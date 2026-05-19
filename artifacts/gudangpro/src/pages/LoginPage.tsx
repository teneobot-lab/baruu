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
        const { token: _token, ...sessionData } = data as { token?: string; id: string; username: string; fullName: string; role: string };
        void _token;
        setSession(sessionData as Parameters<typeof setSession>[0]);
        navigate("/dashboard");
      }
    } catch {
      setError("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #dde8f5 0%, #e8eef8 40%, #d6e4f0 100%)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        position: "relative",
      }}
    >
      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, left: -80, width: 500, height: 500, background: "radial-gradient(circle, rgba(147,197,253,0.55) 0%, rgba(147,197,253,0.15) 45%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -100, right: 100, width: 420, height: 420, background: "radial-gradient(circle, rgba(196,181,253,0.42) 0%, rgba(196,181,253,0.1) 40%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "40%", right: 20, width: 280, height: 280, background: "radial-gradient(circle, rgba(167,243,208,0.32) 0%, rgba(167,243,208,0.08) 35%, transparent 60%)", borderRadius: "50%" }} />
      </div>

      {/* Left panel — branding */}
      <div
        style={{
          display: "none",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 40px",
          position: "relative",
          zIndex: 1,
        }}
        className="lg:flex"
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            background: "linear-gradient(135deg, #1e3a5f, #2d5a9e)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(30,58,95,0.3)",
          }}>
            <Warehouse size={20} color="#ffffff" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#1e3a5f", letterSpacing: "-0.3px" }}>
            GudangPro
          </span>
        </div>

        {/* Main text */}
        <div>
          <blockquote style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#1e3a5f",
            lineHeight: 1.35,
            letterSpacing: "-0.4px",
            margin: "0 0 12px",
          }}>
            "Kelola stok gudang Anda dengan mudah, cepat, dan akurat."
          </blockquote>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, margin: 0, maxWidth: 380 }}>
            Sistem Manajemen Inventaris Gudang modern untuk bisnis Indonesia.
          </p>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 32 }}>
            {[
              { value: "Multi", label: "Gudang" },
              { value: "Real-time", label: "Transaksi" },
              { value: "Lengkap", label: "Laporan" },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.9)",
                borderRadius: "16px",
                padding: "16px 14px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1e3a5f", marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          &copy; {new Date().getFullYear()} GudangPro
        </div>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.95)",
            borderRadius: "24px",
            boxShadow: "0 8px 32px rgba(148,163,184,0.22), 0 2px 8px rgba(148,163,184,0.12)",
            padding: "36px 32px",
          }}
          className="glass-page-enter"
        >
          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }} className="lg:hidden">
            <div style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #1e3a5f, #2d5a9e)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Warehouse size={18} color="#ffffff" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#1e3a5f", letterSpacing: "-0.3px" }}>
              GudangPro
            </span>
          </div>

          <h2 style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#1e2d40",
            letterSpacing: "-0.4px",
            margin: "0 0 4px",
          }}>
            Masuk ke Sistem
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 28px" }}>
            Masukkan kredensial Anda untuk melanjutkan.
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Username */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label htmlFor="username" style={{ fontSize: 12, fontWeight: 600, color: "#334155", letterSpacing: "0.01em" }}>
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                autoComplete="username"
                style={{
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.9)",
                  borderRadius: 12,
                  padding: "11px 14px",
                  fontSize: 13,
                  color: "#1e2d40",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.9)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label htmlFor="password" style={{ fontSize: 12, fontWeight: 600, color: "#334155", letterSpacing: "0.01em" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  autoComplete="current-password"
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.9)",
                    borderRadius: 12,
                    padding: "11px 40px 11px 14px",
                    fontSize: 13,
                    color: "#1e2d40",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.9)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "#94a3b8",
                    padding: 4,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.10)",
                color: "#dc2626",
                fontSize: 13,
                fontWeight: 500,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(239,68,68,0.2)",
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: loading
                  ? "rgba(30,58,95,0.7)"
                  : "linear-gradient(135deg, #1e3a5f, #2d5a9e)",
                color: "#ffffff",
                border: "none",
                borderRadius: 12,
                padding: "12px",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                boxShadow: "0 2px 12px rgba(30,58,95,0.35)",
                transition: "all 0.18s ease",
                letterSpacing: "0.01em",
              }}
            >
              {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{
            marginTop: 20,
            padding: "12px 14px",
            background: "rgba(148,163,184,0.08)",
            borderRadius: 12,
            border: "1px solid rgba(148,163,184,0.15)",
            fontSize: 12,
            color: "#94a3b8",
            lineHeight: 1.7,
          }}>
            <p style={{ fontWeight: 600, color: "#334155", margin: "0 0 4px" }}>Demo Login:</p>
            <p>Admin: <code style={{ background: "rgba(148,163,184,0.12)", padding: "1px 6px", borderRadius: 4, fontFamily: "'DM Sans', monospace", color: "#1e3a5f" }}>admin</code> / <code style={{ background: "rgba(148,163,184,0.12)", padding: "1px 6px", borderRadius: 4, fontFamily: "'DM Sans', monospace", color: "#1e3a5f" }}>admin123</code></p>
            <p>Manager: <code style={{ background: "rgba(148,163,184,0.12)", padding: "1px 6px", borderRadius: 4, fontFamily: "'DM Sans', monospace", color: "#1e3a5f" }}>manager</code> / <code style={{ background: "rgba(148,163,184,0.12)", padding: "1px 6px", borderRadius: 4, fontFamily: "'DM Sans', monospace", color: "#1e3a5f" }}>manager123</code></p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}