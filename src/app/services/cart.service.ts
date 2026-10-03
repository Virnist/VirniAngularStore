import { Injectable, signal, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from './data.service';
import { Product } from '../models/product.model';

export interface CartItem {
  cartItemId: string;
  id: number | string;
  title?: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  variant?: string | Record<string, any>;
  variantId?: string | number;
  selectedVariantData?: Record<string, any>;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private dataService = inject(DataService);
  private translate = inject(TranslateService);

  private cartItems = signal<CartItem[]>(this.loadCart());
  private currentLang = signal<string>(this.translate.currentLang || this.translate.defaultLang || 'uk');

  // Динамічний обчислювальний список товарів у кошику
  items = computed(() => {
    const lang = this.currentLang();
    const rawItems = this.cartItems();
    const productsList = this.dataService.products();

    return rawItems.map(item => {
      // 1. Шукаємо актуальний товар у каталозі
      const foundProduct = productsList.find(p => p.id === item.id) as Record<string, any> | undefined;
      const dataSource = foundProduct || item;

      // 2. Визначення Title (title_uk, title_en...)
      const titleKey = `title_${lang}`;
      const displayTitle = 
        dataSource[titleKey] || 
        dataSource['title_uk'] || 
        dataSource['title_en'] || 
        dataSource['title'] || 
        item.title || 
        '';

      // 3. Динамічний пошук варіанта в актуальному каталозі за variantId чи id
      let displayVariant = '';
      const targetVariantId = item.variantId || item.selectedVariantData?.['id'] || (typeof item.variant === 'string' ? item.variant : null);

      let variantObj: Record<string, any> | undefined;

      // Спочатку шукаємо варіант у свіжих даних товару з DataService
      if (foundProduct && foundProduct['variants'] && Array.isArray(foundProduct['variants'])) {
        variantObj = foundProduct['variants'].find((v: any) => v.id === targetVariantId);
      }

      // Якщо не знайшли в каталозі, беремо збережені дані з item
      if (!variantObj && item.selectedVariantData) {
        variantObj = item.selectedVariantData;
      }

      if (variantObj) {
        const nameKey = `name_${lang}`;
        displayVariant = 
          variantObj[nameKey] || 
          variantObj['name_uk'] || 
          variantObj['name_en'] || 
          variantObj['name'] || 
          '';
      } else if (typeof item.variant === 'string') {
        displayVariant = item.variant;
      }

      return {
        ...item,
        title: displayTitle,
        variantName: displayVariant // Динамічно перекладена назва варіанта для HTML
      };
    });
  });

  count = computed(() => 
    this.cartItems().reduce((acc, item) => acc + item.quantity, 0)
  );

  currency = computed(() => {
    const lang = this.currentLang();
    const apiRates = this.dataService.rates();

    const symbols: Record<string, string> = { 
      uk: '₴', en: '$', de: '€', fr: '€', pl: 'zł', it: '€', ja: '¥', zh: '¥' 
    };

    const currencyMap: Record<string, string> = {
      uk: 'UAH', en: 'USD', de: 'EUR', fr: 'EUR', pl: 'PLN', it: 'EUR', ja: 'JPY', zh: 'CNY'
    };

    const targetCurrency = currencyMap[lang] || 'UAH';
    const symbol = symbols[lang] || '₴';

    const fallbackRates: Record<string, number> = { 
      UAH: 41.5, USD: 1.0, EUR: 0.92, PLN: 4.02, JPY: 145.0, CNY: 7.2
    };

    let rate = 1.0;
    if (apiRates && apiRates[targetCurrency]) {
      rate = apiRates[targetCurrency];
    } else {
      rate = fallbackRates[targetCurrency] || 1.0;
    }

    return { rate, symbol, code: targetCurrency };
  });

  totalSum = computed(() => 
    this.cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0)
  );

  shippingPrice = computed(() => {
    const total = this.totalSum();
    const lang = this.currentLang();

    if (total === 0 || total >= 150) return 0;
    if (lang === 'uk') return 3;
    if (lang === 'pl') return 15;
    return 20;
  });

  finalTotal = computed(() => this.totalSum() + this.shippingPrice());

  constructor() {
    this.dataService.fetchExchangeRates().subscribe({
      next: () => console.log('✅ Курси валют оновлено'),
      error: (err) => console.warn('⚠️ Застосовано фолбек курсів:', err)
    });

    if (!this.dataService.products || this.dataService.products().length === 0) {
      this.dataService.getProducts().subscribe();
    }

    this.translate.onLangChange.subscribe(event => {
      this.currentLang.set(event.lang);
    });
  }

  addToCart(
    product: Product, 
    title?: string, 
    size?: string, 
    variantObj?: any, 
    variantId?: string | number
  ) {
    const vId = variantObj?.id || variantId || (typeof variantObj === 'string' ? variantObj : 'default');
    const sizeKey = size ? size.trim().toLowerCase() : 'default';
    const variantKey = String(vId).trim().toLowerCase();
    
    const cartItemId = `${product.id}-${sizeKey}-${variantKey}`;

    this.cartItems.update(current => {
      const existingIndex = current.findIndex(item => item.cartItemId === cartItemId);

      if (existingIndex > -1) {
        return current.map((item, idx) => 
          idx === existingIndex 
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                size,
                variantId: vId,
                selectedVariantData: variantObj || item.selectedVariantData
              } 
            : item
        );
      } else {
        const newItem: CartItem = {
          ...product,
          cartItemId,
          id: product.id,
          title: title || (product as any)['title_uk'] || (product as any)['title'],
          price: (product.discountPrice || product.price) + (variantObj?.priceOffset || 0),
          image: variantObj?.image || product.image,
          quantity: 1,
          size,
          variantId: vId,
          selectedVariantData: typeof variantObj === 'object' ? variantObj : undefined,
          variant: typeof variantObj === 'string' ? variantObj : undefined
        };
        return [...current, newItem];
      }
    });
    this.saveCart();
  }

  updateQuantityByCartItemId(cartItemId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeItemByCartItemId(cartItemId);
      return;
    }

    this.cartItems.update(current =>
      current.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
    this.saveCart();
  }

  removeItemByCartItemId(cartItemId: string) {
    this.cartItems.update(current => 
      current.filter(item => item.cartItemId !== cartItemId)
    );
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