import { create } from 'zustand';
import { posDB } from '../db';
import { formatCents } from '../utils/cents';

export interface StoreConfigData {
  storeName: string;
  currencySymbol: string;
  taxRate: number;
  receiptHeader: string;
  receiptFooter: string;
}

interface ConfigState {
  config: StoreConfigData;
  isLoading: boolean;
  showOnboarding: boolean;
  shiftStartTime: number;
  dailySaleCounter: number;
  loadConfig: () => Promise<void>;
  saveConfig: (partial: Partial<StoreConfigData>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  incrementSaleCounter: () => Promise<void>;
  formatCurrency: (cents: number) => string;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: {
    storeName: 'POS Terminal',
    currencySymbol: '$',
    taxRate: 5,
    receiptHeader: 'Thank you for your purchase!',
    receiptFooter: 'Have a great day!',
  },
  isLoading: true,
  showOnboarding: false,
  shiftStartTime: Date.now(),
  dailySaleCounter: 0,

  loadConfig: async () => {
    try {
      const dbConfig = await posDB.config.get(1);
      if (dbConfig) {
        set({
          config: {
            storeName: dbConfig.storeName || 'POS Terminal',
            currencySymbol: dbConfig.currencySymbol || '$',
            taxRate: dbConfig.taxRate ?? 5,
            receiptHeader: dbConfig.receiptHeader || '',
            receiptFooter: dbConfig.receiptFooter || '',
          },
          isLoading: false,
          showOnboarding: false,
          shiftStartTime: dbConfig.shiftStartTime || Date.now(),
          dailySaleCounter: dbConfig.dailySaleCounter || 0,
        });
      } else {
        set({ isLoading: false, showOnboarding: true });
      }
    } catch {
      set({ isLoading: false, showOnboarding: true });
    }
  },

  saveConfig: async (partial) => {
    const current = get().config;
    const updated = { ...current, ...partial };
    set({ config: updated });
    const state = get();
    await posDB.config.put({
      id: 1,
      ...updated,
      shiftStartTime: state.shiftStartTime,
      dailySaleCounter: state.dailySaleCounter,
    });
  },

  completeOnboarding: async () => {
    const state = get();
    const now = Date.now();
    await posDB.config.put({
      id: 1,
      ...state.config,
      shiftStartTime: now,
      dailySaleCounter: 0,
    });
    set({ showOnboarding: false, shiftStartTime: now, dailySaleCounter: 0 });
  },

  incrementSaleCounter: async () => {
    const next = get().dailySaleCounter + 1;
    set({ dailySaleCounter: next });
    await posDB.config.update(1, { dailySaleCounter: next });
  },

  formatCurrency: (cents: number) => {
    const symbol = get().config.currencySymbol;
    return formatCents(cents as any, symbol);
  },
}));