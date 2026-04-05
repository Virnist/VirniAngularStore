export interface NewsItem {
  id: number;
  date: string;
  image: string;
  
  // Це дозволяє мати будь-яку кількість полів типу title_uk, title_pl, text_de тощо.
  [key: string]: any; 
}