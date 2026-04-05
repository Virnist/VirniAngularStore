import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConvertPricePipe } from '../../pipes/convert-price.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ConvertPricePipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  public cartService = inject(CartService);
  private translate = inject(TranslateService);

  order = { name: '', email: '', phone: '', country: '', address: '' };
  
  shippingPrice = computed(() => this.cartService.totalSum() > 150 ? 0 : 15);
  finalTotal = computed(() => this.cartService.totalSum() + this.shippingPrice());

  // 1. ВІДПРАВКА В TELEGRAM
  async sendToTelegram() {
    if (!this.order.name || !this.order.phone) {
      alert('Будь ласка, заповніть ім\'я та телефон');
      return;
    }

    const token = environment.tgToken;
    const chatId = environment.tgChatId;

    const text = `
📦 *НОВЕ ЗАМОВЛЕННЯ (Virni)*
👤 *Клієнт:* ${this.order.name}
📞 *Тел:* ${this.order.phone}
📧 *Email:* ${this.order.email}
📍 *Адреса:* ${this.order.country}, ${this.order.address}

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
      }
    } catch (e) {
      alert('Помилка відправки. Спробуйте Email або WhatsApp.');
    }
  }

  // 2. ВІДПРАВКА В WHATSAPP
  sendToWhatsApp() {
    const msg = `Привіт! Я хочу зробити замовлення.\nІм'я: ${this.order.name}\nТовари: ${this.cartService.items().map(i => i.title).join(', ')}\nСума: ${this.finalTotal()}$`;
    window.open(`https://wa.me/380685412442?text=${encodeURIComponent(msg)}`, '_blank');
  }

  // 3. ВІДПРАВКА ЧЕРЕЗ MAILTO (ПОШТА КЛІЄНТА)
  sendToEmail() {
    const subject = `Order from ${this.order.name}`;
    const body = `Items: ${this.cartService.items().map(i => i.title).join(', ')}\nTotal: ${this.finalTotal()}$`;
    window.location.href = `mailto:your-email@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}