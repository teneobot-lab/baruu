import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FilePlus, Save, Trash2, Printer, X, Search,
  Plus, Copy, RefreshCw, ChevronLeft, ChevronRight, Package,
  ArrowDown, ArrowUp, ArrowLeftRight, Sliders
} from "lucide-react";
import { cn, generateRefNo, formatNumber } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────
export type TxType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";

export interface TxFormItem {
  id: number;
  code: string;
  name: string;
  qty: string;
  unit: string;
  price: string;
  disc: string;
  total: number;
  notes: string;
}

export interface TxFormData {
  type: TxType;
  refNo: string;
  date: string;
  warehouseId: string;
  warehouseName: string;
  destWarehouseId?: string;
  destWarehouseName?: string;
  partnerId?: string;
  partnerName: string;
  poNumber?: string;
  deliveryNote?: string;
  notes: string;
  items: TxFormItem[];
}

// ─── Item catalog (would come from API) ─────────────────────────────
const CATALOG_ITEMS = [
  { code: "BRG-001", name: "Air Mineral 600ml",    baseUnit: "BOTOL", altUnit: "DUS",    altRatio: 24,  price: 2500  },
  { code: "BRG-002", name: "Mie Instant Goreng",   baseUnit: "PCS",   altUnit: "DUS",    altRatio: 40,  price: 3200  },
  { code: "BRG-003", name: "Sabun Mandi Batang",   baseUnit: "BATANG",altUnit: "LUSIN",  altRatio: 12,  price: 5000  },
  { code: "BRG-004", name: "Teh Celup 25s",        baseUnit: "BOX",   altUnit: "KARTON", altRatio: 24,  price: 8500  },
  { code: "BRG-005", name: "Kopi Sachet 20s",      baseUnit: "RENCENG",altUnit:"DUS",    altRatio: 12,  price: 12000 },
  { code: "BRG-006", name: "Gula Pasir 1kg",       baseUnit: "BUNGKUS",altUnit:"KARTON", altRatio: 24,  price: 14000 },
  { code: "BRG-007", name: "Minyak Goreng 2L",     baseUnit: "BOTOL", altUnit: "DUS",    altRatio: 12,  price: 32000 },
];

const ALL_UNITS = ["PCS","DUS","BOTOL","KARTON","LUSIN","BATANG","BOX","RENCENG","KG","BUNGKUS","LUSIN"];

const WAREHOUSES = [
  { id: "wh-001", name: "Gudang Utama" },
  { id: "wh-002", name: "Gudang Cabang Selatan" },
];

