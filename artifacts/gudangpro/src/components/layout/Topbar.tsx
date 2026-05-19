import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Sun, Moon, Search, Bell, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getTheme, applyTheme } from "@/lib/theme";
import { formatDateLong, formatTime } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventory": "Inventaris",
  "/inventory/stok": "Stok per Gudang",
  "/transaksi": "Transaksi",
  "/transaksi/masuk": "Barang Masuk",
  "/transaksi/keluar": "Barang Keluar",
  "/transaksi/transfer": "Transfer",
  "/transaksi/penyesuaian": "Penyesuaian",
  "/reject": "Modul Reject",
  "/laporan": "Laporan",
  "/pengaturan": "Pengaturan",
};

function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden sm:flex flex-col items-end leading-tight">
      <span className="font-mono text-sm font-semibold tabular-nums">{formatTime(now)}</span>
      <span className="text-[10px] text-muted-foreground">{formatDateLong(now)}</span>
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

  const searchResults = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Daftar Barang", href: "/inventory" },
    { label: "Transaksi Masuk", href: "/transaksi/masuk" },
    { label: "Transaksi Keluar", href: "/transaksi/keluar" },
    { label: "Transfer Stok", href: "/transaksi/transfer" },
    { label: "Penyesuaian Stok", href: "/transaksi/penyesuaian" },
    { label: "Modul Reject", href: "/reject" },
    { label: "Pengaturan Gudang", href: "/pengaturan" },
  ].filter(r => !query || r.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Cari...</span>
        <kbd className="hidden sm:inline text-[10px] bg-background border border-border rounded px-1">⌘K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card border border-border rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari halaman, fitur..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-60 overflow-auto">
              {searchResults.map(r => (
                <button
                  key={r.href}
                  onClick={() => { navigate(r.href); setOpen(false); setQuery(""); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                >
                  <span>{r.label}</span>
                </button>
              ))}
              {searchResults.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">Tidak ditemukan</div>
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

  const title = PAGE_TITLES[location] ?? "GudangPro";

  return (
    <header className="shrink-0 h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-4">
      <div className="pl-8 md:pl-0">
        <h1 className="font-semibold text-base">{title}</h1>
      </div>
      <div className="flex-1" />
      <GlobalSearch />
      <ClockWidget />
      <button
        onClick={toggleTheme}
        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
        title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
}
