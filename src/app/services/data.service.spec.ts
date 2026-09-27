import { importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

import { DataService } from './data.service';

describe('DataService', () => {
  let service: DataService;
  let httpTestingController: HttpTestingController;
  let originalYoutubeApiKey: string;

  beforeEach(() => {
    originalYoutubeApiKey = environment.youtubeApiKey;
    environment.youtubeApiKey = '';
    TestBed.configureTestingModule({
      providers: [
        DataService,
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(TranslateModule.forRoot())
      ]
    });
    service = TestBed.inject(DataService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    environment.youtubeApiKey = originalYoutubeApiKey;
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('shuffles fallback videos without changing the source array', () => {
    const videos = [{ id: 'first' }, { id: 'second' }, { id: 'third' }];
    spyOn(Math, 'random').and.returnValue(0);
    let result: { id: string }[] = [];

    service.getVideos().subscribe(value => result = value);
    httpTestingController.expectOne('./assets/data/videos.json').flush(videos);

    expect(result.map(video => video.id)).toEqual(['second', 'third', 'first']);
    expect(videos.map(video => video.id)).toEqual(['first', 'second', 'third']);
  });

  it('keeps YouTube API videos in the order returned by YouTube', () => {
    environment.youtubeApiKey = 'test-key';
    const firstVideo = {
      contentDetails: { videoId: 'first' },
      snippet: { title: 'First', description: '', thumbnails: { maxres: { url: 'first.jpg' } } }
    };
    const secondVideo = {
      contentDetails: { videoId: 'second' },
      snippet: { title: 'Second', description: '', thumbnails: { maxres: { url: 'second.jpg' } } }
    };
    let result: { id: string }[] = [];

    service.getVideos().subscribe(value => result = value);
    httpTestingController.expectOne(request => request.url.includes('/youtube/v3/playlistItems')).flush({
      items: [firstVideo, secondVideo]
    });

    expect(result.map(video => video.id)).toEqual(['first', 'second']);
  });
});
