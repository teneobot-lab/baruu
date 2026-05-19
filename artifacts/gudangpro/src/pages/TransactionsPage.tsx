import React, { useState } from "react";
import { Plus, Search, Filter, ArrowDown, ArrowUp, ArrowLeftRight, Sliders, Eye, X, ChevronDown } from "lucide-react";
import { formatDate, formatNumber, generateRefNo, cn } from "@/lib/utils";

type TxType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";

interface TxItem {
  item_id: string;
  item_name: string;
  unit: string;
  qty: number;
  base_qty: number;
}

interface Transaction {
  id: string;
  reference_no: string;
  type: TxType;
  date: string;
  warehouse: string;
  dest_warehouse?: string;
  partner?: string;
  notes?: string;
  items: TxItem[];
}

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

const WAREHOUSES = ["Gudang Utama", "Gudang Cabang Selatan"];
const ITEMS = [
  { id: "item-001", name: "Air Mineral 600ml", units: ["BOTOL", "DUS"] },
  { id: "item-002", name: "Mie Instant Goreng", units: ["PCS", "DUS"] },
  { id: "item-003", name: "Sabun Mandi Batang", units: ["BATANG", "LUSIN"] },
];

const MOCK_TX: Transaction[] = [
  {
    id: "tx-001", reference_no: "IN-20260519-0001", type: "IN",
    date: "2026-05-19", warehouse: "Gudang Utama", partner: "PT Maju Jaya Supplier",
    notes: "Penerimaan barang minggu ini",
    items: [
      { item_id: "item-001", item_name: "Air Mineral 600ml", unit: "DUS", qty: 20, base_qty: 480 },
      { item_id: "item-002", item_name: "Mie Instant Goreng", unit: "DUS", qty: 5, base_qty: 200 },
    ]
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

function DetailModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold font-mono text-sm">{tx.reference_no}</h3>
            <TypeBadge type={tx.type} />
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Tanggal:</span> <span className="font-medium">{formatDate(tx.date)}</span></div>
            <div><span className="text-muted-foreground">Gudang:</span> <span className="font-medium">{tx.warehouse}</span></div>
            {tx.dest_warehouse && <div><span className="text-muted-foreground">Tujuan:</span> <span className="font-medium">{tx.dest_warehouse}</span></div>}
            {tx.partner && <div className="col-span-2"><span className="text-muted-foreground">Mitra:</span> <span className="font-medium">{tx.partner}</span></div>}
            {tx.notes && <div className="col-span-2"><span className="text-muted-foreground">Catatan:</span> <span className="font-medium">{tx.notes}</span></div>}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Detail Barang</p>
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left py-1.5">Barang</th>
                <th className="text-right py-1.5">Qty</th>
                <th className="text-right py-1.5">Base Qty</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {tx.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2">{item.item_name}</td>
                    <td className="py-2 text-right tabular-nums">{item.qty} {item.unit}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{item.base_qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TxFormModal({ type, onClose, onSave }: {
  type: TxType;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0]);
  const [destWarehouse, setDestWarehouse] = useState(WAREHOUSES[1]);
  const [partner, setPartner] = useState("");
  const [notes, setNotes] = useState("");
  const [txItems, setTxItems] = useState<TxItem[]>([
    { item_id: "item-001", item_name: "Air Mineral 600ml", unit: "BOTOL", qty: 1, base_qty: 1 }
  ]);

  const addItem = () => setTxItems(prev => [
    ...prev,
    { item_id: "item-001", item_name: "Air Mineral 600ml", unit: "BOTOL", qty: 1, base_qty: 1 }
  ]);

  const updateItem = (i: number, field: string, value: string | number) => {
    setTxItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [field]: value };
      if (field === "item_id") {
        const found = ITEMS.find(it => it.id === value);
        updated.item_name = found?.name ?? "";
        updated.unit = found?.units[0] ?? "PCS";
      }
      if (field === "qty") updated.base_qty = Number(value);
      return updated;
    }));
  };

  const handleSave = () => {
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      reference_no: generateRefNo(type),
      type, date, warehouse, notes,
      ...(type === "TRANSFER" ? { dest_warehouse: destWarehouse } : {}),
      ...(["IN", "OUT"].includes(type) && partner ? { partner } : {}),
      items: txItems,
    };
    onSave(tx);
  };

  const title = { IN: "Barang Masuk", OUT: "Barang Keluar", TRANSFER: "Transfer Stok", ADJUSTMENT: "Penyesuaian Stok" }[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-semibold">Buat Transaksi — {title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Tanggal</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Gudang</label>
              <select value={warehouse} onChange={e => setWarehouse(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring">
                {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          </div>
          {type === "TRANSFER" && (
            <div>
              <label className="block text-xs font-medium mb-1.5">Gudang Tujuan</label>
              <select value={destWarehouse} onChange={e => setDestWarehouse(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring">
                {WAREHOUSES.filter(w => w !== warehouse).map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
          )}
          {["IN", "OUT"].includes(type) && (
            <div>
              <label className="block text-xs font-medium mb-1.5">Mitra (Opsional)</label>
              <input value={partner} onChange={e => setPartner(e.target.value)} placeholder="Nama supplier/pelanggan..."
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium">Daftar Barang</label>
              <button onClick={addItem} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Tambah Baris
              </button>
            </div>
            <div className="space-y-2">
              {txItems.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={item.item_id}
                    onChange={e => updateItem(i, "item_id", e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ITEMS.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={e => updateItem(i, "qty", Number(e.target.value))}
                    className="w-20 px-2 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring text-right"
                    min={1}
                  />
                  <select
                    value={item.unit}
                    onChange={e => updateItem(i, "unit", e.target.value)}
                    className="w-24 px-2 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
                  >
                    {(ITEMS.find(it => it.id === item.item_id)?.units ?? ["PCS"]).map(u => <option key={u}>{u}</option>)}
                  </select>
                  {txItems.length > 1 && (
                    <button onClick={() => setTxItems(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Catatan opsional..."
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 sticky bottom-0 bg-card">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">Batal</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all">
            Simpan Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TX);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<TxType | "ALL">("ALL");
  const [showForm, setShowForm] = useState<TxType | null>(null);
  const [viewTx, setViewTx] = useState<Transaction | null>(null);

  const filtered = transactions.filter(tx =>
    (filterType === "ALL" || tx.type === filterType) &&
    (tx.reference_no.toLowerCase().includes(search.toLowerCase()) ||
      tx.warehouse.toLowerCase().includes(search.toLowerCase()) ||
      (tx.partner ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
    setShowForm(null);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Transaksi</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{transactions.length} total transaksi</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["IN", "OUT", "TRANSFER", "ADJUSTMENT"] as TxType[]).map(t => {
            const Icon = TYPE_ICONS[t];
            return (
              <button key={t} onClick={() => setShowForm(t)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-card border border-border rounded-lg hover:bg-accent transition-colors">
                <Icon className="w-3.5 h-3.5" />
                {TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari referensi, gudang, mitra..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-1.5">
          {([["ALL", "Semua"], ...Object.entries(TYPE_LABELS)] as [string, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setFilterType(val as TxType | "ALL")}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                filterType === val ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium">Referensi</th>
                <th className="text-left px-4 py-3 font-medium">Tipe</th>
                <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium">Gudang</th>
                <th className="text-left px-4 py-3 font-medium">Mitra</th>
                <th className="text-right px-4 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-muted/20 transition-colors stagger-item">
                  <td className="px-5 py-3 font-mono text-xs font-medium">{tx.reference_no}</td>
                  <td className="px-4 py-3"><TypeBadge type={tx.type} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3">
                    <span>{tx.warehouse}</span>
                    {tx.dest_warehouse && <span className="text-muted-foreground"> → {tx.dest_warehouse}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{tx.partner ?? "-"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{tx.items.length}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => setViewTx(tx)}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                  <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Tidak ada transaksi ditemukan</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <TxFormModal type={showForm} onClose={() => setShowForm(null)} onSave={handleSave} />}
      {viewTx && <DetailModal tx={viewTx} onClose={() => setViewTx(null)} />}
    </div>
  );
}
