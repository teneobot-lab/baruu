import React, { useState, useRef, useCallback } from "react";
import { Package, Plus, Search, Edit2, Trash2, Upload, Download, X, Check, AlertCircle, FileSpreadsheet } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassConfirmModal } from "@/components/ui/GlassModal";

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
  { id: "item-001", code: "BRG-001", name: "Air Mineral 600ml", category: "Minuman", base_unit: "BOTOL", min_stock: 100, is_active: true, total_stock: 720, units: [{ unit_name: "DUS", conversion_ratio: 24, operator: "*" }] },
  { id: "item-002", code: "BRG-002", name: "Mie Instant Goreng", category: "Makanan", base_unit: "PCS", min_stock: 50, is_active: true, total_stock: 280, units: [{ unit_name: "DUS", conversion_ratio: 40, operator: "*" }] },
  { id: "item-003", code: "BRG-003", name: "Sabun Mandi Batang", category: "Kebersihan", base_unit: "BATANG", min_stock: 30, is_active: true, total_stock: 120, units: [{ unit_name: "LUSIN", conversion_ratio: 12, operator: "*" }] },
];

// ─── Template CSV ───────────────────────────────────────────────────────────────
const ITEM_TEMPLATE_CSV = [
  "kode,nama,kategori,satuan_dasar,minimum_stok,konversi",
  "BRG-001,Nama Barang,Minuman,PCS,0,",
  "BRG-002,Nama Barang Lain,Kesehatan,KG,0,DUS,24",
].join("\n");

