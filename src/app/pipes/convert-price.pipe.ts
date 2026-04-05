import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../services/data.service';

@Pipe({
  name: 'convertPrice',
  standalone: true,
  pure: false
})
export class ConvertPricePipe implements PipeTransform {
  private translate = inject(TranslateService);
  private dataService = inject(DataService);

  private symbols: any = { 'uk': '₴', 'en': '$', 'pl': 'zł', 'fr': '€', 'de': '€' };
  private codes: any = { 'uk': 'UAH', 'en': 'USD', 'pl': 'PLN', 'fr': 'EUR', 'de': 'EUR' };

  transform(usdPrice: number): string {
    const lang = this.translate.currentLang || 'uk';
    const currencyCode = this.codes[lang];
    const symbol = this.symbols[lang];
    const rates = this.dataService.rates();

    if (!rates || !rates[currencyCode]) {
      return `$${usdPrice.toFixed(2)}`; // Fallback на долар
    }

    const converted = (usdPrice * rates[currencyCode]).toFixed(2);
    
    return lang === 'en' ? `${symbol}${converted}` : `${converted} ${symbol}`;
  }
}