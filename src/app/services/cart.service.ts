import { Injectable, signal, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from './data.service'; // Шлях до твого DataService

export interface CartItem {
  id: number;
  title: string;
  price: number; // Ціна в USD (базова)
  image: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private dataService = inject(DataService);
  private translate = inject(TranslateService);

  // Приватний сигнал зі списком товарів у кошику
  private cartItems = signal<CartItem[]>(this.loadCart());

  // Реактивний сигнал поточної мови (тепер він керує всіма перерахунками)
  private currentLang = signal<string>(this.translate.currentLang || 'uk');

  // Публічні сигнали для використання в компонентах
  items = computed(() => this.cartItems());
  
  // Рахуємо загальну кількість речей у кошику
  count = computed(() => 
    this.cartItems().reduce((acc, item) => acc + item.quantity, 0)
  );

  // 1. Динамічний сигнал валюти, що залежить від мови та курсів з DataService
  currency = computed(() => {
    const lang = this.currentLang();
    const apiRates = this.dataService.rates(); // Наш сигнал курсів із DataService

    // Словник символів валют
    const symbols: Record<string, string> = { uk: '₴', pl: 'zł', de: '€', fr: '€', en: '$' };
    const symbol = symbols[lang] || '$';

    // Визначаємо цільову валюту за мовою
    let targetCurrency = 'USD';
    if (lang === 'uk') targetCurrency = 'UAH';
    if (lang === 'pl') targetCurrency = 'PLN';
    if (lang === 'de' || lang === 'fr') targetCurrency = 'EUR';

    // Беремо коефіцієнт з API. Якщо API ще не відповіло — ставимо тимчасовий дефолт
    let rate = 1.0;
    if (apiRates) {
      rate = apiRates[targetCurrency] || 1.0;
    } else {
      // Тимчасовий фолбек до моменту завантаження з мережі
      const fallbackRates: Record<string, number> = { UAH: 41.5, PLN: 4.02, EUR: 0.92, USD: 1.0 };
      rate = fallbackRates[targetCurrency] || 1.0;
    }

    return { rate, symbol };
  });

  // 2. Рахуємо чисту вартість товарів у кошику (в базовій валюті USD)
  totalSum = computed(() => 
    this.cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0)
  );

  // 3. НОВИЙ СИГНАЛ: Реактивний розрахунок ціни доставки (в USD)
  // Автоматично перераховується щоразу, коли змінюється мова або сума кошика!
  shippingPrice = computed(() => {
    const total = this.totalSum();
    const lang = this.currentLang();

    // Якщо кошик порожній або сума товарів від $150 і вище — доставка безкоштовна
    if (total === 0 || total >= 150) {
      return 0;
    }

    // Базові тарифи доставки в USD залежно від мови (країни)
    if (lang === 'uk') return 3;   // Україна
    if (lang === 'pl') return 15;  // Польща
    return 20;                     // Міжнародна доставка (en, de, fr)
  });

  // 4. НОВИЙ СИГНАЛ: Загальна сума до сплати разом із доставкою (в USD)
  finalTotal = computed(() => {
    return this.totalSum() + this.shippingPrice();
  });

  constructor() {
    // Тригеримо завантаження свіжих курсів валют з інтернету при старті
    this.dataService.fetchExchangeRates().subscribe({
      next: () => console.log('✅ Курси валют в кошику успішно синхронізовано з DataService'),
      error: (err) => console.warn('⚠️ Оновлення курсів не вдалося, працюємо на фолбеці:', err)
    });

    // Стежимо за перемиканням мов у додатку і миттєво оновлюємо сигнал мови
    this.translate.onLangChange.subscribe(event => {
      this.currentLang.set(event.lang);
    });
  }

  // Додавання в кошик (Зберігає базовий USD із продукту)
  addToCart(product: any, title: string) {
    this.cartItems.update(current => {
      const existingIndex = current.findIndex(item => item.id === product.id);

      if (existingIndex > -1) {
        return current.map((item, idx) => 
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        const newItem: CartItem = {
          id: product.id,
          title: title,
          price: product.price, // Чистий базовий USD
          image: product.image,
          quantity: 1
        };
        return [...current, newItem];
      }
    });
    this.saveCart();
  }

  updateQuantity(id: number, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeItem(id);
      return;
    }

    this.cartItems.update(current =>
      current.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
    this.saveCart();
  }

  removeItem(id: number) {
    this.cartItems.update(current => current.filter(item => item.id !== id));
    this.saveCart();
  }

  clearCart() {
    this.cartItems.set([]);
    localStorage.removeItem('cart');
  }

  private saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cartItems()));
  }

  private loadCart(): CartItem[] {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  }
}