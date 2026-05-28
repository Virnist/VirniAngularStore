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
    this.cartItems.update(current => {
      const existingIndex = current.findIndex(item => item.id === product.id);

      if (existingIndex > -1) {
        // Створюємо новий масив з оновленим об'єктом (без мутацій старого)
        return current.map((item, idx) => 
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        const newItem: CartItem = {
          id: product.id,
          title: title,
          price: product.price,
          image: product.image,
          quantity: 1
        };
        return [...current, newItem];
      }
    });
    this.saveCart();
  }

  // === НОВИЙ МЕТОД: Зміна кількості (+/- в кошику) ===
  updateQuantity(id: number, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeItem(id); // Якщо зменшили до 0 — видаляємо товар
      return;
    }

    this.cartItems.update(current =>
      current.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
    this.saveCart();
  }

  // === ВИПРАВЛЕНО: Змінено назву з removeFromCart на removeItem для HTML-шаблону ===
  removeItem(id: number) {
    this.cartItems.update(current => current.filter(item => item.id !== id));
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