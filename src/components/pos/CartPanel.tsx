import { useState } from 'react';
import type { CartItem } from '../../types';
import { formatCents } from '../../utils/cents';
import { useCartStore } from '../../stores/cartStore';
import { X, ShoppingCart, Tag, Trash2, Minus, Plus } from 'lucide-react';

interface CartPanelProps {
  items: CartItem[];
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  totalItems: number;
  currencySymbol: string;
  discount: { type: 'flat' | 'percentage' | 'none'; value: number };
  onCheckout: () => void;
  onClearCart: () => void;
}

function CartPanel({
  items,
  subtotal,
  discountAmount,
  taxAmount,
  total,
  totalItems,
  currencySymbol,
  discount,
  onCheckout,
  onClearCart,
}: CartPanelProps) {
  const [showDiscInput, setShowDiscInput] = useState(false);
  const [discValue, setDiscValue] = useState('');
  const [discType, setDiscType] = useState<'flat' | 'percentage'>('percentage');
  const [qtyEditId, setQtyEditId] = useState<number | null>(null);
  const [qtyValue, setQtyValue] = useState('');

  const setDiscount = useCartStore((s) => s.setDiscount);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const handleApplyDiscount = () => {
    const val = parseFloat(discValue);
    if (isNaN(val) || val <= 0) return;
    setDiscount(discType, val);
    setShowDiscInput(false);
    setDiscValue('');
  };

  const handleRemoveDiscount = () => {
    setDiscount('none', 0);
    setDiscValue('');
  };

  const openQtyEditor = (id: number, current: number) => {
    setQtyEditId(id);
    setQtyValue(String(current));
  };

  const confirmQty = () => {
    if (qtyEditId !== null) {
      const val = parseInt(qtyValue, 10);
      if (!isNaN(val) && val > 0) {
        updateQuantity(qtyEditId, val);
      }
    }
    setQtyEditId(null);
    setQtyValue('');
  };

  const hasActiveDiscount = discount.type !== 'none' && discount.value > 0;
  const discLabel =
    hasActiveDiscount
      ? discount.type === 'flat'
        ? `${currencySymbol}${discount.value.toFixed(2)} off`
        : `${discount.value}% off`
      : '';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#a1a1aa]" />
          <span className="text-sm font-bold text-[#f4f4f5]">Cart</span>
          <span className="text-xs bg-[#27272a] text-[#a1a1aa] px-1.5 py-0.5 rounded-full">
            {totalItems}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {hasActiveDiscount && (
            <button
              onClick={handleRemoveDiscount}
              className="text-[#a1a1aa] hover:text-[#fca5a5] p-1 rounded transition-colors"
              title="Remove discount"
            >
              <Tag className="w-3.5 h-3.5" />
            </button>
          )}
          {items.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-[#a1a1aa] hover:text-[#fca5a5] p-1 rounded transition-colors"
              title="Clear cart"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#52525b]">
            <ShoppingCart className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs mt-1">Search products or scan barcode</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productId}
              className="card-panel p-2.5 animate-slide-in group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#f4f4f5] truncate">{item.name}</p>
                  <p className="text-[10px] text-[#a1a1aa] font-mono mt-0.5">{item.barcode}</p>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[#52525b] hover:text-[#fca5a5] transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1">
                  {qtyEditId === item.productId ? (
                    <div className="flex items-center gap-1">
                      <input
                        className="input-pos w-16 h-7 text-xs text-center"
                        value={qtyValue}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setQtyValue(val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmQty();
                          if (e.key === 'Escape') {
                            setQtyEditId(null);
                            setQtyValue('');
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={confirmQty}
                        className="text-[#059669] text-xs font-bold"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, Math.max(1, item.quantity - 1))
                        }
                        className="w-6 h-6 rounded bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-[#f4f4f5] flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => openQtyEditor(item.productId, item.quantity)}
                        className="min-w-[28px] h-6 px-1 rounded bg-[#18181b] text-[#f4f4f5] text-xs font-bold font-mono flex items-center justify-center hover:bg-[#27272a] transition-colors cursor-pointer"
                      >
                        {item.quantity}
                      </button>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="w-6 h-6 rounded bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-[#f4f4f5] flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold text-[#f4f4f5] font-mono tabular-nums">
                  {formatCents(item.lineTotal, currencySymbol)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-[#27272a] px-4 py-3 space-y-2">
          {hasActiveDiscount && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#34d399]">{discLabel}</span>
              <span className="text-[#34d399] font-mono">-{discountAmount}</span>
            </div>
          )}

          {showDiscInput ? (
            <div className="card-panel p-2 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setDiscType('percentage')}
                  className={`text-xs px-2 py-1 rounded ${
                    discType === 'percentage'
                      ? 'bg-[#059669] text-white'
                      : 'bg-[#27272a] text-[#a1a1aa]'
                  }`}
                >
                  %
                </button>
                <button
                  onClick={() => setDiscType('flat')}
                  className={`text-xs px-2 py-1 rounded ${
                    discType === 'flat'
                      ? 'bg-[#059669] text-white'
                      : 'bg-[#27272a] text-[#a1a1aa]'
                  }`}
                >
                  {currencySymbol}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  className="input-pos flex-1 text-xs h-8"
                  placeholder={discType === 'flat' ? 'Amount' : 'Percent'}
                  value={discValue}
                  onChange={(e) =>
                    setDiscValue(e.target.value.replace(/[^0-9.]/g, ''))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyDiscount();
                  }}
                  autoFocus
                />
                <button onClick={handleApplyDiscount} className="btn-primary text-xs px-3 h-8">
                  Apply
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowDiscInput(true);
                setDiscValue('');
              }}
              className="text-xs text-[#a1a1aa] hover:text-[#f4f4f5] flex items-center gap-1 transition-colors"
            >
              <Tag className="w-3 h-3" />
              Add discount
            </button>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-[#a1a1aa]">Subtotal</span>
            <span className="text-[#f4f4f5] font-mono tabular-nums">{subtotal}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[#a1a1aa]">Tax</span>
            <span className="text-[#f4f4f5] font-mono tabular-nums">{taxAmount}</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#27272a]">
            <span className="text-base font-bold text-[#f4f4f5]">Total</span>
            <span className="text-lg font-bold text-[#34d399] font-mono tabular-nums">
              {total}
            </span>
          </div>

          <button
            onClick={onCheckout}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2 mt-2 py-3"
          >
            <ShoppingCart className="w-4 h-4" />
            Checkout & Pay
          </button>
        </div>
      )}
    </div>
  );
}

export default CartPanel;