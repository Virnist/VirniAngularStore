export interface NewsItem {
  id: string;
  numeric_id?: number;
  date: string;
  image: string;

  // Явно вказуємо обов'язкові базі мовні поля
  title_en: string;
  text_en: string;
  
  // Це дозволяє мати будь-яку кількість полів типу title_uk, title_pl, text_de тощо.
  [key: string]: any; 
}