import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; 
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    TranslateModule,
    CommonModule,
    UpperCasePipe
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  isDarkMode = false;
  // Список підтримуваних мов (ISO-коди)
  supportedLangs = ['uk', 'en', 'de', 'fr', 'pl'];

  constructor(private translate: TranslateService) {
    this.translate.addLangs(this.supportedLangs);
    this.translate.setDefaultLang('en');

    const savedLang = localStorage.getItem('language');
    
    if (savedLang && this.supportedLangs.includes(savedLang)) {
      this.translate.use(savedLang);
    } else {
      const browserLang = this.translate.getBrowserLang() || 'en';
      // Перевіряємо, чи мова браузера є у нашому списку
      const langToUse = this.supportedLangs.includes(browserLang) ? browserLang : 'en';
      this.translate.use(langToUse);
      localStorage.setItem('language', langToUse);
    }
  }

  changeLang(lang: string) {
    if (this.supportedLangs.includes(lang)) {
      this.translate.use(lang);
      localStorage.setItem('language', lang);
    }
  }

  get currentLang(): string {
    return this.translate.currentLang || 'en';
  }

  toggleTheme() {
    this.isDarkMode ? this.disableDarkMode() : this.enableDarkMode();
  }

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    
    // Перевіряємо, чи є збережений вибір, АБО чи на ПК увімкнено Dark Mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }
  }

  enableDarkMode() {
    this.isDarkMode = true; // Тепер іконка (сонечко/місяць) синхронна
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    localStorage.setItem('theme', 'dark');
  }

  disableDarkMode() {
    this.isDarkMode = false;
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
}
