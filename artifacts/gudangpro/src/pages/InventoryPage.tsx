import React, { useState } from "react";
import { Package, Plus, Search, Filter, Edit2, Trash2, ChevronDown, AlertTriangle } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Semua", "Minuman", "Makanan", "Kebersihan", "Elektronik", "Lainnya"];

interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  base_unit: string;
  min_stock: number;
  is_active: boolean;
  total_stock: number;
  units: { unit_name: string; conversion_ratio: number; operator: string }[];
}

const MOCK_ITEMS: Item[] = [
  {
    id: "item-001", code: "BRG-001", name: "Air Mineral 600ml",
    category: "Minuman", base_unit: "BOTOL", min_stock: 100, is_active: true, total_stock: 720,
    units: [{ unit_name: "DUS", conversion_ratio: 24, operator: "*" }]
  },
  {
    id: "item-002", code: "BRG-002", name: "Mie Instant Goreng",
    category: "Makanan", base_unit: "PCS", min_stock: 50, is_active: true, total_stock: 280,
    units: [{ unit_name: "DUS", conversion_ratio: 40, operator: "*" }]
  },
  {
    id: "item-003", code: "BRG-003", name: "Sabun Mandi Batang",
    category: "Kebersihan", base_unit: "BATANG", min_stock: 30, is_active: true, total_stock: 120,
    units: [{ unit_name: "LUSIN", conversion_ratio: 12, operator: "*" }]
  },
];

function ItemModal({ item, onClose, onSave }: {
  item?: Partial<Item>;
  onClose: () => void;
  onSave: (data: Partial<Item>) => void;
}) {
  const [form, setForm] = useState({
    code: item?.code ?? "",
    name: item?.name ?? "",
    category: item?.category ?? "Minuman",
    base_unit: item?.base_unit ?? "PCS",
    min_stock: item?.min_stock ?? 0,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold">{item?.id ? "Edit Barang" : "Tambah Barang"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Kode Barang</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
                placeholder="BRG-001"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Satuan Dasar</label>
              <input
                value={form.base_unit}
                onChange={e => setForm(f => ({ ...f, base_unit: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
                placeholder="PCS"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Nama Barang</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
              placeholder="Nama barang..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Kategori</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Minimum Stok</label>
            <input
              type="number"
              value={form.min_stock}
              onChange={e => setForm(f => ({ ...f, min_stock: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
            Batal
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Item> | undefined>();
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);

  const filtered = items.filter(i =>
    (category === "Semua" || i.category === category) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = (data: Partial<Item>) => {
    if (editItem?.id) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...data } : i));
    } else {
      const newItem: Item = {
        id: `item-${Date.now()}`,
        total_stock: 0,
        is_active: true,
        units: [],
        ...data,
      } as Item;
      setItems(prev => [...prev, newItem]);
    }
    setShowModal(false);
    setEditItem(undefined);
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus barang ini?")) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Daftar Barang</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} barang terdaftar</p>
        </div>
        <button
          onClick={() => { setEditItem(undefined); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Barang
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau kode barang..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {c}
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
                <th className="text-left px-5 py-3 font-medium">Kode</th>
                <th className="text-left px-4 py-3 font-medium">Nama Barang</th>
                <th className="text-left px-4 py-3 font-medium">Kategori</th>
                <th className="text-left px-4 py-3 font-medium">Satuan</th>
                <th className="text-right px-4 py-3 font-medium">Total Stok</th>
                <th className="text-right px-4 py-3 font-medium">Min. Stok</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(item => {
                const low = item.total_stock <= item.min_stock;
                return (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors stagger-item">
                    <td className="px-5 py-3">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{item.code}</code>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{item.base_unit}</div>
                      {item.units.map(u => (
                        <div key={u.unit_name} className="text-xs text-muted-foreground/60">
                          1 {u.unit_name} = {u.conversion_ratio} {item.base_unit}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      <span className={low ? "text-red-500" : ""}>{formatNumber(item.total_stock)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{formatNumber(item.min_stock)}</td>
                    <td className="px-4 py-3">
                      {low ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full badge-pulse">
                          <AlertTriangle className="w-3 h-3" /> Menipis
                        </span>
                      ) : (
                        <span className="inline-flex text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {item.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditItem(item); setShowModal(true); }}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Tidak ada barang ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ItemModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(undefined); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
