import { importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppComponent } from './app.component';

class TestTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({ APP_TITLE: 'Virni' });
  }
}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        importProvidersFrom(TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TestTranslateLoader }
        }))
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize supported languages and default theme state', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.supportedLangs).toEqual(['uk', 'en', 'de', 'fr', 'pl', 'it', 'ja', 'zh']);
    expect(app.isDarkMode).toBeFalse();
    expect(app.currentLang).toBeDefined();
  });

  it('should render the translated brand logo in the header', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo')?.textContent).toContain('Virni');
  });
});
