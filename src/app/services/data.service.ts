import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);

  getNews(): Observable<any[]> {
    return this.http.get<any[]>('./assets/data/news.json');
  }

  getVideos(): Observable<any[]> {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${environment.youtubeApiKey}&channelId=${environment.youtubeChannelId}&part=snippet,id&order=date&maxResults=6&type=video`;
    
    // Додаємо типізацію (any), щоб TypeScript не сварився на response
    return this.http.get<any>(url).pipe(
      map((response: any) => response.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high.url
      })))
    );
  }
}
