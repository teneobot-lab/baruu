import React, { useState } from "react";
import { AlertTriangle, Plus, Search, Eye, X, ChevronRight } from "lucide-react";
import { formatDate, formatNumber, cn } from "@/lib/utils";

interface RejectBatch {
  id: string;
  batch_no: string;
  outlet: string;
  date: string;
  status: "PENDING" | "PROCESSED" | "DISPOSED";
  total_items: number;
  notes?: string;
  items: { name: string; code: string; qty: number; reason: string }[];
}

const STATUS_COLORS = {
  PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  PROCESSED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  DISPOSED: "bg-red-500/10 text-red-600 dark:text-red-400",
};
const STATUS_LABELS = {
  PENDING: "Menunggu", PROCESSED: "Diproses", DISPOSED: "Dibuang"
};

const MOCK_BATCHES: RejectBatch[] = [
  {
    id: "rj-001", batch_no: "RJ-20260519-0001",
    outlet: "Toko Berkah Abadi", date: "2026-05-19",
    status: "PENDING", total_items: 2,
    notes: "Barang rusak dari pengiriman",
    items: [
      { name: "Air Mineral 600ml", code: "BRG-001", qty: 12, reason: "Kemasan Rusak" },
      { name: "Mie Instant Goreng", code: "BRG-002", qty: 5, reason: "Kedaluwarsa" },
    ]
  },
];

const REJECT_REASONS = ["Kemasan Rusak", "Kedaluwarsa", "Cacat Produksi", "Basah/Lembab", "Lainnya"];

function DetailModal({ batch, onClose }: { batch: RejectBatch; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold font-mono text-sm">{batch.batch_no}</h3>
            <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-0.5", STATUS_COLORS[batch.status])}>
              {STATUS_LABELS[batch.status]}
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Tanggal:</span> <span className="font-medium">{formatDate(batch.date)}</span></div>
            <div><span className="text-muted-foreground">Outlet:</span> <span className="font-medium">{batch.outlet}</span></div>
            {batch.notes && <div className="col-span-2"><span className="text-muted-foreground">Catatan:</span> <span>{batch.notes}</span></div>}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Daftar Barang Reject</p>
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left py-1.5">Barang</th>
                <th className="text-right py-1.5">Qty</th>
                <th className="text-left py-1.5 pl-4">Alasan</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {batch.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2">
                      <div className="font-medium">{item.name}</div>
                      <code className="text-xs text-muted-foreground">{item.code}</code>
                    </td>
                    <td className="py-2 text-right tabular-nums font-semibold">{formatNumber(item.qty)}</td>
                    <td className="py-2 pl-4 text-muted-foreground text-xs">{item.reason}</td>
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

function CreateModal({ onClose, onSave }: { onClose: () => void; onSave: (b: RejectBatch) => void }) {
  const [outlet, setOutlet] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ name: "", code: "", qty: 1, reason: REJECT_REASONS[0] }]);

  const addItem = () => setItems(prev => [...prev, { name: "", code: "", qty: 1, reason: REJECT_REASONS[0] }]);

  const handleSave = () => {
    const batch: RejectBatch = {
      id: `rj-${Date.now()}`,
      batch_no: `RJ-${date.replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      outlet, date, notes, status: "PENDING",
      total_items: items.length, items,
    };
    onSave(batch);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="font-semibold">Buat Batch Reject</h3>
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
              <label className="block text-xs font-medium mb-1.5">Outlet / Toko</label>
              <input value={outlet} onChange={e => setOutlet(e.target.value)} placeholder="Nama outlet..."
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium">Barang Reject</label>
              <button onClick={addItem} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-center">
                <input value={item.code} onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, code: e.target.value } : it))}
                  placeholder="Kode" className="col-span-1 px-2 py-1.5 text-xs bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring" />
                <input value={item.name} onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, name: e.target.value } : it))}
                  placeholder="Nama barang" className="col-span-2 px-2 py-1.5 text-xs bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring" />
                <input type="number" value={item.qty} onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, qty: Number(e.target.value) } : it))}
                  min={1} className="col-span-1 px-2 py-1.5 text-xs bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring text-right" />
                {items.length > 1 && (
                  <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive p-1 rounded hover:bg-destructive/10">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 sticky bottom-0 bg-card">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">Batal</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all">Simpan</button>
        </div>
      </div>
    </div>
  );
}

export default function RejectPage() {
  const [batches, setBatches] = useState<RejectBatch[]>(MOCK_BATCHES);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewBatch, setViewBatch] = useState<RejectBatch | null>(null);

  const filtered = batches.filter(b =>
    b.batch_no.toLowerCase().includes(search.toLowerCase()) ||
    b.outlet.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (b: RejectBatch) => {
    setBatches(prev => [b, ...prev]);
    setShowCreate(false);
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Modul Reject</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Pengelolaan barang reject & retur</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Buat Batch Reject
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Batch", value: batches.length, color: "text-foreground" },
          { label: "Menunggu", value: batches.filter(b => b.status === "PENDING").length, color: "text-yellow-500" },
          { label: "Dibuang", value: batches.filter(b => b.status === "DISPOSED").length, color: "text-red-500" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari batch, outlet..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium">No. Batch</th>
                <th className="text-left px-4 py-3 font-medium">Outlet</th>
                <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                <th className="text-right px-4 py-3 font-medium">Total Item</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-muted/20 transition-colors stagger-item">
                  <td className="px-5 py-3 font-mono text-xs font-medium">{b.batch_no}</td>
                  <td className="px-4 py-3 font-medium">{b.outlet}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(b.date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.total_items}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[b.status])}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => setViewBatch(b)}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Belum ada data reject</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSave={handleSave} />}
      {viewBatch && <DetailModal batch={viewBatch} onClose={() => setViewBatch(null)} />}
    </div>
  );
}
