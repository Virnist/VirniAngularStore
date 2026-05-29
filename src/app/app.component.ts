import { Component, OnInit, inject, computed, HostListener, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; 
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { CartService } from './services/cart.service';

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
  // Інжектуємо сервіси за стандартом сучасної розробки
  public cartService = inject(CartService);
  private translate = inject(TranslateService);

  // Стан теми та мов
  public isDarkMode = false;
  public supportedLangs = ['uk', 'en', 'de', 'fr', 'pl'];

  // Нові сигнали для контролю розумної шапки
  public isHeaderHidden = signal<boolean>(false);
  public isScrolled = signal<boolean>(false);
  
  private lastScrollTop = 0;
  private scrollThreshold = 10; // Мінімальна дельта скролу в пікселях, щоб уникнути сіпання екрану

  // Обчислювальний сигнал для кошика
  public cartCount = computed(() => {
    return this.cartService.items().reduce((total, item) => total + item.quantity, 0);
  });

  ngOnInit() {
    // 1. Ініціалізація локалізації
    this.translate.addLangs(this.supportedLangs);
    this.translate.setDefaultLang('en');

    const savedLang = localStorage.getItem('language');
    if (savedLang && this.supportedLangs.includes(savedLang)) {
      this.translate.use(savedLang);
    } else {
      const browserLang = this.translate.getBrowserLang() || 'en';
      const langToUse = this.supportedLangs.includes(browserLang) ? browserLang : 'en';
      this.translate.use(langToUse);
      localStorage.setItem('language', langToUse);
    }

    // 2. Ініціалізація теми оформлення (Темна / Світла)
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }
  }

  // Декоратор HostListener для відстеження розумного скролу шапки
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    // Перевіряємо, чи сторінка прокручена вниз від самого верху для ефекту розмиття скла
    this.isScrolled.set(scrollTop > 50);

    // Ігноруємо відскоки екрану на iOS (скрол в мінус або за межі висоти документу)
    if (scrollTop < 0) return;

    // Рахуємо різницю між поточним скролом і попереднім
    const scrollDelta = Math.abs(scrollTop - this.lastScrollTop);

    if (scrollDelta > this.scrollThreshold) {
      if (scrollTop > this.lastScrollTop && scrollTop > 150) {
        // Скролимо вниз — ховаємо меню
        this.isHeaderHidden.set(true);
      } else {
        // Скролимо вгору — плавно повертаємо меню на екран
        this.isHeaderHidden.set(false);
      }
    }

    this.lastScrollTop = scrollTop;
  }

  // Зміна мови додатку
  changeLang(lang: string) {
    if (this.supportedLangs.includes(lang)) {
      this.translate.use(lang);
      localStorage.setItem('language', lang);
    }
  }

  // Геттер для поточної мови
  get currentLang(): string {
    return this.translate.currentLang || 'en';
  }

  // Перемикач теми
  toggleTheme() {
    this.isDarkMode ? this.disableDarkMode() : this.enableDarkMode();
  }

  enableDarkMode() {
    this.isDarkMode = true;
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