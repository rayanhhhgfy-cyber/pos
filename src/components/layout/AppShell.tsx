import { useState, useEffect } from 'react';
import { useUIStore, TabId } from '../../stores/uiStore';
import { useConfigStore } from '../../stores/configStore';
import { useCartStore } from '../../stores/cartStore';
import { useLangStore } from '../../stores/langStore';
import { posDB } from '../../db';
import {
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  Bell,
  Wifi,
  WifiOff,
  Languages,
} from 'lucide-react';

const tabs: { id: TabId; labelKey: 'pos' | 'inventory' | 'analytics' | 'settings'; icon: typeof ShoppingCart; shortcut: string }[] = [
  { id: 'pos', labelKey: 'pos', icon: ShoppingCart, shortcut: 'F1' },
  { id: 'inventory', labelKey: 'inventory', icon: Package, shortcut: 'F2' },
  { id: 'analytics', labelKey: 'analytics', icon: BarChart3, shortcut: 'F3' },
  { id: 'settings', labelKey: 'settings', icon: Settings, shortcut: 'F6' },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const store = useConfigStore((s) => s.config);
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const t = useLangStore((s) => s.t);
  const dir = useLangStore((s) => s.dir);
  const [time, setTime] = useState(new Date());
  const [lowStockCount, setLowStockCount] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const cartItems = useCartStore((s) => s.items);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const loadLowStock = async () => {
      try {
        const count = await posDB.products.filter((p) => p.stock < 5).count();
        setLowStockCount(count);
      } catch {
        /* db may not be ready */
      }
    };
    loadLowStock();
    const stockInterval = setInterval(loadLowStock, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(stockInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setActiveTab('pos');
      }
      if (e.key === 'F2' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setActiveTab('inventory');
      }
      if (e.key === 'F3' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setActiveTab('analytics');
      }
      if (e.key === 'F6' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setActiveTab('settings');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  const totalCartItems = cartItems.reduce((a, i) => a + i.quantity, 0);

  const timeStr = time.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className="flex flex-col h-full" dir={dir}>
      {/* Top Bar */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-[#18181b]/90 border-b border-[#27272a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#059669] to-[#0f766e] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-[#f4f4f5] tracking-wider uppercase">
              {store.storeName}
            </span>
          </div>
          <span className="text-[#52525b] text-xs">|</span>
          <span className="text-[#a1a1aa] text-xs font-mono tabular-nums">{timeStr}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-[#f4f4f5] transition-all text-xs"
            title={`Switch to ${lang === 'en' ? 'Arabic' : 'English'}`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>

          {lowStockCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#b91c1c] to-[#9f1239] text-white text-xs font-bold">
              <Bell className="w-3 h-3" />
              <span>{lowStockCount}</span>
            </div>
          )}
          {totalCartItems > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#059669]/20 text-[#34d399] text-xs font-bold">
              <ShoppingCart className="w-3 h-3" />
              <span>{totalCartItems}</span>
            </div>
          )}
          <div className="flex items-center">
            {online ? (
              <Wifi className="w-3.5 h-3.5 text-[#059669]" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-[#a1a1aa]" />
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-16 lg:w-56 flex-shrink-0 bg-[#18181b]/50 border-r border-[#27272a] p-2 flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const label = t[tab.labelKey] || tab.labelKey;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab ${isActive ? 'active' : ''}`}
                title={`${label} (${tab.shortcut})`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden lg:block text-sm">{label}</span>
                <span className="hidden lg:block ml-auto text-[10px] text-[#52525b]">
                  {tab.shortcut}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;