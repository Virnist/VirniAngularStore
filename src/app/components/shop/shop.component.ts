import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConvertPricePipe } from '../../pipes/convert-price.pipe';
import { Product } from '../../models/product.model';
import { Observable } from 'rxjs'; 

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, AsyncPipe, TranslateModule, ConvertPricePipe],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss'
})
export class ShopComponent implements OnInit {
  private dataService = inject(DataService);
  private cartService = inject(CartService);
  public translate = inject(TranslateService);

  // Явно вказуємо тип через Observable
  public products$ = this.dataService.getProducts() as Observable<Product[]>;

  ngOnInit() {
    // Перевіряємо наявність курсів валют
    if (!this.dataService.rates()) {
      this.dataService.fetchExchangeRates().subscribe({
        error: (err) => console.error('Помилка завантаження курсів:', err)
      });
    }
  }

  getContent(item: Product, field: string): string {
    const lang = this.translate.currentLang || 'uk';
    const key = `${field}_${lang}`;
    // Повертаємо переклад або дефолтну українську версію
    return item[key] || item[`${field}_uk`];
  }

  addToCart(product: Product) {
    const title = this.getContent(product, 'title');
    this.cartService.addToCart(product, title);
    
    // Тепер лог знаходиться всередині методу, де змінна title доступна
    console.log(`Додано в кошик: ${title}`);
  }
}