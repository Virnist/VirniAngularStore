import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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

  // Отримуємо потік даних прямо з сервісу
  news$ = this.dataService.getNews();
}