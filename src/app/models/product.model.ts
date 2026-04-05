export interface Product {
  id: number;
  image: string;
  category: string;
  price: number;
  [key: string]: any; // Це дозволить звертатися до title_uk, title_en і т.д.
}