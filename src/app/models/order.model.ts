export interface OrderData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  country: string;
  address: string;
  items: any[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
}