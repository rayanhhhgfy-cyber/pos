import type { Cents } from './cents';

export interface Product {
  id?: number;
  barcode: string;
  name: string;
  price: Cents;
  costPrice: Cents;
  stock: number;
  category: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface CartItem {
  productId: number;
  barcode: string;
  name: string;
  unitPrice: Cents;
  costPrice: Cents;
  quantity: number;
  lineTotal: Cents;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile_pay';

export interface Sale {
  id?: number;
  items: SaleItem[];
  subtotal: Cents;
  discountType: 'flat' | 'percentage' | 'none';
  discountValue: number;
  discountAmount: Cents;
  taxRate: number;
  taxAmount: Cents;
  total: Cents;
  paymentMethod: PaymentMethod;
  amountTendered: Cents;
  changeAmount: Cents;
  timestamp: number;
  storeName: string;
}

export interface SaleItem {
  name: string;
  barcode: string;
  quantity: number;
  unitPrice: Cents;
  costPrice: Cents;
  lineTotal: Cents;
}

export interface StoreConfig {
  id?: number;
  storeName: string;
  currencySymbol: string;
  taxRate: number;
  receiptHeader: string;
  receiptFooter: string;
  shiftStartTime?: number;
  dailySaleCounter?: number;
}

export interface ParkedCart {
  id?: number;
  name: string;
  items: CartItem[];
  createdAt: number;
}

export interface AuditEntry {
  id?: number;
  type: 'stock_deduction' | 'stock_addition' | 'product_created' | 'product_deleted' | 'sale_completed' | 'data_wipe' | 'data_import';
  details: string;
  timestamp: number;
}