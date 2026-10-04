import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { Product, ProductVariant } from '../../models/product.model';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConvertPricePipe } from '../../pipes/convert-price.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, ConvertPricePipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  private cartService = inject(CartService);
  public translate = inject(TranslateService);
  
  // Сигнал для ефекту додавання в кошик
  public isAdded = signal<boolean>(false);

  product?: Product;
  selectedImage: string = '';
  
  // Сигнали для реактивності варіанта та розміру
  selectedVariant = signal<ProductVariant | null>(null);
  selectedSize = signal<string | null>(null);

  get isSizeRequired(): boolean {
    return !!(this.product?.sizes && this.product.sizes.length > 0);
  }

  get isVariantRequired(): boolean {
    return !!(this.product?.variants && this.product.variants.length > 0);
  }

  get isSelectionInvalid(): boolean {
    return (this.isSizeRequired && !this.selectedSize()) || 
           (this.isVariantRequired && !this.selectedVariant());
  }

  get productCartQuantity(): number {
    const productId = this.product?.id;
    if (productId === undefined) return 0;

    return this.cartService.items()
      .filter(item => String(item.id) === String(productId))
      .reduce((quantity, item) => quantity + item.quantity, 0);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const paramId = params.get('id');

      if (!paramId) {
        this.router.navigate(['/404'], { skipLocationChange: true });
        return;
      }

      this.dataService.getProducts().subscribe(products => {
        this.product = products.find(p => 
          String(p.id) === paramId || (p['numeric_id'] != null && String(p['numeric_id']) === paramId)
        );

        if (!this.product) {
          this.router.navigate(['/404'], { skipLocationChange: true });
          return;
        }

        const firstVariant = this.product.variants?.length ? this.product.variants[0] : null;
        this.selectedVariant.set(firstVariant);

        const firstSize = this.product.sizes?.length ? this.product.sizes[0] : null;
        this.selectedSize.set(firstSize);

        this.selectedImage = this.product.image || (this.product.images?.length ? this.product.images[0] : '');
      });
    });
  }

  selectImage(img: string) {
    this.selectedImage = img;
  }

  selectVariant(variant: ProductVariant) {
    this.selectedVariant.set(variant);
    if (variant.image) {
      this.selectedImage = variant.image;
    }
  }

  selectSize(size: string) {
    this.selectedSize.set(size);
  }

  openInquiryModal(): void {
    if (!this.product) return;

    const title = this.getContent('title');
    const sku = this.product.id || 'N/A';

    this.translate.get('SHOP.INQUIRY_MESSAGE', { title, sku }).subscribe((translatedMessage: string) => {
      const encodedMessage = encodeURIComponent(translatedMessage);
      window.open(`https://t.me/Virni_Fashion?text=${encodedMessage}`, '_blank');
    });
  }

  getContent(field: string): string {
    if (!this.product) return '';
    const lang = this.translate.currentLang || 'uk';
    return this.product[`${field}_${lang}`] || this.product[`${field}_uk`] || this.product[field] || '';
  }

  getContentOfVariant(field: string, variant?: ProductVariant | null): string {
    const targetVariant = variant || this.selectedVariant();
    if (!targetVariant) return '';
    const lang = this.translate.currentLang || 'uk';
    return targetVariant[`${field}_${lang}`] || targetVariant[`${field}_uk`] || targetVariant[field] || '';
  }

  getCurrentPrice(): number {
    if (!this.product) return 0;
    let basePrice = this.product.discountPrice || this.product.price;
    const variant = this.selectedVariant();
    if (variant?.priceOffset) {
      basePrice += variant.priceOffset;
    }
    return basePrice;
  }

  getOriginalPrice(): number | null {
    if (!this.product || !this.product.discountPercent) return null;
    let basePrice = this.product.price;
    const variant = this.selectedVariant();
    if (variant?.priceOffset) {
      basePrice += variant.priceOffset;
    }
    return basePrice;
  }

  addToCart() {
    if (this.isSelectionInvalid || !this.product) {
      return;
    }

    // 1. Додаємо товар у кошик
    this.cartService.addToCart(
      this.product, 
      this.getContent('title'),
      this.selectedSize() || undefined,
      this.selectedVariant() || undefined
    );

    // 2. Вмикаємо ефект успішного додавання
    this.isAdded.set(true);

    // 3. Через 1.5 секунди повертаємо стандартну кнопку
    setTimeout(() => {
      this.isAdded.set(false);
    }, 1500);
  }
}