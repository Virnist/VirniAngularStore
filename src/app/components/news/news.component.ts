import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap, startWith } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss'
})
export class NewsComponent {
  private dataService = inject(DataService);
  public translate = inject(TranslateService);

  // Сигнали для фільтрації та сторінок
  public selectedCategory = signal<string>('all');
  public currentPage = signal<number>(1);
  private itemsPerPage = 10; // Показувати по 10 новин

  // Масив номерів сторінок (зберігається тут безпечно)
  public pageNumbers: number[] = [];

  // Отримуємо категорії, відсортовані за популярністю (кількістю новин)
  public categories$: Observable<string[]> = this.dataService.getNews().pipe(
    map(news => {
      // 1. Рахуємо кількість новин для кожної категорії
      const countMap: { [key: string]: number } = {};
      news.forEach(item => {
        const cat = (item['category'] || 'style').toLowerCase();
        countMap[cat] = (countMap[cat] || 0) + 1;
      });

      // 2. Сортуємо категорії за кількістю згадок (від більшого до меншого)
      const sortedCats = Object.keys(countMap).sort((a, b) => countMap[b] - countMap[a]);

      // 3. Обмежуємо загальний максимум (не більше 6 найпопулярніших + 'all')
      const topCategories = sortedCats.slice(0, 6);

      return ['all', ...topCategories];
    })
  );

  // Фільтруємо новини за категоріями та пагінацією
  public news$: Observable<any[]> = combineLatest([
    toObservable(this.selectedCategory),
    toObservable(this.currentPage),
    // ВИПРАВЛЕНО: Додано startWith, щоб потік мови вистрілював одразу при переході на сторінку
    this.translate.onLangChange.pipe(
      map(e => e.lang),
      startWith(this.translate.currentLang || 'en'),
      switchMap(() => [null])
    )
  ]).pipe(
    switchMap(([category, page]) => {
      return this.dataService.getNews().pipe(
        map(news => {
          // 1. Фільтрація
          const filtered = category.toLowerCase() === 'all' 
            ? news 
            : news.filter(n => (n['category'] || '').toUpperCase() === category.toUpperCase());

          // 2. Розрахунок сторінок для пагінації (очищення запобігає багам трекінгу в Angular)
          this.pageNumbers = []; 
          const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
          this.pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

          // 3. Нарізаємо порцію з 10 елементів
          const startIndex = (page - 1) * this.itemsPerPage;
          const endIndex = startIndex + this.itemsPerPage;
          
          return filtered.slice(startIndex, endIndex);
        })
      );
    })
  );

  // Метод для безпечного отримання перекладеного контенту
  getContent(item: any, field: 'title' | 'text'): string {
    const lang = this.translate.currentLang || 'en';
    return item[`${field}_${lang}`] || item[`${field}_en`] || item[`${field}_uk`] || '';
  }

  getSeoPageUrl(articleId: number): string {
    return new URL(`news/${articleId}/`, document.baseURI).href;
  }

  private setCategoryState(category: string) {
    const normalized = category.toLowerCase() === 'all' ? 'all' : category.toUpperCase();
    this.currentPage.set(1);
    this.selectedCategory.set(normalized);
  }

  // Метод перемикання категорій
  setCategory(category: string) {
    this.setCategoryState(category);
  }

  // Метод зміни сторінки користувачем
  setPage(page: number) {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}