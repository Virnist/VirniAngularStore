import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Product } from '../models/product.model';
import { DataService } from './data.service';
import { CartService } from './cart.service';

describe('CartService', () => {
  const product: Product = {
    id: 1,
    image: 'dress.jpg',
    category: 'dresses',
    price: 100,
    stock: 1,
    title_uk: 'Сукня',
    title_en: 'Dress',
    title_fr: 'Robe',
    variants: [
      {
        id: 'ivory',
        name_uk: 'Слонова кістка',
        name_en: 'Ivory',
        name_fr: 'Ivoire'
      }
    ]
  };

  beforeEach(() => {
    localStorage.removeItem('cart');
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: DataService,
          useValue: {
            products: signal([product]),
            rates: signal(null),
            fetchExchangeRates: () => of(null),
            getProducts: () => of([product])
          }
        }
      ]
    });
  });

  afterEach(() => {
    localStorage.removeItem('cart');
  });

  it('merges legacy translated variant rows and displays the current language', () => {
    localStorage.setItem('cart', JSON.stringify([
      {
        ...product,
        cartItemId: '1-default-ivory-fr',
        id: 1,
        title: 'Dress',
        price: 100,
        image: product.image,
        quantity: 1,
        variantId: 'Ivory',
        variant: 'Ivory'
      },
      {
        ...product,
        cartItemId: '1-default-ivory-uk',
        id: 1,
        title: 'Сукня',
        price: 100,
        image: product.image,
        quantity: 1,
        variantId: 'Слонова кістка',
        variant: 'Слонова кістка'
      }
    ]));

    const cartService = TestBed.inject(CartService);
    const translate = TestBed.inject(TranslateService);
    const variant = product.variants![0];

    cartService.addToCart(product, product['title_uk'], undefined, variant);
    translate.use('fr').subscribe();

    expect(cartService.items().length).toBe(1);
    expect(cartService.items()[0].quantity).toBe(3);
    expect(cartService.items()[0].title).toBe('Robe');
    expect(cartService.items()[0].variantName).toBe('Ivoire');
  });
});
