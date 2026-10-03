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
    ReactiveFormsModule, 
    FormsModule, 
    NgOptimizedImage, 
    RouterLink, 
    TranslateModule, 
    ConvertPricePipe
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  public cartService = inject(CartService);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);

  isLoading = signal<boolean>(false);
  
  // Спосіб підтвердження замовлення
  submitMethod = signal<'telegram' | 'whatsapp' | 'email'>('telegram');

  // Форма замовлення
  orderForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3}[\s-]?\d{4,5}$/)]],
    email: ['', [Validators.email]],
    address: ['', [Validators.required, Validators.minLength(5)]]
  });
  
  // Розрахунок доставки
  shippingPrice = computed(() => {
    const totalInUsd = this.cartService.totalSum();
    const lang = this.translate.currentLang || 'uk';

    if (totalInUsd > 150 || totalInUsd === 0) return 0;

    if (lang === 'uk') return 3;
    if (lang === 'pl') return 15;
    return 20;
  });

  // Загальна сума
  finalTotal = computed(() => {
    return this.cartService.totalSum() + this.shippingPrice();
  });

  private formatPriceForMessage(priceInUsd: number): string {
    const currentCurrency = this.cartService.currency();
    const converted = priceInUsd * currentCurrency.rate;
    
    let formatted: string;
    if (currentCurrency.symbol === '₴' || currentCurrency.symbol === 'zł') {
      formatted = Math.round(converted).toString();
    } else {
      formatted = converted.toFixed(2);
    }
    
    return currentCurrency.symbol === '$' 
      ? `${currentCurrency.symbol}${formatted}` 
      : `${formatted} ${currentCurrency.symbol}`;
  }

  // Надійне HTML-екранування для Telegram
  private escapeHtml(text: string): string {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  submitOrder() {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    if (this.isLoading()) return;

    switch (this.submitMethod()) {
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

    return {
      name: formValues.name || '',
      phone: formValues.phone || '',
      email: formValues.email || 'Не вказано',
      address: formValues.address || '',
      shippingText,
      totalText,
      plainGoods: this.cartService.items().map(i => `${i.title} (x${i.quantity})`).join(', '),
      telegramItems: this.cartService.items().map(i => `• <b>${this.escapeHtml(i.title)}</b> (x${i.quantity}) — ${this.formatPriceForMessage(i.price * i.quantity)}`).join('\n')
    };
  }

  private finalizeOrder() {
    this.cartService.clearCart();
    this.orderForm.reset();
  }

  async sendToTelegram() {
    this.isLoading.set(true);
    const token = environment.tgToken;
    const chatId = environment.tgChatId;
    const summary = this.getOrderSummary();

    const text = `
📦 <b>НОВЕ ЗАМОВЛЕННЯ (Virni)</b>

👤 <b>Клієнт:</b> ${this.escapeHtml(summary.name)}
📞 <b>Тел:</b> ${this.escapeHtml(summary.phone)}
📧 <b>Email:</b> ${this.escapeHtml(summary.email)}
📍 <b>Адреса:</b> ${this.escapeHtml(summary.address)}
🌐 <b>Мова:</b> ${(this.translate.currentLang || 'uk').toUpperCase()}

🛒 <b>Товари:</b>
${summary.telegramItems}

🚚 <b>Доставка:</b> ${summary.shippingText}
💰 <b>РАЗОМ ДО СПЛАТИ: ${summary.totalText}</b>
    `.trim();

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
      });

      if (response.ok) {
        alert('Замовлення успішно надіслано! Ми зв’яжемося з вами найближчим часом.');
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

  sendToEmail() {
    this.isLoading.set(true);
    try {
      const summary = this.getOrderSummary();
      const subject = `Замовлення Virni від ${summary.name}`;
      const supportEmail = environment.supportEmail || 'hello@virni.com';
      const body = `Клієнт: ${summary.name}\nТелефон: ${summary.phone}\nАдреса доставки: ${summary.address}\n\nТовари:\n${summary.plainGoods}\n\nДоставка: ${summary.shippingText}\n\nРазом до сплати: ${summary.totalText}`;
      
      window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      this.finalizeOrder();
    } finally {
      this.isLoading.set(false);
    }
  }
}