import { asCents, Cents } from '../types/cents';

export function parsePriceToCents(value: string | number): Cents {
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    return asCents(Math.round(parseFloat(cleaned || '0') * 100));
  }
  return asCents(Math.round(value * 100));
}

export function formatCents(cents: Cents, symbol: string = '$'): string {
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const centsPart = abs % 100;
  const formatted = `${symbol}${dollars}.${centsPart.toString().padStart(2, '0')}`;
  return cents < 0 ? `-${formatted}` : formatted;
}

export function multiplyCents(price: Cents, quantity: number): Cents {
  return asCents(price * quantity);
}

export function sumCents(values: Cents[]): Cents {
  return asCents(values.reduce((a, b) => a + b, 0));
}

export function addCents(a: Cents, b: Cents): Cents {
  return asCents(a + b);
}

export function subtractCents(a: Cents, b: Cents): Cents {
  return asCents(a - b);
}

export function calculateTax(cents: Cents, taxRate: number): Cents {
  return asCents(Math.round(cents * taxRate / 100));
}

export function calculateDiscount(cents: Cents, type: 'flat' | 'percentage' | 'none', value: number): Cents {
  if (type === 'none' || value <= 0) return asCents(0);
  if (type === 'flat') return asCents(Math.min(Math.round(value * 100), cents));
  if (type === 'percentage') return asCents(Math.min(Math.round(cents * value / 100), cents));
  return asCents(0);
}

export function toNumberInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
  if (parts.length === 2 && parts[1].length > 2) return parts[0] + '.' + parts[1].slice(0, 2);
  return cleaned;
}