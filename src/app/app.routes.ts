import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'news', loadComponent: () => import('./components/news/news.component').then(m => m.NewsComponent) },
  { path: 'shop', loadComponent: () => import('./components/shop/shop.component').then(m => m.ShopComponent) },
  { path: 'media', loadComponent: () => import('./pages/media/media.component').then(m => m.MediaComponent) },
  { path: 'news/:id', loadComponent: () => import('./pages/news-detail/news-detail.component').then(m => m.NewsDetailComponent) },
  { path: 'product/:id', loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
  { path: 'videos', loadComponent: () => import('./components/videos/videos.component').then(m => m.VideosComponent) },
  { path: 'cart', loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
