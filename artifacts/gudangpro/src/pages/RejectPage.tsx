import React, { useState } from "react";
import { AlertTriangle, Plus, Search, Eye } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassConfirmModal } from "@/components/ui/GlassModal";
import { GlassInput } from "@/components/ui/GlassInput";

interface RejectBatch {
  id: string; batch_no: string; outlet: string; date: string;
  status: "PENDING" | "PROCESSED" | "DISPOSED";
  total_items: number; notes?: string;
  items: { name: string; code: string; qty: number; reason: string }[];
}

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

function DetailModal({ batch, onClose }: { batch: RejectBatch; onClose: () => void }) {
  return (
    <GlassModal
      open={true}
      onClose={onClose}
      title={batch.batch_no}
      subtitle={`${formatDate(batch.date)} · ${batch.outlet}`}
      maxWidth={480}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <GlassBadge type={batch.status} />
        </div>
        {batch.notes && (
          <div style={{ fontSize: 12, color: "#94a3b8", padding: "8px 12px", background: "rgba(148,163,184,0.08)", borderRadius: 8 }}>
            {batch.notes}
          </div>
        )}
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
              {["Barang", "Jumlah", "Alasan"].map(h => (
                <th key={h} style={{ textAlign: h === "Jumlah" ? "right" : "left", padding: "8px 0", fontWeight: 600, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batch.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
                <td style={{ padding: "10px 0" }}>
                  <div style={{ fontWeight: 600, color: "#1e2d40" }}>{item.name}</div>
                  <code style={{ fontSize: 11, color: "#94a3b8" }}>{item.code}</code>
                </td>
                <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>
                  {formatNumber(item.qty)}
                </td>
                <td style={{ padding: "10px 0", paddingLeft: 16, color: "#94a3b8", fontSize: 12 }}>
                  {item.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassModal>
  );
}

export default function RejectPage() {
  const [batches, setBatches] = useState<RejectBatch[]>(MOCK_BATCHES);
  const [search, setSearch] = useState("");
  const [viewBatch, setViewBatch] = useState<RejectBatch | null>(null);

  const filtered = batches.filter(b =>
    b.batch_no.toLowerCase().includes(search.toLowerCase()) ||
    b.outlet.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total: batches.length,
    pending: batches.filter(b => b.status === "PENDING").length,
    disposed: batches.filter(b => b.status === "DISPOSED").length,
  };

  return (
    <div className="glass-page-enter" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e2d40", letterSpacing: "-0.3px", margin: "0 0 4px" }}>
            Modul Reject
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            Pengelolaan barang reject & retur
          </p>
        </div>
        <GlassButton>
          <Plus size={16} /> Buat Batch Reject
        </GlassButton>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { label: "Total Batch", value: counts.total, color: "#1e2d40" },
          { label: "Menunggu", value: counts.pending, color: "#b45309" },
          { label: "Dibuang", value: counts.disposed, color: "#dc2626" },
        ].map(s => (
          <GlassCard key={s.label} style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: "-0.5px" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {s.label}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari batch, outlet..."
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

      {/* Table */}
      <GlassCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(148,163,184,0.08)" }}>
                {["No. Batch", "Outlet", "Tanggal", "Total Item", "Status"].map(h => (
                  <th key={h} style={{
                    textAlign: h === "Total Item" ? "right" : "left",
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
                  <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <AlertTriangle size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>Belum ada data reject</p>
                  </td>
                </tr>
              ) : (
                filtered.map(b => (
                  <tr key={b.id}
                    style={{ borderBottom: "1px solid rgba(148,163,184,0.08)", transition: "background 0.15s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(226,232,240,0.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <code style={{ fontFamily: "'DM Sans', monospace", fontSize: 12, fontWeight: 700, color: "#1e3a5f" }}>
                        {b.batch_no}
                      </code>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e2d40" }}>{b.outlet}</td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{formatDate(b.date)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#334155", fontVariantNumeric: "tabular-nums" }}>
                      {b.total_items}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <GlassBadge type={b.status} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => setViewBatch(b)}
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

      {viewBatch && <DetailModal batch={viewBatch} onClose={() => setViewBatch(null)} />}
    </div>
  );
}