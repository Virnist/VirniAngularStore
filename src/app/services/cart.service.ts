import { Injectable, signal, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from './data.service';
import { Product, ProductVariant } from '../models/product.model';

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
      const foundProduct = productsList.find(p => String(p.id) === String(item.id));
      const dataSource = foundProduct || item;

      // 2. Визначення Title (title_uk, title_en...)
      const titleKey = `title_${lang}`;
      const displayTitle = 
        dataSource[titleKey] || 
        dataSource['title_en'] || 
        dataSource['title_uk'] ||
        dataSource['title'] || 
        item.title || 
        '';

      // 3. Динамічний пошук варіанта в актуальному каталозі за variantId чи id
      const variantValue = item.variantId ?? item.selectedVariantData?.['id'] ?? item.variant;
      const variantObj = foundProduct
        ? this.findVariant(foundProduct, variantValue)
        : undefined;
      const resolvedVariant = variantObj || item.selectedVariantData;
      let displayVariant = '';

      if (resolvedVariant) {
        const nameKey = `name_${lang}`;
        displayVariant = 
          resolvedVariant[nameKey] ||
          resolvedVariant['name_en'] ||
          resolvedVariant['name_uk'] ||
          resolvedVariant['name'] ||
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
    variantObj?: ProductVariant | string,
    variantId?: string | number
  ) {
    const selectedVariant = this.findVariant(product, variantObj) ||
      (typeof variantObj === 'object' ? variantObj : undefined);
    const variantValue = selectedVariant?.id ?? variantId ??
      (typeof variantObj === 'string' ? variantObj : undefined);
    const vId = variantValue ?? 'default';
    const sizeKey = this.normalizeKey(size);
    const variantKey = this.normalizeKey(vId);
    const cartItemId = `${product.id}-${sizeKey}-${variantKey}`;

    this.cartItems.update(current => {
      const matchingItems = current.filter(item =>
        String(item.id) === String(product.id) &&
        this.normalizeKey(item.size) === sizeKey &&
        this.getCartItemVariantKey(product, item) === variantKey
      );

      if (matchingItems.length > 0) {
        const existingItem = matchingItems[0];
        const matchingSet = new Set(matchingItems);
        return current
          .filter(item => !matchingSet.has(item) || item === existingItem)
          .map(item => item === existingItem
            ? {
                ...item,
                quantity: matchingItems.reduce((total, match) => total + match.quantity, 1),
                variantId: vId,
                selectedVariantData: selectedVariant || item.selectedVariantData,
                variant: selectedVariant ? undefined : item.variant
              }
            : item
          );
      }

      const newItem: CartItem = {
        ...product,
        cartItemId,
        id: product.id,
        title: title || product['title_uk'] || product['title'],
        price: (product.discountPrice || product.price) + (selectedVariant?.priceOffset || 0),
        image: selectedVariant?.image || product.image,
        quantity: 1,
        size,
        variantId: vId,
        selectedVariantData: selectedVariant,
        variant: selectedVariant ? undefined : (typeof variantObj === 'string' ? variantObj : undefined)
      };
      return [...current, newItem];
    });
    this.saveCart();
  }

  private getCartItemVariantKey(product: Product, item: CartItem): string {
    const candidate = item.variantId ?? item.selectedVariantData?.['id'] ?? item.variant;
    const variant = this.findVariant(product, candidate);
    return this.normalizeKey(variant?.id ?? candidate);
  }

  private findVariant(product: Product, value: unknown): ProductVariant | undefined {
    const variants = product.variants || [];
    if (value === null || value === undefined) return undefined;

    const candidate = typeof value === 'object'
      ? (value as ProductVariant).id
      : value;

    const byId = variants.find(variant => String(variant.id) === String(candidate));
    if (byId) return byId;

    const localizedName = typeof value === 'string' ? this.normalizeKey(value) : '';
    if (!localizedName) return undefined;

    return variants.find(variant =>
      Object.entries(variant).some(([key, name]) =>
        key.startsWith('name_') &&
        typeof name === 'string' &&
        this.normalizeKey(name) === localizedName
      )
    );
  }

  private normalizeKey(value: unknown): string {
    return value === null || value === undefined || value === ''
      ? 'default'
      : String(value).trim().toLowerCase();
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