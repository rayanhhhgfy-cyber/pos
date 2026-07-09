import { create } from 'zustand';
import { posDB } from '../db';
import { asCents, Cents } from '../types/cents';
import type { CartItem, PaymentMethod, Sale, SaleItem } from '../types';
import {
  formatCents,
  multiplyCents,
  sumCents,
  subtractCents,
  addCents,
  calculateTax,
  calculateDiscount,
} from '../utils/cents';

interface DiscountState {
  type: 'flat' | 'percentage' | 'none';
  value: number;
}

interface CartState {
  items: CartItem[];
  discount: DiscountState;
  lastSale: Sale | null;
  isLoading: boolean;

  addItem: (barcode: string, name: string, unitPrice: Cents, costPrice: Cents, productId: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setDiscount: (type: DiscountState['type'], value: number) => void;
  clearCart: () => void;

  getSubtotal: () => Cents;
  getDiscountAmount: () => Cents;
  getTotalItems: () => number;

  completeSale: (
    paymentMethod: PaymentMethod,
    amountTendered: Cents,
    changeAmount: Cents,
    taxRate: number,
    currencySymbol: string,
  ) => Promise<Sale>;

  loadSavedCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: { type: 'none', value: 0 },
  lastSale: null,
  isLoading: false,

  addItem: (barcode, name, unitPrice, costPrice, productId) => {
    set((state) => {
      const existing = state.items.find((item) => item.productId === productId);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  lineTotal: multiplyCents(unitPrice, item.quantity + 1),
                }
              : item
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            productId,
            barcode,
            name,
            unitPrice,
            costPrice,
            quantity: 1,
            lineTotal: unitPrice,
          },
        ],
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              lineTotal: multiplyCents(item.unitPrice, quantity),
            }
          : item
      ),
    }));
  },

  setDiscount: (type, value) => {
    set({ discount: { type, value: Math.max(0, value) } });
  },

  clearCart: () => set({ items: [], discount: { type: 'none', value: 0 }, lastSale: null }),

  getSubtotal: () => sumCents(get().items.map((i) => i.lineTotal)),
  getDiscountAmount: () => {
    const cart = get();
    return calculateDiscount(cart.getSubtotal(), cart.discount.type, cart.discount.value);
  },
  getTotalItems: () => get().items.reduce((a, i) => a + i.quantity, 0),

  completeSale: async (paymentMethod, amountTendered, changeAmount, taxRate, currencySymbol) => {
    const cart = get();
    const config = await posDB.config.get(1);
    const subtotal = cart.getSubtotal();
    const discountAmount = cart.getDiscountAmount();
    const taxable = subtractCents(subtotal, discountAmount);
    const taxAmount = calculateTax(taxable, taxRate);
    const total = addCents(taxable, taxAmount);

    const storeName = config?.storeName || 'POS Terminal';

    const saleItems: SaleItem[] = cart.items.map((item) => ({
      name: item.name,
      barcode: item.barcode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      lineTotal: item.lineTotal,
    }));

    const sale: Sale = {
      items: saleItems,
      subtotal,
      discountType: cart.discount.type,
      discountValue: cart.discount.value,
      discountAmount,
      taxRate,
      taxAmount,
      total,
      paymentMethod,
      amountTendered,
      changeAmount,
      timestamp: Date.now(),
      storeName,
    };

    const saleId = await posDB.sales_history.add(sale);
    sale.id = saleId as number;

    await posDB.transaction('rw', posDB.products, posDB.audit_log, async () => {
      for (const item of cart.items) {
        const product = await posDB.products.get(item.productId);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await posDB.products.update(item.productId, {
            stock: newStock,
            updatedAt: Date.now(),
          });
          await posDB.audit_log.add({
            type: 'stock_deduction',
            details: `${item.quantity}x ${item.name} (${item.barcode}) — from ${product.stock} to ${newStock}`,
            timestamp: Date.now(),
          });
        }
      }
    });

    const totalItems = cart.items.reduce((a, i) => a + i.quantity, 0);
    await posDB.audit_log.add({
      type: 'sale_completed',
      details: `Sale #${saleId}: ${totalItems} items, total ${formatCents(total, currencySymbol)}`,
      timestamp: Date.now(),
    });

    set({ items: [], discount: { type: 'none', value: 0 }, lastSale: sale });
    return sale;
  },

  loadSavedCart: async () => {
    try {
      const saved = await posDB.parked_carts.get('active_cart' as any);
      if (saved && saved.items && saved.items.length > 0) {
        set({ items: saved.items });
        posDB.parked_carts.delete('active_cart' as any);
      }
    } catch {
      /* ignore */
    }
  },
}));