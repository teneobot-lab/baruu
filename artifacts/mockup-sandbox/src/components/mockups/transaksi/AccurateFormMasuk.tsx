import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FilePlus, Save, Trash2, Printer, X, Search,
  Plus, Copy, RefreshCw, ChevronLeft, ChevronRight, Package
} from "lucide-react";

// ─── mock data ──────────────────────────────────────────────────────
const WAREHOUSES = ["Gudang Utama", "Gudang Cabang Selatan"];
const PARTNERS = [
  { code: "SUP-001", name: "PT Maju Jaya Supplier" },
  { code: "SUP-002", name: "CV Sumber Makmur" },
  { code: "SUP-003", name: "UD Berkah Bersama" },
];
const ITEMS = [
  { code: "BRG-001", name: "Air Mineral 600ml",     unit: "BOTOL", price: 2500,  altUnit: "DUS",    altRatio: 24 },
  { code: "BRG-002", name: "Mie Instant Goreng",     unit: "PCS",   price: 3200,  altUnit: "DUS",    altRatio: 40 },
  { code: "BRG-003", name: "Sabun Mandi Batang",     unit: "BATANG",price: 5000,  altUnit: "LUSIN",  altRatio: 12 },
  { code: "BRG-004", name: "Teh Celup 25s",          unit: "BOX",   price: 8500,  altUnit: "KARTON", altRatio: 24 },
  { code: "BRG-005", name: "Kopi Sachet 20s",        unit: "RENCENG",price: 12000,altUnit: "DUS",    altRatio: 12 },
  { code: "BRG-006", name: "Gula Pasir 1kg",         unit: "BUNGKUS",price: 14000,altUnit: "KARTON", altRatio: 24 },
  { code: "BRG-007", name: "Minyak Goreng 2L",       unit: "BOTOL", price: 32000, altUnit: "DUS",    altRatio: 12 },
];
const UNITS = ["PCS","DUS","BOTOL","KARTON","LUSIN","BATANG","BOX","RENCENG","KG","BUNGKUS","LUSIN"];

