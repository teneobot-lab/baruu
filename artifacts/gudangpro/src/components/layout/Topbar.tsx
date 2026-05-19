import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getTheme, applyTheme } from "@/lib/theme";
import { formatDateLong, formatTime } from "@/lib/utils";

const PAGE_TITLES: Record<string, { title: string; section?: string }> = {
  "/dashboard":        { title: "Dashboard",    section: "Ringkasan Aktivitas" },
  "/inventory":         { title: "Inventaris",    section: "Daftar Barang" },
  "/inventory/stok":    { title: "Inventaris",    section: "Stok per Gudang" },
  "/transaksi":         { title: "Transaksi",     section: "Riwayat Transaksi" },
  "/reject":            { title: "Modul Reject",  section: "Barang Reject & Retur" },
  "/pengaturan":         { title: "Pengaturan",     section: "Konfigurasi Sistem" },
};

function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.3 }}>
      <span style={{
        fontFamily: "'DM Sans', monospace",
        fontSize: 15,
        fontWeight: 600,
        color: "#1e2d40",
        letterSpacing: "0.01em",
        fontVariantNumeric: "tabular-nums",
      }}>
        {formatTime(now)}
      </span>
      <span style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.02em" }}>
        {formatDateLong(now)}
      </span>
    </div>
  );
}

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Daftar Barang", href: "/inventory" },
    { label: "Transaksi", href: "/transaksi" },
    { label: "Modul Reject", href: "/reject" },
    { label: "Pengaturan", href: "/pengaturan" },
  ].filter(r => !query || r.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.9)",
          borderRadius: 10,
          cursor: "pointer",
          fontSize: 13,
          color: "#94a3b8",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          width: 200,
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.08)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.9)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <Search size={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Cari...</span>
        <kbd style={{
          fontSize: 10,
          background: "rgba(148,163,184,0.12)",
          border: "1px solid rgba(148,163,184,0.2)",
          borderRadius: 4,
          padding: "1px 5px",
          fontFamily: "'DM Sans', monospace",
          color: "#94a3b8",
        }}>⌘K</kbd>
      </button>
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 80,
            padding: "80px 16px 16px",
          }}
        >
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(8px)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: 440,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.95)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(148,163,184,0.22)",
              overflow: "hidden",
            }}
          >
            {/* Input row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 16px",
              borderBottom: "1px solid rgba(148,163,184,0.18)",
            }}>
              <Search size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari halaman, fitur..."
                autoFocus
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: "#1e2d40",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              />
            </div>
            {/* Results */}
            <div style={{ maxHeight: 240, overflow: "auto" }}>
              {results.map(r => (
                <button
                  key={r.href}
                  onClick={() => { navigate(r.href); setOpen(false); setQuery(""); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    color: "#334155",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    transition: "background 0.12s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(148,163,184,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  {r.label}
                </button>
              ))}
              {results.length === 0 && (
                <div style={{ padding: "16px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
                  Tidak ditemukan
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Topbar() {
  const [location] = useLocation();
  const [theme, setThemeState] = useState<"dark" | "light">(getTheme());

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    applyTheme(next);
  };

  const pageInfo = PAGE_TITLES[location] ?? { title: "GudangPro", section: undefined };

  return (
    <header
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 16,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.9)",
        flexShrink: 0,
        position: "relative",
        zIndex: 5,
      }}
    >
      {/* Page title / breadcrumb */}
      <div style={{ paddingLeft: 72 }}>
        {pageInfo.section && (
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            color: "#94a3b8",
            marginBottom: 2,
          }}>
            {pageInfo.section}
          </div>
        )}
        <h1 style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#1e2d40",
          letterSpacing: "-0.3px",
          margin: 0,
        }}>
          {pageInfo.title}
        </h1>
      </div>

      <div style={{ flex: 1 }} />

      <GlobalSearch />
      <ClockWidget />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
        style={{
          padding: "8px 10px",
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.9)",
          borderRadius: 10,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          transition: "all 0.15s ease",
        }}
      >
        {/* Sun icon for light mode toggle */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      </button>
    </header>
  );
}