function downloadTemplate(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Bulk Import Modal ─────────────────────────────────────────────────────────
interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

function BulkImportModal({ onClose }: { onClose: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): string[][] => {
    const lines = text.trim().split("\n");
    return lines.map((line) => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          cells.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      return cells;
    });
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      setFileName(file.name);
      setPreview(rows.slice(0, 6)); // Preview first 5 rows
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFile(file);
    }
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    const text = await file.text();
    const rows = parseCSV(text);

    // Convert CSV rows to JSON (skip header)
    const header = rows[0];
    const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim()));

    // Normalize header: snake_case → camelCase
    const normalizeRow = (row: string[]): Record<string, string> => {
      const obj: Record<string, string> = {};
      header.forEach((col, idx) => {
        const key = col.trim().toLowerCase();
        obj[key] = row[idx] ?? "";
      });
      return obj;
    };

    const normalized = dataRows.map(normalizeRow);

    // Build import payload
    const payload = normalized.map((r) => ({
      kode: r["kode"] ?? r["Kode"] ?? "",
      nama: r["nama"] ?? r["Nama"] ?? "",
      kategori: r["kategori"] ?? r["Kategori"] ?? "",
      satuan_dasar: r["satuan_dasar"] ?? r["Satuan Dasar"] ?? r["satuan"] ?? r["Satuan"] ?? "",
      minimum_stok: r["minimum_stok"] ?? r["Minimum Stok"] ?? r["min_stok"] ?? "0",
      konversi: r["konversi"] ?? r["Konversi"] ?? "",
    }));

    try {
      const data = await apiClient.post<ImportResult>("/api/inventory/items/bulk-import", { rows: payload });
      setResult(data);
    } catch {
      setResult({ success: false, total: 0, imported: 0, failed: 0, errors: [{ row: 0, field: "server", message: "Gagal terhubung ke server" }] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal
      open={true}
      onClose={onClose}
      title="Import Barang"
      subtitle="Upload file CSV untuk import barang secara bulk"
      maxWidth={600}
      footer={
        result ? (
          <>
            <GlassButton variant="secondary" onClick={onClose}>Tutup</GlassButton>
            {result.imported > 0 && (
              <GlassButton variant="primary" onClick={onClose}>
                <Check size={16} /> Selesai
              </GlassButton>
            )}
          </>
        ) : (
          <>
            <GlassButton variant="secondary" onClick={onClose}>Batal</GlassButton>
            <GlassButton variant="primary" onClick={handleImport} disabled={!fileName || loading}>
              {loading ? "Mengimport..." : "Import Sekarang"}
            </GlassButton>
          </>
        )
      }
    >
      {/* Template download */}
      <div style={{ marginBottom: 16 }}>
        <GlassButton
          variant="secondary"
          onClick={() => downloadTemplate("template_barang.csv", ITEM_TEMPLATE_CSV)}
          style={{ fontSize: 12, padding: "6px 12px" }}
        >
          <Download size={14} /> Download Template CSV
        </GlassButton>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>
          Kolom: kode, nama, kategori, satuan_dasar, minimum_stok, konversi
        </p>
      </div>

      {/* Drop zone */}
      {!result && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#1e3a5f" : "rgba(148,163,184,0.3)"}`,
            borderRadius: 12,
            padding: "32px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "rgba(30,58,95,0.05)" : "rgba(255,255,255,0.4)",
            transition: "all 0.2s ease",
            marginBottom: 12,
          }}
        >
          <FileSpreadsheet size={36} style={{ margin: "0 auto 8px", color: "#94a3b8" }} />
          <p style={{ margin: 0, fontWeight: 600, color: "#1e2d40", fontSize: 13 }}>
            {fileName ? fileName : "Drag & drop file CSV di sini, atau klik untuk pilih"}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>Format: CSV</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && !result && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#1e2d40", margin: "0 0 6px" }}>Preview ({preview.length - 1} baris)</p>
          <div style={{ overflowX: "auto", maxHeight: 180, overflowY: "auto" }}>
            <table style={{ fontSize: 11, borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr style={{ background: "rgba(148,163,184,0.08)" }}>
                  {preview[0].map((h, i) => (
                    <th key={i} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid rgba(148,163,184,0.15)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1, 5).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: "5px 8px", borderBottom: "1px solid rgba(148,163,184,0.08)", color: "#334155" }}>{cell || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#16a34a", margin: 0 }}>{result.imported}</p>
              <p style={{ fontSize: 11, color: "#16a34a", margin: 0 }}>Berhasil</p>
            </div>
            <div style={{ flex: 1, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#dc2626", margin: 0 }}>{result.failed}</p>
              <p style={{ fontSize: 11, color: "#dc2626", margin: 0 }}>Gagal</p>
            </div>
            <div style={{ flex: 1, background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#1e2d40", margin: 0 }}>{result.total}</p>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Total</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={14} /> Error per baris
              </p>
              <div style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.1)", borderRadius: 8, padding: "10px 12px", maxHeight: 160, overflowY: "auto" }}>
                {result.errors.map((err, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#334155", marginBottom: 4 }}>
                    <span style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626", borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>Baris {err.row}</span>
                    <span style={{ marginLeft: 6, color: "#94a3b8" }}>[{err.field}]</span>
                    <span style={{ marginLeft: 4 }}>{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </GlassModal>
  );
}

// ─── Item Form Modal ────────────────────────────────────────────────────────────
function ItemFormModal({
  item, onClose, onSave,
}: {
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
    <GlassModal
      open={true}
      onClose={onClose}
      title={item?.id ? "Edit Barang" : "Tambah Barang"}
      subtitle={item?.id ? "Perbarui detail barang" : "Tambahkan barang baru ke inventaris"}
      maxWidth={460}
      footer={
        <>
          <GlassButton variant="secondary" onClick={onClose}>Batal</GlassButton>
          <GlassButton
            variant="primary"
            onClick={() => { onSave(form as Item); onClose(); }}
          >
            Simpan
          </GlassButton>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>Kode Barang</label>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="BRG-001"
              style={{
                width: "100%", padding: "9px 12px",
                background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)",
                borderRadius: 10, fontSize: 13, color: "#1e2d40", outline: "none",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>Satuan Dasar</label>
            <input
              value={form.base_unit}
              onChange={(e) => setForm((f) => ({ ...f, base_unit: e.target.value }))}
              placeholder="PCS"
              style={{
                width: "100%", padding: "9px 12px",
                background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)",
                borderRadius: 10, fontSize: 13, color: "#1e2d40", outline: "none",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>Nama Barang</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nama barang..."
            style={{
              width: "100%", padding: "9px 12px",
              background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)",
              borderRadius: 10, fontSize: 13, color: "#1e2d40", outline: "none",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>Kategori</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            style={{
              width: "100%", padding: "9px 12px",
              background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)",
              borderRadius: 10, fontSize: 13, color: "#1e2d40", outline: "none",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            {CATEGORIES.slice(1).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>Minimum Stok</label>
          <input
            type="number"
            value={String(form.min_stock)}
            onChange={(e) => setForm((f) => ({ ...f, min_stock: Number(e.target.value) }))}
            style={{
              width: "100%", padding: "9px 12px",
              background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)",
              borderRadius: 10, fontSize: 13, color: "#1e2d40", outline: "none",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          />
        </div>
      </div>
    </GlassModal>
  );
}

// ─── Bulk Delete Confirmation ───────────────────────────────────────────────────
function BulkDeleteConfirm({
  selectedIds, onClose, onConfirm,
}: {
  selectedIds: string[]; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <GlassModal
      open={true}
      onClose={onClose}
      title="Hapus Barang Terpilih"
      subtitle={`Yakin ingin menghapus ${selectedIds.length} barang?`}
      maxWidth={420}
      footer={
        <>
          <GlassButton variant="secondary" onClick={onClose}>Batal</GlassButton>
          <GlassButton variant="primary" danger onClick={onConfirm}>
            Ya, Hapus
          </GlassButton>
        </>
      }
    >
      <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
        Barang yang dihapus akan dinonaktifkan (soft delete). Tindakan ini tidak dapat dibatalkan.
      </p>
    </GlassModal>
  );
}

// ─── Main Inventory Page ────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Item> | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const filtered = items.filter(i =>
    (category === "Semua" || i.category === category) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleSave = (data: Partial<Item>) => {
    if (editItem?.id) {
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? { ...i, ...data } as Item : i)));
    } else {
      const newItem: Item = { id: `item-${Date.now()}`, total_stock: 0, is_active: true, units: [], ...data } as Item;
      setItems((prev) => [...prev, newItem]);
    }
    setEditItem(undefined);
  };

  const handleDelete = (item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setDeleteTarget(null);
  };

  const handleBulkDelete = () => {
    setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setShowBulkDelete(false);
  };

  return (
    <div className="glass-page-enter" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e2d40", letterSpacing: "-0.3px", margin: "0 0 4px" }}>
            Daftar Barang
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            {items.length} barang terdaftar
            {selectedIds.size > 0 && (
              <span style={{ marginLeft: 8, color: "#1e3a5f", fontWeight: 600 }}>
                · {selectedIds.size} dipilih
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <GlassButton variant="secondary" onClick={() => setShowImportModal(true)}>
            <Upload size={16} /> Import
          </GlassButton>
          <GlassButton onClick={() => { setEditItem(undefined); setShowModal(true); }}>
            <Plus size={16} /> Tambah Barang
          </GlassButton>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau kode barang..."
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

        {/* Category pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: "6px 14px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                border: category === c ? "none" : "1px solid rgba(255,255,255,0.9)",
                background: category === c
                  ? "linear-gradient(135deg, #1e3a5f, #2d5a9e)"
                  : "rgba(255,255,255,0.65)",
                backdropFilter: "blur(12px)",
                color: category === c ? "#ffffff" : "#94a3b8",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                boxShadow: category === c ? "0 2px 8px rgba(30,58,95,0.25)" : "none",
              }}
            >
              {c}
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
                <th style={{ padding: "12px 10px", textAlign: "center", width: 44 }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1e3a5f" }}
                  />
                </th>
                {["Kode", "Nama Barang", "Kategori", "Satuan", "Total Stok", "Min. Stok", "Status", "Aksi"].map((h) => (
                  <th key={h} style={{
                    textAlign: h === "Total Stok" || h === "Min. Stok" ? "right" : "left",
                    padding: "12px 16px",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.05em",
                    color: "#94a3b8",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <Package size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>Tidak ada barang ditemukan</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const low = item.total_stock <= item.min_stock;
                  const checked = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid rgba(148,163,184,0.08)",
                        background: checked ? "rgba(30,58,95,0.05)" : "transparent",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = "rgba(226,232,240,0.5)"; }}
                      onMouseLeave={(e) => { if (!checked) e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(item.id)}
                          style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1e3a5f" }}
                        />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <code style={{
                          background: "rgba(148,163,184,0.12)",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontFamily: "'DM Sans', monospace",
                          color: "#1e3a5f",
                        }}>{item.code}</code>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e2d40" }}>{item.name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          display: "inline-block", padding: "3px 10px", borderRadius: 9999,
                          fontSize: 11, fontWeight: 600,
                          background: "rgba(148,163,184,0.12)",
                          color: "#475569",
                        }}>{item.category}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                        <div>{item.base_unit}</div>
                        {item.units.map((u) => (
                          <div key={u.unit_name} style={{ fontSize: 11, color: "#94a3b8", opacity: 0.7 }}>
                            1 {u.unit_name} = {u.conversion_ratio} {item.base_unit}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, color: low ? "#dc2626" : "#1e2d40", fontVariantNumeric: "tabular-nums" }}>
                        {formatNumber(item.total_stock)}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
                        {formatNumber(item.min_stock)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {low ? (
                          <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 600, background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
                            Menipis
                          </span>
                        ) : (
                          <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 600, background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>
                            Aktif
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => { setEditItem(item); setShowModal(true); }}
                            style={{
                              padding: "6px 8px",
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
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            style={{
                              padding: "6px 8px",
                              background: "rgba(239,68,68,0.10)",
                              border: "1px solid rgba(239,68,68,0.15)",
                              borderRadius: 8,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              color: "#dc2626",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* WhatsApp-style floating action bar */}
      {selectedIds.size > 0 && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 20px",
          background: "#1e3a5f",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(30,58,95,0.4)",
          zIndex: 1000,
          animation: "slideUp 0.2s ease",
        }}>
          <style>{`@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }`}</style>
          <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>
            {selectedIds.size} dipilih
          </span>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />
          <button
            onClick={() => setShowBulkDelete(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px",
              background: "rgba(239,68,68,0.9)",
              border: "none",
              borderRadius: 10,
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            <Trash2 size={15} /> Hapus
          </button>
          <button
            onClick={clearSelection}
            style={{
              display: "flex", alignItems: "center",
              padding: "8px 10px",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 10,
              color: "white",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <ItemFormModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(undefined); }}
          onSave={handleSave}
        />
      )}

      {showImportModal && (
        <BulkImportModal onClose={() => setShowImportModal(false)} />
      )}

      {deleteTarget && (
        <GlassConfirmModal
          open={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
          title="Hapus Barang"
          message={`Yakin ingin menghapus "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Ya, Hapus"
          cancelLabel="Batal"
          danger
        />
      )}

      {showBulkDelete && (
        <BulkDeleteConfirm
          selectedIds={Array.from(selectedIds)}
          onClose={() => setShowBulkDelete(false)}
          onConfirm={handleBulkDelete}
        />
      )}
    </div>
  );
}