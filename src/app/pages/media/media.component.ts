import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DataService } from '../../services/data.service';

interface MusicTrack {
  id: number;
  title: string;
  poster: string;
  audioUrl: string;
  downloadUrl: string;
}

type TrackSortOrder = 'title-asc' | 'title-desc' | 'popular' | 'random';

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './media.component.html',
  styleUrl: './media.component.scss'
})
export class MediaComponent {
  private http = inject(HttpClient);
  private dataService = inject(DataService);
  private sanitizer = inject(DomSanitizer);
  private readonly embedUrlCache = new Map<string, SafeResourceUrl>();

  readonly isLandscape = signal<boolean>(window.innerWidth > window.innerHeight);
  readonly selectedVideoId = signal<string | null>(null);
  readonly tracks = signal<MusicTrack[]>([]);
  readonly sortOrder = signal<TrackSortOrder>('title-asc');
  readonly currentPage = signal(1);
  readonly pageSize = 20;
  readonly defaultPoster = './assets/images/Mp3Title/Virni Music - Title.webp';
  private readonly randomTrackIds = signal<number[]>([]);
  private readonly trackOpenCounts = signal<Record<number, number>>(this.loadTrackOpenCounts());

  readonly sortedTracks = computed(() => {
    const tracks = this.tracks();
    if (this.sortOrder() === 'random') {
      const tracksById = new Map(tracks.map(track => [track.id, track]));
      const shuffledTracks = this.randomTrackIds().map(trackId => tracksById.get(trackId));
      return shuffledTracks.filter((track): track is MusicTrack => track !== undefined);
    }

    return [...tracks].sort((firstTrack, secondTrack) => {
      const titleOrder = firstTrack.title.localeCompare(secondTrack.title, undefined, {
        numeric: true,
        sensitivity: 'base'
      });

      if (this.sortOrder() === 'popular') {
        const popularityOrder = (this.trackOpenCounts()[secondTrack.id] || 0)
          - (this.trackOpenCounts()[firstTrack.id] || 0);
        return popularityOrder || titleOrder;
      }

      return this.sortOrder() === 'title-asc' ? titleOrder : -titleOrder;
    });
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.sortedTracks().length / this.pageSize)));
  readonly visibleTracks = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.sortedTracks().slice(start, start + this.pageSize);
  });

  videos$: Observable<any[]> = this.dataService.getVideos().pipe(
    map(videos => (videos || []).slice(0, 5)),
    catchError(() => of([]))
  );

  constructor() {
    this.loadTracks();
  }

  @HostListener('window:resize')
  onResize() {
    this.isLandscape.set(window.innerWidth > window.innerHeight);
  }

  getEmbedUrl(videoId: string | null): SafeResourceUrl {
    const safeVideoId = videoId && /^[\w-]+$/.test(videoId) ? videoId : null;
    if (safeVideoId) {
      const cachedUrl = this.embedUrlCache.get(safeVideoId);
      if (cachedUrl) {
        return cachedUrl;
      }
    }

    const url = safeVideoId
      ? `https://www.youtube-nocookie.com/embed/${safeVideoId}?autoplay=1&mute=1&rel=0&controls=1&loop=1&playlist=${safeVideoId}`
      : 'about:blank';

    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    if (safeVideoId) {
      this.embedUrlCache.set(safeVideoId, safeUrl);
    }
    return safeUrl;
  }

  setActiveVideo(videoId: string) {
    this.selectedVideoId.set(videoId);
  }

  setSortOrder(event: Event) {
    const sortOrder = (event.target as HTMLSelectElement).value as TrackSortOrder;
    this.sortOrder.set(sortOrder);
    if (sortOrder === 'random') {
      this.shuffleTracks();
    }
    this.currentPage.set(1);
  }

  setPage(page: number) {
    this.currentPage.set(Math.min(Math.max(page, 1), this.pageCount()));
    setTimeout(() => {
      const playerShell = document.querySelector('.player-shell');
      if (playerShell) {
        const targetTop = window.scrollY + playerShell.getBoundingClientRect().top - 170;
        window.scrollTo(0, Math.max(0, targetTop));
      }
    }, 0);
  }

  recordTrackOpen(track: MusicTrack) {
    const currentCounts = this.trackOpenCounts();
    const updatedCounts = {
      ...currentCounts,
      [track.id]: (currentCounts[track.id] || 0) + 1
    };
    this.trackOpenCounts.set(updatedCounts);

    try {
      localStorage.setItem('virniMediaTrackOpenCounts', JSON.stringify(updatedCounts));
    } catch {
      // Keep the current-session count if browser storage is unavailable.
    }
  }

  getDrivePreviewUrl(track: MusicTrack): string {
    const fileId = track.audioUrl.match(/[?&]id=([\w-]+)/)?.[1];
    const safeFileId = fileId && /^[\w-]+$/.test(fileId) ? fileId : null;
    return safeFileId
      ? `https://drive.google.com/file/d/${safeFileId}/preview`
      : 'https://drive.google.com/';
  }

  private loadTracks() {
    this.http.get<MusicTrack[]>('./assets/data/music-tracks.json').subscribe({
      next: (tracks) => this.tracks.set(tracks || this.buildFallbackTracks()),
      error: () => this.tracks.set(this.buildFallbackTracks())
    });
  }

  private shuffleTracks() {
    const shuffledTracks = [...this.tracks()];
    for (let remaining = shuffledTracks.length; remaining > 1; remaining -= 1) {
      const lastIndex = remaining - 1;
      const randomIndex = Math.floor(Math.random() * remaining);
      [shuffledTracks[lastIndex], shuffledTracks[randomIndex]] = [
        shuffledTracks[randomIndex],
        shuffledTracks[lastIndex]
      ];
    }
    this.randomTrackIds.set(shuffledTracks.map(track => track.id));
  }

  private loadTrackOpenCounts(): Record<number, number> {
    try {
      return JSON.parse(localStorage.getItem('virniMediaTrackOpenCounts') || '{}') as Record<number, number>;
    } catch {
      return {};
    }
  }

  private buildFallbackTracks(): MusicTrack[] {
    return Array.from({ length: 110 }, (_, index) => ({
      id: index + 1,
      title: `Track ${index + 1}`,
      poster: this.defaultPoster,
      audioUrl: `https://drive.google.com/uc?export=download&id=YOUR_DRIVE_FILE_ID_${String(index + 1).padStart(3, '0')}`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=YOUR_DRIVE_FILE_ID_${String(index + 1).padStart(3, '0')}`
    }));
  }

}
