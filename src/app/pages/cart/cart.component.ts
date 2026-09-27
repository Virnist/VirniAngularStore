import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router'; 
import { CartService } from '../../services/cart.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConvertPricePipe } from '../../pipes/convert-price.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, // Модуль для створення надійних реактивних форм
    FormsModule,         // Потрібен для простої прив'язки submitMethod через ngModel
    NgOptimizedImage,     // Сучасна директива для швидкого завантаження картинок
    RouterLink, 
    TranslateModule, 
    ConvertPricePipe
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  // Впровадження залежностей (сервісів)
  public cartService = inject(CartService);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);

  // Стан завантаження для захисту від повторних кліків по кнопці "Відправити"
  isLoading = signal<boolean>(false);
  
  // Спосіб підтвердження замовлення за замовчуванням
  submitMethod: 'telegram' | 'whatsapp' | 'email' = 'telegram';

  // Оголошення реактивної форми з правилами валідації полів
  orderForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3}[\s-]?\d{4,5}$/)]],
    email: ['', [Validators.email]],
    address: ['', [Validators.required, Validators.minLength(5)]]
  });
  
  // Динамічний розрахунок вартості доставки залежно від мови та суми в USD
  shippingPrice = computed(() => {
    const totalInUsd = this.cartService.totalSum();
    const lang = this.translate.currentLang || 'uk';

    // Безкоштовна доставка, якщо кошик порожній або сума більше 150 USD
    if (totalInUsd > 150 || totalInUsd === 0) return 0;

    if (lang === 'uk') return 3;  // Для України — $3
    if (lang === 'pl') return 15; // Для Польщі — $15
    return 20;                    // Для всього іншого світу — $20
  });

  // Загальна сума до сплати (Сума товарів + Доставка)
  finalTotal = computed(() => {
    return this.cartService.totalSum() + this.shippingPrice();
  });

  // Метод для форматування цін у текст повідомлення (переводить базові USD у вибрану валюту)
  private formatPriceForMessage(priceInUsd: number): string {
    const currentCurrency = this.cartService.currency();
    const converted = priceInUsd * currentCurrency.rate;
    
    let formatted: string;
    if (currentCurrency.symbol === '₴' || currentCurrency.symbol === 'zł') {
      formatted = Math.round(converted).toString(); // Округлюємо гривні та злоті
    } else {
      formatted = converted.toFixed(2); // Залишаємо копійки для доларів/євро
    }
    
    return currentCurrency.symbol === '$' 
      ? `${currentCurrency.symbol}${formatted}` 
      : `${formatted} ${currentCurrency.symbol}`;
  }

  // Екранування символів Markdown, щоб Telegram не ламав відправку через спецсимволи
  private escapeMarkdown(text: string): string {
    return text.replace(/[_*\[`]/g, '\\$&');
  }

  // Головна функція обробки натискання на кнопку замовлення
  submitOrder() {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    if (this.isLoading()) return;

    switch (this.submitMethod) {
      case 'telegram':
        this.sendToTelegram();
        break;
      case 'whatsapp':
        this.sendToWhatsApp();
        break;
      case 'email':
        this.sendToEmail();
        break;
    }
  }

  private getOrderSummary() {
    const formValues = this.orderForm.value;
    const shippingText = this.shippingPrice() === 0 ? 'Безкоштовно' : this.formatPriceForMessage(this.shippingPrice());
    const totalText = this.formatPriceForMessage(this.finalTotal());
    const goodsList = this.cartService.items().map(i => i.title);

    return {
      name: formValues.name || '',
      phone: formValues.phone || '',
      email: formValues.email || 'Не вказано',
      address: formValues.address || '',
      shippingText,
      totalText,
      goodsList,
      productSummary: this.cartService.items().map(i => `• ${i.title} (x${i.quantity})`).join('\n'),
      plainGoods: this.cartService.items().map(i => `${i.title} (x${i.quantity})`).join(', '),
      telegramItems: this.cartService.items().map(i => `• ${this.escapeMarkdown(i.title)} (x${i.quantity}) — ${this.formatPriceForMessage(i.price * i.quantity)}`).join('\n')
    };
  }

  private finalizeOrder() {
    this.cartService.clearCart();
    this.orderForm.reset();
  }

  // 1. НАДСИЛАННЯ В TELEGRAM БОТ
  async sendToTelegram() {
    this.isLoading.set(true);
    const token = environment.tgToken;
    const chatId = environment.tgChatId;
    const summary = this.getOrderSummary();

    const text = `
📦 *НОВЕ ЗАМОВЛЕННЯ (Virni)*
👤 *Клієнт:* ${this.escapeMarkdown(summary.name)}
📞 *Тел:* ${this.escapeMarkdown(summary.phone)}
📧 *Email:* ${this.escapeMarkdown(summary.email)}
📍 *Адреса:* ${this.escapeMarkdown(summary.address)}
🌐 *Мова інтерейсу:* ${(this.translate.currentLang || 'uk').toUpperCase()}

🛒 *Товари:*
${summary.telegramItems}

🚚 *Доставка з України:* ${summary.shippingText}
💰 *РАЗОМ ДО СПЛАТИ: ${summary.totalText}*
    `;

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
      });

      if (response.ok) {
        alert('Замовлення надіслано в Telegram! Ми зв’яжемося з вами.');
        this.finalizeOrder();
      } else {
        throw new Error('Telegram API Error');
      }
    } catch (e) {
      alert('Помилка відправки. Спробуйте інший спосіб звʼязку.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // 2. НАДСИЛАННЯ В WHATSAPP
  sendToWhatsApp() {
    this.isLoading.set(true);

    try {
      const summary = this.getOrderSummary();
      const whatsappNumber = environment.whatsappNumber || '380685412442';
      const msg = `Привіт! Я хочу зробити замовлення в магазині Virni.\n\nІм'я: ${summary.name}\nТелефон: ${summary.phone}\nАдреса: ${summary.address}\nТовари: ${summary.plainGoods}\nДоставка: ${summary.shippingText}\n\nЗагальна сума до сплати: ${summary.totalText}`;
      
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      this.finalizeOrder();
    } finally {
      this.isLoading.set(false);
    }
  }

  // 3. НАДСИЛАННЯ НА EMAIL
  sendToEmail() {
    this.isLoading.set(true);

    try {
      const summary = this.getOrderSummary();
      const subject = `Замовлення Virni від ${summary.name}`;
      const supportEmail = environment.supportEmail || 'hello@virni.com';
      const body = `Клієнт: ${summary.name}\nТелефон: ${summary.phone}\nАдреса доставки: ${summary.address}\n\nТовари:\n${summary.productSummary}\n\nДоставка: ${summary.shippingText}\n\nРазом до сплати: ${summary.totalText}`;
      
      window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      this.finalizeOrder();
    } finally {
      this.isLoading.set(false);
    }
  }
}