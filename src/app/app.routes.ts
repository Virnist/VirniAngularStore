import { Routes } from '@angular/router';
import { NewsComponent } from './components/news/news.component';
import { ShopComponent } from './components/shop/shop.component';
import { VideosComponent } from './components/videos/videos.component';

export const routes: Routes = [
  { path: 'news', component: NewsComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'videos', component: VideosComponent },
  { path: '', redirectTo: '/news', pathMatch: 'full' } // При завантаженні сайту відкриваємо Новини
];
