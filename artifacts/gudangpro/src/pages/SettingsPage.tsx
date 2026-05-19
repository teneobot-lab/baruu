import React, { useState } from "react";
import { Warehouse, Building2, Users, Settings2, Plus, Edit2, Trash2, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassCardSubtle } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassModal } from "@/components/ui/GlassModal";

type Tab = "gudang" | "mitra" | "pengguna" | "konfigurasi";

interface Gudang { id: string; name: string; location: string; pic: string; phone: string; is_active: boolean; }
interface Mitra { id: string; type: "SUPPLIER" | "CUSTOMER"; name: string; phone: string; email: string; address: string; }
interface Pengguna { id: string; username: string; full_name: string; role: "ADMIN" | "MANAGER" | "STAFF"; status: "ACTIVE" | "INACTIVE"; }

const MOCK_GUDANG: Gudang[] = [
  { id: "wh-001", name: "Gudang Utama", location: "Jl. Industri No. 1, Jakarta", pic: "Ahmad Fauzi", phone: "021-1234567", is_active: true },
  { id: "wh-002", name: "Gudang Cabang Selatan", location: "Jl. Raya Selatan No. 5, Bekasi", pic: "Siti Rahayu", phone: "021-7654321", is_active: true },
];
const MOCK_MITRA: Mitra[] = [
  { id: "pt-001", type: "SUPPLIER", name: "PT Maju Jaya Supplier", phone: "021-9876543", email: "supplier@majujaya.co.id", address: "Jl. Supplier No. 10, Jakarta" },
  { id: "pt-002", type: "CUSTOMER", name: "Toko Berkah Abadi", phone: "021-1111222", email: "toko@berkah.co.id", address: "Jl. Pelanggan No. 3, Tangerang" },
];
const MOCK_USERS: Pengguna[] = [
  { id: "u-001", username: "admin", full_name: "Administrator", role: "ADMIN", status: "ACTIVE" },
  { id: "u-002", username: "manager", full_name: "Budi Santoso", role: "MANAGER", status: "ACTIVE" },
];

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "gudang",       label: "Gudang",       icon: Warehouse },
  { key: "mitra",        label: "Mitra",        icon: Building2 },
  { key: "pengguna",     label: "Pengguna",     icon: Users },
  { key: "konfigurasi",   label: "Konfigurasi",   icon: Settings2 },
];

function GudangTab() {
  const [items, setItems] = useState<Gudang[]>(MOCK_GUDANG);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{items.length} gudang terdaftar</p>
        <GlassButton><Plus size={14} /> Tambah Gudang</GlassButton>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map(g => (
          <GlassCardSubtle key={g.id} style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{
              width: 40, height: 40, background: "rgba(59,130,246,0.12)", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Warehouse size={18} color="#1e3a5f" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>{g.name}</span>
                {g.is_active
                  ? <GlassBadge type="ACTIVE" />
                  : <GlassBadge type="INACTIVE" />}
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 2px" }}>{g.location}</p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>PIC: {g.pic} · {g.phone}</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button style={{ padding: "8px 9px", background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", color: "#1e3a5f" }}><Edit2 size={14} /></button>
              <button onClick={() => setItems(prev => prev.filter(i => i.id !== g.id))} style={{ padding: "8px 9px", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", color: "#dc2626" }}><Trash2 size={14} /></button>
            </div>
          </GlassCardSubtle>
        ))}
      </div>
    </div>
  );
}

function MitraTab() {
  const [items, setItems] = useState<Mitra[]>(MOCK_MITRA);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{items.length} mitra terdaftar</p>
        <GlassButton><Plus size={14} /> Tambah Mitra</GlassButton>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map(m => (
          <GlassCardSubtle key={m.id} style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, flexShrink: 0,
              background: m.type === "SUPPLIER" ? "rgba(16,185,129,0.12)" : "rgba(139,92,246,0.12)",
              color: m.type === "SUPPLIER" ? "#047857" : "#6d28d9",
            }}>
              {m.type === "SUPPLIER" ? "S" : "C"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1e2d40" }}>{m.name}</span>
                <GlassBadge type={m.type === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER"} />
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 2px" }}>{m.phone} · {m.email}</p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{m.address}</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button style={{ padding: "8px 9px", background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", color: "#1e3a5f" }}><Edit2 size={14} /></button>
              <button onClick={() => setItems(prev => prev.filter(i => i.id !== m.id))} style={{ padding: "8px 9px", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", color: "#dc2626" }}><Trash2 size={14} /></button>
            </div>
          </GlassCardSubtle>
        ))}
      </div>
    </div>
  );
}

