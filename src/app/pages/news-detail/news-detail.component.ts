import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NewsItem } from '../../models/news.model';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterLink],
  templateUrl: './news-detail.component.html',
  styleUrl: './news-detail.component.scss'
})
export class NewsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  public translate = inject(TranslateService);

  article?: NewsItem;

  ngOnInit(): void {
    // 1. Зчитуємо параметр як рядок без конвертації в Number
    const routeId = this.route.snapshot.paramMap.get('id');

    if (!routeId) {
      this.router.navigate(['/404'], { skipLocationChange: true });
      return;
    }

    // 2. Шукаємо новину у списку
    this.dataService.getNews().subscribe(news => {
      this.article = news.find(item => 
        item.id === routeId || item.numeric_id === Number(routeId)
      );

      // 3. Якщо новину не знайдено — редіректимо на 404
      if (!this.article) {
        this.router.navigate(['/404'], { skipLocationChange: true });
      }
    });
  }

  getContent(field: 'title' | 'text'): string {
    if (!this.article) return '';
    const lang = this.translate.currentLang || 'uk';
    return this.article[`${field}_${lang}`] || this.article[`${field}_uk`];
  }
}