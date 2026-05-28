import { Routes } from '@angular/router';
import { NewsComponent } from './components/news/news.component';
import { ShopComponent } from './components/shop/shop.component';
import { VideosComponent } from './components/videos/videos.component';
import { HomeComponent } from './pages/home/home.component';
import { NewsDetailComponent } from './pages/news-detail/news-detail.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CartComponent } from './pages/cart/cart.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'news', component: NewsComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'news/:id', component: NewsDetailComponent },
  { path: 'product/:id', component: ProductDetailComponent },
  { path: 'videos', component: VideosComponent },
  { path: 'cart', component: CartComponent },
  { path: '', redirectTo: '', pathMatch: 'full' }
];
