import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // У 2026 році замість конструктора часто використовують функцію inject()
  private http = inject(HttpClient);

  // Метод для завантаження новин
  getNews(): Observable<any[]> {
    return this.http.get<any[]>('./assets/data/news.json');
  }

  // Метод для завантаження товарів
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>('./assets/data/products.json');
  }

  // Тут пізніше буде метод для YouTube API
}