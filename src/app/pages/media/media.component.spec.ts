import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MediaComponent } from './media.component';

describe('MediaComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaComponent, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MediaComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should paginate tracks and reset to the first page when sorting changes', () => {
    const fixture = TestBed.createComponent(MediaComponent);
    const component = fixture.componentInstance;
    component.tracks.set(Array.from({ length: 21 }, (_, index) => ({
      id: index + 1,
      title: `${21 - index}_Track`,
      poster: '',
      audioUrl: '',
      downloadUrl: ''
    })));

    expect(component.visibleTracks()).toHaveSize(20);
    component.setPage(2);
    expect(component.visibleTracks()).toHaveSize(1);

    component.setSortOrder({ target: { value: 'title-desc' } } as unknown as Event);

    expect(component.currentPage()).toBe(1);
    expect(component.visibleTracks()[0].title).toBe('21_Track');

    component.setSortOrder({ target: { value: 'random' } } as unknown as Event);

    expect(component.visibleTracks()).toHaveSize(20);
    expect(new Set(component.sortedTracks().map(track => track.id)).size).toBe(21);
  });

  it('should sort tracks by local Drive player opens', () => {
    const fixture = TestBed.createComponent(MediaComponent);
    const component = fixture.componentInstance;
    const tracks = [
      { id: 901, title: 'Z Track', poster: '', audioUrl: '', downloadUrl: '' },
      { id: 902, title: 'A Track', poster: '', audioUrl: '', downloadUrl: '' }
    ];
    component.tracks.set(tracks);
    component.setSortOrder({ target: { value: 'popular' } } as unknown as Event);

    component.recordTrackOpen(tracks[0]);
    component.recordTrackOpen(tracks[0]);

    expect(component.sortedTracks()[0].id).toBe(901);
  });
});
