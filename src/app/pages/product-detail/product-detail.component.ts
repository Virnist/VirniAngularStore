import { Component, inject, OnInit, Signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConvertPricePipe } from '../../pipes/convert-price.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, ConvertPricePipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);
  private cartService = inject(CartService);
  public translate = inject(TranslateService);

  product?: Product;

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.dataService.getProducts().subscribe(products => {
      this.product = products.find(p => p.id === id);
    });
  }

  getContent(field: string): string {
    if (!this.product) return '';
    const lang = this.translate.currentLang || 'uk';
    return this.product[`${field}_${lang}`] || this.product[`${field}_uk`];
  }

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(this.product, this.getContent('title'));
    }
  }
}