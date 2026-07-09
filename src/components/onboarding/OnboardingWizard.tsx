import { useState } from 'react';
import { useConfigStore } from '../../stores/configStore';
import { seedSampleData } from '../../utils/seed';
import { playSuccess } from '../../utils/audio';
import {
  Store,
  ReceiptText,
  Package,
  ShoppingCart,
  BarChart3,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';

function OnboardingWizard() {
  const saveConfig = useConfigStore((s) => s.saveConfig);
  const completeOnboarding = useConfigStore((s) => s.completeOnboarding);
  const config = useConfigStore((s) => s.config);

  const [step, setStep] = useState(0);
  const [storeName, setStoreName] = useState(config.storeName);
  const [currency, setCurrency] = useState(config.currencySymbol);
  const [taxRate, setTaxRate] = useState(String(config.taxRate));
  const [receiptHeader, setReceiptHeader] = useState(config.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(config.receiptFooter);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const handleSave = async () => {
    await saveConfig({
      storeName: storeName.trim() || 'POS Terminal',
      currencySymbol: currency || '$',
      taxRate: parseFloat(taxRate) || 0,
      receiptHeader,
      receiptFooter,
    });
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const count = await seedSampleData();
      if (count > 0) {
        playSuccess();
        setSeeded(true);
      }
    } catch {
      /* ignore */
    }
    setSeeding(false);
  };

  const handleFinish = async () => {
    await handleSave();
    await completeOnboarding();
    playSuccess();
  };

  const steps = [
    {
      title: 'Welcome to POS Terminal',
      subtitle: 'Configure your store to get started',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#a1a1aa] mb-1.5">Store / Business Name</label>
            <input
              className="input-pos w-full"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="My Store"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#a1a1aa] mb-1.5">Currency Symbol</label>
              <input
                className="input-pos w-full"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="$"
                maxLength={3}
              />
            </div>
            <div>
              <label className="block text-xs text-[#a1a1aa] mb-1.5">Tax Rate (%)</label>
              <input
                className="input-pos w-full"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="5"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#a1a1aa] mb-1.5">Receipt Header Note</label>
            <input
              className="input-pos w-full"
              value={receiptHeader}
              onChange={(e) => setReceiptHeader(e.target.value)}
              placeholder="Thank you for your purchase!"
            />
          </div>
          <div>
            <label className="block text-xs text-[#a1a1aa] mb-1.5">Receipt Footer Note</label>
            <input
              className="input-pos w-full"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="Have a great day!"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'System Overview',
      subtitle: 'Quick tour of your POS interface',
      content: (
        <div className="space-y-4">
          <div className="card-panel p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#059669] to-[#0f766e] flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#f4f4f5]">POS Checkout</p>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Left panel: active cart & receipt preview. Right panel: search products & scan barcodes.
              </p>
            </div>
          </div>
          <div className="card-panel p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-[#1e293b] to-[#18181b] flex items-center justify-center flex-shrink-0 border border-[#27272a]">
              <Package className="w-4 h-4 text-[#e4e4e7]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#f4f4f5]">Inventory Management</p>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Add, edit, and manage stock. Low-stock items highlighted in red.
              </p>
            </div>
          </div>
          <div className="card-panel p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1e293b] flex items-center justify-center flex-shrink-0 border border-[#27272a]">
              <BarChart3 className="w-4 h-4 text-[#e4e4e7]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#f4f4f5]">Analytics Dashboard</p>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Track revenue, profit, transactions, and top-selling items in real-time.
              </p>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-[#059669]/10 border border-[#059669]/20">
            <p className="text-xs text-[#34d399]">
              <span className="font-bold">Keyboard Shortcuts:</span>{' '}
              F1=POS, F2=Inventory, F3=Analytics, F4=Scanner, F8=Checkout
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Ready to Go!',
      subtitle: 'Load sample products or start fresh',
      content: (
        <div className="space-y-5 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#059669] to-[#0f766e] flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm text-[#a1a1aa]">
            Your store is configured. Load sample products to test the system immediately, or start with an empty
            inventory.
          </p>
          {!seeded ? (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {seeding ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              Seed with 10 Sample Products
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[#34d399]">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">10 products loaded!</span>
            </div>
          )}
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 card-panel p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-8 bg-[#059669]'
                    : i < step
                    ? 'w-4 bg-[#059669]/50'
                    : 'w-4 bg-[#27272a]'
                }`}
              />
            ))}
          </div>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-[#52525b] hover:text-[#a1a1aa] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="my-5">
          <h2 className="text-lg font-bold text-[#f4f4f5]">{current.title}</h2>
          <p className="text-xs text-[#a1a1aa] mt-0.5">{current.subtitle}</p>
        </div>

        {current.content}

        <div className="flex justify-between mt-6 pt-4 border-t border-[#27272a]">
          <button
            onClick={async () => {
              await handleSave();
              await completeOnboarding();
            }}
            className="text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors"
          >
            Skip setup
          </button>
          <div className="flex gap-2">
            {step < steps.length - 1 ? (
              <button
                onClick={async () => {
                await handleSave();
                  setStep((s) => s + 1);
                }}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleFinish} className="btn-primary text-sm flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Start Using POS
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;