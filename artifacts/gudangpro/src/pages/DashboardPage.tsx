import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Package, ArrowDown, ArrowUp, ArrowLeftRight, AlertTriangle, Warehouse, Loader2,
} from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassCardSubtle } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassCardSkeleton } from "@/components/ui/GlassSkeleton";
import type {
  DashboardSummary,
  TransactionSummary,
  WarehouseStockSummary,
  LowStockItem,
} from "@workspace/api-client-react";

const TYPE_LABELS: Record<string, string> = {
  IN: "Masuk", OUT: "Keluar", TRANSFER: "Transfer", ADJUSTMENT: "Penyesuaian",
};

function StatCard({
  label, value, unit, icon: Icon, accentColor, section,
}: {
  label: string; value: number | string; unit: string;
  icon: React.ElementType; accentColor: string; section: string;
}) {
  return (
    <GlassCard style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            color: "#94a3b8",
            marginBottom: 4,
          }}>
            {label}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#1e2d40", letterSpacing: "-0.5px" }}>
              {value}
            </span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{unit}</span>
          </div>
        </div>
        <div style={{
          width: 40,
          height: 40,
          background: accentColor,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={18} color="#ffffff" />
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>{section}</div>
    </GlassCard>
  );
}

export default function DashboardPage() {
  const { data: summary, isLoading: sLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary"],
    queryFn: () => apiClient.get<DashboardSummary>("/api/dashboard/summary"),
  });
  const { data: recentTx, isLoading: txLoading } = useQuery<TransactionSummary[]>({
    queryKey: ["dashboard", "recent-transactions"],
    queryFn: () => apiClient.get<TransactionSummary[]>("/api/dashboard/recent-transactions"),
  });
  const { data: warehouses, isLoading: whLoading } = useQuery<WarehouseStockSummary[]>({
    queryKey: ["dashboard", "stock-by-warehouse"],
    queryFn: () => apiClient.get<WarehouseStockSummary[]>("/api/dashboard/stock-by-warehouse"),
  });
  const { data: lowStock } = useQuery<LowStockItem[]>({
    queryKey: ["dashboard", "low-stock"],
    queryFn: () => apiClient.get<LowStockItem[]>("/api/dashboard/low-stock"),
  });

  return (
    <div className="glass-page-enter" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e2d40", letterSpacing: "-0.3px", margin: "0 0 4px" }}>
          Selamat Datang 👋
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          Berikut ringkasan aktivitas gudang Anda hari ini.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="Total Barang" value={sLoading ? "..." : String(summary?.totalItems ?? 0)} unit="SKU" icon={Package} accentColor="rgba(59,130,246,0.85)" section={`${summary?.totalWarehouses ?? 0} gudang aktif`} />
        <StatCard label="Barang Masuk Hari Ini" value={sLoading ? "..." : String(summary?.totalInToday ?? 0)} unit="transaksi" icon={ArrowDown} accentColor="rgba(16,185,129,0.85)" section={`Total hari ini: ${summary?.totalTransactionsToday ?? 0}`} />
        <StatCard label="Barang Keluar Hari Ini" value={sLoading ? "..." : String(summary?.totalOutToday ?? 0)} unit="transaksi" icon={ArrowUp} accentColor="rgba(249,115,22,0.85)" section={`Mitra: ${summary?.totalPartners ?? 0} terdaftar`} />
        <StatCard label="Stok Menipis" value={sLoading ? "..." : String(summary?.lowStockCount ?? 0)} unit="item" icon={AlertTriangle} accentColor="rgba(239,68,68,0.85)" section="Di bawah batas minimum" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Recent Transactions */}
        <GlassCard style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(148,163,184,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40", margin: 0 }}>Transaksi Terbaru</h3>
            {txLoading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: "#94a3b8" }} />}
          </div>
          <div>
            {txLoading ? (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <GlassCardSkeleton lines={4} />
              </div>
            ) : (!recentTx || recentTx.length === 0) ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                Belum ada transaksi
              </div>
            ) : (
              recentTx.map(t => (
                <div key={t.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(148,163,184,0.10)",
                  transition: "background 0.15s ease",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(226,232,240,0.5)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <GlassBadge type={t.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40", fontFamily: "'DM Sans', monospace" }}>
                      {t.referenceNo}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.partnerName ?? "—"} · {t.itemCount ?? 0} item
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{formatDate(t.date)}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#334155" }}>{t.warehouseName}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Warehouses */}
        <GlassCard style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(148,163,184,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40", margin: 0 }}>Gudang Aktif</h3>
            {whLoading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite", color: "#94a3b8" }} />}
          </div>
          <div>
            {whLoading ? (
              <div style={{ padding: 16 }}><GlassCardSkeleton lines={3} /></div>
            ) : (!warehouses || warehouses.length === 0) ? (
              <div style={{ padding: "24px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                Tidak ada gudang
              </div>
            ) : (
              warehouses.map(w => (
                <div key={w.warehouseId} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(148,163,184,0.10)",
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    background: "rgba(59,130,246,0.12)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Warehouse size={16} color="#1e3a5f" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {w.warehouseName}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{w.totalItems} SKU</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <GlassBadge type="ACTIVE" label="Aktif" />
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{formatNumber(w.totalQty)} unit</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Low Stock Alert */}
      {lowStock && lowStock.length > 0 && (
        <GlassCard style={{ padding: 0, overflow: "hidden", border: "1px solid rgba(239,68,68,0.2)", boxShadow: "0 4px 24px rgba(239,68,68,0.08)" }}>
          <div style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(239,68,68,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <AlertTriangle size={16} color="#dc2626" />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", margin: 0 }}>
              Peringatan Stok Menipis ({lowStock.length} item)
            </h3>
          </div>
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(239,68,68,0.10)" }}>
                <th style={{ textAlign: "left", padding: "10px 20px", fontWeight: 600, color: "#94a3b8", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>Barang</th>
                <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600, color: "#94a3b8", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>Stok Saat Ini</th>
                <th style={{ textAlign: "right", padding: "10px 20px", fontWeight: 600, color: "#94a3b8", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>Min. Stok</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid rgba(239,68,68,0.08)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "10px 20px" }}>
                    <span style={{ fontWeight: 600, color: "#1e2d40" }}>{item.name}</span>
                    <span style={{ marginLeft: 8, fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans', monospace" }}>{item.code}</span>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800, color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                    {formatNumber(item.currentStock ?? 0)} {item.baseUnit}
                  </td>
                  <td style={{ padding: "10px 20px", textAlign: "right", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
                    {formatNumber(item.minStock)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}