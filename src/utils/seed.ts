import { posDB } from '../db';
import { parsePriceToCents } from './cents';

const sampleProducts = [
  { barcode: '8901234567890', name: 'Fresh Whole Milk 1L', price: '3.99', costPrice: '2.50', stock: 50, category: 'Dairy' },
  { barcode: '8901234567891', name: 'Wheat Bread Loaf', price: '2.49', costPrice: '1.20', stock: 30, category: 'Bakery' },
  { barcode: '8901234567892', name: 'Farm Eggs (12pk)', price: '4.99', costPrice: '3.00', stock: 3, category: 'Dairy' },
  { barcode: '8901234567893', name: 'Basmati Rice 5kg', price: '12.99', costPrice: '8.50', stock: 20, category: 'Grains' },
  { barcode: '8901234567894', name: 'Cooking Oil 2L', price: '8.49', costPrice: '5.75', stock: 15, category: 'Pantry' },
  { barcode: '8901234567895', name: 'Organic Honey 500g', price: '9.99', costPrice: '6.00', stock: 1, category: 'Pantry' },
  { barcode: '8901234567896', name: 'Chicken Breast 1kg', price: '11.49', costPrice: '7.25', stock: 12, category: 'Meat' },
  { barcode: '8901234567897', name: 'Apple Juice 1L', price: '3.49', costPrice: '1.80', stock: 25, category: 'Beverages' },
  { barcode: '8901234567898', name: 'Cheddar Cheese 200g', price: '5.99', costPrice: '3.50', stock: 8, category: 'Dairy' },
  { barcode: '8901234567899', name: 'Toilet Paper 12pk', price: '14.99', costPrice: '9.00', stock: 2, category: 'Household' },
];

export async function seedSampleData(): Promise<number> {
  let count = 0;
  await posDB.transaction('rw', posDB.products, posDB.bulk_discounts, async () => {
    for (const product of sampleProducts) {
      const existing = await posDB.products.get({ barcode: product.barcode });
      if (!existing) {
        await posDB.products.add({
          barcode: product.barcode,
          name: product.name,
          price: parsePriceToCents(product.price),
          costPrice: parsePriceToCents(product.costPrice),
          stock: product.stock,
          category: product.category,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        count++;
      }
    }

    // Seed default bulk discount rule of 15% on Fresh Whole Milk (barcode 8901234567890) for quantity >= 10
    const existingRule = await posDB.bulk_discounts.get({ barcode: '8901234567890' });
    if (!existingRule) {
      await posDB.bulk_discounts.add({
        barcode: '8901234567890',
        minQuantity: 10,
        discountPercentage: 15,
      });
    }
  });
  return count;
}