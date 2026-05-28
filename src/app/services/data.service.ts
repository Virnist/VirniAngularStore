import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { NewsItem } from '../models/news.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);

  // --- НОВИНИ ---
  getNews(): Observable<NewsItem[]> {
    return this.http.get<NewsItem[]>('./assets/data/news.json');
  }

  getNewsById(id: number): Observable<NewsItem | undefined> {
    return this.getNews().pipe(
      map(news => news.find(item => item.id === id))
    );
  }

  // --- ВІДЕО (YouTube) з автоматичним перемиканням на JSON у разі помилки ---
  getVideos(): Observable<any[]> {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${environment.youtubeApiKey}&channelId=${environment.youtubeChannelId}&part=snippet,id&order=date&maxResults=6&type=video`;
    
    return this.http.get<any>(url).pipe(
      // Якщо запит до YouTube API успішний, мапимо дані як зазвичай
      map((response: any) => response.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high.url
      }))),
      
      // Ловимо 403 або будь-яку іншу помилку від Google
      catchError(error => {
        console.warn('YouTube API недоступне (403/квоти). Перемикаюсь на резервний локальний файл videos.json.', error);
        
        // Повертаємо новий потік — запит до нашого локального файлу
        return this.http.get<any[]>('./assets/data/videos.json');
      })
    );
  }

  // --- ВАЛЮТИ ---
  // Зберігаємо курси у сигналі для миттєвого доступу по всьому додатку
  rates = signal<any>(null);

  fetchExchangeRates(): Observable<any> {
    const url = `https://open.er-api.com/v6/latest/USD`; 
    return this.http.get<any>(url).pipe(
      tap(data => this.rates.set(data.rates))
    );
  }

  // --- МАГАЗИН ---
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>('./assets/data/products.json');
  }
}