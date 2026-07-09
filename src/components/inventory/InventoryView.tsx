import { useState, useEffect, useCallback } from 'react';
import { posDB } from '../../db';
import type { Product } from '../../types';
import { parsePriceToCents, formatCents } from '../../utils/cents';
import { useConfigStore } from '../../stores/configStore';
import { playSuccess } from '../../utils/audio';
import { Plus, Search, Edit, Trash2, X, Save, Barcode, Package } from 'lucide-react';

function InventoryView() {
  const formatCurrency = useConfigStore((s) => s.formatCurrency);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'none' | 'add' | 'edit'>('none');
  const [editProduct, setEditProduct] = useState<Partial<Product>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategorySuggest, setShowCategorySuggest] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      let collection;
      if (search.trim()) {
        const q = search.toLowerCase();
        collection = await posDB.products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.barcode.toLowerCase().includes(q) ||
              (!!p.category && p.category.toLowerCase().includes(q))
          )
          .toArray();
      } else {
        collection = await posDB.products.toArray();
      }
      setProducts(collection);

      const cats = await posDB.products
        .filter((p) => !!p.category && p.category.trim().length > 0)
        .toArray();
      const uniqueCats = [...new Set(cats.map((p) => p.category))].sort();
      setCategories(uniqueCats);
    } catch {
      /* */
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openAdd = () => {
    setEditProduct({ barcode: '', name: '', price: 0 as any, costPrice: 0 as any, stock: 0, category: '' });
    setModal('add');
  };

  const openEdit = (p: Product) => {
    setEditProduct({ ...p });
    setModal('edit');
  };

  const handleSave = async () => {
    if (!editProduct.name || !editProduct.barcode) return;
    const priceCents = parsePriceToCents(String(editProduct.price ?? 0));
    const costCents = parsePriceToCents(String(editProduct.costPrice ?? 0));
    const data = {
      barcode: editProduct.barcode!,
      name: editProduct.name!,
      price: priceCents,
      costPrice: costCents,
      stock: Math.max(0, parseInt(String(editProduct.stock ?? 0), 10) || 0),
      category: editProduct.category || '',
      updatedAt: Date.now(),
    };

    if (modal === 'add') {
      const existing = await posDB.products.get({ barcode: data.barcode });
      if (existing) {
        alert(`Product with barcode "${data.barcode}" already exists!`);
        return;
      }
      await posDB.products.add({ ...data, createdAt: Date.now() });
      await posDB.audit_log.add({
        type: 'product_created',
        details: `${data.name} (${data.barcode})`,
        timestamp: Date.now(),
      });
      playSuccess();
    } else if (modal === 'edit' && editProduct.id) {
      await posDB.products.update(editProduct.id, data);
    }

    setModal('none');
    setEditProduct({});
    loadProducts();
  };

  const handleDelete = async (id: number) => {
    const product = await posDB.products.get(id);
    if (product) {
      await posDB.products.delete(id);
      await posDB.audit_log.add({
        type: 'product_deleted',
        details: `${product.name} (${product.barcode})`,
        timestamp: Date.now(),
      });
    }
    setDeleteConfirm(null);
    loadProducts();
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-bold tracking-wide text-[#f4f4f5]">Inventory Manager</h1>
        <button onClick={openAdd} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="relative flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
        <input
          className="input-pos w-full pl-10"
          placeholder="Search by name, barcode, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto card-panel">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#52525b]">
            <Package className="w-8 h-8 mb-2" />
            <p className="text-sm">No products found</p>
            {!search && (
              <button onClick={openAdd} className="text-xs text-[#059669] hover:underline mt-1">
                Add your first product
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#27272a] text-[#a1a1aa] text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-3 font-medium">Barcode</th>
                <th className="text-left py-3 px-3 font-medium">Name</th>
                <th className="text-right py-3 px-3 font-medium">Price</th>
                <th className="text-right py-3 px-3 font-medium">Cost</th>
                <th className="text-right py-3 px-3 font-medium">Stock</th>
                <th className="text-left py-3 px-3 font-medium">Category</th>
                <th className="text-right py-3 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                .map((p) => {
                  const isLowStock = p.stock < 5;
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-[#27272a]/50 hover:bg-[#27272a]/30 transition-colors ${
                        isLowStock ? 'bg-[#b91c1c]/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-[#a1a1aa] text-xs font-mono">{p.barcode}</td>
                      <td
                        className={`py-2.5 px-3 font-medium ${
                          isLowStock ? 'text-[#fca5a5]' : 'text-[#f4f4f5]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {p.name}
                          {isLowStock && <span className="badge-low-stock">LOW</span>}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {formatCurrency(p.price)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#a1a1aa]">
                        {formatCurrency(p.costPrice)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums ${
                          isLowStock ? 'text-[#fca5a5] font-bold' : 'text-[#f4f4f5]'
                        }`}
                      >
                        {p.stock}
                      </td>
                      <td className="py-2.5 px-3 text-[#a1a1aa] text-xs">{p.category || '—'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(p.id!)}
                            className="p-1.5 rounded-lg hover:bg-[#b91c1c]/20 text-[#a1a1aa] hover:text-[#fca5a5] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 card-panel p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#f4f4f5]">
                {modal === 'add' ? 'Add Product' : 'Edit Product'}
              </h3>
              <button
                onClick={() => setModal('none')}
                className="p-1.5 rounded-lg hover:bg-[#27272a] text-[#a1a1aa] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#a1a1aa] mb-1">Barcode</label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52525b]" />
                  <input
                    className="input-pos w-full pl-10 font-mono"
                    value={editProduct.barcode || ''}
                    onChange={(e) => setEditProduct((p) => ({ ...p, barcode: e.target.value }))}
                    placeholder="Scan or type barcode"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#a1a1aa] mb-1">Product Name</label>
                <input
                  className="input-pos w-full"
                  value={editProduct.name || ''}
                  onChange={(e) => setEditProduct((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Product name"
                  autoFocus={modal === 'add'}
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
                    value={
                      typeof editProduct.price === 'number'
                        ? (editProduct.price / 100).toFixed(2)
                        : '0.00'
                    }
                    onChange={(e) =>
                      setEditProduct((p) => ({ ...p, price: parsePriceToCents(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#a1a1aa] mb-1">Cost Price ($)</label>
                  <input
                    className="input-pos w-full"
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      typeof editProduct.costPrice === 'number'
                        ? (editProduct.costPrice / 100).toFixed(2)
                        : '0.00'
                    }
                    onChange={(e) =>
                      setEditProduct((p) => ({ ...p, costPrice: parsePriceToCents(e.target.value) }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#a1a1aa] mb-1">Stock</label>
                  <input
                    className="input-pos w-full"
                    type="number"
                    min="0"
                    value={editProduct.stock ?? 0}
                    onChange={(e) =>
                      setEditProduct((p) => ({ ...p, stock: parseInt(e.target.value, 10) || 0 }))
                    }
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs text-[#a1a1aa] mb-1">Category</label>
                  <input
                    className="input-pos w-full"
                    value={editProduct.category || ''}
                    onChange={(e) => {
                      setEditProduct((p) => ({ ...p, category: e.target.value }));
                      setShowCategorySuggest(true);
                    }}
                    onFocus={() => setShowCategorySuggest(true)}
                    onBlur={() => setTimeout(() => setShowCategorySuggest(false), 200)}
                    placeholder="Category"
                  />
                  {showCategorySuggest && categories.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 card-panel max-h-32 overflow-y-auto z-10">
                      {categories
                        .filter(
                          (c) =>
                            !editProduct.category ||
                            c.toLowerCase().includes((editProduct.category || '').toLowerCase())
                        )
                        .map((c) => (
                          <button
                            key={c}
                            className="w-full text-left px-3 py-1.5 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#f4f4f5] transition-colors"
                            onMouseDown={() => {
                              setEditProduct((p) => ({ ...p, category: c }));
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
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-[#27272a]">
              <button onClick={() => setModal('none')} className="btn-secondary text-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editProduct.name || !editProduct.barcode}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 card-panel p-6 animate-scale-in">
            <h3 className="text-sm font-bold text-[#f4f4f5] mb-2">Delete Product?</h3>
            <p className="text-xs text-[#a1a1aa] mb-5">
              This action cannot be undone. The product will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryView;