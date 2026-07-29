import { create } from 'zustand';
import { posDB, DBBulkDiscount, triggerLocalBackup } from '../db';
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
  bulkDiscountRules: DBBulkDiscount[];

  loadBulkDiscountRules: () => Promise<void>;
  addItem: (barcode: string, name: string, unitPrice: Cents, costPrice: Cents, productId: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateCartItemDetails: (
    productId: number,
    unitPrice: Cents,
    discountType: 'flat' | 'percentage' | 'none',
    discountValue: number
  ) => void;
  setDiscount: (type: DiscountState['type'], value: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;

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

export function recalculateItemTotals(item: CartItem, rules: DBBulkDiscount[]): CartItem {
  const origPrice = item.originalPrice ?? item.unitPrice;
  const priceToUse = item.unitPrice;

  const baseSubtotal = multiplyCents(priceToUse, item.quantity);

  let customDiscountAmt = 0 as Cents;
  const dType = item.discountType ?? 'none';
  const dVal = item.discountValue ?? 0;
  if (dType === 'percentage' && dVal > 0) {
    customDiscountAmt = Math.round(baseSubtotal * (dVal / 100)) as Cents;
  } else if (dType === 'flat' && dVal > 0) {
    customDiscountAmt = Math.min(baseSubtotal, Math.round(dVal * 100)) as Cents;
  }

  let autoDiscountAmt = 0 as Cents;
  const rule = rules.find((r) => r.barcode === item.barcode);
  if (rule && item.quantity >= rule.minQuantity) {
    const discountedBase = subtractCents(baseSubtotal, customDiscountAmt);
    autoDiscountAmt = Math.round(discountedBase * (rule.discountPercentage / 100)) as Cents;
  }

  const discountAmount = addCents(customDiscountAmt, autoDiscountAmt) as Cents;
  const lineTotal = subtractCents(baseSubtotal, discountAmount) as Cents;

  return {
    ...item,
    originalPrice: origPrice,
    discountAmount: customDiscountAmt,
    lineTotal,
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: { type: 'none', value: 0 },
  lastSale: null,
  isLoading: false,
  bulkDiscountRules: [],

  loadBulkDiscountRules: async () => {
    try {
      const rules = await posDB.bulk_discounts.toArray();
      set({ bulkDiscountRules: rules });
    } catch {
      /* ignore */
    }
  },

  addItem: (barcode, name, unitPrice, costPrice, productId) => {
    set((state) => {
      const rules = state.bulkDiscountRules;
      const existing = state.items.find((item) => item.productId === productId);
      let updatedItems: CartItem[];
      if (existing) {
        updatedItems = state.items.map((item) =>
          item.productId === productId
            ? recalculateItemTotals({
                ...item,
                quantity: item.quantity + 1,
              }, rules)
            : item
        );
      } else {
        updatedItems = [
          ...state.items,
          recalculateItemTotals({
            productId,
            barcode,
            name,
            unitPrice,
            costPrice,
            quantity: 1,
            lineTotal: unitPrice,
            originalPrice: unitPrice,
            discountType: 'none',
            discountValue: 0,
            discountAmount: 0 as Cents,
          }, rules),
        ];
      }
      return { items: updatedItems };
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
    set((state) => {
      const rules = state.bulkDiscountRules;
      return {
        items: state.items.map((item) =>
          item.productId === productId
            ? recalculateItemTotals({
                ...item,
                quantity,
              }, rules)
            : item
        ),
      };
    });
  },

  updateCartItemDetails: (productId, unitPrice, discountType, discountValue) => {
    set((state) => {
      const rules = state.bulkDiscountRules;
      return {
        items: state.items.map((item) =>
          item.productId === productId
            ? recalculateItemTotals({
                ...item,
                unitPrice,
                discountType,
                discountValue,
              }, rules)
            : item
        ),
      };
    });
  },

  setDiscount: (type, value) => {
    set({ discount: { type, value: Math.max(0, value) } });
  },

  clearCart: () => set({ items: [], discount: { type: 'none', value: 0 }, lastSale: null }),

  setItems: (items) => set({ items }),

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

    await triggerLocalBackup();

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