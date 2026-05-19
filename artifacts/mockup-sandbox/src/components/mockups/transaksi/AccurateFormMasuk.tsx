import React, { useState, useRef } from "react";
import {
  FilePlus, Save, Trash2, Printer, X, Search, ChevronDown,
  Plus, Minus, Package, Calendar, Warehouse, User, FileText,
  ChevronLeft, ChevronRight, Copy, RefreshCw
} from "lucide-react";

// ─── mock data ──────────────────────────────────────────────────────
const WAREHOUSES = ["Gudang Utama", "Gudang Cabang Selatan"];
const PARTNERS = [
  { code: "SUP-001", name: "PT Maju Jaya Supplier" },
  { code: "SUP-002", name: "CV Sumber Makmur" },
  { code: "SUP-003", name: "UD Berkah Bersama" },
];
const ITEMS = [
  { code: "BRG-001", name: "Air Mineral 600ml", unit: "BOTOL", price: 2500, altUnit: "DUS", altRatio: 24 },
  { code: "BRG-002", name: "Mie Instant Goreng", unit: "PCS", price: 3200, altUnit: "DUS", altRatio: 40 },
  { code: "BRG-003", name: "Sabun Mandi Batang", unit: "BATANG", price: 5000, altUnit: "LUSIN", altRatio: 12 },
  { code: "BRG-004", name: "Teh Celup 25s", unit: "BOX", price: 8500, altUnit: "KARTON", altRatio: 24 },
  { code: "BRG-005", name: "Kopi Sachet 20s", unit: "RENCENG", price: 12000, altUnit: "DUS", altRatio: 12 },
];
const UNITS = ["PCS", "DUS", "BOTOL", "KARTON", "LUSIN", "BATANG", "BOX", "RENCENG", "KG", "LUSIN"];

interface LineItem {
  id: number;
  code: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  disc: number;
  total: number;
  notes: string;
}

function fmt(n: number) {
  return n.toLocaleString("id-ID");
}

function ToolbarBtn({
  icon: Icon, label, onClick, variant = "default", disabled
}: {
  icon: React.ElementType; label: string; onClick?: () => void;
  variant?: "default" | "primary" | "danger"; disabled?: boolean;
}) {
  const colors = {
    default: "text-gray-700 hover:bg-slate-100 border-slate-200",
    primary: "text-blue-700 hover:bg-blue-50 border-blue-200",
    danger: "text-red-600 hover:bg-red-50 border-red-200",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors min-w-[52px] disabled:opacity-40 disabled:cursor-not-allowed ${colors[variant]}`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-gray-500 font-medium shrink-0 w-28 text-right pr-2">{children}</label>;
}

function TextInput({ value, onChange, placeholder, className }: {
  value: string; onChange?: (v: string) => void;
  placeholder?: string; className?: string;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white ${className ?? ""}`}
    />
  );
}

