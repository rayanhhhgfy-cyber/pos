import { useState } from 'react';
import type { CartItem } from '../../types';
import { formatCents } from '../../utils/cents';
import { useCartStore } from '../../stores/cartStore';
import { X, ShoppingCart, Tag, Trash2, Minus, Plus, Unlock, Pencil, Pause, FolderOpen } from 'lucide-react';
import { playCheckoutComplete } from '../../utils/audio';
import { posDB } from '../../db';
import { useLangStore } from '../../stores/langStore';

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
  const [showDrawerNotification, setShowDrawerNotification] = useState(false);

  const t = useLangStore((s) => s.t);
  const lang = useLangStore((s) => s.lang);
  const setDiscount = useCartStore((s) => s.setDiscount);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateCartItemDetails = useCartStore((s) => s.updateCartItemDetails);

  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemDiscType, setEditItemDiscType] = useState<'flat' | 'percentage' | 'none'>('none');
  const [editItemDiscValue, setEditItemDiscValue] = useState('');

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

  const openItemEditor = (item: CartItem) => {
    setEditingItem(item);
    setEditItemPrice(String((item.unitPrice / 100).toFixed(2)));
    setEditItemDiscType(item.discountType || 'none');
    setEditItemDiscValue(item.discountValue ? String(item.discountValue) : '');
  };

  const handleSaveItemEdit = () => {
    if (!editingItem) return;
    const parsedPrice = Math.round(parseFloat(editItemPrice || '0') * 100);
    const parsedDiscVal = parseFloat(editItemDiscValue || '0');
    updateCartItemDetails(
      editingItem.productId,
      parsedPrice as any,
      editItemDiscType,
      isNaN(parsedDiscVal) ? 0 : parsedDiscVal
    );
    setEditingItem(null);
  };

  const [showRecallModal, setShowRecallModal] = useState(false);
  const [parkedCarts, setParkedCarts] = useState<any[]>([]);

  const handleHoldCart = async () => {
    if (items.length === 0) return;
    const defaultName = `Cart #${Date.now().toString().slice(-4)}`;
    const name = prompt(lang === 'ar' ? 'أدخل اسم العميل أو المرجع لهذه السلة (اختياري):' : 'Enter reference/customer name for this cart (optional):', defaultName);
    if (name === null) return;

    const finalName = name.trim() || defaultName;
    await posDB.parked_carts.add({
      name: finalName,
      items,
      createdAt: Date.now()
    });
    useCartStore.getState().clearCart();
    playCheckoutComplete();
    alert(lang === 'ar' ? 'تم تعليق الفاتورة بنجاح!' : 'Cart put on hold successfully!');
  };

  const openRecallModal = async () => {
    const carts = await posDB.parked_carts.toArray();
    setParkedCarts(carts.filter(c => (c.id as any) !== 'active_cart'));
    setShowRecallModal(true);
  };

  const handleRestoreCart = async (cart: any) => {
    useCartStore.getState().setItems(cart.items);
    await posDB.parked_carts.delete(cart.id);
    setShowRecallModal(false);
    playCheckoutComplete();
  };

  const handleDeleteParked = async (id: number) => {
    await posDB.parked_carts.delete(id);
    const carts = await posDB.parked_carts.toArray();
    setParkedCarts(carts.filter(c => (c.id as any) !== 'active_cart'));
  };

  const hasActiveDiscount = discount.type !== 'none' && discount.value > 0;
  const discLabel =
    hasActiveDiscount
      ? discount.type === 'flat'
        ? `${currencySymbol}${discount.value.toFixed(2)} off`
        : `${discount.value}% off`
      : '';

  const handleOpenRegister = async () => {
    playCheckoutComplete();
    await posDB.audit_log.add({
      type: 'register_opened',
      details: 'Cash register drawer manually opened',
      timestamp: Date.now(),
    });
    setShowDrawerNotification(true);
    setTimeout(() => {
      setShowDrawerNotification(false);
    }, 2500);
  };

  return (
    <div className="flex flex-col h-full relative">
      {showDrawerNotification && (
        <div className="absolute top-12 left-4 right-4 z-50 bg-gradient-to-r from-[#059669] to-[#0f766e] text-white text-xs font-bold py-2 px-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <Unlock className="w-4 h-4" />
          <span>{t.openRegister} ({t.done})</span>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#a1a1aa]" />
          <span className="text-sm font-bold text-[#f4f4f5]">{t.cart}</span>
          <span className="text-xs bg-[#27272a] text-[#a1a1aa] px-1.5 py-0.5 rounded-full">
            {totalItems}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenRegister}
            className="text-[#a1a1aa] hover:text-[#34d399] p-1 rounded transition-colors"
            title={t.openRegister}
          >
            <Unlock className="w-3.5 h-3.5" />
          </button>
          {items.length > 0 && (
            <button
              onClick={handleHoldCart}
              className="text-[#a1a1aa] hover:text-[#fbbf24] p-1 rounded transition-colors"
              title={lang === 'ar' ? 'تعليق الفاتورة (Hold)' : 'Hold Cart'}
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={openRecallModal}
            className="text-[#a1a1aa] hover:text-[#38bdf8] p-1 rounded transition-colors"
            title={lang === 'ar' ? 'استرجاع الفواتير المعلقة' : 'Recall Held Carts'}
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
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
              title={t.clearCart}
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
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openItemEditor(item)}>
                  <p className="text-sm font-medium text-[#f4f4f5] truncate">{item.name}</p>
                  <p className="text-[10px] text-[#a1a1aa] font-mono mt-0.5">{item.barcode}</p>
                  {item.discountAmount && item.discountAmount > 0 && (
                    <p className="text-[10px] text-[#34d399] mt-0.5">
                      -{formatCents(item.discountAmount, currencySymbol)} {lang === 'ar' ? 'خصم مخصص' : 'item discount'}
                    </p>
                  )}
                  {item.originalPrice !== undefined && item.unitPrice !== item.originalPrice && (
                    <p className="text-[10px] text-[#38bdf8] mt-0.5">
                      {lang === 'ar' ? 'السعر معدل من' : 'Price edited from'} {formatCents(item.originalPrice, currencySymbol)}
                    </p>
                  )}
                  {(() => {
                    const priceToUse = item.unitPrice;
                    const baseSubtotal = priceToUse * item.quantity;
                    const expectedTotal = baseSubtotal - (item.discountAmount || 0);
                    if (item.lineTotal < expectedTotal) {
                      return (
                        <p className="text-[10px] text-[#fbbf24] mt-0.5 font-bold">
                          ★ {lang === 'ar' ? 'تم تطبيق خصم الكمية التلقائي!' : 'Bulk discount applied automatically!'}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => openItemEditor(item)}
                    className="p-1 text-[#52525b] hover:text-[#34d399] transition-all"
                    title="Edit Price/Discount"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1 text-[#52525b] hover:text-[#fca5a5] transition-all"
                    title="Remove item"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
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

      {/* Edit Cart Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="w-full max-w-sm mx-4 card-panel p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#f4f4f5]">
                {lang === 'ar' ? `تعديل المنتج: ${editingItem.name}` : `Adjust Item: ${editingItem.name}`}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg hover:bg-[#27272a] text-[#a1a1aa] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#a1a1aa] mb-1.5">
                  {lang === 'ar' ? `سعر الوحدة (${currencySymbol})` : `Unit Price (${currencySymbol})`}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input-pos w-full"
                  value={editItemPrice}
                  onChange={(e) => setEditItemPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-[#a1a1aa] mb-1.5">
                  {lang === 'ar' ? 'خصم المنتج' : 'Item Discount'}
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setEditItemDiscType('none')}
                    className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                      editItemDiscType === 'none'
                        ? 'bg-[#059669] text-white'
                        : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'
                    }`}
                  >
                    {lang === 'ar' ? 'بدون خصم' : 'No Discount'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditItemDiscType('percentage')}
                    className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                      editItemDiscType === 'percentage'
                        ? 'bg-[#059669] text-white'
                        : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'
                    }`}
                  >
                    {lang === 'ar' ? 'نسبة مئوية (%)' : 'Percentage (%)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditItemDiscType('flat')}
                    className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                      editItemDiscType === 'flat'
                        ? 'bg-[#059669] text-white'
                        : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'
                    }`}
                  >
                    {lang === 'ar' ? `خصم ثابت (${currencySymbol})` : `Flat (${currencySymbol})`}
                  </button>
                </div>

                {editItemDiscType !== 'none' && (
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input-pos w-full animate-slide-in"
                    placeholder={editItemDiscType === 'percentage' ? 'Percent (e.g. 10)' : 'Amount (e.g. 5.00)'}
                    value={editItemDiscValue}
                    onChange={(e) => setEditItemDiscValue(e.target.value.replace(/[^0-9.]/g, ''))}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="btn-secondary text-sm"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveItemEdit}
                className="btn-primary text-sm"
              >
                {lang === 'ar' ? 'تطبيق التعديلات' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recall Held Carts Modal */}
      {showRecallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="w-full max-w-md mx-4 card-panel p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#f4f4f5]">
                {lang === 'ar' ? 'الفواتير المعلقة (Hold)' : 'Held Receipts / Parked Carts'}
              </h3>
              <button
                onClick={() => setShowRecallModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#27272a] text-[#a1a1aa] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {parkedCarts.length === 0 ? (
                <p className="text-xs text-center text-[#52525b] py-6">
                  {lang === 'ar' ? 'لا توجد فواتير معلقة حالياً.' : 'No held receipts at the moment.'}
                </p>
              ) : (
                parkedCarts.map((cart) => (
                  <div key={cart.id} className="flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-[#38bdf8] transition-colors">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleRestoreCart(cart)}>
                      <p className="text-sm font-bold text-[#f4f4f5] truncate">{cart.name}</p>
                      <p className="text-[10px] text-[#a1a1aa] mt-1 font-mono">
                        {new Date(cart.createdAt).toLocaleTimeString()} ({cart.items.reduce((sum: number, i: any) => sum + i.quantity, 0)} {lang === 'ar' ? 'منتجات' : 'items'})
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteParked(cart.id)}
                      className="p-1.5 rounded-lg hover:bg-[#b91c1c]/20 text-[#a1a1aa] hover:text-[#fca5a5] transition-colors"
                      title={lang === 'ar' ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end mt-5 pt-4 border-t border-[#27272a]">
              <button
                onClick={() => setShowRecallModal(false)}
                className="btn-secondary text-sm w-full"
              >
                {t.close || (lang === 'ar' ? 'إغلاق' : 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPanel;