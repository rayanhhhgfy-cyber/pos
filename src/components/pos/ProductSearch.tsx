import { useState, useEffect, useCallback, useRef } from 'react';
import { posDB } from '../../db';
import type { Product } from '../../types';
import { useUIStore } from '../../stores/uiStore';
import { Search, Camera, Barcode, Grid3X3 } from 'lucide-react';
import ProductGrid from './ProductGrid';

function ProductSearch() {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const openModal = useUIStore((s) => s.openModal);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = searchQuery.trim().toLowerCase();
      let results: Product[];
      if (q.length === 0 && !activeCategory) {
        results = await posDB.products.limit(100).toArray();
      } else {
        results = await posDB.products
          .filter((p) => {
            const nameMatch = p.name.toLowerCase().includes(q);
            const barcodeMatch = p.barcode.toLowerCase().includes(q);
            const catMatch = activeCategory
              ? p.category?.toLowerCase() === activeCategory.toLowerCase()
              : true;
            return (nameMatch || barcodeMatch) && catMatch;
          })
          .limit(200)
          .toArray();
      }
      setProducts(results);

      const allCats = await posDB.products
        .orderBy('category')
        .uniqueKeys();
      setCategories(allCats.filter((k): k is string => typeof k === 'string' && k.length > 0));
    } catch {
      /* */
    }
    setLoading(false);
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  // Keyboard shortcut: F4 for camera, F2 for search focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F4' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        openModal('camera_scanner');
      }
      if (e.key === 'F2' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openModal]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 border-b border-[#27272a]">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
            <input
              ref={inputRef}
              className="input-pos w-full pl-10 pr-3 h-10"
              placeholder="Search products by name or barcode... (F2)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => openModal('camera_scanner')}
            className="btn-secondary flex items-center gap-1.5 text-xs px-3"
            title="Camera Scanner (F4)"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Scan</span>
          </button>
        </div>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory('')}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                !activeCategory
                  ? 'bg-[#059669] text-white'
                  : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
                className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#059669] text-white'
                    : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}

export default ProductSearch;