import { useState, useEffect } from 'react';
import { posDB, triggerLocalBackup } from '../../db';
import { parsePriceToCents } from '../../utils/cents';
import { useUIStore } from '../../stores/uiStore';
import { useCartStore } from '../../stores/cartStore';
import { useConfigStore } from '../../stores/configStore';
import { playSuccess } from '../../utils/audio';
import { X, Save, Barcode } from 'lucide-react';

interface QuickAddModalProps {
  onClose: () => void;
}

function QuickAddModal({ onClose }: QuickAddModalProps) {
  const modalData = useUIStore((s) => s.modalData);
  const scannedBarcode = (modalData.barcode as string) || '';

  const [barcode, setBarcode] = useState(scannedBarcode);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showCategorySuggest, setShowCategorySuggest] = useState(false);

  useEffect(() => {
    posDB.products
      .filter((p) => !!p.category && p.category.trim().length > 0)
      .toArray()
      .then((prods) => {
        const cats = [...new Set(prods.map((p) => p.category))].sort();
        setCategories(cats);
      });
  }, []);

  const handleSave = async () => {
    if (!name || !barcode) return;
    setSaving(true);
    try {
      const priceCents = parsePriceToCents(price || '0');
      const newId = await posDB.products.add({
        barcode: barcode.trim(),
        name: name.trim(),
        price: priceCents,
        costPrice: parsePriceToCents('0'),
        stock: Math.max(1, parseInt(stock, 10) || 1),
        category: category.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await posDB.audit_log.add({
        type: 'product_created',
        details: `${name} (${barcode}) — quick add from scanner`,
        timestamp: Date.now(),
      });
      useCartStore.getState().addItem(barcode.trim(), name.trim(), priceCents, priceCents, newId as number);
      await triggerLocalBackup();
      playSuccess();
      onClose();
    } catch {
      /* */
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 card-panel p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#f4f4f5]">Quick Add Product</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#27272a] text-[#a1a1aa] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {barcode && (
          <div className="mb-3 p-2 rounded-lg bg-[#059669]/10 border border-[#059669]/20">
            <p className="text-[10px] text-[#34d399] mb-0.5">Scanned Barcode</p>
            <p className="text-sm font-mono text-[#f4f4f5]">{barcode}</p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#a1a1aa] mb-1">Product Name *</label>
            <input
              className="input-pos w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product name"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a1a1aa] mb-1">Price ($)</label>
              <input
                className="input-pos w-full"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-[#a1a1aa] mb-1">Stock</label>
              <input
                className="input-pos w-full"
                type="number"
                min="1"
                value={stock}
                onChange={(e) => setStock(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-xs text-[#a1a1aa] mb-1">Category</label>
            <input
              className="input-pos w-full"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setShowCategorySuggest(true);
              }}
              onFocus={() => setShowCategorySuggest(true)}
              onBlur={() => setTimeout(() => setShowCategorySuggest(false), 200)}
              placeholder="Category (optional)"
            />
            {showCategorySuggest && categories.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 card-panel max-h-32 overflow-y-auto z-10">
                {categories
                  .filter((c) => !category || c.toLowerCase().includes(category.toLowerCase()))
                  .map((c) => (
                    <button
                      key={c}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#f4f4f5] transition-colors"
                      onMouseDown={() => {
                        setCategory(c);
                        setShowCategorySuggest(false);
                      }}
                    >
                      {c}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#27272a]">
          <button onClick={onClose} className="btn-secondary text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !barcode || saving}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save & Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickAddModal;