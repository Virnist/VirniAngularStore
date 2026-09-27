import { importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { DataService } from '../services/data.service';
import { CartService } from '../services/cart.service';
import { ConvertPricePipe } from './convert-price.pipe';

describe('ConvertPricePipe', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CartService,
        DataService,
        provideHttpClient(),
        provideRouter([]),
        importProvidersFrom(TranslateModule.forRoot())
      ]
    });
  });

  it('create an instance', () => {
    const pipe = TestBed.runInInjectionContext(() => new ConvertPricePipe());
    expect(pipe).toBeTruthy();
  });
});
