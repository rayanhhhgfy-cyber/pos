import { useState, useEffect, useCallback } from 'react';
import { posDB } from '../../db';
import { useConfigStore } from '../../stores/configStore';
import { formatCents } from '../../utils/cents';
import type { Cents } from '../../types/cents';
import { DollarSign, TrendingUp, ShoppingBag, AlertTriangle } from 'lucide-react';

interface AnalyticsData {
  revenueToday: number;
  costToday: number;
  profitToday: number;
  transactionCount: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentSales: { id: number; total: number; timestamp: number; paymentMethod: string }[];
}

function AnalyticsView() {
  const formatCurrency = useConfigStore((s) => s.formatCurrency);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      const todaySales = await posDB.sales_history
        .filter((s) => s.timestamp >= todayStart)
        .toArray();

      const recentSales = await posDB.sales_history
        .orderBy('timestamp')
        .reverse()
        .limit(10)
        .toArray();

      let revenueToday = 0;
      let costToday = 0;
      const productSales = new Map<string, { quantity: number; revenue: number }>();

      for (const sale of todaySales) {
        revenueToday += sale.total;
        for (const item of sale.items) {
          costToday += item.costPrice * item.quantity;
          const existing = productSales.get(item.name) || { quantity: 0, revenue: 0 };
          existing.quantity += item.quantity;
          existing.revenue += item.lineTotal;
          productSales.set(item.name, existing);
        }
      }

      const profitToday = revenueToday - costToday;

      const topProducts = [...productSales.entries()]
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const lsCount = await posDB.products.filter((p) => p.stock < 5).count();
      setLowStockCount(lsCount);

      setData({
        revenueToday,
        costToday,
        profitToday,
        transactionCount: todaySales.length,
        topProducts,
        recentSales: recentSales.map((s) => ({
          id: s.id as number,
          total: s.total,
          timestamp: s.timestamp,
          paymentMethod: s.paymentMethod,
        })),
      });
    } catch {
      /* */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 10000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  if (loading || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">
      <h1 className="text-lg font-bold tracking-wide text-[#f4f4f5] flex-shrink-0">
        Analytics Dashboard
      </h1>

      {/* Widget Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-panel p-4 bg-gradient-to-br from-[#0891b2] to-[#1d4ed8]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/70">Revenue Today</span>
            <DollarSign className="w-4 h-4 text-white/70" />
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {formatCurrency(data.revenueToday as Cents)}
          </p>
          <p className="text-xs text-white/50 mt-1">{data.transactionCount} transactions</p>
        </div>

        <div className="card-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#a1a1aa]">Profit Today</span>
            <TrendingUp className="w-4 h-4 text-[#a1a1aa]" />
          </div>
          <p
            className={`text-2xl font-bold font-mono tabular-nums ${
              data.profitToday >= 0 ? 'text-[#34d399]' : 'text-[#fca5a5]'
            }`}
          >
            {formatCurrency(Math.max(0, data.profitToday) as Cents)}
          </p>
          <p className="text-xs text-[#52525b] mt-1">
            Cost: {formatCurrency(data.costToday as Cents)}
          </p>
        </div>

        <div className="card-panel p-4 bg-gradient-to-br from-[#78716c] to-[#525252]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/70">Transactions</span>
            <ShoppingBag className="w-4 h-4 text-white/70" />
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {data.transactionCount}
          </p>
          <p className="text-xs text-white/50 mt-1">Today</p>
        </div>

        <div className="card-panel p-4 bg-gradient-to-br from-[#b91c1c] to-[#9f1239]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/70">Low Stock Alert</span>
            <AlertTriangle className="w-4 h-4 text-white/70" />
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">{lowStockCount}</p>
          <p className="text-xs text-white/50 mt-1">Products below threshold</p>
        </div>
      </div>

      {/* Top Products + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-panel p-4">
          <h3 className="text-sm font-bold text-[#f4f4f5] mb-3">Top 5 Selling Items</h3>
          {data.topProducts.length === 0 ? (
            <p className="text-xs text-[#52525b]">No sales today</p>
          ) : (
            <div className="space-y-2">
              {data.topProducts.map((product, i) => {
                const maxQty = data.topProducts[0]?.quantity || 1;
                const barWidth = (product.quantity / maxQty) * 100;
                return (
                  <div key={product.name} className="flex items-center gap-3">
                    <span className="text-xs text-[#a1a1aa] w-4 text-right font-mono">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-[#f4f4f5] truncate">{product.name}</span>
                        <span className="text-[#a1a1aa] font-mono ml-2">x{product.quantity}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#059669] to-[#0f766e]"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-[#a1a1aa] font-mono w-16 text-right">
                      {formatCurrency(product.revenue as Cents)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card-panel p-4">
          <h3 className="text-sm font-bold text-[#f4f4f5] mb-3">Recent Sales</h3>
          {data.recentSales.length === 0 ? (
            <p className="text-xs text-[#52525b]">No sales recorded yet</p>
          ) : (
            <div className="space-y-1.5">
              {data.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#27272a]/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#a1a1aa] font-mono">#{sale.id}</span>
                    <span className="text-[10px] uppercase text-[#52525b]">{sale.paymentMethod}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#a1a1aa]">
                      {new Date(sale.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-xs font-bold text-[#f4f4f5] font-mono">
                      {formatCurrency(sale.total as Cents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsView;