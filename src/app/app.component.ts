import { Component, OnInit, inject, computed, HostListener, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; 
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { CartService } from './services/cart.service';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

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
  public cartService = inject(CartService);
  private translate = inject(TranslateService);

  public isDarkMode = false;
  // Масив усіх підтримуваних мов сайту
  public supportedLangs = ['uk', 'en', 'de', 'fr', 'pl', 'it', 'ja', 'zh'];

  // Перетворюємо початкову мову в Signal для миттєвого реактивного оновлення UI
  public currentLangSignal = signal<string>('en');

  public isHeaderHidden = signal<boolean>(false);
  public isScrolled = signal<boolean>(false);
  public showInstallPrompt = signal(false);
  public showInstallInstructions = signal(false);

  private deferredInstallPrompt: InstallPromptEvent | null = null;
  private readonly installDismissedKey = 'virniInstallPromptDismissedUntil';
  
  private lastScrollTop = 0;
  private scrollThreshold = 10;

  public cartCount = computed(() => {
    return this.cartService.items().reduce((total, item) => total + item.quantity, 0);
  });

  ngOnInit() {
    // 1. Ініціалізація локалізації
    this.translate.addLangs(this.supportedLangs);
    this.translate.setDefaultLang('en');

    const savedLang = localStorage.getItem('language');
    let langToUse = 'en';

    if (savedLang && this.supportedLangs.includes(savedLang)) {
      langToUse = savedLang;
    } else {
      const browserLang = this.translate.getBrowserLang() || 'en';
      langToUse = this.supportedLangs.includes(browserLang) ? browserLang : 'en';
    }

    this.translate.use(langToUse);
    this.currentLangSignal.set(langToUse);
    localStorage.setItem('language', langToUse);

    // Слухаємо зміни мови від TranslateService
    this.translate.onLangChange.subscribe(event => {
      this.currentLangSignal.set(event.lang);
    });

    // 2. Ініціалізація теми
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }

    this.scheduleInstallPrompt();
  }

  // Зміна мови
  changeLang(lang: string) {
    if (this.supportedLangs.includes(lang)) {
      this.translate.use(lang);
      this.currentLangSignal.set(lang);
      localStorage.setItem('language', lang);
    }
  }

  get currentLang(): string {
    return this.currentLangSignal();
  }

  // Решта методів залишаються без змін...
  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event) {
    if (!this.isMobileDevice() || this.isInstalledAsPwa()) return;
    event.preventDefault();
    this.deferredInstallPrompt = event as InstallPromptEvent;
    if (!this.isInstallPromptDismissed()) {
      this.showInstallPrompt.set(true);
    }
  }

  @HostListener('window:appinstalled')
  onAppInstalled() {
    this.deferredInstallPrompt = null;
    this.showInstallPrompt.set(false);
    localStorage.removeItem(this.installDismissedKey);
  }

  async installApp() {
    if (!this.deferredInstallPrompt) {
      this.showInstallInstructions.set(true);
      return;
    }
    const installPrompt = this.deferredInstallPrompt;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    this.deferredInstallPrompt = null;

    if (choice.outcome === 'accepted') {
      this.showInstallPrompt.set(false);
    } else {
      this.showInstallInstructions.set(true);
    }
  }

  hasNativeInstallPrompt(): boolean {
    return this.deferredInstallPrompt !== null;
  }

  isIosDevice(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  dismissInstallPrompt() {
    const dismissUntil = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(this.installDismissedKey, String(dismissUntil));
    this.showInstallPrompt.set(false);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isScrolled.set(scrollTop > 50);

    if (scrollTop < 0) return;
    const scrollDelta = Math.abs(scrollTop - this.lastScrollTop);

    if (scrollDelta > this.scrollThreshold) {
      if (scrollTop > this.lastScrollTop && scrollTop > 150) {
        this.isHeaderHidden.set(true);
      } else {
        this.isHeaderHidden.set(false);
      }
    }
    this.lastScrollTop = scrollTop;
  }

  toggleTheme() {
    this.isDarkMode ? this.disableDarkMode() : this.enableDarkMode();
  }

  enableDarkMode() {
    this.isDarkMode = true;
    this.applyTheme('dark');
  }

  disableDarkMode() {
    this.isDarkMode = false;
    this.applyTheme('light');
  }

  private applyTheme(theme: 'dark' | 'light') {
    const body = document.body;
    body.classList.add('theme-switching');
    body.classList.toggle('dark-theme', theme === 'dark');
    body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('theme', theme);
    requestAnimationFrame(() => body.classList.remove('theme-switching'));
  }

  private scheduleInstallPrompt() {
    if (!this.isMobileDevice() || this.isInstalledAsPwa() || this.isInstallPromptDismissed()) return;
    window.setTimeout(() => {
      if (!this.isInstalledAsPwa() && !this.isInstallPromptDismissed()) {
        this.showInstallPrompt.set(true);
      }
    }, 1800);
  }

  private isMobileDevice(): boolean {
    const capacitor = (window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean };
    }).Capacitor;
    if (capacitor?.isNativePlatform?.()) return false;

    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      || window.matchMedia('(max-width: 768px)').matches;
  }

  private isInstalledAsPwa(): boolean {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return isStandalone || isIosStandalone;
  }

  private isInstallPromptDismissed(): boolean {
    const dismissUntil = Number(localStorage.getItem(this.installDismissedKey) || 0);
    if (dismissUntil > Date.now()) return true;
    if (dismissUntil) localStorage.removeItem(this.installDismissedKey);
    return false;
  }
}