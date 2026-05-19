import React, { useState } from "react";
import { Plus, Search, Eye, ArrowDown, ArrowUp, ArrowLeftRight, Sliders } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
import { TransactionForm, type TxType, type TxFormData } from "@/components/TransactionForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassModal } from "@/components/ui/GlassModal";

const TYPE_LABELS: Record<TxType, string> = {
  IN: "Masuk", OUT: "Keluar", TRANSFER: "Transfer", ADJUSTMENT: "Penyesuaian",
};

const TYPE_ACCENT: Record<TxType, string> = {
  IN:         "#16a34a",
  OUT:        "#c2410c",
  TRANSFER:   "#1d4ed8",
  ADJUSTMENT: "#6d28d9",
};

const TYPE_ICONS: Record<TxType, React.ElementType> = {
  IN: ArrowDown, OUT: ArrowUp, TRANSFER: ArrowLeftRight, ADJUSTMENT: Sliders,
};

interface SavedTx {
  id: string; refNo: string; type: TxType; date: string;
  warehouseName: string; destWarehouseName?: string;
  partnerName: string; itemCount: number; total: number;
}

const MOCK_TX: SavedTx[] = [
  { id: "tx-001", refNo: "IN-20260519-0001", type: "IN", date: "2026-05-19", warehouseName: "Gudang Utama", partnerName: "PT Maju Jaya Supplier", itemCount: 2, total: 2080000 },
];

function DetailModal({ tx, onClose }: { tx: SavedTx; onClose: () => void }) {
  const Icon = TYPE_ICONS[tx.type];
  return (
    <GlassModal
      open={true}
      onClose={onClose}
      title={tx.refNo}
      subtitle={`${TYPE_LABELS[tx.type]} · ${formatDate(tx.date)}`}
      maxWidth={420}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
        {([
          ["Tanggal", formatDate(tx.date)],
          ["Gudang", tx.warehouseName],
          tx.destWarehouseName ? (["Tujuan", tx.destWarehouseName] as [string, string]) : null,
          tx.partnerName ? (["Mitra", tx.partnerName] as [string, string]) : null,
          ["Jumlah Item", `${tx.itemCount} item`],
          ["Total", `Rp ${formatNumber(tx.total)}`],
        ] as ( [string, string] | null )[]).filter((item): item is [string, string] => item !== null).map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
            <span style={{ color: "#94a3b8" }}>{label}</span>
            <span style={{ fontWeight: 600, color: "#1e2d40" }}>{value}</span>
          </div>
        ))}
      </div>
    </GlassModal>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<SavedTx[]>(MOCK_TX);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<TxType | "ALL">("ALL");
  const [showForm, setShowForm] = useState<TxType | null>(null);
  const [viewTx, setViewTx] = useState<SavedTx | null>(null);

  const filtered = transactions.filter(tx =>
    (filterType === "ALL" || tx.type === filterType) &&
    (tx.refNo.toLowerCase().includes(search.toLowerCase()) ||
      tx.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
      tx.partnerName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = (data: TxFormData) => {
    const total = data.items.reduce((s, i) => s + i.total, 0);
    const saved: SavedTx = {
      id: `tx-${Date.now()}`,
      refNo: data.refNo, type: data.type, date: data.date,
      warehouseName: data.warehouseName,
      ...(data.destWarehouseName ? { destWarehouseName: data.destWarehouseName } : {}),
      partnerName: data.partnerName || "—",
      itemCount: data.items.length, total,
    };
    setTransactions(prev => [saved, ...prev]);
    setShowForm(null);
  };

  const TX_TYPES: TxType[] = ["IN", "OUT", "TRANSFER", "ADJUSTMENT"];
  const ALL_FILTERS: Array<[TxType | "ALL", string]> = [
    ["ALL", "Semua"], ...TX_TYPES.map(t => [t, TYPE_LABELS[t]] as [TxType, string]),
  ];

  return (
    <div className="glass-page-enter" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e2d40", letterSpacing: "-0.3px", margin: "0 0 4px" }}>Transaksi</h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{transactions.length} total transaksi</p>
        </div>
        {/* Transaction type buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {TX_TYPES.map(t => {
            const Icon = TYPE_ICONS[t];
            return (
              <button
                key={t}
                onClick={() => setShowForm(t)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.9)",
                  borderRadius: 12,
                  fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                  color: TYPE_ACCENT[t],
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  boxShadow: "0 2px 8px rgba(148,163,184,0.12)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(148,163,184,0.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(148,163,184,0.12)"; }}
              >
                <Icon size={14} />
                {TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari referensi, gudang, mitra..."
            style={{
              width: "100%",
              paddingLeft: 36,
              background: "rgba(255,255,255,0.65)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.9)",
              borderRadius: 12,
              padding: "10px 12px 10px 36px",
              fontSize: 13,
              color: "#1e2d40",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        {/* Filter pills */}
        <div style={{ display: "flex", gap: 6 }}>
          {ALL_FILTERS.map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterType(val as TxType | "ALL")}
              style={{
                padding: "7px 14px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                border: filterType === val ? "none" : "1px solid rgba(255,255,255,0.9)",
                background: filterType === val
                  ? "linear-gradient(135deg, #1e3a5f, #2d5a9e)"
                  : "rgba(255,255,255,0.65)",
                backdropFilter: "blur(12px)",
                color: filterType === val ? "#ffffff" : "#94a3b8",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                boxShadow: filterType === val ? "0 2px 8px rgba(30,58,95,0.25)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <GlassCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(148,163,184,0.08)" }}>
                {["No. Dokumen", "Tipe", "Tanggal", "Gudang", "Mitra", "Item", "Total"].map(h => (
                  <th key={h} style={{
                    textAlign: h === "Item" || h === "Total" ? "right" : "left",
                    padding: "12px 16px",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.05em",
                    color: "#94a3b8",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
                <th style={{ padding: "12px 16px" }} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <ArrowLeftRight size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>Tidak ada transaksi ditemukan</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Klik tombol di atas untuk membuat transaksi baru</p>
                  </td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id}
                    style={{
                      borderBottom: "1px solid rgba(148,163,184,0.08)",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(226,232,240,0.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontFamily: "'DM Sans', monospace", fontSize: 12, fontWeight: 600, color: "#1e3a5f" }}>
                        {tx.refNo}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <GlassBadge type={tx.type} />
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{formatDate(tx.date)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#334155" }}>
                      {tx.warehouseName}
                      {tx.destWarehouseName && <span style={{ color: "#94a3b8" }}> → {tx.destWarehouseName}</span>}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{tx.partnerName}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "#334155" }}>{tx.itemCount}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#1e3a5f" }}>
                      Rp {formatNumber(tx.total)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setViewTx(tx); }}
                        style={{
                          padding: "7px 9px",
                          background: "rgba(59,130,246,0.10)",
                          border: "1px solid rgba(59,130,246,0.15)",
                          borderRadius: 8,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          color: "#1e3a5f",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* TransactionForm modal */}
      {showForm && (
        <TransactionForm
          type={showForm}
          onClose={() => setShowForm(null)}
          onSave={handleSave}
        />
      )}

      {/* Detail modal */}
      {viewTx && <DetailModal tx={viewTx} onClose={() => setViewTx(null)} />}
    </div>
  );
}