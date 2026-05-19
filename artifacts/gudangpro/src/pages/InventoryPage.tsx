import React, { useState } from "react";
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassCardSubtle } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassInput";
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
          <GlassInput
            label="Kode Barang"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            placeholder="BRG-001"
          />
          <GlassInput
            label="Satuan Dasar"
            value={form.base_unit}
            onChange={e => setForm(f => ({ ...f, base_unit: e.target.value }))}
            placeholder="PCS"
          />
        </div>
        <GlassInput
          label="Nama Barang"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Nama barang..."
        />
        <GlassSelect
          label="Kategori"
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          options={CATEGORIES.slice(1).map(c => ({ value: c, label: c }))}
        />
        <GlassInput
          label="Minimum Stok"
          type="number"
          value={String(form.min_stock)}
          onChange={e => setForm(f => ({ ...f, min_stock: Number(e.target.value) }))}
        />
      </div>
    </GlassModal>
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Item> | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);

  const filtered = items.filter(i =>
    (category === "Semua" || i.category === category) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = (data: Partial<Item>) => {
    if (editItem?.id) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...data } : i));
    } else {
      const newItem: Item = { id: `item-${Date.now()}`, total_stock: 0, is_active: true, units: [], ...data } as Item;
      setItems(prev => [...prev, newItem]);
    }
    setEditItem(undefined);
  };

  const handleDelete = (item: Item) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
    setDeleteTarget(null);
  };

  return (
    <div className="glass-page-enter" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e2d40", letterSpacing: "-0.3px", margin: "0 0 4px" }}>
            Daftar Barang
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{items.length} barang terdaftar</p>
        </div>
        <GlassButton onClick={() => { setEditItem(undefined); setShowModal(true); }}>
          <Plus size={16} /> Tambah Barang
        </GlassButton>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
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
          {CATEGORIES.map(c => (
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
                {["Kode", "Nama Barang", "Kategori", "Satuan", "Total Stok", "Min. Stok", "Status", "Aksi"].map(h => (
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
                  <td colSpan={8} style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <Package size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>Tidak ada barang ditemukan</p>
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const low = item.total_stock <= item.min_stock;
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(226,232,240,0.5)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
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
                      <td style={{ padding: "12px 16px" }}><GlassBadge type={item.category} label={item.category} /></td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                        <div>{item.base_unit}</div>
                        {item.units.map(u => (
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
                          <GlassBadge type="CRITICAL" label="Menipis" />
                        ) : (
                          <GlassBadge type={item.is_active ? "ACTIVE" : "INACTIVE"} />
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

      {showModal && (
        <ItemFormModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(undefined); }}
          onSave={handleSave}
        />
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
    </div>
  );
}