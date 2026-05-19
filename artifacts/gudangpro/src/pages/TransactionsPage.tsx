import React, { useState } from "react";
import { Plus, Search, Eye, X, ArrowDown, ArrowUp, ArrowLeftRight, Sliders } from "lucide-react";
import { formatDate, formatNumber, cn } from "@/lib/utils";
import { TransactionForm, type TxType, type TxFormData } from "@/components/TransactionForm";

const TYPE_LABELS: Record<TxType, string> = {
  IN: "Masuk", OUT: "Keluar", TRANSFER: "Transfer", ADJUSTMENT: "Penyesuaian"
};
const TYPE_COLORS: Record<TxType, string> = {
  IN: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  OUT: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  TRANSFER: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ADJUSTMENT: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};
const TYPE_ICONS: Record<TxType, React.ElementType> = {
  IN: ArrowDown, OUT: ArrowUp, TRANSFER: ArrowLeftRight, ADJUSTMENT: Sliders
};

interface SavedTx {
  id: string;
  refNo: string;
  type: TxType;
  date: string;
  warehouseName: string;
  destWarehouseName?: string;
  partnerName: string;
  itemCount: number;
  total: number;
}

const MOCK_TX: SavedTx[] = [
  {
    id: "tx-001",
    refNo: "IN-20260519-0001",
    type: "IN",
    date: "2026-05-19",
    warehouseName: "Gudang Utama",
    partnerName: "PT Maju Jaya Supplier",
    itemCount: 2,
    total: 2080000,
  },
];

function TypeBadge({ type }: { type: TxType }) {
  const Icon = TYPE_ICONS[type];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", TYPE_COLORS[type])}>
      <Icon className="w-3 h-3" />
      {TYPE_LABELS[type]}
    </span>
  );
}

function DetailModal({ tx, onClose }: { tx: SavedTx; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold font-mono text-sm">{tx.refNo}</h3>
            <div className="mt-0.5"><TypeBadge type={tx.type} /></div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-y-2">
            <span className="text-muted-foreground">Tanggal</span>
            <span className="font-medium">{formatDate(tx.date)}</span>
            <span className="text-muted-foreground">Gudang</span>
            <span className="font-medium">{tx.warehouseName}{tx.destWarehouseName ? ` → ${tx.destWarehouseName}` : ""}</span>
            {tx.partnerName && (<><span className="text-muted-foreground">Mitra</span><span className="font-medium">{tx.partnerName}</span></>)}
            <span className="text-muted-foreground">Jumlah Item</span>
            <span className="font-medium">{tx.itemCount} item</span>
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-primary">Rp {formatNumber(tx.total)}</span>
          </div>
        </div>
      </div>
    </div>
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
      refNo: data.refNo,
      type: data.type,
      date: data.date,
      warehouseName: data.warehouseName,
      ...(data.destWarehouseName ? { destWarehouseName: data.destWarehouseName } : {}),
      partnerName: data.partnerName || "—",
      itemCount: data.items.length,
      total,
    };
    setTransactions(prev => [saved, ...prev]);
    setShowForm(null);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Transaksi</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{transactions.length} total transaksi</p>
        </div>
        {/* Transaction type buttons */}
        <div className="flex gap-2 flex-wrap">
          {(["IN", "OUT", "TRANSFER", "ADJUSTMENT"] as TxType[]).map(t => {
            const Icon = TYPE_ICONS[t];
            const clr: Record<TxType, string> = {
              IN:         "hover:border-emerald-400 hover:text-emerald-600",
              OUT:        "hover:border-orange-400  hover:text-orange-600",
              TRANSFER:   "hover:border-blue-400    hover:text-blue-600",
              ADJUSTMENT: "hover:border-purple-400  hover:text-purple-600",
            };
            return (
              <button
                key={t}
                onClick={() => setShowForm(t)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-card border border-border rounded-lg transition-colors text-muted-foreground",
                  clr[t]
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari referensi, gudang, mitra..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([["ALL", "Semua"], ...Object.entries(TYPE_LABELS)] as [string, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterType(val as TxType | "ALL")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                filterType === val
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium">No. Dokumen</th>
                <th className="text-left px-4 py-3 font-medium">Tipe</th>
                <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium">Gudang</th>
                <th className="text-left px-4 py-3 font-medium">Mitra</th>
                <th className="text-right px-4 py-3 font-medium">Item</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-muted/20 transition-colors stagger-item">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs font-medium">{tx.refNo}</span>
                  </td>
                  <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3 text-sm">
                    {tx.warehouseName}
                    {tx.destWarehouseName && (
                      <span className="text-muted-foreground"> → {tx.destWarehouseName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{tx.partnerName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{tx.itemCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-sm">
                    Rp {formatNumber(tx.total)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setViewTx(tx)}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Tidak ada transaksi ditemukan</p>
                    <p className="text-xs mt-1">Klik tombol di atas untuk membuat transaksi baru</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form modal — Accurate Desktop 5 style */}
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
