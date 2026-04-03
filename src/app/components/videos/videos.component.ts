import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './videos.component.html',
  styleUrl: './videos.component.scss'
})
export class VideosComponent {
  private dataService = inject(DataService);
  
  // Отримуємо потік відео з нашого сервісу
  videos$ = this.dataService.getVideos();
}
