import Dexie, { type Table, type EntityTable } from 'dexie';
import type { Product, Sale, StoreConfig, ParkedCart, AuditEntry } from '../types';

export interface DBProduct extends Product {}
export interface DBSale extends Sale {}
export interface DBStoreConfig extends StoreConfig {}
export interface DBParkedCart extends ParkedCart {}
export interface DBAuditEntry extends AuditEntry {}

export class POSDatabase extends Dexie {
  products!: EntityTable<DBProduct, 'id'>;
  sales_history!: EntityTable<DBSale, 'id'>;
  config!: EntityTable<DBStoreConfig, 'id'>;
  parked_carts!: EntityTable<DBParkedCart, 'id'>;
  audit_log!: EntityTable<DBAuditEntry, 'id'>;

  constructor() {
    super('POSRegistry');
    this.version(1).stores({
      products: '++id, &barcode, name, category, stock',
      sales_history: '++id, timestamp',
      config: '++id',
      parked_carts: '++id',
      audit_log: '++id, timestamp, productId',
    });
  }
}

export const posDB = new POSDatabase();