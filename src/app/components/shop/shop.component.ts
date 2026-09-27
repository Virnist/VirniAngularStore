import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router'; 
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConvertPricePipe } from '../../pipes/convert-price.pipe'; // Обов'язково імпортуємо пайп
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule, 
    AsyncPipe, 
    TranslateModule, 
    ConvertPricePipe // Додали пайп у список імпортів для HTML
  ], 
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss'
})
export class ShopComponent {
  private dataService = inject(DataService);
  public cartService = inject(CartService); // Змінили на public, щоб була повна синхронізація
  public translate = inject(TranslateService);
  private router = inject(Router); 

  public selectedCategory = signal<string>('all');
  public currentPage = signal<number>(1);
  private itemsPerPage = 10; 
  public pageNumbers: number[] = [];

  // Отримуємо категорії товарів, відсортовані за популярністю
  public categories$: Observable<string[]> = this.dataService.getProducts().pipe(
    map(products => {
      const countMap: { [key: string]: number } = {};
      products.forEach(item => {
        const cat = (item['category'] || 'other').toLowerCase();
        countMap[cat] = (countMap[cat] || 0) + 1;
      });

      const sortedCats = Object.keys(countMap).sort((a, b) => countMap[b] - countMap[a]);
      const topCategories = sortedCats.slice(0, 6);

      return ['all', ...topCategories];
    })
  );

  // Потік фільтрації та пагінації товарів
  public products$: Observable<any[]> = combineLatest([
    toObservable(this.selectedCategory),
    toObservable(this.currentPage)
  ]).pipe(
    switchMap(([category, page]) => {
      return this.dataService.getProducts().pipe(
        map(products => {
          const filtered = category.toLowerCase() === 'all' 
            ? products 
            : products.filter(p => p.category.toUpperCase() === category.toUpperCase());

          const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
          this.pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

          const startIndex = (page - 1) * this.itemsPerPage;
          const endIndex = startIndex + this.itemsPerPage;
          
          return filtered.slice(startIndex, endIndex);
        })
      );
    })
  );

  // Отримання контенту залежно від обраної мови
  getLangContent(item: any, field: string): string {
    const lang = this.translate.currentLang || 'en';
    return item[`${field}_${lang}`] || item[`${field}_en`] || item[`${field}_uk`] || '';
  }

  getSeoPageUrl(productId: number): string {
    return new URL(`product/${productId}/`, document.baseURI).href;
  }

  // Обробка кліку на картку або кнопку "В кошик"
  onCardAction(item: any, event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('a')) return;
    const isButtonClick = target.classList.contains('read-more') || target.closest('.read-more');

    if (isButtonClick) {
      event.stopPropagation();
      event.preventDefault();
      const title = this.getLangContent(item, 'title');
      this.cartService.addToCart(item, title);
    } else {
      window.location.assign(this.getSeoPageUrl(item.id));
    }
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