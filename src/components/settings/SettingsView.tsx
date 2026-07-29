import { useState, useEffect, useRef } from 'react';
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
  X,
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
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    posDB.bulk_discounts.toArray().then((rules) => {
      setBulkRules(rules);
    });
  }, []);

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
          <DownloadCloud className="w-4 h-4 text-[#0284c7]" />
          {lang === 'ar' ? 'تحميل وتثبيت التطبيق' : 'Download & Install PWA App'}
        </h2>
        <p className="text-xs text-[#a1a1aa] mb-3">
          {lang === 'ar'
            ? 'قم بتنزيل نظام نقاط البيع على شاشتك الرئيسية ليعمل بشكل مستقل وبأقصى سرعة حتى بدون اتصال بالإنترنت.'
            : 'Download and install this POS terminal on your device. It runs at ultra-fast speeds and works entirely offline!'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <button
            onClick={() => {
              if (isInstallable) {
                install();
              }
              setShowInstallGuide(true);
            }}
            className="btn-primary text-sm flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0284c7] to-[#0369a1] border-none text-white hover:brightness-110 active:brightness-90 transition-all rounded-lg"
          >
            <DownloadCloud className="w-5 h-5 animate-bounce" />
            {lang === 'ar' ? 'تحميل التطبيق الآن' : 'Download & Install App Now'}
          </button>

          <button
            onClick={() => setShowInstallGuide(true)}
            className="text-xs text-[#38bdf8] hover:underline bg-transparent border-none cursor-pointer"
          >
            {lang === 'ar' ? 'كيفية التثبيت يدوياً؟' : 'How to install manually?'}
          </button>
        </div>
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

      {/* PWA Interactive Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="w-full max-w-md mx-4 card-panel p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#f4f4f5]">
                {lang === 'ar' ? 'دليل تثبيت التطبيق' : 'App Installation Guide'}
              </h3>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 rounded-lg hover:bg-[#27272a] text-[#a1a1aa] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-[#a1a1aa]">
                {lang === 'ar'
                  ? 'اتبع التعليمات أدناه لتثبيت التطبيق على جهازك وفقاً لنوع المتصفح:'
                  : 'Follow the instructions below to download and install this POS application based on your device:'}
              </p>

              {/* iOS / Apple Safari */}
              <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
                <h4 className="text-xs font-bold text-[#0284c7] mb-1.5 flex items-center gap-1.5">
                  📱 Safari (iOS / iPhone / iPad)
                </h4>
                <ol className="list-decimal list-inside text-xs text-[#e4e4e7] space-y-1">
                  {lang === 'ar' ? (
                    <>
                      <li>اضغط على زر <strong>مشاركة (Share)</strong> في أسفل الشاشة.</li>
                      <li>اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</li>
                      <li>اضغط على <strong>إضافة (Add)</strong> للتأكيد.</li>
                    </>
                  ) : (
                    <>
                      <li>Tap the <strong>Share</strong> button (box with an up-arrow) at the bottom.</li>
                      <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                      <li>Tap <strong>Add</strong> in the top-right corner to complete.</li>
                    </>
                  )}
                </ol>
              </div>

              {/* Chrome / Edge / Android */}
              <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
                <h4 className="text-xs font-bold text-[#059669] mb-1.5 flex items-center gap-1.5">
                  🌐 Google Chrome / Microsoft Edge (Android & Desktop)
                </h4>
                <ol className="list-decimal list-inside text-xs text-[#e4e4e7] space-y-1">
                  {lang === 'ar' ? (
                    <>
                      <li>اضغط على أيقونة <strong>التثبيت</strong> في شريط العنوان بالأعلى، أو زر القائمة ثلاثية النقاط.</li>
                      <li>اختر <strong>تثبيت التطبيق (Install App)</strong> أو إضافة إلى الشاشة الرئيسية.</li>
                    </>
                  ) : (
                    <>
                      <li>Click the <strong>Install</strong> icon in the address bar, or open the browser menu (3-dots).</li>
                      <li>Select <strong>Install App</strong> or Add to Home Screen.</li>
                    </>
                  )}
                </ol>
              </div>

              {/* Firefox */}
              <div className="p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
                <h4 className="text-xs font-bold text-[#ea580c] mb-1.5 flex items-center gap-1.5">
                  🦊 Mozilla Firefox
                </h4>
                <ol className="list-decimal list-inside text-xs text-[#e4e4e7] space-y-1">
                  {lang === 'ar' ? (
                    <>
                      <li>اضغط على زر القائمة في الزاوية.</li>
                      <li>اختر <strong>تثبيت (Install)</strong> أو إضافة إلى الشاشة الرئيسية.</li>
                    </>
                  ) : (
                    <>
                      <li>Open the Firefox browser menu.</li>
                      <li>Select <strong>Install</strong> or Add to Home Screen.</li>
                    </>
                  )}
                </ol>
              </div>
            </div>

            <div className="flex justify-end mt-5 pt-4 border-t border-[#27272a]">
              <button
                onClick={() => setShowInstallGuide(false)}
                className="btn-primary text-xs w-full py-2 bg-gradient-to-r from-[#059669] to-[#0f766e] border-none text-white font-bold rounded-lg"
              >
                {lang === 'ar' ? 'حسناً، فهمت' : 'Got it! Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsView;