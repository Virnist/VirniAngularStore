import { Component, inject, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router'; 
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop'; // ДОДАНО для правильної роботи сигналів у потоках

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

  // Спеціальний сигнал для зберігання обраної категорії
  public selectedCategory = signal<string>('all');

  // ДОДАНО: Список унікальних категорій для меню фільтрів (те, що вимагає HTML)
  public categories$: Observable<string[]> = this.dataService.getProducts().pipe(
    map(products => {
      const cats = products.map(p => p.category.toLowerCase());
      return ['all', ...new Set(cats)]; // Повертає ['all', 'wedding', 'traditional', ...]
    })
  );

  // ВИПРАВЛЕНО: Тепер потік товарів автоматично перераховується, коли змінюється сигнал selectedCategory
  public products$: Observable<any[]> = toObservable(this.selectedCategory).pipe(
    switchMap(category => {
      return this.dataService.getProducts().pipe(
        map(products => {
          if (category.toLowerCase() === 'all') return products;
          return products.filter(p => p.category.toUpperCase() === category.toUpperCase());
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

  // Обробка загального кліку на картку або кнопку додавання
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

  setCategory(category: string) {
    if (category.toLowerCase() === 'all') {
      this.selectedCategory.set('all');
    } else {
      this.selectedCategory.set(category.toUpperCase());
    }
  }

  // Клік по бейджу: якщо він уже активний — скидаємо фільтр на 'all', якщо ні — фільтруємо
  onBadgeClick(category: string, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.selectedCategory() === category.toUpperCase()) {
      this.selectedCategory.set('all'); 
    } else {
      this.selectedCategory.set(category.toUpperCase()); 
    }
  }
}