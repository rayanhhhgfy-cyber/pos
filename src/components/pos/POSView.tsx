import { useState } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useConfigStore } from '../../stores/configStore';
import { useUIStore } from '../../stores/uiStore';
import {
  formatCents,
  calculateTax,
  subtractCents,
  addCents,
} from '../../utils/cents';
import { playSuccess, playCheckoutComplete } from '../../utils/audio';
import { useLangStore } from '../../stores/langStore';
import type { PaymentMethod, Sale } from '../../types';
import type { Cents } from '../../types/cents';

import CartPanel from './CartPanel';
import ProductSearch from './ProductSearch';
import CheckoutModal from './CheckoutModal';
import QuickAddModal from './QuickAddModal';

function POSView() {
  const items = useCartStore((s) => s.items);
  const discount = useCartStore((s) => s.discount);
  const lastSale = useCartStore((s) => s.lastSale);
  const getSubtotal = useCartStore.getState().getSubtotal;
  const getDiscountAmount = useCartStore.getState().getDiscountAmount;

  const config = useConfigStore((s) => s.config);
  const currencySymbol = config.currencySymbol;
  const taxRate = config.taxRate;

  const activeModal = useUIStore((s) => s.activeModal);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const t = useLangStore((s) => s.t);
  const lang = useLangStore((s) => s.lang);

  const handleCheckout = () => {
    if (items.length === 0) return;
    openModal('checkout');
  };

  const handleCompleteSale = async (
    paymentMethod: PaymentMethod,
    amountTendered: Cents,
    change: Cents
  ) => {
    const sale = await useCartStore
      .getState()
      .completeSale(paymentMethod, amountTendered, change, taxRate, currencySymbol);
    setCompletedSale(sale);
    setShowReceipt(true);
    playCheckoutComplete();
    useConfigStore.getState().incrementSaleCounter();
    closeModal();
  };

  const handlePrintReceipt = () => {
    const receiptRoot = document.getElementById('receipt-root');
    const receiptPrint = document.querySelector('.receipt-print');
    if (receiptRoot && receiptPrint) {
      receiptRoot.innerHTML = receiptPrint.outerHTML;
      window.print();
      setTimeout(() => {
        receiptRoot.innerHTML = '';
      }, 500);
    } else {
      window.print();
    }
  };

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const taxable = subtractCents(subtotal, discountAmount);
  const taxAmount = calculateTax(taxable, taxRate);
  const total = addCents(taxable, taxAmount);

  return (
    <div className="h-full flex" id="pos-view">
      {/* Left: Cart Panel */}
      <div
        id="cart-panel"
        className="w-96 flex-shrink-0 border-r border-[#27272a] bg-[#1e293b] flex flex-col"
      >
        <CartPanel
          items={items}
          discount={discount}
          subtotal={formatCents(subtotal, currencySymbol)}
          discountAmount={formatCents(discountAmount, currencySymbol)}
          taxAmount={formatCents(taxAmount, currencySymbol)}
          total={formatCents(total, currencySymbol)}
          totalItems={items.reduce((a, i) => a + i.quantity, 0)}
          currencySymbol={currencySymbol}
          onCheckout={handleCheckout}
          onClearCart={() => useCartStore.getState().clearCart()}
        />
      </div>

      {/* Right: Product Search + Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ProductSearch />
      </div>

      {/* Checkout Modal */}
      {activeModal === 'checkout' && (
        <CheckoutModal
          subtotal={subtotal}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          total={total}
          currencySymbol={currencySymbol}
          taxRate={taxRate}
          items={items}
          onComplete={handleCompleteSale}
          onClose={closeModal}
        />
      )}

      {/* Quick Add Product Modal */}
      {activeModal === 'quick_add_product' && (
        <QuickAddModal onClose={closeModal} />
      )}

      {/* Receipt Display */}
      {showReceipt && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="card-panel p-6 max-w-sm w-full mx-4 animate-scale-in">
            <div className="receipt-print">
              <div className="receipt-header">
                <div className="receipt-store-name">{config.storeName}</div>
                <div className="mt-1 text-[10px]">
                  {new Date(completedSale.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="receipt-divider" />
              {completedSale.items.map((item, i) => (
                <div key={i} className="receipt-item">
                  <span className="receipt-qty">{item.quantity}x</span>
                  <span className="receipt-name">{item.name}</span>
                  <span className="receipt-price">
                    {formatCents(item.lineTotal, currencySymbol)}
                  </span>
                </div>
              ))}
              <div className="receipt-divider" />
              <div className="receipt-total-row">
                <span>{t.subtotal}</span>
                <span>{formatCents(completedSale.subtotal, currencySymbol)}</span>
              </div>
              {completedSale.discountAmount > 0 && (
                <div className="receipt-total-row">
                  <span>{t.discount}</span>
                  <span>-{formatCents(completedSale.discountAmount, currencySymbol)}</span>
                </div>
              )}
              <div className="receipt-total-row">
                <span>{t.tax} ({completedSale.taxRate}%)</span>
                <span>{formatCents(completedSale.taxAmount, currencySymbol)}</span>
              </div>
              <div className="receipt-thick-divider" />
              <div className="receipt-total-row receipt-grand-total">
                <span>{lang === 'ar' ? 'المجموع النهائي' : 'TOTAL'}</span>
                <span>{formatCents(completedSale.total, currencySymbol)}</span>
              </div>
              <div className="receipt-divider" />
              <div className="receipt-total-row text-xs">
                <span>
                  {lang === 'ar' ? 'المدفوع' : 'Paid'}{' '}
                  ({completedSale.paymentMethod === 'visa' ? t.visa : completedSale.paymentMethod === 'cash' ? t.cash : completedSale.paymentMethod === 'card' ? t.card : t.mobilePay})
                </span>
                <span>{formatCents(completedSale.amountTendered, currencySymbol)}</span>
              </div>
              {completedSale.changeAmount > 0 && (
                <div className="receipt-total-row text-xs">
                  <span>{lang === 'ar' ? 'الباقي' : 'Change'}</span>
                  <span>{formatCents(completedSale.changeAmount, currencySymbol)}</span>
                </div>
              )}
              <div className="receipt-thick-divider" />
              <div className="receipt-footer">
                <p>{config.receiptHeader}</p>
                <p>{config.receiptFooter}</p>
                <p className="mt-2 text-[9px]">{lang === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!'}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 print:hidden">
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setCompletedSale(null);
                }}
                className="btn-secondary text-sm flex-1"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
              <button onClick={handlePrintReceipt} className="btn-primary text-sm flex-1">
                {lang === 'ar' ? 'طباعة الإيصال' : 'Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default POSView;