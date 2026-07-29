import { X, ArrowLeft, DollarSign, CreditCard, Smartphone } from 'lucide-react';
import { useState } from 'react';
import type { CartItem, PaymentMethod } from '../../types';
import type { Cents } from '../../types/cents';
import { formatCents } from '../../utils/cents';
import { useCartStore } from '../../stores/cartStore';
import { useLangStore } from '../../stores/langStore';
import NumericKeypad from './NumericKeypad';

interface CheckoutModalProps {
  subtotal: Cents;
  discountAmount: Cents;
  taxAmount: Cents;
  total: Cents;
  currencySymbol: string;
  taxRate: number;
  items: CartItem[];
  onComplete: (method: PaymentMethod, amountTendered: Cents, change: Cents) => Promise<void>;
  onClose: () => void;
}

function CheckoutModal({
  subtotal,
  discountAmount,
  taxAmount,
  total,
  currencySymbol,
  taxRate,
  items,
  onComplete,
  onClose,
}: CheckoutModalProps) {
  const [method, setMethod] = useState<'payment' | 'cash'>('payment');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const t = useLangStore((s) => s.t);
  const lang = useLangStore((s) => s.lang);

  const totalDisplay = formatCents(total, currencySymbol);

  const cashCents = Math.round(parseFloat(cashAmount || '0') * 100);
  const isEnough = cashCents >= total;
  const changeDue = isEnough ? cashCents - total : 0;
  const changeDisplay = formatCents(changeDue as Cents, currencySymbol);

  const handleSelectMethod = async (paymentMethod: PaymentMethod) => {
    setSelectedPayment(paymentMethod);
    if (paymentMethod === 'cash') {
      setMethod('cash');
    } else {
      setProcessing(true);
      await onComplete(paymentMethod, total, 0 as Cents);
      setProcessing(false);
    }
  };

  const handleCashConfirm = async () => {
    if (!isEnough) return;
    setProcessing(true);
    await onComplete('cash', cashCents as Cents, changeDue as Cents);
    setProcessing(false);
  };

  const handleKeypadPress = (key: string) => {
    setCashAmount((prev) => {
      if (key === 'backspace') {
        return prev.slice(0, -1);
      }
      if (key === '.' && prev.includes('.')) return prev;
      const next = prev + key;
      const parts = next.split('.');
      if (parts.length === 2 && parts[1].length > 2) return prev;
      return next;
    });
  };

  const showChange = parseFloat(cashAmount || '0') * 100 >= total && cashAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 card-panel p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#f4f4f5]">
            {method === 'payment' ? t.selectPayment : (lang === 'ar' ? 'الدفع النقدي' : 'Cash Payment')}
          </h3>
          {!processing && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#27272a] text-[#a1a1aa] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {method === 'payment' && (
          <div className="space-y-3" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="card-panel p-4">
              <div className="flex justify-between text-xs text-[#a1a1aa] mb-2">
                <span>{items.reduce((a, i) => a + i.quantity, 0)} {lang === 'ar' ? 'مواد' : 'items'}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="text-[#34d399]">{t.discount}</span>
                  <span className="text-[#34d399]">-{formatCents(discountAmount, currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-0.5">
                <span className="text-[#a1a1aa]">{t.tax} ({taxRate}%)</span>
                <span className="text-[#f4f4f5]">{formatCents(taxAmount, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-[#27272a]">
                <span>{t.total}</span>
                <span className="text-[#34d399]">{totalDisplay}</span>
              </div>
            </div>

            <button onClick={() => handleSelectMethod('cash')} className="btn-primary w-full text-sm py-4 flex items-center justify-center gap-2">
              <DollarSign className="w-5 h-5" /> {t.cash}
            </button>
            <button onClick={() => handleSelectMethod('card')} className="btn-secondary w-full text-sm py-4 flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5" /> {t.card}
            </button>
            <button onClick={() => handleSelectMethod('visa')} className="btn-secondary w-full text-sm py-4 flex items-center justify-center gap-2 border-blue-500 hover:border-blue-400">
              <CreditCard className="w-5 h-5 text-blue-400" /> {t.visa}
            </button>
            <button onClick={() => handleSelectMethod('mobile_pay')} className="btn-secondary w-full text-sm py-4 flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5" /> {t.mobilePay}
            </button>
          </div>
        )}

        {method === 'cash' && (
          <div className="space-y-3" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="card-panel p-4 text-center">
              <p className="text-xs text-[#a1a1aa] mb-1">{t.amountDue}</p>
              <p className="text-3xl font-bold text-[#f4f4f5] font-mono">{totalDisplay}</p>
            </div>

            <div className="card-panel p-3 text-center">
              <label className="block text-xs text-[#a1a1aa] mb-1.5">{t.cashTendered}</label>
              <div className="relative max-w-[200px] mx-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-[#34d399] font-mono">
                  {currencySymbol}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input-pos w-full text-center text-2xl font-bold text-[#34d399] pl-8 font-mono bg-[#18181b]/80"
                  value={cashAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setCashAmount(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isEnough) {
                      handleCashConfirm();
                    }
                  }}
                  autoFocus
                  placeholder="0.00"
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => setCashAmount((total / 100).toFixed(2))}
                  className="text-[10px] py-1.5 rounded bg-[#27272a] text-[#f4f4f5] hover:bg-[#3f3f46] font-bold font-mono transition-all"
                >
                  {lang === 'ar' ? 'المبلغ بالضبط' : 'Exact'}
                </button>
                {[5, 10, 20, 50, 100].map((bill) => {
                  const billVal = Math.ceil((total / 100) / bill) * bill;
                  if (billVal * 100 < total) return null;
                  return (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setCashAmount(billVal.toFixed(2))}
                      className="text-[10px] py-1.5 rounded bg-[#27272a] text-[#f4f4f5] hover:bg-[#3f3f46] font-bold font-mono transition-all"
                    >
                      {currencySymbol}{billVal}
                    </button>
                  );
                }).filter((b) => b !== null).slice(0, 3)}
              </div>
            </div>

            {showChange && (
              <div className="card-panel p-3 text-center animate-fade-in">
                <p className="text-xs text-[#a1a1aa] mb-1">{t.changeDue}</p>
                <p className="text-2xl font-bold text-[#f4f4f5] font-mono">{changeDisplay}</p>
              </div>
            )}

            <NumericKeypad
              onInput={handleKeypadPress}
              onConfirm={handleCashConfirm}
              confirmLabel={isEnough ? t.completeSale : `${lang === 'ar' ? 'متبقي' : 'Need'} ${currencySymbol}${(Math.max(0, total - cashCents) / 100).toFixed(2)}`}
            />
          </div>
        )}

        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#18181b]/80">
            <div className="w-6 h-6 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;