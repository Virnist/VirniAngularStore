import { Pipe, PipeTransform, inject } from '@angular/core';
import { CartService } from '../services/cart.service'; // Перевір шлях до свого CartService

@Pipe({
  name: 'convertPrice',
  standalone: true,
  pure: false // Залишаємо false, щоб пайп миттєво реагував на зміну мови в додатку
})
export class ConvertPricePipe implements PipeTransform {
  private cartService = inject(CartService);

  transform(usdPrice: number | undefined | null): string {
    if (usdPrice === undefined || usdPrice === null) return '';

    // Отримуємо вже прорахований курс та значок валюти з CartService
    const currentCurrency = this.cartService.currency();
    const lang = this.cartService['currentLang'] ? this.cartService['currentLang']() : 'uk';
    
    // Перераховуємо ціну
    const converted = usdPrice * currentCurrency.rate;

    // Красиве форматування: округлюємо гривні (₴) та злоті (zł) до цілих чисел,
    // а для долара ($) та євро (€) залишаємо 2 знаки після коми (центи)
    let formattedPrice: string;
    if (currentCurrency.symbol === '₴' || currentCurrency.symbol === 'zł') {
      formattedPrice = Math.round(converted).toString();
    } else {
      formattedPrice = converted.toFixed(2);
    }
    
    // Форматування відображення (значок спереду для EN, для інших — ззаду)
    return currentCurrency.symbol === '$' 
      ? `${currentCurrency.symbol}${formattedPrice}` 
      : `${formattedPrice} ${currentCurrency.symbol}`;
  }
}