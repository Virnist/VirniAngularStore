import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; 
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    TranslateModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'uk']);
    this.translate.setDefaultLang('en');

    // 1. Перевіряємо, чи є збережена мова в пам'яті браузера
    const savedLang = localStorage.getItem('language');
    
    if (savedLang) {
      // Якщо користувач вже обирав мову — ставимо її
      this.translate.use(savedLang);
    } else {
      // Якщо це перший візит — визначаємо мову браузера
      const browserLang = this.translate.getBrowserLang();
      const langToUse = browserLang?.match(/en|uk/) ? browserLang : 'en';
      this.translate.use(langToUse);
    }
  }

  changeLang(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('language', lang);
  }

  get currentLang(): string {
    return this.translate.currentLang;
  }

  isDarkMode = false;

  ngOnInit() {
    // Перевіряємо, чи користувач вже обирав тему раніше
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.enableDarkMode();
    }
  }

  toggleTheme() {
    this.isDarkMode ? this.disableDarkMode() : this.enableDarkMode();
  }

  enableDarkMode() {
    this.isDarkMode = true;
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme'); // Видаляємо світлу
    localStorage.setItem('theme', 'dark');
  }

  disableDarkMode() {
    this.isDarkMode = false;
    document.body.classList.add('light-theme');    // Додаємо світлу
    document.body.classList.remove('dark-theme');  // Видаляємо темну
    localStorage.setItem('theme', 'light');
  }
}