import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router'; 
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, AsyncPipe, TranslateModule], 
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss'
})
export class ShopComponent {
  private dataService = inject(DataService);
  private cartService = inject(CartService);
  public translate = inject(TranslateService);
  private router = inject(Router); 

  public selectedCategory = signal<string>('all');
  
  // ДОДАНО: Сигнал для поточної сторінки (починаємо з 1)
  public currentPage = signal<number>(1);
  private itemsPerPage = 10; // Кількість товарів на сторінці

  // ДОДАНО: Змінна для зберігання масиву номерів сторінок (наприклад, [1, 2, 3])
  public pageNumbers: number[] = [];

  // Отримуємо категорії товарів, відсортовані за кількістю товарів у них
  public categories$: Observable<string[]> = this.dataService.getProducts().pipe(
    map(products => {
      // 1. Рахуємо, скільки товарів припадає на кожну категорію
      const countMap: { [key: string]: number } = {};
      products.forEach(item => {
        const cat = (item['category'] || 'other').toLowerCase();
        countMap[cat] = (countMap[cat] || 0) + 1;
      });

      // 2. Сортуємо за популярністю (де більше товарів — ті перші)
      const sortedCats = Object.keys(countMap).sort((a, b) => countMap[b] - countMap[a]);

      // 3. Обмежуємо топ-6 найпопулярніших категорій для виведення на екран
      const topCategories = sortedCats.slice(0, 6);

      // Повертаємо масив із дефолтним варіантом 'all' на початку
      return ['all', ...topCategories];
    })
  );

  // ВИПРАВЛЕНО: Тепер потік реагує і на зміну категорії, і на зміну сторінки
  public products$: Observable<any[]> = combineLatest([
    toObservable(this.selectedCategory),
    toObservable(this.currentPage)
  ]).pipe(
    switchMap(([category, page]) => {
      return this.dataService.getProducts().pipe(
        map(products => {
          // 1. Спочатку фільтруємо за категорією
          const filtered = category.toLowerCase() === 'all' 
            ? products 
            : products.filter(p => p.category.toUpperCase() === category.toUpperCase());

          // 2. Рахуємо масив сторінок для HTML
          const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
          this.pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

          // 3. Нарізаємо масив товарів (наприклад, для сторінки 1: з 0 по 10)
          const startIndex = (page - 1) * this.itemsPerPage;
          const endIndex = startIndex + this.itemsPerPage;
          
          return filtered.slice(startIndex, endIndex);
        })
      );
    })
  );

  getLangContent(item: any, field: string): string {
    const lang = this.translate.currentLang || 'en';
    return item[`${field}_${lang}`] || item[`${field}_en`] || item[`${field}_uk`] || '';
  }

  getFormattedPrice(price: number): string {
    const rates = this.dataService.rates();
    const lang = this.translate.currentLang || 'uk';
    if (lang === 'uk' && rates?.['UAH']) {
      return `${Math.round(price * rates['UAH'])} ₴`;
    }
    return `${price} $`;
  }

  onCardAction(item: any, event: Event) {
    const target = event.target as HTMLElement;
    const isButtonClick = target.classList.contains('read-more') || target.closest('.read-more');

    if (isButtonClick) {
      event.stopPropagation();
      event.preventDefault();
      const title = this.getLangContent(item, 'title');
      this.cartService.addToCart(item, title);
    } else {
      this.router.navigate(['/product', item.id]);
    }
  }

  // При зміні категорії завжди скидаємо сторінку на 1
  setCategory(category: string) {
    this.currentPage.set(1); 
    if (category.toLowerCase() === 'all') {
      this.selectedCategory.set('all');
    } else {
      this.selectedCategory.set(category.toUpperCase());
    }
  }

  onBadgeClick(category: string, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.currentPage.set(1); // Скидаємо сторінку
    if (this.selectedCategory() === category.toUpperCase()) {
      this.selectedCategory.set('all'); 
    } else {
      this.selectedCategory.set(category.toUpperCase()); 
    }
  }

  // ДОДАНО: Метод для зміни сторінки користувачем
  setPage(page: number) {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Плавний скролл вгору при зміні сторінки
  }
}