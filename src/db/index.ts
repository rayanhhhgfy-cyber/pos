import Dexie, { type Table, type EntityTable } from 'dexie';
import type { Product, Sale, StoreConfig, ParkedCart, AuditEntry } from '../types';

export interface DBProduct extends Product {}
export interface DBSale extends Sale {}
export interface DBStoreConfig extends StoreConfig {}
export interface DBParkedCart extends ParkedCart {}
export interface DBAuditEntry extends AuditEntry {}
export interface DBBulkDiscount {
  id?: number;
  barcode: string;
  minQuantity: number;
  discountPercentage: number;
}

export class POSDatabase extends Dexie {
  products!: EntityTable<DBProduct, 'id'>;
  sales_history!: EntityTable<DBSale, 'id'>;
  config!: EntityTable<DBStoreConfig, 'id'>;
  parked_carts!: EntityTable<DBParkedCart, 'id'>;
  audit_log!: EntityTable<DBAuditEntry, 'id'>;
  bulk_discounts!: EntityTable<DBBulkDiscount, 'id'>;

  constructor() {
    super('POSRegistry');
    this.version(1).stores({
      products: '++id, &barcode, name, category, stock',
      sales_history: '++id, timestamp',
      config: '++id',
      parked_carts: '++id',
      audit_log: '++id, timestamp, productId',
    });
    this.version(2).stores({
      products: '++id, &barcode, name, category, stock',
      sales_history: '++id, timestamp',
      config: '++id',
      parked_carts: '++id',
      audit_log: '++id, timestamp, productId',
      bulk_discounts: '++id, &barcode',
    });
  }
}

export const posDB = new POSDatabase();

export async function triggerLocalBackup() {
  try {
    const products = await posDB.products.toArray();
    const config = await posDB.config.toArray();
    const bulk_discounts = await posDB.bulk_discounts.toArray();
    const backupData = {
      version: 2,
      exportedAt: Date.now(),
      products,
      config,
      bulk_discounts,
    };
    localStorage.setItem('pos_local_backup', JSON.stringify(backupData));
    console.log('[POS] LocalStorage backup successful');
  } catch (err) {
    console.error('[POS] LocalStorage backup failed', err);
  }
}

export async function restoreFromLocalBackupIfEmpty(): Promise<boolean> {
  try {
    const count = await posDB.products.count();
    if (count > 0) return false;

    const backupStr = localStorage.getItem('pos_local_backup');
    if (!backupStr) return false;

    const data = JSON.parse(backupStr);
    if (!data || !Array.isArray(data.products)) return false;

    await posDB.transaction('rw', posDB.products, posDB.config, posDB.bulk_discounts, async () => {
      await posDB.products.clear();
      for (const p of data.products) {
        await posDB.products.add(p);
      }
      if (Array.isArray(data.config)) {
        await posDB.config.clear();
        for (const c of data.config) {
          await posDB.config.put(c);
        }
      }
      if (Array.isArray(data.bulk_discounts)) {
        await posDB.bulk_discounts.clear();
        for (const bd of data.bulk_discounts) {
          await posDB.bulk_discounts.put(bd);
        }
      }
    });
    console.log('[POS] Restored from LocalStorage backup successfully');
    return true;
  } catch (err) {
    console.error('[POS] Failed to restore from LocalStorage backup', err);
    return false;
  }
}