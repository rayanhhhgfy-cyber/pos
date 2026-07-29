import { useState, useRef } from 'react';
import { useConfigStore } from '../../stores/configStore';
import { useLangStore } from '../../stores/langStore';
import { exportDatabase, importDatabase, wipeAllData } from '../../utils/backup';
import { usePWAInstall } from '../../utils/pwa';
import { posDB, triggerLocalBackup } from '../../db';
import { useCartStore } from '../../stores/cartStore';
import { playSuccess } from '../../utils/audio';
import {
  Download,
  Upload,
  Trash2,
  Save,
  Shield,
  AlertTriangle,
  FileText,
  DownloadCloud,
  CheckCircle,
  Languages,
  Plus,
} from 'lucide-react';

function SettingsView() {
  const config = useConfigStore((s) => s.config);
  const saveConfig = useConfigStore((s) => s.saveConfig);
  const formatCurrency = useConfigStore((s) => s.formatCurrency);

  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const t = useLangStore((s) => s.t);

  const [storeName, setStoreName] = useState(config.storeName);
  const [bulkRules, setBulkRules] = useState<any[]>([]);
  const [newRuleBarcode, setNewRuleBarcode] = useState('');
  const [newRuleMinQty, setNewRuleMinQty] = useState('10');
  const [newRulePct, setNewRulePercentage] = useState('15');

  useState(() => {
    posDB.bulk_discounts.toArray().then((rules) => {
      setBulkRules(rules);
    });
  });

  const handleAddBulkRule = async () => {
    if (!newRuleBarcode) return;
    try {
      await posDB.bulk_discounts.put({
        barcode: newRuleBarcode.trim(),
        minQuantity: parseInt(newRuleMinQty, 10) || 10,
        discountPercentage: parseFloat(newRulePct) || 15
      });
      const rules = await posDB.bulk_discounts.toArray();
      setBulkRules(rules);
      await useCartStore.getState().loadBulkDiscountRules();
      await triggerLocalBackup();
      setNewRuleBarcode('');
      alert(lang === 'ar' ? 'تمت إضافة قاعدة الخصم التلقائي!' : 'Automatic discount rule added successfully!');
    } catch {
      /* ignore */
    }
  };

  const handleDeleteBulkRule = async (id: number) => {
    try {
      await posDB.bulk_discounts.delete(id);
      const rules = await posDB.bulk_discounts.toArray();
      setBulkRules(rules);
      await useCartStore.getState().loadBulkDiscountRules();
      await triggerLocalBackup();
    } catch {
      /* ignore */
    }
  };
  const [currencySymbol, setCurrencySymbol] = useState(config.currencySymbol);
  const [taxRate, setTaxRate] = useState(String(config.taxRate));
  const [receiptHeader, setReceiptHeader] = useState(config.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(config.receiptFooter);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [wipeProgress, setWipeProgress] = useState(false);

  const { isInstallable, isInstalled, install } = usePWAInstall();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = async () => {
    setSaving(true);
    await saveConfig({
      storeName: storeName.trim() || 'POS Terminal',
      currencySymbol: currencySymbol || '$',
      taxRate: parseFloat(taxRate) || 0,
      receiptHeader,
      receiptFooter,
    });
    playSuccess();
    setSaving(false);
  };

  const handleExport = async () => {
    await exportDatabase();
    playSuccess();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importDatabase(file);
      setImportResult(`Imported ${result.products} products and ${result.sales} sales`);
      playSuccess();
    } catch (err: any) {
      setImportResult(`Error: ${err.message}`);
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleWipe = async () => {
    if (wipeConfirmText !== 'DELETE') return;
    setWipeProgress(true);
    await wipeAllData();
    useCartStore.getState().clearCart();
    setShowWipeConfirm(false);
    setWipeConfirmText('');
    setWipeProgress(false);
    playSuccess();
    alert('All data has been wiped. The app will reset on next load.');
    window.location.reload();
  };

  const handlePrintDailyReport = async () => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const sales = await posDB.sales_history.filter((s) => s.timestamp >= todayStart).toArray();

    let totalRevenue = 0;
    let totalTax = 0;
    let totalItems = 0;
    const paymentMethods: Record<string, number> = { cash: 0, card: 0, mobile_pay: 0, visa: 0 };

    for (const sale of sales) {
      totalRevenue += sale.total;
      totalTax += sale.taxAmount;
      for (const item of sale.items) {
        totalItems += item.quantity;
      }
      paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + 1;
    }

    const reportTitle = t.dailyReport;
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;
    reportWindow.document.write(`
      <html><head><title>${reportTitle}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; max-width: 80mm; margin: 0 auto; }
        h1 { text-align: center; font-size: 16px; text-transform: uppercase; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; }
        .total { font-weight: bold; font-size: 14px; }
        @media print { body { padding: 0; } }
      </style></head><body>
        <h1>${config.storeName}</h1>
        <p style="text-align:center">${reportTitle}</p>
        <div class="divider"></div>
        <div class="row"><span>Sales Count</span><span>${sales.length}</span></div>
        <div class="row"><span>Total Items Sold</span><span>${totalItems}</span></div>
        <div class="row"><span>Total Revenue</span><span>${formatCurrency(totalRevenue as any)}</span></div>
        <div class="row"><span>Total Tax</span><span>${formatCurrency(totalTax as any)}</span></div>
        <div class="divider"></div>
        <div class="row"><span>Cash Transactions</span><span>${paymentMethods.cash || 0}</span></div>
        <div class="row"><span>Card Transactions</span><span>${paymentMethods.card || 0}</span></div>
        <div class="row"><span>Visa Transactions</span><span>${paymentMethods.visa || 0}</span></div>
        <div class="row"><span>Mobile Pay</span><span>${paymentMethods.mobile_pay || 0}</span></div>
        <div class="divider"></div>
        <div class="row total"><span>Total Revenue</span><span>${formatCurrency(totalRevenue as any)}</span></div>
        <p style="text-align:center;margin-top:16px;font-size:10px;">${config.receiptFooter}</p>
        <script>window.print();</script>
      </body></html>
    `);
    reportWindow.document.close();
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">
      <h1 className="text-lg font-bold tracking-wide text-[#f4f4f5] flex-shrink-0">
        {t.settings}
      </h1>

      {/* Language Selector */}
      <div className="card-panel p-4">
        <h2 className="text-sm font-bold text-[#f4f4f5] mb-3">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            Language / اللغة
          </div>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setLang('en')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              lang === 'en'
                ? 'bg-[#059669] text-white'
                : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang('ar')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              lang === 'ar'
                ? 'bg-[#059669] text-white'
                : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'
            }`}
          >
            العربية
          </button>
        </div>
      </div>

      {/* Store Configuration */}
      <div className="card-panel p-4">
        <h2 className="text-sm font-bold text-[#f4f4f5] mb-3">{t.storeConfig}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#a1a1aa] mb-1">{t.storeName}</label>
            <input className="input-pos w-full" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#a1a1aa] mb-1">{t.currencySymbol}</label>
              <input className="input-pos w-full" value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} maxLength={3} />
            </div>
            <div>
              <label className="block text-xs text-[#a1a1aa] mb-1">{t.taxRate}</label>
              <input className="input-pos w-full" type="number" step="0.1" min="0" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#a1a1aa] mb-1">{t.receiptHeader}</label>
            <input className="input-pos w-full" value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-[#a1a1aa] mb-1">{t.receiptFooter}</label>
            <input className="input-pos w-full" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} />
          </div>
          <button onClick={handleSaveSettings} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
            <Save className="w-4 h-4" />
            {saving ? t.saving : t.saveSettings}
          </button>
        </div>
      </div>

      {/* Automatic Bulk Quantity Discounts */}
      <div className="card-panel p-4">
        <h2 className="text-sm font-bold text-[#f4f4f5] mb-3">
          {lang === 'ar' ? 'الخصومات التلقائية للكميات الكبيرة' : 'Automatic Bulk Quantity Discounts'}
        </h2>
        <p className="text-xs text-[#a1a1aa] mb-3">
          {lang === 'ar'
            ? 'قم بإعداد نسبة خصم تلقائية لمنتج معين عند شراء كمية محددة أو أكثر (مثل خصم 15% على الحليب عند شراء 10 عبوات).'
            : 'Apply an automatic percentage discount on a specific product when purchased in bulk (e.g. 15% off Fresh Whole Milk for 10+ units).'}
        </p>

        {/* Existing Rules List */}
        <div className="space-y-2 mb-4">
          {bulkRules.length === 0 ? (
            <p className="text-xs text-[#52525b] italic">
              {lang === 'ar' ? 'لا توجد قواعد خصم مضافة.' : 'No bulk discount rules configured yet.'}
            </p>
          ) : (
            bulkRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#18181b] border border-[#27272a]">
                <div className="text-xs">
                  <span className="font-mono font-bold text-[#f4f4f5]">{rule.barcode}</span>
                  <span className="text-[#a1a1aa] mx-1.5">|</span>
                  <span className="text-[#34d399] font-semibold">
                    {lang === 'ar'
                      ? `كمية ≥ ${rule.minQuantity} ← خصم %${rule.discountPercentage}`
                      : `Qty ≥ ${rule.minQuantity} ← ${rule.discountPercentage}% Discount`}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteBulkRule(rule.id!)}
                  className="p-1 rounded-md hover:bg-[#b91c1c]/20 text-[#a1a1aa] hover:text-[#fca5a5] transition-colors"
                  title={lang === 'ar' ? 'حذف' : 'Delete'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Rule Form */}
        <div className="space-y-3 pt-3 border-t border-[#27272a]">
          <h3 className="text-xs font-bold text-[#f4f4f5]">
            {lang === 'ar' ? 'إضافة قاعدة جديدة' : 'Add New Bulk Rule'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-[#a1a1aa] mb-1">
                {lang === 'ar' ? 'باركود المنتج' : 'Product Barcode'}
              </label>
              <input
                className="input-pos w-full text-xs font-mono"
                value={newRuleBarcode}
                onChange={(e) => setNewRuleBarcode(e.target.value)}
                placeholder="e.g. 8901234567890"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#a1a1aa] mb-1">
                {lang === 'ar' ? 'الحد الأدنى للكمية' : 'Min Quantity'}
              </label>
              <input
                className="input-pos w-full text-xs font-mono"
                type="number"
                min="1"
                value={newRuleMinQty}
                onChange={(e) => setNewRuleMinQty(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#a1a1aa] mb-1">
                {lang === 'ar' ? 'نسبة الخصم (%)' : 'Discount Percentage (%)'}
              </label>
              <input
                className="input-pos w-full text-xs font-mono"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={newRulePct}
                onChange={(e) => setNewRulePercentage(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={handleAddBulkRule}
            disabled={!newRuleBarcode}
            className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'إضافة قاعدة الخصم' : 'Add Discount Rule'}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="card-panel p-4">
        <h2 className="text-sm font-bold text-[#f4f4f5] mb-3">{t.dataManagement}</h2>
        <div className="space-y-3">
          <button onClick={handleExport} className="btn-secondary text-sm flex items-center gap-2 w-full justify-start">
            <Download className="w-4 h-4" />
            {t.exportDb}
          </button>

          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="btn-secondary text-sm flex items-center gap-2 w-full justify-start"
            >
              <Upload className="w-4 h-4" />
              {importing ? t.importing : t.importDb}
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            {importResult && <p className="text-xs mt-1.5 text-[#34d399]">{importResult}</p>}
          </div>

          <button onClick={handlePrintDailyReport} className="btn-secondary text-sm flex items-center gap-2 w-full justify-start">
            <FileText className="w-4 h-4" />
            {t.printReport}
          </button>

          <div className="pt-2 border-t border-[#27272a]">
            <button onClick={() => setShowWipeConfirm(true)} className="btn-danger text-sm flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              {t.wipeData}
            </button>
            <p className="text-xs text-[#52525b] mt-1">{t.wipeWarning}</p>
          </div>
        </div>
      </div>

      {/* PWA Install */}
      <div className="card-panel p-4">
        <h2 className="text-sm font-bold text-[#f4f4f5] mb-3 flex items-center gap-2">
          <DownloadCloud className="w-4 h-4" />
          {t.installApp}
        </h2>
        <p className="text-xs text-[#a1a1aa] mb-3">{t.installAppDesc}</p>
        {isInstalled ? (
          <div className="flex items-center gap-2 text-[#34d399] text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>App is installed on this device</span>
          </div>
        ) : isInstallable ? (
          <button onClick={install} className="btn-primary text-sm flex items-center gap-2">
            <DownloadCloud className="w-4 h-4" />
            {t.install}
          </button>
        ) : (
          <p className="text-xs text-[#52525b]">
            To install: open browser menu → "Add to Home Screen" or "Install App"
          </p>
        )}
      </div>

      {/* Storage */}
      <div className="card-panel p-4">
        <h2 className="text-sm font-bold text-[#f4f4f5] mb-3">{t.storage}</h2>
        <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
          <Shield className="w-4 h-4 text-[#059669]" />
          <span>{t.storageInfo}</span>
        </div>
        <p className="text-xs text-[#52525b] mt-1">{t.storageDesc}</p>
      </div>

      {/* Wipe Confirm Modal */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 card-panel p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#b91c1c] to-[#9f1239] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#f4f4f5]">{t.wipeConfirm}</h3>
                <p className="text-xs text-[#a1a1aa] mt-0.5">{t.wipeWarning}</p>
              </div>
            </div>
            <p className="text-xs text-[#a1a1aa] mb-3">{t.typeDelete}</p>
            <input
              className="input-pos w-full text-center font-mono"
              value={wipeConfirmText}
              onChange={(e) => setWipeConfirmText(e.target.value)}
              placeholder={lang === 'ar' ? 'اكتب DELETE' : 'Type DELETE'}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowWipeConfirm(false); setWipeConfirmText(''); }} className="btn-secondary text-sm flex-1">
                {t.cancel}
              </button>
              <button onClick={handleWipe} disabled={wipeConfirmText !== 'DELETE' || wipeProgress} className="btn-danger text-sm flex-1">
                {wipeProgress ? t.wiping : t.wipeEverything}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsView;