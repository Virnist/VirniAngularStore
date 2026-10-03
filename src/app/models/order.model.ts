export interface OrderItem {
  id: string | number;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderData {
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  country?: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
}