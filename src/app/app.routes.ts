import { Routes } from '@angular/router';
import { NewsComponent } from './components/news/news.component';
import { ShopComponent } from './components/shop/shop.component';
import { VideosComponent } from './components/videos/videos.component';
import { NewsDetailComponent } from './pages/news-detail/news-detail.component';

export const routes: Routes = [
  { path: 'news', component: NewsComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'news/:id', component: NewsDetailComponent },
  { path: 'videos', component: VideosComponent },
  { path: '', redirectTo: '/news', pathMatch: 'full' }
];
