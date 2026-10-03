export interface ProductVariant {
  id: string | number;
  name_uk: string;
  name_en?: string;
  colorHex?: string;    // HEX-код кольору для кружечка (наприклад, "#000000")
  image?: string;       // Зображення під конкретний колір/варіант
  priceOffset?: number; // Націнка або знижка для цього варіанта (+100 або -50)
  [key: string]: any;
}

export interface Product {
  id: number;
  numeric_id?: number;
  image: string;           // Головне фото товару
  category: string;        // Ключ або назва категорії
  price: number;           // Базова ціна
  stock: number;           // Кількість у наявності
  productionTime?: number; // Час виготовлення (днів) для передзамовлення

  // --- Нові розширені поля ---
  images?: string[];            // Галерея додаткових фотографій
  sizes?: string[];             // Список розмірів (наприклад, ['S', 'M', 'L'])
  variants?: ProductVariant[];  // Варіанти кольорів або матеріалів

  isNew?: boolean;              // Бейдж "Новинка"
  isBestseller?: boolean;       // Бейдж "Бестселер"
  discountPercent?: number;     // Відсоток знижки (наприклад, 15)
  discountPrice?: number;       // Ціна зі знижкою (наприклад, 850)

  // Багатомовні поля (title_uk, title_en, description_uk, description_en тощо)
  [key: string]: any;
}