function PenggunaTab() {
  const [users, setUsers] = useState<Pengguna[]>(MOCK_USERS);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{users.length} pengguna aktif</p>
        <GlassButton><Plus size={14} /> Tambah Pengguna</GlassButton>
      </div>
      <GlassCard style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(148,163,184,0.08)" }}>
              {["Nama", "Username", "Role", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "#94a3b8", whiteSpace: "nowrap" }}>{h}</th>
              ))}
              <th style={{ padding: "12px 16px" }} />
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(226,232,240,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e2d40" }}>{u.full_name}</td>
                <td style={{ padding: "12px 16px", color: "#94a3b8", fontFamily: "'DM Sans', monospace", fontSize: 12 }}>{u.username}</td>
                <td style={{ padding: "12px 16px" }}>
                  <GlassBadge type={u.role} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {u.status === "ACTIVE"
                    ? <GlassBadge type="ACTIVE" label="Aktif" />
                    : <GlassBadge type="INACTIVE" label="Nonaktif" />}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button style={{ padding: "7px 9px", background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", color: "#1e3a5f" }}>
                    <Edit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

function KonfigurasiTab() {
  const [saved, setSaved] = useState(false);
  const [currency, setCurrency] = useState("IDR (Rp)");
  const [company, setCompany] = useState("GudangPro Demo");
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [showAlert, setShowAlert] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
      <GlassCard style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Nama Perusahaan</div>
          <input
            value={company}
            onChange={e => setCompany(e.target.value)}
            style={{
              width: "100%", background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.9)", borderRadius: 12, padding: "10px 14px",
              fontSize: 13, color: "#1e2d40", fontFamily: "'DM Sans', system-ui, sans-serif",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Mata Uang</div>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            style={{
              width: "100%", background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.9)", borderRadius: 12, padding: "10px 14px",
              fontSize: 13, color: "#1e2d40", fontFamily: "'DM Sans', system-ui, sans-serif",
              outline: "none", cursor: "pointer", boxSizing: "border-box",
            }}
          >
            <option>IDR (Rp)</option>
            <option>USD ($)</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid rgba(148,163,184,0.12)" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>Notifikasi Stok Menipis</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Tampilkan peringatan saat stok di bawah minimum</div>
          </div>
          <button
            onClick={() => setShowAlert(v => !v)}
            style={{
              width: 44, height: 24, borderRadius: 9999, transition: "background 0.2s ease",
              background: showAlert ? "linear-gradient(135deg, #1e3a5f, #2d5a9e)" : "rgba(148,163,184,0.25)",
              border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute", top: 3, left: showAlert ? 22 : 3,
              width: 18, height: 18, borderRadius: "50%", background: "#ffffff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)", transition: "left 0.2s ease",
            }} />
          </button>
        </div>
        <div>
          <GlassButton
            variant={saved ? "secondary" : "primary"}
            onClick={handleSave}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {saved ? (
              <><Check size={16} /> Tersimpan</>
            ) : (
              "Simpan Konfigurasi"
            )}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("gudang");

  return (
    <div className="glass-page-enter" style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e2d40", letterSpacing: "-0.3px", margin: "0 0 4px" }}>
          Pengaturan
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
          Kelola gudang, mitra, pengguna, dan konfigurasi sistem
        </p>
      </div>

      {/* Tab pill navigation */}
      <div style={{
        display: "flex", gap: 6, padding: "6px", background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.9)", borderRadius: 14, width: "fit-content",
      }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10,
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                border: "none",
                background: active
                  ? "linear-gradient(135deg, #1e3a5f, #2d5a9e)"
                  : "transparent",
                color: active ? "#ffffff" : "#94a3b8",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                boxShadow: active ? "0 2px 8px rgba(30,58,95,0.3)" : "none",
              }}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <GlassCard style={{ padding: 20 }}>
        {tab === "gudang" && <GudangTab />}
        {tab === "mitra" && <MitraTab />}
        {tab === "pengguna" && <PenggunaTab />}
        {tab === "konfigurasi" && <KonfigurasiTab />}
      </GlassCard>
    </div>
  );
}