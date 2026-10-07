import { importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { CartComponent } from './cart.component';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        importProvidersFrom(TranslateModule.forRoot())
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept valid phone formats without requiring a separator after the country code', () => {
    const phoneControl = component.orderForm.get('phone');

    phoneControl?.setValue('+380991234567');
    expect(phoneControl?.valid).toBeTrue();

    phoneControl?.setValue('+49 170 1234567');
    expect(phoneControl?.valid).toBeTrue();

    phoneControl?.setValue('0991234567');
    expect(phoneControl?.valid).toBeTrue();
  });

  it('should keep the selected recipient country in the checkout form', () => {
    expect(component.orderForm.controls.country.value).toBe('UA');

    component.orderForm.controls.country.setValue('US');

    expect(component.selectedCountry()).toBe('US');
    expect(component.destinationCountries().some(country => country.code === 'US')).toBeTrue();
  });
});
