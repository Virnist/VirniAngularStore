import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router'; // Додали для кнопки "Перейти до магазину"
import { CartService } from '../../services/cart.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConvertPricePipe } from '../../pipes/convert-price.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, // Обов'язково додаємо сюди RouterLink
    TranslateModule, 
    ConvertPricePipe
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  public cartService = inject(CartService);
  private translate = inject(TranslateService);

  // Спростили об'єкт під новий універсальний інпут адреси
  order = { name: '', email: '', phone: '', address: '' };
  
  // Метод відправки за замовчуванням (зв'язаний з радіо-кнопками в HTML)
  submitMethod: 'telegram' | 'whatsapp' | 'email' = 'telegram';
  
  shippingPrice = computed(() => this.cartService.totalSum() > 150 ? 0 : 15);
  finalTotal = computed(() => this.cartService.totalSum() + this.shippingPrice());

  // ГОЛОВНИЙ МЕТОД ДЛЯ КНОПКИ "Підтвердити замовлення"
  submitOrder() {
    if (!this.order.name || !this.order.phone || !this.order.address) {
      alert('Будь ласка, заповніть обовʼязкові поля: Імʼя, Телефон та Адресу доставки');
      return;
    }

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

  // 1. ВІДПРАВКА В TELEGRAM
  async sendToTelegram() {
    const token = environment.tgToken;
    const chatId = environment.tgChatId;

    const text = `
📦 *НОВЕ ЗАМОВЛЕННЯ (Virni)*
👤 *Клієнт:* ${this.order.name}
📞 *Тел:* ${this.order.phone}
📧 *Email:* ${this.order.email || 'Не вказано'}
📍 *Адреса:* ${this.order.address}

🛒 *Товари:*
${this.cartService.items().map(i => `• ${i.title} (x${i.quantity})`).join('\n')}

💰 *РАЗОМ: ${this.finalTotal()}$*
    `;

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });

      if (response.ok) {
        alert('Замовлення надіслано в Telegram! Ми зв’яжемося з вами.');
        this.cartService.clearCart();
        this.resetOrderForm();
      }
    } catch (e) {
      alert('Помилка відправки. Спробуйте інший спосіб звʼязку.');
    }
  }

  // 2. ВІДПРАВКА В WHATSAPP
  sendToWhatsApp() {
    const goods = this.cartService.items().map(i => `${i.title} (x${i.quantity})`).join(', ');
    const msg = `Привіт! Я хочу зробити замовлення в магазині Virni.\n\nІм'я: ${this.order.name}\nТелефон: ${this.order.phone}\nАдреса: ${this.order.address}\nТовари: ${goods}\n\nЗагальна сума: ${this.finalTotal()}$`;
    
    window.open(`https://wa.me/380685412442?text=${encodeURIComponent(msg)}`, '_blank');
    this.cartService.clearCart();
    this.resetOrderForm();
  }

  // 3. ВІДПРАВКА ЧЕРЕЗ MAILTO (ПОШТА КЛІЄНТА)
  sendToEmail() {
    const subject = `Замовлення Virni від ${this.order.name}`;
    const goods = this.cartService.items().map(i => `• ${i.title} (x${i.quantity})`).join('\n');
    const body = `Клієнт: ${this.order.name}\nТелефон: ${this.order.phone}\nАдреса доставки: ${this.order.address}\n\nТовари:\n${goods}\n\nРазом до сплати: ${this.finalTotal()}$`;
    
    window.location.href = `mailto:your-email@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    this.cartService.clearCart();
    this.resetOrderForm();
  }

  // Очищення форми після успішного замовлення
  private resetOrderForm() {
    this.order = { name: '', email: '', phone: '', address: '' };
  }
}