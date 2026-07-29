import { useEffect, useCallback, lazy, Suspense } from 'react';
import { useConfigStore } from './stores/configStore';
import { useUIStore } from './stores/uiStore';
import { useCartStore } from './stores/cartStore';
import { setScannerCallback } from './utils/scanner';
import { posDB, restoreFromLocalBackupIfEmpty } from './db';
import { playSuccess, playError } from './utils/audio';

import AppShell from './components/layout/AppShell';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import POSView from './components/pos/POSView';
import InventoryView from './components/inventory/InventoryView';
import AnalyticsView from './components/analytics/AnalyticsView';
import SettingsView from './components/settings/SettingsView';
import ScannerProvider from './components/scanner/ScannerProvider';

function App() {
  const loadConfig = useConfigStore((s) => s.loadConfig);
  const isLoading = useConfigStore((s) => s.isLoading);
  const showOnboarding = useConfigStore((s) => s.showOnboarding);
  const activeTab = useUIStore((s) => s.activeTab);
  const loadSavedCart = useCartStore((s) => s.loadSavedCart);

  useEffect(() => {
    const init = async () => {
      await restoreFromLocalBackupIfEmpty();
      try {
        const existingRule = await posDB.bulk_discounts.get({ barcode: '8901234567890' });
        if (!existingRule) {
          await posDB.bulk_discounts.add({
            barcode: '8901234567890',
            minQuantity: 10,
            discountPercentage: 15,
          });
        }
      } catch (e) {
        /* ignore */
      }
      await useCartStore.getState().loadBulkDiscountRules();
      await loadConfig();
      await loadSavedCart();
    };
    init();
  }, [loadConfig, loadSavedCart]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const items = useCartStore.getState().items;
      if (items.length > 0) {
        posDB.parked_carts.put({
          id: 'active_cart' as any,
          items,
          createdAt: Date.now(),
          name: 'Auto-saved Cart',
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleBarcode = useCallback(async (barcode: string) => {
    const product = await posDB.products.get({ barcode });
    if (product && product.id) {
      useCartStore.getState().addItem(
        product.barcode,
        product.name,
        product.price,
        product.costPrice,
        product.id
      );
      playSuccess();
    } else {
      playError();
      useUIStore.getState().openModal('quick_add_product', { barcode });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#059669] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#a1a1aa] text-sm">Loading POS Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <ScannerProvider onBarcode={handleBarcode}>
      <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-[#18181b] via-[#0c0a09] to-[#0a0a0a] overflow-hidden">
        {showOnboarding && <OnboardingWizard />}
        <AppShell>
          {activeTab === 'pos' && <POSView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'settings' && <SettingsView />}
        </AppShell>
      </div>
    </ScannerProvider>
  );
}

const posDBStore = { get: (id: number) => posDB.config.get(id) };

export default App;