const PARTNERS = {
  IN: [
    { id: "pt-001", name: "PT Maju Jaya Supplier" },
    { id: "pt-002", name: "CV Sumber Makmur" },
  ],
  OUT: [
    { id: "pt-003", name: "Toko Berkah Abadi" },
    { id: "pt-004", name: "Minimarket Sejahtera" },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────
let _rowId = 100;
function newRow(): TxFormItem {
  return { id: ++_rowId, code: "", name: "", qty: "1", unit: "PCS", price: "0", disc: "0", total: 0, notes: "" };
}

function num(s: string) { return parseFloat(s.replace(/[^\d.-]/g, "")) || 0; }

function calcRowTotal(row: TxFormItem): number {
  const item = CATALOG_ITEMS.find(i => i.code === row.code);
  const ratio = (item && row.unit === item.altUnit) ? item.altRatio : 1;
  return num(row.qty) * ratio * num(row.price) * (1 - num(row.disc) / 100);
}

const TX_META: Record<TxType, { label: string; icon: React.ElementType; color: string }> = {
  IN:         { label: "Penerimaan Barang (Masuk)",         icon: ArrowDown,      color: "from-blue-700 to-blue-800" },
  OUT:        { label: "Pengeluaran Barang (Keluar)",       icon: ArrowUp,        color: "from-orange-600 to-orange-700" },
  TRANSFER:   { label: "Transfer Antar Gudang",             icon: ArrowLeftRight, color: "from-teal-600 to-teal-700" },
  ADJUSTMENT: { label: "Penyesuaian Stok (Adjustment)",     icon: Sliders,        color: "from-purple-700 to-purple-800" },
};

// ─── Autocomplete dropdown ────────────────────────────────────────────
function ItemDropdown({ query, visible, onSelect, onKeyDown }: {
  query: string; visible: boolean;
  onSelect: (item: typeof CATALOG_ITEMS[0]) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  const [cursor, setCursor] = useState(0);
  const matches = CATALOG_ITEMS.filter(i =>
    !query ||
    i.code.toLowerCase().includes(query.toLowerCase()) ||
    i.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);

  useEffect(() => { setCursor(0); }, [query]);

  if (!visible || matches.length === 0) {
    if (visible && query.length > 0) return (
      <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-xl rounded w-80 px-3 py-2 text-xs text-gray-400">
        Barang tidak ditemukan untuk "<strong>{query}</strong>"
      </div>
    );
    return null;
  }

  return (
    <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-xl rounded w-80 overflow-hidden"
      onKeyDown={e => {
        if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, matches.length - 1)); }
        if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
        if (e.key === "Enter")     { e.preventDefault(); if (matches[cursor]) onSelect(matches[cursor]); }
      }}>
      <div className="bg-blue-700 text-white text-[10px] font-bold px-2 py-1 grid grid-cols-[72px_1fr] gap-2">
        <span>Kode</span><span>Nama Barang</span>
      </div>
      {matches.map((item, i) => (
        <button key={item.code}
          onMouseDown={e => { e.preventDefault(); onSelect(item); }}
          className={cn(
            "w-full text-left grid grid-cols-[72px_1fr] gap-2 px-2 py-1.5 text-xs border-b border-gray-100 last:border-0 transition-colors",
            i === cursor ? "bg-blue-100 text-blue-800" : "hover:bg-blue-50"
          )}
        >
          <span className="font-mono text-gray-400">{item.code}</span>
          <span className="text-gray-700 truncate">{item.name}</span>
        </button>
      ))}
      <div className="bg-gray-50 px-2 py-1 text-[10px] text-gray-400 border-t border-gray-100">
        ↑↓ Navigasi · Enter pilih · Esc tutup
      </div>
    </div>
  );
}

// ─── Grid row component ───────────────────────────────────────────────
interface GridRowProps {
  row: TxFormItem;
  rowIdx: number;
  acOpen: boolean;
  codeRef: (el: HTMLInputElement | null) => void;
  qtyRef:  (el: HTMLInputElement | null) => void;
  onCodeChange:  (v: string) => void;
  onCodeEnter:   () => void;
  onItemSelect:  (item: typeof CATALOG_ITEMS[0]) => void;
  onCloseAc:     () => void;
  onQtyChange:   (v: string) => void;
  onQtyEnter:    () => void;
  onUnitChange:  (v: string) => void;
  onPriceChange: (v: string) => void;
  onDiscChange:  (v: string) => void;
  onNotesChange: (v: string) => void;
  onDelete:      () => void;
}