interface Row {
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

let _id = 10;
function mkRow(): Row {
  return { id: ++_id, code:"", name:"", qty:"1", unit:"PCS", price:"0", disc:"0", total:0, notes:"" };
}

function fmt(n: number) { return n.toLocaleString("id-ID"); }
function num(s: string) { return parseFloat(s.replace(/[^\d.]/g,"")) || 0; }
function calcTotal(r: Row) {
  const item = ITEMS.find(i => i.code === r.code);
  const ratio = (item && r.unit === item.altUnit) ? item.altRatio : 1;
  return num(r.qty) * ratio * num(r.price) * (1 - num(r.disc) / 100);
}

// ─── Toolbar button ──────────────────────────────────────────────────
function TBtn({ icon:Icon, label, onClick, variant="def", disabled }:{
  icon:React.ElementType; label:string; onClick?:()=>void;
  variant?:"def"|"pri"|"del"; disabled?:boolean;
}) {
  const cls = {
    def: "text-gray-700 hover:bg-slate-100 border-slate-200",
    pri: "text-blue-700 hover:bg-blue-50 border-blue-200",
    del: "text-red-600 hover:bg-red-50 border-red-200",
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded border text-[11px] font-medium min-w-[50px] transition-colors disabled:opacity-40 ${cls}`}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

// ─── Item autocomplete dropdown ──────────────────────────────────────
function ItemDropdown({ query, onSelect, visible }: {
  query: string; visible: boolean;
  onSelect: (item: typeof ITEMS[0]) => void;
}) {
  if (!visible) return null;
  const matches = ITEMS.filter(i =>
    i.code.toLowerCase().includes(query.toLowerCase()) ||
    i.name.toLowerCase().includes(query.toLowerCase())
  );
  if (!matches.length) return (
    <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg rounded w-72 p-2 text-xs text-gray-400">
      Barang tidak ditemukan
    </div>
  );
  return (
    <div className="absolute top-full left-0 z-50 bg-white border border-gray-300 shadow-lg rounded w-72 max-h-44 overflow-y-auto">
      <div className="bg-blue-700 text-white text-[10px] font-semibold px-2 py-1 flex gap-2">
        <span className="w-16">Kode</span><span>Nama Barang</span>
      </div>
      {matches.map((item, i) => (
        <button key={item.code}
          onMouseDown={e => { e.preventDefault(); onSelect(item); }}
          className="w-full text-left flex gap-2 px-2 py-1.5 text-xs hover:bg-blue-50 border-b border-gray-100 last:border-0"
        >
          <span className="font-mono text-gray-400 w-16 shrink-0">{item.code}</span>
          <span className="text-gray-700 truncate">{item.name}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────
export function AccurateFormMasuk() {
  const today = new Date().toISOString().slice(0,10);
  const refNo = `IN-${today.replace(/-/g,"")}-0001`;

  const [date, setDate] = useState(today);
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0]);
  const [partner, setPartner] = useState(PARTNERS[0].name);
  const [partnerCode, setPartnerCode] = useState(PARTNERS[0].code);
  const [terms, setTerms] = useState("30 Hari");
  const [memo, setMemo] = useState("");
  const [saved, setSaved] = useState(false);
  const [showPartner, setShowPartner] = useState(false);

  const [rows, setRows] = useState<Row[]>([
    { id:1, code:"BRG-001", name:"Air Mineral 600ml",  qty:"20", unit:"DUS",   price:"2500",  disc:"0", total:20*24*2500,  notes:"" },
    { id:2, code:"BRG-002", name:"Mie Instant Goreng", qty:"5",  unit:"DUS",   price:"3200",  disc:"0", total:5*40*3200,   notes:"" },
    { id:3, code:"",        name:"",                   qty:"1",  unit:"PCS",   price:"0",     disc:"0", total:0,           notes:"" },
  ]);

  // Per-row refs for code and qty inputs
  const codeRefs = useRef<(HTMLInputElement|null)[]>([]);
  const qtyRefs  = useRef<(HTMLInputElement|null)[]>([]);

  // Autocomplete state per row
  const [acOpen, setAcOpen] = useState<number|null>(null); // row index
  const [acQuery, setAcQuery] = useState("");

  const focusCode = (idx: number) => {
    setTimeout(() => codeRefs.current[idx]?.focus(), 30);
  };
  const focusQty = (idx: number) => {
    setTimeout(() => { qtyRefs.current[idx]?.focus(); qtyRefs.current[idx]?.select(); }, 30);
  };

  // Update a field in a row
  const upd = useCallback((id: number, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, ...patch };
      next.total = calcTotal(next);
      return next;
    }));
  }, []);

  // Select item from autocomplete
  const selectItem = (rowIdx: number, item: typeof ITEMS[0]) => {
    const id = rows[rowIdx].id;
    const unit = item.altUnit; // default to alt unit (DUS/KARTON etc)
    upd(id, { code: item.code, name: item.name, unit, price: String(item.price) });
    setAcOpen(null);
    setAcQuery("");
    focusQty(rowIdx);
  };

  // Press Enter in code field
  const onCodeEnter = (rowIdx: number) => {
    const row = rows[rowIdx];
    // If code matches exactly one item, select it
    const exact = ITEMS.find(i => i.code.toLowerCase() === row.code.toLowerCase());
    if (exact) { selectItem(rowIdx, exact); return; }
    // Otherwise keep dropdown open if visible
    const matches = ITEMS.filter(i =>
      i.code.toLowerCase().includes(row.code.toLowerCase()) ||
      i.name.toLowerCase().includes(row.code.toLowerCase())
    );
    if (matches.length === 1) { selectItem(rowIdx, matches[0]); return; }
    // If still multiple, keep AC open
  };

  // Press Enter in qty field → move to next row code
  const onQtyEnter = (rowIdx: number) => {
    const isLast = rowIdx === rows.length - 1;
    const isEmpty = rows[rowIdx].code === "";
    if (isLast && !isEmpty) {
      // Add new empty row
      setRows(prev => [...prev, mkRow()]);
      setTimeout(() => focusCode(rowIdx + 1), 50);
    } else if (!isLast) {
      focusCode(rowIdx + 1);
    }
  };

  const addRow = () => {
    setRows(prev => [...prev, mkRow()]);
    setTimeout(() => focusCode(rows.length), 50);
  };

  const delRow = (id: number) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const subtotal = rows.reduce((s,r) => s + r.total, 0);

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-4 pt-6 font-sans text-gray-800">
      <div className="w-full max-w-5xl bg-white border border-gray-300 rounded shadow-lg overflow-hidden select-none">

        {/* ── Title bar ── */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 opacity-80" />
            <span className="text-sm font-semibold tracking-wide">Pembelian — Penerimaan Barang (Barang Masuk)</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-xs">─</button>
            <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 text-xs">□</button>
            <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500"><X className="w-3 h-3"/></button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-slate-50 border-b border-gray-200 px-3 py-1.5 flex items-center gap-1.5 flex-wrap">
          <TBtn icon={FilePlus}      label="Baru" />
          <TBtn icon={Save}          label="Simpan" variant="pri" onClick={() => setSaved(true)} />
          <TBtn icon={Copy}          label="Duplikat" />
          <div className="w-px h-8 bg-gray-200 mx-0.5" />
          <TBtn icon={Trash2}        label="Hapus" variant="del" />
          <div className="w-px h-8 bg-gray-200 mx-0.5" />
          <TBtn icon={Printer}       label="Cetak" />
          <TBtn icon={RefreshCw}     label="Refresh" />
          <div className="w-px h-8 bg-gray-200 mx-0.5" />
          <TBtn icon={ChevronLeft}   label="Sebelum" disabled />
          <TBtn icon={ChevronRight}  label="Sesudah" />
          <div className="flex-1" />
          {saved && (
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
              ✓ Tersimpan
            </span>
          )}
        </div>

        {/* ── Header ── */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {/* Left */}
            <div className="space-y-1.5">
              {[
                { label:"No. Penerimaan", node: <input readOnly value={refNo} className="border border-gray-300 rounded px-2 py-0.5 text-sm bg-gray-50 font-mono w-44 focus:outline-none" /> },
                { label:"Tanggal", node: <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border border-gray-300 rounded px-2 py-0.5 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-blue-400" /> },
                { label:"Gudang", node: <select value={warehouse} onChange={e=>setWarehouse(e.target.value)} className="border border-gray-300 rounded px-2 py-0.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"><option>Gudang Utama</option><option>Gudang Cabang Selatan</option></select> },
                { label:"Syarat", node: <select value={terms} onChange={e=>setTerms(e.target.value)} className="border border-gray-300 rounded px-2 py-0.5 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white">{["COD","7 Hari","14 Hari","30 Hari","60 Hari"].map(t=><option key={t}>{t}</option>)}</select> },
              ].map(f=>(
                <div key={f.label} className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-28 text-right shrink-0">{f.label}</label>
                  {f.node}
                </div>
              ))}
            </div>
            {/* Right */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-28 text-right shrink-0">Supplier</label>
                <input readOnly value={partnerCode} className="border border-gray-300 rounded px-2 py-0.5 text-sm bg-gray-50 font-mono w-20 focus:outline-none" />
                <input value={partner} onChange={e=>setPartner(e.target.value)} className="border border-gray-300 rounded px-2 py-0.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <div className="relative">
                  <button onClick={()=>setShowPartner(v=>!v)} className="border border-gray-300 rounded px-2 py-0.5 text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                    <Search className="w-3.5 h-3.5"/>
                  </button>
                  {showPartner && (
                    <div className="absolute top-full right-0 bg-white border border-gray-300 rounded shadow-xl z-50 w-72">
                      <div className="bg-blue-700 text-white text-[10px] font-semibold px-2 py-1">Pilih Supplier</div>
                      {PARTNERS.map(p=>(
                        <button key={p.code} onMouseDown={()=>{setPartner(p.name);setPartnerCode(p.code);setShowPartner(false);}}
                          className="w-full flex gap-3 px-3 py-2 hover:bg-blue-50 text-left text-sm">
                          <span className="font-mono text-xs text-gray-400 w-16">{p.code}</span>
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {[
                {label:"No. PO Supplier", ph:"Opsional..."},
                {label:"No. Surat Jalan", ph:"Opsional..."},
                {label:"Keterangan",      ph:"Keterangan transaksi..."},
              ].map(f=>(
                <div key={f.label} className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-28 text-right shrink-0">{f.label}</label>
                  <input placeholder={f.ph} className="border border-gray-300 rounded px-2 py-0.5 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="border-b border-gray-200 overflow-x-auto" onClick={()=>setShowPartner(false)}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-700 text-white text-[11px] select-none">
                {["No","Kode Barang","Nama Barang","Qty","Satuan","Harga (Rp)","Disc%","Total (Rp)","Keterangan",""].map((h,i)=>(
                  <th key={i} className={`px-2 py-2 border-r border-blue-600 last:border-0 font-semibold whitespace-nowrap
                    ${["text-center","text-left","text-left","text-right","text-left","text-right","text-right","text-right","text-left",""][i]}`}
                    style={{width:["28px","96px","auto","60px","72px","100px","52px","110px","90px","28px"][i]}}>
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
                  isLast={ri === rows.length - 1}
                  acOpen={acOpen === ri}
                  acQuery={ri === acOpen ? acQuery : ""}
                  codeRef={el => { codeRefs.current[ri] = el; }}
                  qtyRef={el  => { qtyRefs.current[ri]  = el; }}
                  onCodeChange={(v) => {
                    upd(row.id, { code: v, name: v ? row.name : "" });
                    setAcQuery(v);
                    setAcOpen(v ? ri : null);
                  }}
                  onCodeKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); onCodeEnter(ri); }
                    if (e.key === "Tab")   { setAcOpen(null); focusQty(ri); e.preventDefault(); }
                    if (e.key === "Escape") setAcOpen(null);
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      // handled by dropdown itself
                    }
                  }}
                  onCodeBlur={() => setTimeout(() => setAcOpen(null), 150)}
                  onItemSelect={(item) => selectItem(ri, item)}
                  onQtyChange={(v) => upd(row.id, { qty: v })}
                  onQtyKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); onQtyEnter(ri); }
                    if (e.key === "Tab")   { /* natural tab */ }
                  }}
                  onUnitChange={(v)  => upd(row.id, { unit: v })}
                  onPriceChange={(v) => upd(row.id, { price: v })}
                  onDiscChange={(v)  => upd(row.id, { disc: v })}
                  onNotesChange={(v) => upd(row.id, { notes: v })}
                  onDelete={() => delRow(row.id)}
                />
              ))}

              {/* Add row trigger */}
              <tr className="hover:bg-blue-50/40 cursor-pointer" onClick={addRow}>
                <td colSpan={10} className="px-4 py-1.5 border-b border-dashed border-gray-200">
                  <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                    <Plus className="w-3 h-3"/> Klik untuk tambah baris (atau tekan Enter di Qty terakhir)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Bottom ── */}
        <div className="px-4 py-3 bg-white flex gap-6">
          <div className="flex-1">
            <label className="text-xs text-gray-500 font-medium block mb-1">Memo / Catatan Internal</label>
            <textarea value={memo} onChange={e=>setMemo(e.target.value)} rows={3} placeholder="Catatan untuk transaksi ini..."
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"/>
          </div>
          <div className="w-60 space-y-1.5">
            <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-1.5">
              {[["Subtotal", `Rp ${fmt(subtotal)}`],["Diskon","Rp 0"],["PPN (0%)","Rp 0"],["Biaya Lain","Rp 0"]].map(([l,v])=>(
                <div key={l} className="flex justify-between">
                  <span className="text-xs text-gray-500">{l}</span>
                  <span className="text-xs tabular-nums">{v}</span>
                </div>
              ))}
              <div className="border-t border-gray-300 pt-1.5 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700">Total</span>
                <span className="text-sm font-bold text-blue-700 tabular-nums">Rp {fmt(subtotal)}</span>
              </div>
            </div>
            <button onClick={()=>setSaved(true)}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm py-2 rounded transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4"/> Simpan (Ctrl+S)
            </button>
          </div>
        </div>

        {/* ── Status bar ── */}
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-1 flex items-center gap-4">
          <span className="text-xs text-gray-400">Administrator · {new Date().toLocaleDateString("id-ID")}</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-[11px] text-gray-400">
            {rows.filter(r=>r.code).length} item · Total: <strong className="text-blue-700">Rp {fmt(subtotal)}</strong>
          </span>
          <div className="flex-1"/>
          <span className="text-[11px] text-gray-400 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
            💡 Enter di Qty → lanjut ke barang berikutnya
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Single grid row ──────────────────────────────────────────────────
function GridRow({ row, rowIdx, isLast, acOpen, acQuery, codeRef, qtyRef,
  onCodeChange, onCodeKeyDown, onCodeBlur, onItemSelect,
  onQtyChange, onQtyKeyDown, onUnitChange, onPriceChange, onDiscChange, onNotesChange, onDelete
}: {
  row: Row; rowIdx: number; isLast: boolean;
  acOpen: boolean; acQuery: string;
  codeRef: (el: HTMLInputElement|null) => void;
  qtyRef:  (el: HTMLInputElement|null) => void;
  onCodeChange:   (v: string) => void;
  onCodeKeyDown:  (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCodeBlur:     () => void;
  onItemSelect:   (item: typeof ITEMS[0]) => void;
  onQtyChange:    (v: string) => void;
  onQtyKeyDown:   (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onUnitChange:   (v: string) => void;
  onPriceChange:  (v: string) => void;
  onDiscChange:   (v: string) => void;
  onNotesChange:  (v: string) => void;
  onDelete:       () => void;
}) {
  const rowBg = rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/60";
  const hasCode = row.code !== "";

  const cellCls = "border-r border-gray-200 last:border-0 px-0 py-0";
  const inputCls = "w-full px-1.5 py-1 text-xs border border-transparent focus:border-blue-400 focus:bg-white rounded focus:outline-none bg-transparent focus:ring-0 transition-colors";

  return (
    <tr className={`${rowBg} border-b border-gray-100 hover:bg-blue-50/30 transition-colors group`}>
      <td className={cellCls + " text-center"}>
        <span className="text-[10px] text-gray-400 px-1">{rowIdx + 1}</span>
      </td>

      {/* Code */}
      <td className={cellCls + " relative"}>
        <input
          ref={codeRef}
          value={row.code}
          onChange={e => onCodeChange(e.target.value)}
          onKeyDown={onCodeKeyDown}
          onBlur={onCodeBlur}
          onFocus={e => e.target.select()}
          className={inputCls + " font-mono uppercase"}
          placeholder="Kode..."
          autoComplete="off"
        />
        <ItemDropdown query={acQuery} visible={acOpen} onSelect={onItemSelect} />
      </td>

      {/* Name */}
      <td className={cellCls}>
        <input value={row.name} readOnly
          className={inputCls + " cursor-default text-gray-500"} placeholder="— pilih kode —"
          tabIndex={-1} />
      </td>

      {/* Qty */}
      <td className={cellCls}>
        <input
          ref={qtyRef}
          type="number"
          value={row.qty}
          onChange={e => onQtyChange(e.target.value)}
          onKeyDown={onQtyKeyDown}
          onFocus={e => e.target.select()}
          className={inputCls + " text-right tabular-nums font-semibold"}
          min={0}
          placeholder="0"
        />
      </td>

      {/* Unit */}
      <td className={cellCls}>
        <select value={row.unit} onChange={e => onUnitChange(e.target.value)}
          className={inputCls + " cursor-pointer"}>
          {UNITS.map(u => <option key={u}>{u}</option>)}
        </select>
      </td>

      {/* Price */}
      <td className={cellCls}>
        <input type="number" value={row.price} onChange={e => onPriceChange(e.target.value)}
          onFocus={e=>e.target.select()}
          className={inputCls + " text-right tabular-nums"} min={0} placeholder="0" />
      </td>

      {/* Disc */}
      <td className={cellCls}>
        <input type="number" value={row.disc} onChange={e => onDiscChange(e.target.value)}
          onFocus={e=>e.target.select()}
          className={inputCls + " text-right"} min={0} max={100} placeholder="0" />
      </td>

      {/* Total */}
      <td className="border-r border-gray-200 px-2 py-1 text-right">
        <span className={`text-xs tabular-nums font-semibold ${row.total > 0 ? "text-gray-700" : "text-gray-300"}`}>
          {row.total > 0 ? fmt(row.total) : "—"}
        </span>
      </td>

      {/* Notes */}
      <td className={cellCls}>
        <input value={row.notes} onChange={e => onNotesChange(e.target.value)}
          className={inputCls} placeholder="..." />
      </td>

      {/* Delete */}
      <td className="px-1 py-1 text-center">
        <button onClick={onDelete}
          className="text-gray-200 group-hover:text-gray-400 hover:!text-red-500 transition-colors p-0.5 rounded">
          <X className="w-3.5 h-3.5"/>
        </button>
      </td>
    </tr>
  );
}