function SelectInput({ value, onChange, options, className }: {
  value: string; onChange?: (v: string) => void; options: string[]; className?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      className={`border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white ${className ?? ""}`}
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

let rowIdCounter = 3;

export function AccurateFormMasuk() {
  const today = new Date().toISOString().slice(0, 10);
  const refNo = `IN-${today.replace(/-/g, "")}-0001`;

  const [date, setDate] = useState(today);
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0]);
  const [partner, setPartner] = useState(PARTNERS[0].name);
  const [partnerCode, setPartnerCode] = useState(PARTNERS[0].code);
  const [terms, setTerms] = useState("30 Hari");
  const [memo, setMemo] = useState("");
  const [showPartnerPicker, setShowPartnerPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState<number | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [saved, setSaved] = useState(false);

  const [rows, setRows] = useState<LineItem[]>([
    { id: 1, code: "BRG-001", name: "Air Mineral 600ml", qty: 20, unit: "DUS", price: 2500, disc: 0, total: 20 * 24 * 2500, notes: "" },
    { id: 2, code: "BRG-002", name: "Mie Instant Goreng", qty: 5, unit: "DUS", price: 3200, disc: 0, total: 5 * 40 * 3200, notes: "" },
  ]);

  const updateRow = (id: number, field: keyof LineItem, value: string | number) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === "code") {
        const found = ITEMS.find(i => i.code === value);
        if (found) {
          updated.name = found.name;
          updated.unit = found.altUnit;
          updated.price = found.price;
        }
      }
      const qty = Number(updated.qty);
      const unit = updated.unit;
      const item = ITEMS.find(i => i.code === updated.code);
      const ratio = (item && unit === item.altUnit) ? item.altRatio : 1;
      updated.total = qty * ratio * updated.price * (1 - updated.disc / 100);
      return updated;
    }));
  };

  const addRow = () => {
    rowIdCounter++;
    setRows(prev => [...prev, {
      id: rowIdCounter, code: "", name: "", qty: 1, unit: "PCS", price: 0, disc: 0, total: 0, notes: ""
    }]);
  };

  const deleteRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id));

  const subtotal = rows.reduce((s, r) => s + r.total, 0);
  const totalDisc = rows.reduce((s, r) => s + (r.total * r.disc / 100), 0);
  const grandTotal = subtotal;

  const filteredItems = ITEMS.filter(i =>
    i.code.toLowerCase().includes(itemSearch.toLowerCase()) ||
    i.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-4 pt-6 font-sans">
      <div className="w-full max-w-5xl bg-white border border-gray-300 rounded shadow-lg overflow-hidden">

        {/* ── Window title bar ── */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 opacity-80" />
            <span className="text-sm font-semibold tracking-wide">Pembelian — Penerimaan Barang</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-white/80 hover:text-white text-xs">─</button>
            <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-white/80 hover:text-white text-xs">□</button>
            <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500 text-white/80 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-slate-50 border-b border-gray-200 px-3 py-2 flex items-center gap-1.5">
          <ToolbarBtn icon={FilePlus} label="Baru" variant="default" />
          <ToolbarBtn icon={Save} label="Simpan" variant="primary" onClick={() => setSaved(true)} />
          <ToolbarBtn icon={Copy} label="Duplikat" />
          <div className="w-px h-8 bg-gray-200 mx-0.5" />
          <ToolbarBtn icon={Trash2} label="Hapus" variant="danger" />
          <div className="w-px h-8 bg-gray-200 mx-0.5" />
          <ToolbarBtn icon={Printer} label="Cetak" />
          <ToolbarBtn icon={RefreshCw} label="Refresh" />
          <div className="w-px h-8 bg-gray-200 mx-0.5" />
          <ToolbarBtn icon={ChevronLeft} label="Sebelum" disabled />
          <ToolbarBtn icon={ChevronRight} label="Sesudah" />
          <div className="flex-1" />
          {saved && (
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
              ✓ Data tersimpan
            </span>
          )}
        </div>

        {/* ── Header fields ── */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {/* Left column */}
            <div className="space-y-1.5">
              <div className="flex items-center">
                <FieldLabel>No. Penerimaan</FieldLabel>
                <TextInput value={refNo} className="w-44 bg-gray-50 font-mono" />
              </div>
              <div className="flex items-center">
                <FieldLabel>Tanggal</FieldLabel>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white w-36"
                />
              </div>
              <div className="flex items-center">
                <FieldLabel>Gudang</FieldLabel>
                <SelectInput value={warehouse} onChange={setWarehouse} options={WAREHOUSES} className="w-52" />
              </div>
              <div className="flex items-center">
                <FieldLabel>Syarat</FieldLabel>
                <SelectInput value={terms} onChange={setTerms} options={["COD", "7 Hari", "14 Hari", "30 Hari", "60 Hari"]} className="w-32" />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-1.5">
              <div className="flex items-center">
                <FieldLabel>Supplier</FieldLabel>
                <div className="flex gap-1 items-center">
                  <TextInput value={partnerCode} className="w-24 bg-gray-50 font-mono" />
                  <div className="relative">
                    <TextInput
                      value={partner}
                      onChange={setPartner}
                      className="w-52"
                      placeholder="Nama supplier..."
                    />
                  </div>
                  <button
                    onClick={() => setShowPartnerPicker(v => !v)}
                    className="border border-gray-300 rounded px-2 py-0.5 text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Partner picker dropdown */}
              {showPartnerPicker && (
                <div className="ml-28 bg-white border border-gray-300 rounded shadow-lg z-20 w-80 absolute">
                  <div className="p-2 border-b border-gray-100 text-xs font-medium text-gray-500 bg-gray-50">Pilih Supplier</div>
                  {PARTNERS.map(p => (
                    <button key={p.code} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-left text-sm"
                      onClick={() => { setPartner(p.name); setPartnerCode(p.code); setShowPartnerPicker(false); }}>
                      <span className="font-mono text-xs text-gray-400 w-16">{p.code}</span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center">
                <FieldLabel>No. PO Supplier</FieldLabel>
                <TextInput value="" className="w-44" placeholder="Opsional..." />
              </div>
              <div className="flex items-center">
                <FieldLabel>No. Surat Jalan</FieldLabel>
                <TextInput value="" className="w-44" placeholder="Opsional..." />
              </div>
              <div className="flex items-center">
                <FieldLabel>Keterangan</FieldLabel>
                <TextInput value="" className="w-64" placeholder="Keterangan transaksi..." />
              </div>
            </div>
          </div>
        </div>

        {/* ── Line items table ── */}
        <div className="px-0 border-b border-gray-200 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-700 text-white text-xs">
                <th className="px-2 py-2 text-center border-r border-blue-600 w-8">No</th>
                <th className="px-2 py-2 text-left border-r border-blue-600 w-24">Kode Barang</th>
                <th className="px-2 py-2 text-left border-r border-blue-600 min-w-[180px]">Nama Barang</th>
                <th className="px-2 py-2 text-right border-r border-blue-600 w-20">Qty</th>
                <th className="px-2 py-2 text-left border-r border-blue-600 w-20">Satuan</th>
                <th className="px-2 py-2 text-right border-r border-blue-600 w-28">Harga (Rp)</th>
                <th className="px-2 py-2 text-right border-r border-blue-600 w-16">Disc%</th>
                <th className="px-2 py-2 text-right border-r border-blue-600 w-32">Total (Rp)</th>
                <th className="px-2 py-2 text-left border-r border-blue-600 w-28">Keterangan</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-200 hover:bg-blue-50/60 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"}`}
                >
                  <td className="px-2 py-1 text-center text-xs text-gray-400 border-r border-gray-200">{idx + 1}</td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <div className="relative">
                      <input
                        value={row.code}
                        onChange={e => updateRow(row.id, "code", e.target.value)}
                        onFocus={() => setShowItemPicker(row.id)}
                        className="w-full border border-transparent focus:border-blue-400 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none focus:bg-white bg-transparent"
                        placeholder="Kode..."
                      />
                      {showItemPicker === row.id && (
                        <div className="absolute top-full left-0 bg-white border border-gray-300 rounded shadow-xl z-30 w-72 max-h-40 overflow-auto">
                          <div className="p-1.5 border-b border-gray-100">
                            <input
                              value={itemSearch}
                              onChange={e => setItemSearch(e.target.value)}
                              placeholder="Cari barang..."
                              className="w-full text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none"
                              autoFocus
                            />
                          </div>
                          {filteredItems.map(item => (
                            <button key={item.code}
                              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 text-left"
                              onMouseDown={() => {
                                updateRow(row.id, "code", item.code);
                                setShowItemPicker(null);
                                setItemSearch("");
                              }}>
                              <span className="font-mono text-xs text-gray-400 w-16">{item.code}</span>
                              <span className="text-xs text-gray-700">{item.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <input
                      value={row.name}
                      onChange={e => updateRow(row.id, "name", e.target.value)}
                      className="w-full border border-transparent focus:border-blue-400 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:bg-white bg-transparent"
                      placeholder="Nama barang..."
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <input
                      type="number"
                      value={row.qty}
                      onChange={e => updateRow(row.id, "qty", Number(e.target.value))}
                      className="w-full border border-transparent focus:border-blue-400 rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:bg-white bg-transparent tabular-nums"
                      min={0}
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <select
                      value={row.unit}
                      onChange={e => updateRow(row.id, "unit", e.target.value)}
                      className="w-full border border-transparent focus:border-blue-400 rounded px-1 py-0.5 text-xs focus:outline-none focus:bg-white bg-transparent"
                    >
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <input
                      type="number"
                      value={row.price}
                      onChange={e => updateRow(row.id, "price", Number(e.target.value))}
                      className="w-full border border-transparent focus:border-blue-400 rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:bg-white bg-transparent tabular-nums"
                      min={0}
                    />
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <input
                      type="number"
                      value={row.disc}
                      onChange={e => updateRow(row.id, "disc", Number(e.target.value))}
                      className="w-full border border-transparent focus:border-blue-400 rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:bg-white bg-transparent"
                      min={0} max={100}
                    />
                  </td>
                  <td className="px-2 py-1 text-right border-r border-gray-200">
                    <span className="text-xs font-semibold tabular-nums text-gray-700">{fmt(row.total)}</span>
                  </td>
                  <td className="px-1 py-1 border-r border-gray-200">
                    <input
                      value={row.notes}
                      onChange={e => updateRow(row.id, "notes", e.target.value)}
                      className="w-full border border-transparent focus:border-blue-400 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:bg-white bg-transparent"
                      placeholder="..."
                    />
                  </td>
                  <td className="px-1 py-1 text-center">
                    <button onClick={() => deleteRow(row.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-0.5 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Empty add row */}
              <tr className="border-b border-dashed border-gray-200 bg-blue-50/20 hover:bg-blue-50/50 cursor-pointer" onClick={addRow}>
                <td colSpan={10} className="px-4 py-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                    <Plus className="w-3 h-3" /> Klik untuk menambah baris baru...
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Bottom ── */}
        <div className="px-4 py-3 bg-white flex gap-4">
          {/* Memo */}
          <div className="flex-1">
            <label className="text-xs text-gray-500 font-medium block mb-1">Memo / Catatan Internal</label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              rows={3}
              placeholder="Catatan untuk transaksi ini..."
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          {/* Totals */}
          <div className="w-64 bg-gray-50 border border-gray-200 rounded p-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Subtotal</span>
              <span className="text-xs tabular-nums font-medium">Rp {fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Diskon</span>
              <span className="text-xs tabular-nums text-red-500">- Rp 0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">PPN (0%)</span>
              <span className="text-xs tabular-nums">Rp 0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Biaya Lain</span>
              <span className="text-xs tabular-nums">Rp 0</span>
            </div>
            <div className="border-t border-gray-300 pt-1.5 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">Total</span>
              <span className="text-sm font-bold text-blue-700 tabular-nums">Rp {fmt(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* ── Status bar ── */}
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-1 flex items-center gap-4">
          <span className="text-xs text-gray-400">Dibuat: Administrator · {new Date().toLocaleDateString("id-ID")}</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-400">{rows.length} baris · {rows.filter(r => r.code).length} item</span>
          <div className="flex-1" />
          <span className="text-xs text-gray-400">GudangPro v1.0</span>
        </div>

      </div>
    </div>
  );
}
