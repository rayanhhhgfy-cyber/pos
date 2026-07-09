import { posDB } from '../db';
import type { Product, Sale } from '../types';

export interface BackupData {
  version: number;
  exportedAt: number;
  products: Product[];
  sales: Sale[];
}

export async function exportDatabase(): Promise<void> {
  const products = await posDB.products.toArray();
  const sales = await posDB.sales_history.toArray();

  const backup: BackupData = {
    version: 1,
    exportedAt: Date.now(),
    products,
    sales,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `pos-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importDatabase(file: File, merge: boolean = true): Promise<{ products: number; sales: number }> {
  const text = await file.text();
  const data: BackupData = JSON.parse(text);

  if (!data.products || !Array.isArray(data.products)) {
    throw new Error('Invalid backup file: missing products array');
  }
  if (!data.sales || !Array.isArray(data.sales)) {
    throw new Error('Invalid backup file: missing sales array');
  }

  if (merge) {
    await posDB.transaction('rw', posDB.products, posDB.sales_history, async () => {
      for (const product of data.products) {
        const existing = product.barcode ? await posDB.products.get({ barcode: product.barcode }) : null;
        if (!existing) {
          await posDB.products.put(product);
        }
      }
      for (const sale of data.sales) {
        await posDB.sales_history.add(sale);
      }
    });
} else {
    await posDB.transaction('rw', posDB.products, posDB.sales_history, async () => {
      await posDB.products.clear();
      await posDB.sales_history.clear();
      for (const product of data.products) {
        await posDB.products.add(product);
      }
      for (const sale of data.sales) {
        await posDB.sales_history.add(sale);
      }
    });
  }

  return {
    products: data.products.length,
    sales: data.sales.length,
  };
}

export async function wipeAllData(): Promise<void> {
  await posDB.transaction('rw', posDB.products, posDB.sales_history, posDB.parked_carts, posDB.audit_log, async () => {
    await posDB.products.clear();
    await posDB.sales_history.clear();
    await posDB.parked_carts.clear();
    await posDB.audit_log.clear();
  });
}