import { Injectable, signal, computed } from '@angular/core';

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
  // Приватний сигнал зі списком товарів (завантажуємо з localStorage)
  private cartItems = signal<CartItem[]>(this.loadCart());

  // Публічні сигнали для компонентів (readonly)
  items = computed(() => this.cartItems());
  
  // Рахуємо загальну суму в USD
  totalSum = computed(() => 
    this.cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0)
  );

  // Рахуємо загальну кількість товарів
  count = computed(() => 
    this.cartItems().reduce((acc, item) => acc + item.quantity, 0)
  );

  // Додавання в кошик
  addToCart(product: any, title: string) {
    const current = this.cartItems();
    const existingIndex = current.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      // Якщо товар вже є, збільшуємо кількість
      current[existingIndex].quantity += 1;
      this.cartItems.set([...current]);
    } else {
      // Якщо товару немає, додаємо новий об'єкт
      const newItem: CartItem = {
        id: product.id,
        title: title,
        price: product.price,
        image: product.image,
        quantity: 1
      };
      this.cartItems.set([...current, newItem]);
    }
    this.saveCart();
  }

  // Видалення товару
  removeFromCart(id: number) {
    this.cartItems.set(this.cartItems().filter(item => item.id !== id));
    this.saveCart();
  }

  // Очищення кошика після замовлення
  clearCart() {
    this.cartItems.set([]);
    localStorage.removeItem('cart');
  }

  // Збереження в браузері (щоб після оновлення сторінки кошик не зник)
  private saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cartItems()));
  }

  private loadCart(): CartItem[] {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  }
}