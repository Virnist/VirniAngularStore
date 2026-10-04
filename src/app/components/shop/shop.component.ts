import { Component, inject, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; 
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConvertPricePipe } from '../../pipes/convert-price.pipe';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { ProductVariant } from '../../models/product.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule, 
    AsyncPipe, 
    RouterLink,
    TranslateModule, 
    ConvertPricePipe
  ], 
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss'
})
export class ShopComponent {
  private dataService = inject(DataService);
  public cartService = inject(CartService);
  public translate = inject(TranslateService);
  private router = inject(Router); 

  public selectedCategory = signal<string>('all');
  public currentPage = signal<number>(1);
  private itemsPerPage = 10; 
  public pageNumbers: number[] = [];
  public addedProductIds = new Set<string | number>();

  // Карти для збереження обраного розміру та варіанта для кожного товару (productId -> value)
  public selectedSizesMap = new Map<string | number, string>();
  public selectedVariantsMap = new Map<string | number, ProductVariant>();

  // Отримання категорій
  public categories$: Observable<string[]> = this.dataService.getProducts().pipe(
    map(products => {
      const countMap: { [key: string]: number } = {};
      products.forEach(item => {
        const cat = (item['category'] || 'other').toLowerCase();
        countMap[cat] = (countMap[cat] || 0) + 1;
      });

      const sortedCats = Object.keys(countMap).sort((a, b) => countMap[b] - countMap[a]);
      return ['all', ...sortedCats];
    })
  );

  // Фільтрація та пагінація
  public products$: Observable<any[]> = combineLatest([
    toObservable(this.selectedCategory),
    toObservable(this.currentPage)
  ]).pipe(
    switchMap(([category, page]) => {
      return this.dataService.getProducts().pipe(
        map(products => {
          const filtered = category.toLowerCase() === 'all' 
            ? products 
            : products.filter(p => p.category && p.category.toUpperCase() === category.toUpperCase());

          const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
          this.pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

          const startIndex = (page - 1) * this.itemsPerPage;
          const pageProducts = filtered.slice(startIndex, startIndex + this.itemsPerPage);

          // Ініціалізація замовчуваних виборів для перших елементів
          pageProducts.forEach(item => {
            if (!this.selectedSizesMap.has(item.id) && item.sizes && item.sizes.length > 0) {
              this.selectedSizesMap.set(item.id, item.sizes[0]);
            }
            if (!this.selectedVariantsMap.has(item.id) && item.variants && item.variants.length > 0) {
              this.selectedVariantsMap.set(item.id, item.variants[0]);
            }
          });

          return pageProducts;
        })
      );
    })
  );

  getLangContent(item: any, field: string): string {
    if (!item) return '';
    const lang = this.translate.currentLang || 'uk';
    return item[`${field}_${lang}`] || 
           item[`${field}_uk`] || 
           item[`${field}_en`] || 
           item[field] || '';
  }

  getVariantName(variant: ProductVariant): string {
    if (!variant) return '';
    const lang = this.translate.currentLang || 'en';
    return variant[`name_${lang}`] || variant[`name_uk`] || variant[`name_en`] || variant[`name_de`] || '';
  }

  // Отримання обраного розміру
  getSelectedSize(item: any): string | undefined {
    return this.selectedSizesMap.get(item.id) || (item.sizes?.length ? item.sizes[0] : undefined);
  }

  // Вибір розміру на картці
  selectSize(item: any, size: string, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.selectedSizesMap.set(item.id, size);
  }

  // Отримання обраного варіанта
  getSelectedVariant(item: any): ProductVariant | undefined {
    return this.selectedVariantsMap.get(item.id) || (item.variants?.length ? item.variants[0] : undefined);
  }

  // Вибір варіанта на картці
  selectVariant(item: any, variant: ProductVariant, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.selectedVariantsMap.set(item.id, variant);
  }

  // Розрахунок актуальної ціни з урахуванням обраного варіанта
  calculatePrice(item: any): number {
    let price = item.discountPrice || item.price;
    const variant = this.getSelectedVariant(item);
    if (variant?.priceOffset) {
      price += variant.priceOffset;
    }
    return price;
  }

  // Отримання зображення основного товару
  getProductImage(item: any): string {
    return item?.image || '';
  }

  // Клік по кнопці добавлення/передзамовлення
  onAddToCartClick(item: any, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (item.stock === 0 && item.productionTime === 0) return;

    const size = this.getSelectedSize(item);
    const variant = this.getSelectedVariant(item);
    const title = this.getLangContent(item, 'title');

    // 1. Додаємо в кошик
    this.cartService.addToCart(item, title, size, variant);

    // 2. Активуємо візуальний ефект додавання
    this.addedProductIds.add(item.id);

    // 3. Через 1.5 секунди повертаємо кнопку в початковий стан
    setTimeout(() => {
      this.addedProductIds.delete(item.id);
    }, 1500);
  }

  onCardAction(item: any, event: Event) {
    const target = event.target as HTMLElement;
    
    // Перевіряємо, чи клік був по інтерактивних елементах
    if (
      target.closest('a') || 
      target.closest('.add-to-cart-btn') || 
      target.closest('.size-chip') || 
      target.closest('.variant-chip') ||
      target.closest('.type-badge')
    ) {
      return;
    }

    this.router.navigate(['/product', item.id]);
  }

  private setCategoryState(category: string) {
    const normalized = category.toLowerCase() === 'all' ? 'all' : category.toUpperCase();
    this.currentPage.set(1);
    this.selectedCategory.set(normalized);
  }

  setCategory(category: string) {
    this.setCategoryState(category);
  }

  onBadgeClick(category: string, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.selectedCategory() === category.toUpperCase()) {
      this.setCategoryState('all');
    } else {
      this.setCategoryState(category);
    }
  }

  setPage(page: number) {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }
}