function GridRow({
  row, rowIdx, acOpen,
  codeRef, qtyRef,
  onCodeChange, onCodeEnter, onItemSelect, onCloseAc,
  onQtyChange, onQtyEnter,
  onUnitChange, onPriceChange, onDiscChange, onNotesChange,
  onDelete,
}: GridRowProps) {
  const odd = rowIdx % 2 !== 0;
  const inp = "w-full px-1.5 py-1 text-xs border border-transparent focus:border-blue-400 focus:bg-white rounded focus:outline-none bg-transparent focus:z-10";

  return (
    <tr className={cn("border-b border-gray-100 transition-colors group", odd ? "bg-gray-50/60" : "bg-white", "hover:bg-blue-50/40")}>
      {/* # */}
      <td className="border-r border-gray-200 text-center px-1 py-0.5">
        <span className="text-[10px] text-gray-300">{rowIdx + 1}</span>
      </td>

      {/* Code — has autocomplete */}
      <td className="border-r border-gray-200 relative py-0 px-0">
        <input
          ref={codeRef}
          value={row.code}
          onChange={e => onCodeChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter")  { e.preventDefault(); onCodeEnter(); }
            if (e.key === "Tab")    { onCloseAc(); }
            if (e.key === "Escape") { onCloseAc(); }
          }}
          onBlur={() => setTimeout(onCloseAc, 180)}
          onFocus={e => { e.target.select(); onCodeChange(row.code); }}
          className={inp + " font-mono uppercase tracking-wide"}
          placeholder="Kode..."
          autoComplete="off"
          spellCheck={false}
        />
        <ItemDropdown
          query={row.code}
          visible={acOpen}
          onSelect={onItemSelect}
        />
      </td>

      {/* Name */}
      <td className="border-r border-gray-200 py-0 px-0">
        <input
          value={row.name}
          onChange={e => { /* name is read-only after selection, but allow typing to search */ }}
          readOnly
          className={inp + " text-gray-600 cursor-default"}
          placeholder="— pilih kode —"
          tabIndex={-1}
        />
      </td>

      {/* Qty */}
      <td className="border-r border-gray-200 py-0 px-0 w-16">
        <input
          ref={qtyRef}
          type="number"
          value={row.qty}
          onChange={e => onQtyChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); onQtyEnter(); }
          }}
          onFocus={e => e.target.select()}
          className={inp + " text-right tabular-nums font-semibold text-blue-700"}
          min={0}
          step={1}
          placeholder="0"
        />
      </td>

      {/* Unit */}
      <td className="border-r border-gray-200 py-0 px-0 w-20">
        <select value={row.unit} onChange={e => onUnitChange(e.target.value)}
          className={inp + " cursor-pointer"}>
          {ALL_UNITS.map(u => <option key={u}>{u}</option>)}
        </select>
      </td>

      {/* Price */}
      <td className="border-r border-gray-200 py-0 px-0 w-28">
        <input type="number" value={row.price} onChange={e => onPriceChange(e.target.value)}
          onFocus={e => e.target.select()}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onQtyEnter(); } }}
          className={inp + " text-right tabular-nums"} min={0} placeholder="0" />
      </td>

      {/* Disc */}
      <td className="border-r border-gray-200 py-0 px-0 w-14">
        <input type="number" value={row.disc} onChange={e => onDiscChange(e.target.value)}
          onFocus={e => e.target.select()}
          className={inp + " text-right"} min={0} max={100} placeholder="0" step={0.5} />
      </td>

      {/* Total (read-only) */}
      <td className="border-r border-gray-200 px-2 py-1 text-right w-32">
        <span className={cn("text-xs tabular-nums font-semibold", row.total > 0 ? "text-gray-700" : "text-gray-300")}>
          {row.total > 0 ? formatNumber(row.total) : "—"}
        </span>
      </td>

      {/* Notes */}
      <td className="border-r border-gray-200 py-0 px-0 w-28">
        <input value={row.notes} onChange={e => onNotesChange(e.target.value)}
          className={inp} placeholder="..." />
      </td>

      {/* Delete */}
      <td className="px-1 py-1 text-center w-7">
        <button onClick={onDelete}
          className="text-gray-200 group-hover:text-gray-300 hover:!text-red-500 transition-colors p-0.5 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ─── Toolbar button ───────────────────────────────────────────────────
function TBtn({ icon: Icon, label, onClick, variant = "def", disabled }: {
  icon: React.ElementType; label: string; onClick?: () => void;
  variant?: "def" | "pri" | "del"; disabled?: boolean;
}) {
  const cls = { def: "text-gray-700 hover:bg-slate-100 border-slate-200", pri: "text-blue-700 hover:bg-blue-50 border-blue-200", del: "text-red-600 hover:bg-red-50 border-red-200" }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("flex flex-col items-center gap-0.5 px-3 py-1.5 rounded border text-[11px] font-medium min-w-[48px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed", cls)}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

