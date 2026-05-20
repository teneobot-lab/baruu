import React, { useState, useRef } from "react";
import { Plus, Search, Eye, ArrowDown, ArrowUp, ArrowLeftRight, Sliders, Upload, Download, FileSpreadsheet, Check, AlertCircle } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
import { TransactionForm, type TxType, type TxFormData } from "@/components/TransactionForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassButton } from "@/components/ui/GlassButton";

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

// ─── Template CSV ───────────────────────────────────────────────────────────────
const TX_TEMPLATE_CSV = [
  "tipe,tanggal,gudang_asal,gudang_tujuan,mitra,no_sj,kode_barang,jumlah,satuan,catatan",
  "IN,2026-05-20,Nama Gudang,,Nama Supplier,,BRG-001,10,PCS,",
  "OUT,2026-05-20,Nama Gudang,,Nama Customer,,BRG-001,5,PCS,",
  "TRANSFER,2026-05-20,Gudang Asal,Gudang Tujuan,,,BRG-001,3,PCS,",
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

interface SavedTx {
  id: string; refNo: string; type: TxType; date: string;
  warehouseName: string; destWarehouseName?: string;
  partnerName: string; itemCount: number; total: number;
}

const MOCK_TX: SavedTx[] = [
  { id: "tx-001", refNo: "IN-20260519-0001", type: "IN", date: "2026-05-19", warehouseName: "Gudang Utama", partnerName: "PT Maju Jaya Supplier", itemCount: 2, total: 2080000 },
];

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
      setPreview(rows.slice(0, 6));
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

    const header = rows[0];
    const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim()));

    const normalizeRow = (row: string[]): Record<string, string> => {
      const obj: Record<string, string> = {};
      header.forEach((col, idx) => {
        const key = col.trim().toLowerCase().replace(/\s+/g, "_");
        obj[key] = row[idx] ?? "";
      });
      return obj;
    };

    const normalized = dataRows.map(normalizeRow);

    const payload = normalized.map((r) => ({
      tipe: r["tipe"] ?? "",
      tanggal: r["tanggal"] ?? "",
      gudang_asal: r["gudang_asal"] ?? "",
      gudang_tujuan: r["gudang_tujuan"] ?? "",
      mitra: r["mitra"] ?? "",
      no_sj: r["no_sj"] ?? "",
      kode_barang: r["kode_barang"] ?? "",
      jumlah: Number(r["jumlah"] ?? "0"),
      satuan: r["satuan"] ?? "",
      catatan: r["catatan"] ?? "",
    }));

    try {
      const res = await fetch("/api/transactions/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      const data = await res.json();
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
      title="Import Transaksi"
      subtitle="Upload file CSV untuk import transaksi secara bulk"
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
          onClick={() => downloadTemplate("template_transaksi.csv", TX_TEMPLATE_CSV)}
          style={{ fontSize: 12, padding: "6px 12px" }}
        >
          <Download size={14} /> Download Template CSV
        </GlassButton>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>
          Kolom: tipe, tanggal, gudang_asal, gudang_tujuan, mitra, no_sj, kode_barang, jumlah, satuan, catatan
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

// ─── Detail Modal ───────────────────────────────────────────────────────────────
interface SavedTx {
  id: string; refNo: string; type: TxType; date: string;
  warehouseName: string; destWarehouseName?: string;
  partnerName: string; itemCount: number; total: number;
}

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

// ─── Main Transactions Page ─────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<SavedTx[]>(MOCK_TX);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<TxType | "ALL">("ALL");
  const [showForm, setShowForm] = useState<TxType | null>(null);
  const [viewTx, setViewTx] = useState<SavedTx | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

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
        <div style={{ display: "flex", gap: 8 }}>
          <GlassButton variant="secondary" onClick={() => setShowImportModal(true)}>
            <Upload size={16} /> Import
          </GlassButton>
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

      {/* Import modal */}
      {showImportModal && <BulkImportModal onClose={() => setShowImportModal(false)} />}
    </div>
  );
}