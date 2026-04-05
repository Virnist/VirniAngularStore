import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { routes } from './app.routes';

// 1. Створюємо свій клас-завантажувач. Це позбавляє нас проблем із конструктором бібліотеки.
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    // Тут ми чітко вказуємо шлях для Static HTML
    return this.http.get(`./assets/i18n/${lang}.json`);
  }
}

// 2. Фабрика, яка тепер використовує наш клас
export function HttpLoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Вмикаємо решітку (#) для коректної роботи на GitHub Pages
    provideRouter(
      routes, 
      withHashLocation(), 
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
    ),
    
    provideHttpClient(),

    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        },
        fallbackLang: 'en'
      })
    )
  ]
};