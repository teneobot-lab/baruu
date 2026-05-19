import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Warehouse, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { setSession } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login gagal");
      } else {
        setSession(data);
        navigate("/dashboard");
      }
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-sidebar text-sidebar-foreground p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sidebar-primary rounded-xl flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-sidebar-accent-foreground">GudangPro</span>
        </div>
        <div>
          <blockquote className="text-2xl font-semibold text-sidebar-accent-foreground leading-snug mb-4">
            "Kelola stok gudang Anda dengan mudah, cepat, dan akurat."
          </blockquote>
          <p className="text-sidebar-foreground/60 text-sm">
            Sistem Manajemen Inventaris Gudang modern untuk bisnis Indonesia.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Gudang", value: "Multi" },
            { label: "Transaksi", value: "Real-time" },
            { label: "Laporan", value: "Lengkap" },
          ].map(s => (
            <div key={s.label} className="bg-sidebar-accent/30 rounded-xl p-4">
              <div className="font-bold text-sidebar-primary text-lg">{s.value}</div>
              <div className="text-xs text-sidebar-foreground/60">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">GudangPro</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">Masuk ke Sistem</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Masukkan kredensial Anda untuk melanjutkan.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Username</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full px-3 py-2 pr-10 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:opacity-90 disabled:opacity-60 transition-all text-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-border text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Demo Login:</p>
            <p>Admin: <code className="bg-background px-1 rounded">admin</code> / <code className="bg-background px-1 rounded">admin123</code></p>
            <p>Manager: <code className="bg-background px-1 rounded">manager</code> / <code className="bg-background px-1 rounded">manager123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
