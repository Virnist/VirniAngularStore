import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable, combineLatest } from 'rxjs';
import { map, startWith, shareReplay } from 'rxjs/operators';
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
  imports: [CommonModule, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private dataService = inject(DataService);
  private cartService = inject(CartService);
  public translate = inject(TranslateService);
  private router = inject(Router);

  public feed$!: Observable<FeedItem[]>;

  ngOnInit() {
    if (!this.dataService.rates()) {
      this.dataService.fetchExchangeRates().subscribe({
        error: (err) => console.error('Помилка завантаження курсів:', err)
      });
    }

    // 1. Потік зміни мови із початковим значенням
    const langChanges$ = this.translate.onLangChange.pipe(
      startWith({ lang: this.translate.currentLang || 'en' })
    );

    // 2. Запит до даних з вибіркою НАЙНОВІШИХ по 3 штуки та їх подальшим перемішуванням
    const mixedData$ = forkJoin({
      news: this.dataService.getNews(),
      products: this.dataService.getProducts() as Observable<Product[]>,
      videos: this.dataService.getVideos()
    }).pipe(
      map(({ news, products, videos }) => {
        
        // --- 1. ОБРОБКА НОВИН (Сортування за датою від новіших до старіших) ---
        const latestNews = (news || [])
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA; // Спочатку новіші
          })
          .slice(0, 3) // Беремо топ-3
          .map(item => ({ ...item, FEED_TYPE: 'news' }));

        // --- 2. ОБРОБКА ТОВАРІВ (Сортування за спаданням ID або дати додавання) ---
        const latestProducts = (products || [])
          .sort((a, b) => Number(b.id) - Number(a.id)) // Припускаємо, що більший ID — новіший товар
          .slice(0, 3) // Беремо топ-3
          .map(item => ({ ...item, FEED_TYPE: 'product' }));

        // --- 3. ОБРОБКА ВІДЕО (Беремо останні 3 додані відео з масиву) ---
        const latestVideos = (videos || [])
          .sort((a, b) => {
            // Якщо у відео є дата, сортуємо за нею, якщо ні — за ID у зворотньому порядку
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB !== 0 || dateA !== 0 ? dateB - dateA : Number(b.id) - Number(a.id);
          })
          .slice(0, 3) // Беремо топ-3
          .map(item => ({ ...item, FEED_TYPE: 'video' }));

        // Об'єднуємо відібрані 9 елементів (3 + 3 + 3) в єдиний масив
        const topNineItems = [...latestNews, ...latestProducts, ...latestVideos];

        // Перемішуємо ці 9 елементів між собою, щоб вони не йшли групами
        return this.shuffleArray(topNineItems);
      }),
      shareReplay(1) // Кешуємо результат, щоб уникнути повторних запитів
    );

    // 3. Комбінуємо фіксований за структурою масив із потоком мови
    this.feed$ = combineLatest([mixedData$, langChanges$]).pipe(
      map(([shuffledItems, _]) => {
        return shuffledItems.map(item => {
          if (item.FEED_TYPE === 'news') {
            return {
              type: 'news', id: item.id, image: item.image,
              title: this.getLangContent(item, 'title'), 
              description: this.getLangContent(item, 'text'),
              date: item.date, rawItem: item
            };
          } else if (item.FEED_TYPE === 'product') {
            return {
              type: 'product', id: item.id, image: item.image,
              title: this.getLangContent(item, 'title'), 
              description: this.getLangContent(item, 'description') || '',
              rawItem: item
            };
          } else {
            return {
              type: 'video', id: item.id, image: item.thumbnail,
              title: item.title, description: item.description, rawItem: item
            };
          }
        });
      })
    );
  }

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
  
  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}