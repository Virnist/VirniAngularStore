import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Додаємо для навігації
import { DataService } from '../../services/data.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NewsItem } from '../../models/news.model'; // Імпортуємо модель
import { Observable } from 'rxjs';

@Component({
  selector: 'app-news',
  standalone: true,
  // Додаємо RouterLink в imports, щоб працював перехід на статтю
  imports: [CommonModule, TranslateModule, RouterLink], 
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss'
})
export class NewsComponent {
  private dataService = inject(DataService);
  public translate = inject(TranslateService);

  // Створюємо потік новин з сервісу
  public news$: Observable<NewsItem[]> = this.dataService.getNews();

  /**
   * Динамічно отримує контент для 5 мов:
   * Шукає поле за схемою field_lang (наприклад: title_pl, text_fr)
   */
  getContent(item: NewsItem, field: 'title' | 'text'): string {
    const lang = this.translate.currentLang || 'uk';
    const key = `${field}_${lang}`;
    // Якщо перекладу немає (наприклад, забули додати title_de), повертаємо українську версію
    return item[key] || item[`${field}_uk`];
  }
}