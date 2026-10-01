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
  private itemsPerPage = 10;

  public pageNumbers: number[] = [];

  // Отримуємо категорії, відсортовані за популярністю
  public categories$: Observable<string[]> = this.dataService.getNews().pipe(
    map(news => {
      const countMap: { [key: string]: number } = {};
      news.forEach(item => {
        const cat = (item['category'] || 'style').toLowerCase();
        countMap[cat] = (countMap[cat] || 0) + 1;
      });

      const sortedCats = Object.keys(countMap).sort((a, b) => countMap[b] - countMap[a]);
      return ['all', ...sortedCats];
    })
  );

  // Фільтруємо новини за категоріями та пагінацією
  public news$: Observable<any[]> = combineLatest([
    toObservable(this.selectedCategory),
    toObservable(this.currentPage),
    this.translate.onLangChange.pipe(
      map(e => e.lang),
      startWith(this.translate.currentLang || 'uk'),
      switchMap(() => [null])
    )
  ]).pipe(
    switchMap(([category, page]) => {
      return this.dataService.getNews().pipe(
        map(news => {
          const filtered = category.toLowerCase() === 'all' 
            ? news 
            : news.filter(n => (n['category'] || '').toUpperCase() === category.toUpperCase());

          const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
          this.pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

          const startIndex = (page - 1) * this.itemsPerPage;
          const endIndex = startIndex + this.itemsPerPage;
          
          return filtered.slice(startIndex, endIndex);
        })
      );
    })
  );

  // Метод для безпечного отримання перекладеного контенту
  getContent(item: any, field: 'title' | 'text'): string {
    const lang = this.translate.currentLang || 'uk';
    return item[`${field}_${lang}`] || item[`${field}_uk`] || item[`${field}_en`] || '';
  }

  // Вправлено: приймати string | number
  getSeoPageUrl(articleId: string | number): string {
    return new URL(`news/${articleId}`, document.baseURI).href;
  }

  onBadgeClick(category: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const normalizedCategory = category.toUpperCase();
    this.setCategoryState(this.selectedCategory() === normalizedCategory ? 'all' : normalizedCategory);
  }

  private setCategoryState(category: string) {
    const normalized = category.toLowerCase() === 'all' ? 'all' : category.toUpperCase();
    this.currentPage.set(1);
    this.selectedCategory.set(normalized);
  }

  setCategory(category: string) {
    this.setCategoryState(category);
  }

  setPage(page: number) {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}