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
    const routeId = this.route.snapshot.paramMap.get('id');

    if (!routeId) {
      this.router.navigate(['/404'], { skipLocationChange: true });
      return;
    }

    this.dataService.getNews().subscribe(news => {
      this.article = news.find(item => 
        item.id === routeId || item.numeric_id === Number(routeId)
      );

      if (!this.article) {
        this.router.navigate(['/404'], { skipLocationChange: true });
      }
    });
  }

  getContent(field: 'title' | 'text' | 'image_alt'): string {
    if (!this.article) return '';
    const lang = this.translate.currentLang || 'uk';
    return (this.article as any)[`${field}_${lang}`] || (this.article as any)[`${field}_uk`] || (this.article as any)[`${field}_en`] || '';
  }

  // Метод для кліку по категорії на сторінці детальної новини
  onCategoryClick(category: string): void {
  if (!category) return;
  this.router.navigate(['/news'], { 
    queryParams: { category: category.toUpperCase() } 
  });
}
}