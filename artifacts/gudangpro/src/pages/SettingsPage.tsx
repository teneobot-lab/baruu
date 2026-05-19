import React, { useState } from "react";
import { Warehouse, Users, Building2, Settings2, Plus, Edit2, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "gudang" | "mitra" | "pengguna" | "konfigurasi";

interface Gudang { id: string; name: string; location: string; pic: string; phone: string; is_active: boolean; }
interface Mitra { id: string; type: "SUPPLIER" | "CUSTOMER"; name: string; phone: string; email: string; address: string; }
interface Pengguna { id: string; username: string; full_name: string; role: "ADMIN" | "MANAGER" | "OPERATOR"; status: "ACTIVE" | "INACTIVE"; }

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
  { key: "gudang", label: "Gudang", icon: Warehouse },
  { key: "mitra", label: "Mitra", icon: Building2 },
  { key: "pengguna", label: "Pengguna", icon: Users },
  { key: "konfigurasi", label: "Konfigurasi", icon: Settings2 },
];

function GudangTab() {
  const [items, setItems] = useState<Gudang[]>(MOCK_GUDANG);
  const [editing, setEditing] = useState<Gudang | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} gudang terdaftar</p>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> Tambah Gudang
        </button>
      </div>
      <div className="grid gap-3">
        {items.map(g => (
          <div key={g.id} className="bg-background border border-border rounded-xl p-4 flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Warehouse className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{g.name}</span>
                {g.is_active
                  ? <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Aktif</span>
                  : <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Nonaktif</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{g.location}</p>
              <p className="text-xs text-muted-foreground">PIC: {g.pic} · {g.phone}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setEditing(g); setShowForm(true); }}
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setItems(prev => prev.filter(i => i.id !== g.id))}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MitraTab() {
  const [items, setItems] = useState<Mitra[]>(MOCK_MITRA);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} mitra terdaftar</p>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> Tambah Mitra
        </button>
      </div>
      <div className="grid gap-3">
        {items.map(m => (
          <div key={m.id} className="bg-background border border-border rounded-xl p-4 flex items-start gap-4">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
              m.type === "SUPPLIER" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
            )}>
              {m.type === "SUPPLIER" ? "S" : "C"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{m.name}</span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full",
                  m.type === "SUPPLIER" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                )}>
                  {m.type === "SUPPLIER" ? "Supplier" : "Pelanggan"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{m.phone} · {m.email}</p>
              <p className="text-xs text-muted-foreground">{m.address}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => setItems(prev => prev.filter(i => i.id !== m.id))}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PenggunaTab() {
  const [users, setUsers] = useState<Pengguna[]>(MOCK_USERS);
  const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-red-500/10 text-red-600 dark:text-red-400",
    MANAGER: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    OPERATOR: "bg-green-500/10 text-green-600 dark:text-green-400",
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{users.length} pengguna aktif</p>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> Tambah Pengguna
        </button>
      </div>
      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
            <th className="text-left px-5 py-3 font-medium">Nama</th>
            <th className="text-left px-4 py-3 font-medium">Username</th>
            <th className="text-left px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ROLE_COLORS[u.role])}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {u.status === "ACTIVE"
                    ? <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Aktif</span>
                    : <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Nonaktif</span>}
                </td>
                <td className="px-5 py-3 text-center">
                  <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KonfigurasiTab() {
  const [currency, setCurrency] = useState("IDR (Rp)");
  const [company, setCompany] = useState("GudangPro Demo");
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="block text-xs font-medium mb-1.5">Nama Perusahaan</label>
        <input value={company} onChange={e => setCompany(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5">Mata Uang</label>
        <select value={currency} onChange={e => setCurrency(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring">
          <option>IDR (Rp)</option>
          <option>USD ($)</option>
        </select>
      </div>
      <div className="flex items-center justify-between py-3 border-t border-border">
        <div>
          <p className="text-sm font-medium">Notifikasi Stok Menipis</p>
          <p className="text-xs text-muted-foreground">Tampilkan peringatan saat stok di bawah minimum</p>
        </div>
        <button
          onClick={() => setLowStockAlert(v => !v)}
          className={cn("w-10 h-6 rounded-full transition-colors relative", lowStockAlert ? "bg-primary" : "bg-muted")}
        >
          <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
            lowStockAlert ? "translate-x-4" : "translate-x-0.5"
          )} />
        </button>
      </div>
      <button onClick={handleSave}
        className={cn("flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all",
          saved ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:opacity-90"
        )}>
        {saved ? <><Check className="w-4 h-4" /> Tersimpan</> : "Simpan Konfigurasi"}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("gudang");

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold">Pengaturan</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola gudang, mitra, pengguna, dan konfigurasi sistem</p>
      </div>

      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors",
                tab === t.key ? "bg-card shadow-sm font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in-up">
        {tab === "gudang" && <GudangTab />}
        {tab === "mitra" && <MitraTab />}
        {tab === "pengguna" && <PenggunaTab />}
        {tab === "konfigurasi" && <KonfigurasiTab />}
      </div>
    </div>
  );
}
