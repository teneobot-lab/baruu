import React, { useEffect, useState } from "react";
import {
  Package, ArrowDown, ArrowUp, ArrowLeftRight, AlertTriangle, Warehouse,
  TrendingUp, Loader2
} from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DashboardSummary {
  totalItems: number;
  totalWarehouses: number;
  totalPartners: number;
  totalTransactionsToday: number;
  totalInToday: number;
  totalOutToday: number;
  lowStockCount: number;
}

interface RecentTx {
  id: string;
  referenceNo: string;
  type: string;
  date: string;
  warehouseName: string;
  partnerName: string | null;
  itemCount: number;
}

interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  totalItems: number;
  totalQty: number;
}

interface LowStockItem {
  id: string;
  code: string;
  name: string;
  baseUnit: string;
  minStock: number;
  currentStock: number;
}

const TYPE_COLORS: Record<string, string> = {
  IN: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  OUT: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  TRANSFER: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ADJUSTMENT: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};
const TYPE_LABELS: Record<string, string> = {
  IN: "Masuk", OUT: "Keluar", TRANSFER: "Transfer", ADJUSTMENT: "Penyesuaian"
};

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", TYPE_COLORS[type] ?? "bg-muted text-muted-foreground")}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function StatCard({ label, value, unit, icon: Icon, color, bg, sub }: {
  label: string; value: number | string; unit: string;
  icon: React.ElementType; color: string; bg: string; sub: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex flex-col gap-3 stagger-item">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
        </div>
        <div className={`${bg} ${color} p-2.5 rounded-lg`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

export default function DashboardPage() {
  const { data: summary, loading: sLoading } = useApi<DashboardSummary>("/api/dashboard/summary");
  const { data: recentTx, loading: txLoading } = useApi<RecentTx[]>("/api/dashboard/recent-transactions");
  const { data: warehouses, loading: whLoading } = useApi<WarehouseStock[]>("/api/dashboard/stock-by-warehouse");
  const { data: lowStock } = useApi<LowStockItem[]>("/api/dashboard/low-stock");

  const statCards = [
    {
      label: "Total Barang",
      value: sLoading ? "..." : String(summary?.totalItems ?? 0),
      unit: "SKU",
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      sub: `${summary?.totalWarehouses ?? 0} gudang aktif`,
    },
    {
      label: "Barang Masuk Hari Ini",
      value: sLoading ? "..." : String(summary?.totalInToday ?? 0),
      unit: "transaksi",
      icon: ArrowDown,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      sub: `Total hari ini: ${summary?.totalTransactionsToday ?? 0}`,
    },
    {
      label: "Barang Keluar Hari Ini",
      value: sLoading ? "..." : String(summary?.totalOutToday ?? 0),
      unit: "transaksi",
      icon: ArrowUp,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      sub: `Mitra: ${summary?.totalPartners ?? 0} terdaftar`,
    },
    {
      label: "Stok Menipis",
      value: sLoading ? "..." : String(summary?.lowStockCount ?? 0),
      unit: "item",
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      sub: "Di bawah batas minimum",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl font-bold">Selamat Datang 👋</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Berikut ringkasan aktivitas gudang Anda hari ini.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Transaksi Terbaru</h3>
            {txLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="divide-y divide-border">
            {(recentTx ?? []).map(t => (
              <div key={t.id} className="px-5 py-3 flex items-center gap-4">
                <TypeBadge type={t.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-mono">{t.referenceNo}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.partnerName ?? "—"} · {t.itemCount} item
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                  <p className="text-xs font-medium">{t.warehouseName}</p>
                </div>
              </div>
            ))}
            {!txLoading && (!recentTx || recentTx.length === 0) && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Belum ada transaksi
              </div>
            )}
          </div>
        </div>

        {/* Warehouses */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Gudang Aktif</h3>
            {whLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="divide-y divide-border">
            {(warehouses ?? []).map(w => (
              <div key={w.warehouseId} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Warehouse className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{w.warehouseName}</p>
                  <p className="text-xs text-muted-foreground">{w.totalItems} SKU</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Aktif</span>
                  <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{formatNumber(w.totalQty)} unit</p>
                </div>
              </div>
            ))}
            {!whLoading && (!warehouses || warehouses.length === 0) && (
              <div className="px-5 py-6 text-center text-sm text-muted-foreground">Tidak ada gudang</div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock && lowStock.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-sm text-red-600 dark:text-red-400">
              Peringatan Stok Menipis ({lowStock.length} item)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-red-500/10">
                  <th className="text-left px-5 py-2.5 font-medium">Barang</th>
                  <th className="text-right px-4 py-2.5 font-medium">Stok Saat Ini</th>
                  <th className="text-right px-5 py-2.5 font-medium">Min. Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-500/10">
                {lowStock.map(item => (
                  <tr key={item.id} className="hover:bg-red-500/5">
                    <td className="px-5 py-2.5">
                      <span className="font-medium">{item.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground font-mono">{item.code}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-red-600 dark:text-red-400 font-bold">
                      {formatNumber(item.currentStock)} {item.baseUnit}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
                      {formatNumber(item.minStock)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
