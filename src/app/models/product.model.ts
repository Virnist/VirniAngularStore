export interface Product {
  id: number;
  image: string;
  category: string;
  price: number;
  stock: number;          // Явно додаємо це поле
  productionTime: number; // Явно додаємо це поле
  [key: string]: any;     // Це залишається в самому кінці для title_uk, description_en тощо
}