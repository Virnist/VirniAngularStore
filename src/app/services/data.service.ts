import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { NewsItem } from '../models/news.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private videosCache?: Observable<any[]>;

  // --- СИГНАЛИ ДЛЯ МИТТЄВОГО ДОСТУПУ ---
  rates = signal<Record<string, number> | null>(null);
  products = signal<Product[]>([]); // Додано сигнал товарів

  // --- НОВИНИ ---
  getNews(): Observable<NewsItem[]> {
    return this.http.get<NewsItem[]>('assets/data/news.json');
  }

  getNewsById(id: string | number): Observable<NewsItem | undefined> {
    return this.getNews().pipe(
      map(news => news.find(item => 
        item.id === String(id) || item.numeric_id === Number(id)
      ))
    );
  }

  // --- ВІДЕО ---
  getVideos(): Observable<any[]> {
    if (!this.videosCache) {
      const channelId = environment.youtubeChannelId || 'UCNilfw7uSJVDhUcLLYcD_Cw';
      const uploadsPlaylistId = channelId.startsWith('UC') ? `UU${channelId.slice(2)}` : channelId;
      const fallback = () => this.http.get<any[]>('assets/data/videos.json').pipe(
        map(videos => this.shuffleVideos(videos))
      );

      if (!environment.youtubeApiKey) {
        console.warn('YouTube API key is missing. Using the local videos.json fallback.');
        this.videosCache = fallback().pipe(shareReplay(1));
      } else {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${environment.youtubeApiKey}&playlistId=${uploadsPlaylistId}&part=snippet,contentDetails&maxResults=6`;
        this.videosCache = this.http.get<any>(url).pipe(
          map(response => (response.items || []).map((item: any) => {
            const snippet = item.snippet;
            return {
              id: item.contentDetails?.videoId || snippet.resourceId?.videoId,
              title: snippet.title,
              description: snippet.description,
              thumbnail: snippet.thumbnails.maxres?.url || snippet.thumbnails.high?.url || snippet.thumbnails.default?.url
            };
          }).filter((video: any) => video.id)),
          catchError(error => {
            console.warn('YouTube uploads playlist is unavailable. Using the local videos.json fallback.', error);
            return fallback();
          }),
          shareReplay(1)
        );
      }
    }

    return this.videosCache;
  }

  private shuffleVideos<T>(videos: T[]): T[] {
    const shuffledVideos = [...videos];
    for (let index = shuffledVideos.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffledVideos[index], shuffledVideos[randomIndex]] = [shuffledVideos[randomIndex], shuffledVideos[index]];
    }
    return shuffledVideos;
  }

  // --- ВАЛЮТИ ---
  fetchExchangeRates(): Observable<any> {
    const url = `https://open.er-api.com/v6/latest/USD`; 
    return this.http.get<any>(url).pipe(
      tap(data => this.rates.set(data.rates))
    );
  }

  // --- МАГАЗИН ---
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('assets/data/products.json').pipe(
      map(products => this.sortProductsByAvailability(products)),
      tap(sortedProducts => this.products.set(sortedProducts)) // Синхронізуємо зі сигналом
    );
  }

  private sortProductsByAvailability(products: Product[]): Product[] {
    return [...products].sort((a, b) => {
      const getPriority = (p: Product): number => {
        if (p.stock && p.stock > 0) return 3;
        if (p.productionTime && p.productionTime > 0) return 2;
        return 1;
      };

      return getPriority(b) - getPriority(a);
    });
  }
}