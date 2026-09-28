import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, tap } from 'rxjs';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent implements OnInit {
  private router = inject(Router);
  private dataService = inject(DataService);
  private sanitizer = inject(DomSanitizer);

  requestedUrl: string = '';
  videos$!: Observable<any[]>;
  
  // Сигнали для ID та безпечного URL
  selectedVideoId = signal<string | null>(null);
  currentEmbedUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit(): void {
    this.requestedUrl = this.router.url;
    
    // Отримуємо відео та вибираємо випадкове після завантаження
    this.videos$ = this.dataService.getVideos().pipe(
      tap((videos) => {
        if (videos && videos.length > 0) {
          const randomIndex = Math.floor(Math.random() * videos.length);
          const randomVideo = videos[randomIndex];
          const videoId = randomVideo.id || randomVideo.videoId; // Враховує різні структури об'єкта
          
          this.selectedVideoId.set(videoId);
          this.currentEmbedUrl.set(this.getEmbedUrl(videoId));
        }
      })
    );
  }

  // Генерація безпечного URL для iframe із автовідтворенням
  getEmbedUrl(videoId: string): SafeResourceUrl {
    const url = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&rel=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}