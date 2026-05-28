import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router'; 
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Product } from '../../models/product.model';

interface FeedItem {
  type: 'news' | 'product' | 'video';
  id: number | string;
  image: string;
  title: string;
  description: string;
  date?: string;
  rawItem: any;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, AsyncPipe, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private dataService = inject(DataService);
  private cartService = inject(CartService);
  public translate = inject(TranslateService);
  private router = inject(Router);

  // Тепер просто оголошуємо потік, а створювати будемо в ngOnInit
  public feed$!: Observable<FeedItem[]>;

  ngOnInit() {
    if (!this.dataService.rates()) {
      this.dataService.fetchExchangeRates().subscribe({
        error: (err) => console.error('Помилка завантаження курсів:', err)
      });
    }

    // 1. Створюємо потік подій зміни мови, який відразу дає поточну мову (через startWith)
    const langChanges$ = this.translate.onLangChange.pipe(
      startWith({ lang: this.translate.currentLang || 'en' })
    );

    // 2. Робимо твій запит до даних
    const data$ = forkJoin({
      news: this.dataService.getNews(),
      products: this.dataService.getProducts() as Observable<Product[]>,
      videos: this.dataService.getVideos()
    });

    // 3. Магія: combineLatest змушує Angular перераховувати назви КОЖЕН раз, коли міняється мова
    this.feed$ = combineLatest([data$, langChanges$]).pipe(
      map(([{ news, products, videos }, _]) => {
        
        const mappedNews: FeedItem[] = (news || []).map(item => ({
          type: 'news', id: item.id, image: item.image,
          title: this.getContent(item, 'title'), 
          description: this.getContent(item, 'text'),
          date: item.date, rawItem: item
        }));

        const mappedProducts: FeedItem[] = (products || []).map(item => ({
          type: 'product', id: item.id, image: item.image,
          title: this.getLangContent(item, 'title'), 
          description: this.getLangContent(item, 'description') || '',
          rawItem: item
        }));

        const mappedVideos: FeedItem[] = (videos || []).map(item => ({
          type: 'video', id: item.id, image: item.thumbnail,
          title: item.title, description: item.description, rawItem: item
        }));

        return this.shuffleArray([...mappedNews, ...mappedProducts, ...mappedVideos]);
      })
    );
  }

  // Оновлено: тепер пріоритет на поточну мову -> потім англійська -> потім українська
  getContent(item: any, field: 'title' | 'text'): string {
    const lang = this.translate.currentLang || 'en';
    return item[`${field}_${lang}`] || item[`${field}_en`] || item[`${field}_uk`] || '';
  }

  // Оновлено: тепер пріоритет на поточну мову -> потім англійська -> потім українська
  getLangContent(item: any, field: string): string {
    const lang = this.translate.currentLang || 'en';
    return item[`${field}_${lang}`] || item[`${field}_en`] || item[`${field}_uk`] || '';
  }

  onCardAction(item: FeedItem, event: Event) {
    const target = event.target as HTMLElement;
    const isButtonClick = target.classList.contains('read-more') || target.closest('.read-more');

    if (isButtonClick) {
      event.stopPropagation();
      event.preventDefault();

      if (item.type === 'product') {
        this.cartService.addToCart(item.rawItem, item.title);
        console.log(`Товар успішно додано в кошик: ${item.title}`);
      } else if (item.type === 'video') {
        window.open(`https://www.youtube.com/watch?v=${item.id}`, '_blank');
      } else if (item.type === 'news') {
        this.router.navigate(['/news', item.id]);
      }
    } else {
      if (item.type === 'news') {
        this.router.navigate(['/news', item.id]);
      } else if (item.type === 'product') {
        this.router.navigate(['/product', item.id]); 
      } else if (item.type === 'video') {
        window.open(`https://www.youtube.com/watch?v=${item.id}`, '_blank');
      }
    }
  }

  onBadgeClick(type: 'news' | 'product' | 'video', event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (type === 'product') {
      this.router.navigate(['/shop']); 
    } else if (type === 'news') {
      this.router.navigate(['/news']); 
    } else if (type === 'video') {
      this.router.navigate(['/videos']); 
    }
  }
  
  private shuffleArray(array: FeedItem[]): FeedItem[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}