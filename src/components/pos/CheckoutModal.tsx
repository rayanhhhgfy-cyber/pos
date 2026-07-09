import { X, ArrowLeft, DollarSign, CreditCard, Smartphone } from 'lucide-react';
import { useState } from 'react';
import type { CartItem, PaymentMethod } from '../../types';
import type { Cents } from '../../types/cents';
import { formatCents } from '../../utils/cents';
import { useCartStore } from '../../stores/cartStore';
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
            {method === 'payment' ? 'Select Payment' : 'Cash Payment'}
          </h3>
          {!processing && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#27272a] text-[#a1a1aa] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {method === 'payment' && (
          <div className="space-y-3">
            <div className="card-panel p-4">
              <div className="flex justify-between text-xs text-[#a1a1aa] mb-2">
                <span>{items.reduce((a, i) => a + i.quantity, 0)} items</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="text-[#34d399]">Discount</span>
                  <span className="text-[#34d399]">-{formatCents(discountAmount, currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-0.5">
                <span className="text-[#a1a1aa]">Tax ({taxRate}%)</span>
                <span className="text-[#f4f4f5]">{formatCents(taxAmount, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-[#27272a]">
                <span>Total</span>
                <span className="text-[#34d399]">{totalDisplay}</span>
              </div>
            </div>

            <button onClick={() => handleSelectMethod('cash')} className="btn-primary w-full text-sm py-4 flex items-center justify-center gap-2">
              <DollarSign className="w-5 h-5" /> Cash
            </button>
            <button onClick={() => handleSelectMethod('card')} className="btn-secondary w-full text-sm py-4 flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5" /> Card
            </button>
            <button onClick={() => handleSelectMethod('mobile_pay')} className="btn-secondary w-full text-sm py-4 flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5" /> Mobile Pay
            </button>
          </div>
        )}

        {method === 'cash' && (
          <div className="space-y-3">
            <div className="card-panel p-4 text-center">
              <p className="text-xs text-[#a1a1aa] mb-1">Amount Due</p>
              <p className="text-3xl font-bold text-[#f4f4f5] font-mono">{totalDisplay}</p>
            </div>

            <div className="card-panel p-3 text-center">
              <p className="text-xs text-[#a1a1aa] mb-1">Cash Tendered</p>
              <p className="text-2xl font-bold text-[#34d399] font-mono">
                {currencySymbol}{(parseFloat(cashAmount || '0')).toFixed(2)}
              </p>
            </div>

            {showChange && (
              <div className="card-panel p-3 text-center animate-fade-in">
                <p className="text-xs text-[#a1a1aa] mb-1">Change Due</p>
                <p className="text-2xl font-bold text-[#f4f4f5] font-mono">{changeDisplay}</p>
              </div>
            )}

            <NumericKeypad
              onInput={handleKeypadPress}
              onConfirm={handleCashConfirm}
              confirmLabel={isEnough ? 'Complete Sale' : `Need ${currencySymbol}${(Math.max(0, total - cashCents) / 100).toFixed(2)}`}
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