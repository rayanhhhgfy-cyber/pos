import type { Product } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { useConfigStore } from '../../stores/configStore';
import { formatCents } from '../../utils/cents';
import { playSuccess } from '../../utils/audio';
import { ShoppingCart, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const currencySymbol = useConfigStore((s) => s.config.currencySymbol);

  const isLowStock = product.stock < 5;
  const outOfStock = product.stock <= 0;
  const inCart = items.find((i) => i.productId === product.id);
  const inCartQty = inCart?.quantity || 0;

  const handleAdd = () => {
    if (outOfStock) return;
    addItem(product.barcode, product.name, product.price, product.costPrice, product.id!);
    playSuccess();
  };

  return (
    <button
      onClick={handleAdd}
      disabled={outOfStock}
      className={`card-panel p-3 text-left transition-all duration-150 hover:border-[#059669] active:scale-[0.97] ${
        outOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${isLowStock && !outOfStock ? 'border-l-2 border-l-[#b91c1c]' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-mono text-[#a1a1aa] truncate flex-1" title={product.barcode}>
          {product.barcode}
        </p>
        {inCartQty > 0 && (
          <span className="text-[10px] bg-[#059669] text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
            {inCartQty}
          </span>
        )}
      </div>

      {/* Name */}
      <p className="text-sm font-bold text-[#f4f4f5] mt-1 line-clamp-2 leading-tight" title={product.name}>
        {product.name}
      </p>

      {/* Price */}
      <p className="text-lg font-bold text-[#34d399] mt-1 font-mono tabular-nums">
        {formatCents(product.price, currencySymbol)}
      </p>

      {/* Stock + Category */}
      <div className="flex items-center justify-between mt-2">
        {product.category && (
          <span className="text-[10px] text-[#52525b]">{product.category}</span>
        )}
        {isLowStock ? (
          <span className="flex items-center gap-1 text-[10px] text-[#fca5a5]">
            <AlertTriangle className="w-3 h-3" />
            {product.stock}
          </span>
        ) : (
          <span className="text-[10px] text-[#52525b]">{product.stock} in stock</span>
        )}
      </div>
    </button>
  );
}

export default ProductCard;