// ─── Main TransactionForm component ──────────────────────────────────
interface TransactionFormProps {
  type: TxType;
  onClose: () => void;
  onSave: (data: TxFormData) => void;
}

export function TransactionForm({ type, onClose, onSave }: TransactionFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const meta = TX_META[type];
  const Icon = meta.icon;

  // Header state
  const [date, setDate] = useState(today);
  const [warehouseId, setWarehouseId] = useState(WAREHOUSES[0].id);
  const [destWarehouseId, setDestWarehouseId] = useState(WAREHOUSES[1].id);
  const [partnerName, setPartnerName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [headerNotes, setHeaderNotes] = useState("");
  const [showPartnerMenu, setShowPartnerMenu] = useState(false);

  const refNo = generateRefNo(type);
  const warehouseName = WAREHOUSES.find(w => w.id === warehouseId)?.name ?? "";
  const destWarehouseName = WAREHOUSES.find(w => w.id === destWarehouseId)?.name ?? "";

  // Row state
  const [rows, setRows] = useState<TxFormItem[]>([newRow()]);
  const [acOpenRow, setAcOpenRow] = useState<number | null>(null); // row index with open AC

  // Refs for keyboard navigation
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const qtyRefs  = useRef<(HTMLInputElement | null)[]>([]);

  const focusCode = useCallback((idx: number) => {
    setTimeout(() => { codeRefs.current[idx]?.focus(); codeRefs.current[idx]?.select(); }, 30);
  }, []);
  const focusQty = useCallback((idx: number) => {
    setTimeout(() => { qtyRefs.current[idx]?.focus(); qtyRefs.current[idx]?.select(); }, 30);
  }, []);

  // Update row helper
  const updRow = useCallback((rowId: number, patch: Partial<TxFormItem>) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const next = { ...r, ...patch };
      next.total = calcRowTotal(next);
      return next;
    }));
  }, []);

  // Select item from autocomplete
  const selectItem = useCallback((rowIdx: number, item: typeof CATALOG_ITEMS[0]) => {
    const rowId = rows[rowIdx].id;
    updRow(rowId, {
      code: item.code,
      name: item.name,
      unit: item.altUnit,
      price: String(item.price),
    });
    setAcOpenRow(null);
    focusQty(rowIdx);
  }, [rows, updRow, focusQty]);

  // Enter in code field
  const onCodeEnter = useCallback((rowIdx: number) => {
    const row = rows[rowIdx];
    const q = row.code.toLowerCase();
    const exact = CATALOG_ITEMS.find(i => i.code.toLowerCase() === q);
    if (exact) { selectItem(rowIdx, exact); return; }
    const matches = CATALOG_ITEMS.filter(i =>
      i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
    );
    if (matches.length === 1) { selectItem(rowIdx, matches[0]); return; }
    // Keep AC open
    setAcOpenRow(rowIdx);
  }, [rows, selectItem]);

  // Enter in qty field → next row
  const onQtyEnter = useCallback((rowIdx: number) => {
    const isLast = rowIdx === rows.length - 1;
    if (isLast) {
      const nr = newRow();
      setRows(prev => [...prev, nr]);
      setTimeout(() => focusCode(rowIdx + 1), 50);
    } else {
      focusCode(rowIdx + 1);
    }
  }, [rows, focusCode]);

  const addRow = useCallback(() => {
    const nr = newRow();
    setRows(prev => [...prev, nr]);
    setTimeout(() => focusCode(rows.length), 50);
  }, [rows, focusCode]);

  const delRow = useCallback((rowId: number, rowIdx: number) => {
    setRows(prev => {
      const next = prev.filter(r => r.id !== rowId);
      return next.length ? next : [newRow()];
    });
    setTimeout(() => focusCode(Math.max(0, rowIdx - 1)), 50);
  }, [focusCode]);

  // Grand total
  const subtotal = rows.reduce((s, r) => s + r.total, 0);
  const validItems = rows.filter(r => r.code && num(r.qty) > 0);

  const handleSave = () => {
    onSave({
      type, refNo, date, warehouseId, warehouseName,
      ...(type === "TRANSFER" ? { destWarehouseId, destWarehouseName } : {}),
      partnerName, poNumber, deliveryNote, notes: headerNotes,
      items: validItems,
    });
  };

  // Ctrl+S shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [validItems]);

  const partnerList = PARTNERS[type as "IN" | "OUT"] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-auto pt-4 pb-8 px-2">
      <div className="w-full max-w-5xl bg-white border border-gray-300 rounded shadow-2xl overflow-hidden"
        onClick={() => setShowPartnerMenu(false)}>

        {/* ── Title bar ── */}
        <div className={cn("bg-gradient-to-r text-white px-4 py-2.5 flex items-center justify-between", meta.color)}>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 opacity-80" />
            <span className="text-sm font-semibold tracking-wide">{meta.label}</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-slate-50 border-b border-gray-200 px-3 py-1.5 flex items-center gap-1.5 flex-wrap">
          <TBtn icon={FilePlus} label="Baru" onClick={onClose} />
          <TBtn icon={Save} label="Simpan" variant="pri" onClick={handleSave} />
          <div className="w-px h-8 bg-gray-200 mx-0.5" />
          <TBtn icon={Trash2} label="Hapus" variant="del" onClick={onClose} />
          <div className="w-px h-8 bg-gray-200 mx-0.5" />
          <TBtn icon={Printer} label="Cetak" />
          <div className="flex-1" />
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded border border-gray-200">
            💡 Enter di Qty → lanjut ke baris berikutnya
          </span>
        </div>

        {/* ── Header fields ── */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {/* Left column */}
            <div className="space-y-1.5">
              <Row2Col label="No. Dokumen">
                <input readOnly value={refNo}
                  className="border border-gray-300 rounded px-2 py-0.5 text-sm bg-gray-50 font-mono w-48 focus:outline-none" />
              </Row2Col>
              <Row2Col label="Tanggal">
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-0.5 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </Row2Col>
              <Row2Col label="Gudang">
                <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-0.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                  {WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </Row2Col>
              {type === "TRANSFER" && (
                <Row2Col label="Gudang Tujuan">
                  <select value={destWarehouseId} onChange={e => setDestWarehouseId(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-0.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">
                    {WAREHOUSES.filter(w => w.id !== warehouseId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </Row2Col>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-1.5">
              {(type === "IN" || type === "OUT") && (
                <Row2Col label={type === "IN" ? "Supplier" : "Pelanggan"}>
                  <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
                    <input value={partnerName} onChange={e => setPartnerName(e.target.value)}
                      placeholder={`Nama ${type === "IN" ? "supplier" : "pelanggan"}...`}
                      className="border border-gray-300 rounded px-2 py-0.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    <div className="relative">
                      <button onClick={() => setShowPartnerMenu(v => !v)}
                        className="border border-gray-300 rounded px-2 py-0.5 text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                        <Search className="w-3.5 h-3.5" />
                      </button>
                      {showPartnerMenu && (
                        <div className="absolute top-full right-0 bg-white border border-gray-300 rounded shadow-xl z-50 w-64">
                          <div className="bg-blue-700 text-white text-[10px] font-bold px-2 py-1">
                            Pilih {type === "IN" ? "Supplier" : "Pelanggan"}
                          </div>
                          {partnerList.map(p => (
                            <button key={p.id} onMouseDown={() => { setPartnerName(p.name); setShowPartnerMenu(false); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0">
                              {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Row2Col>
              )}
              {type === "IN" && (
                <>
                  <Row2Col label="No. PO Supplier">
                    <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Opsional..."
                      className="border border-gray-300 rounded px-2 py-0.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </Row2Col>
                  <Row2Col label="No. Surat Jalan">
                    <input value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} placeholder="Opsional..."
                      className="border border-gray-300 rounded px-2 py-0.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </Row2Col>
                </>
              )}
              <Row2Col label="Keterangan">
                <input value={headerNotes} onChange={e => setHeaderNotes(e.target.value)} placeholder="Keterangan transaksi..."
                  className="border border-gray-300 rounded px-2 py-0.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </Row2Col>
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="overflow-x-auto border-b border-gray-200">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-700 text-white text-[11px] select-none">
                {["No","Kode Barang","Nama Barang","Qty","Satuan","Harga","Disc%","Total (Rp)","Keterangan",""].map((h, i) => (
                  <th key={i} className={cn(
                    "px-2 py-2 border-r border-blue-600 last:border-0 font-semibold whitespace-nowrap",
                    ["text-center","text-left","text-left","text-right","text-left","text-right","text-right","text-right","text-left","text-center"][i]
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <GridRow
                  key={row.id}
                  row={row}
                  rowIdx={ri}
                  acOpen={acOpenRow === ri}
                  codeRef={el => { codeRefs.current[ri] = el; }}
                  qtyRef={el  => { qtyRefs.current[ri]  = el; }}
                  onCodeChange={v => {
                    updRow(row.id, { code: v });
                    setAcOpenRow(ri);
                  }}
                  onCodeEnter={() => onCodeEnter(ri)}
                  onItemSelect={item => selectItem(ri, item)}
                  onCloseAc={() => setAcOpenRow(null)}
                  onQtyChange={v => updRow(row.id, { qty: v })}
                  onQtyEnter={() => onQtyEnter(ri)}
                  onUnitChange={v => updRow(row.id, { unit: v })}
                  onPriceChange={v => updRow(row.id, { price: v })}
                  onDiscChange={v => updRow(row.id, { disc: v })}
                  onNotesChange={v => updRow(row.id, { notes: v })}
                  onDelete={() => delRow(row.id, ri)}
                />
              ))}

              {/* Add row button */}
              <tr className="hover:bg-blue-50/40 cursor-pointer transition-colors" onClick={addRow}>
                <td colSpan={10} className="px-4 py-1.5 border-b border-dashed border-gray-200">
                  <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                    <Plus className="w-3 h-3" />
                    Klik untuk tambah baris baru...
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Bottom section ── */}
        <div className="px-4 py-3 bg-white flex gap-6 items-start">
          <div className="flex-1">
            <label className="text-xs text-gray-500 font-medium block mb-1">Memo / Catatan Internal</label>
            <textarea rows={3} placeholder="Catatan tambahan..."
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <div className="w-64 shrink-0">
            <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-1.5 mb-3">
              {[["Subtotal", formatNumber(subtotal)], ["Diskon", "0"], ["PPN (0%)", "0"], ["Biaya Lain", "0"]].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-xs text-gray-500">{l}</span>
                  <span className="text-xs tabular-nums">Rp {v}</span>
                </div>
              ))}
              <div className="border-t border-gray-300 pt-1.5 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700">Total</span>
                <span className="text-sm font-bold text-blue-700 tabular-nums">Rp {formatNumber(subtotal)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 border border-gray-300 rounded py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSave}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-2 rounded transition-colors flex items-center justify-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> Simpan
              </button>
            </div>
          </div>
        </div>

        {/* ── Status bar ── */}
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-1 flex items-center gap-4 text-[11px] text-gray-400">
          <span>{validItems.length} item valid</span>
          <span className="text-gray-300">|</span>
          <span>Total: <strong className="text-blue-700">Rp {formatNumber(subtotal)}</strong></span>
          <div className="flex-1" />
          <span>Ctrl+S Simpan · Esc Tutup</span>
        </div>
      </div>
    </div>
  );
}

// ─── Helper: two-column label/field row ───────────────────────────────
function Row2Col({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500 w-28 text-right shrink-0">{label}</label>
      {children}
    </div>
  );
}
