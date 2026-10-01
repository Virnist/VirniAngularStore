export interface NewsItem {
  id: string;
  numeric_id?: number;
  date: string;
  image: string;

  // Нові мета-поля новини
  author?: string;
  category?: string;
  tags?: string[];
  read_time_min?: number;

  // Обов'язкові базові мовні поля
  title_en: string;
  text_en: string;
  
  // Дозволяє мати будь-яку кількість додаткових локалізованих полів (title_uk, image_alt_fr тощо)
  [key: string]: any; 
}