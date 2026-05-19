import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { cn, getInitials } from "@/lib/utils";
import {
  LayoutDashboard, Package, ArrowLeftRight, AlertTriangle,
  Settings, ChevronDown, Music2, LogOut, Warehouse,
  BarChart3, X, Menu
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  {
    label: "Inventaris", icon: Package, href: "/inventory",
    children: [
      { label: "Daftar Barang", href: "/inventory" },
      { label: "Stok per Gudang", href: "/inventory/stok" },
    ]
  },
  {
    label: "Transaksi", icon: ArrowLeftRight, href: "/transaksi",
    children: [
      { label: "Semua Transaksi", href: "/transaksi" },
      { label: "Barang Masuk", href: "/transaksi/masuk" },
      { label: "Barang Keluar", href: "/transaksi/keluar" },
      { label: "Transfer", href: "/transaksi/transfer" },
      { label: "Penyesuaian", href: "/transaksi/penyesuaian" },
    ]
  },
  { label: "Reject", icon: AlertTriangle, href: "/reject" },
  { label: "Laporan", icon: BarChart3, href: "/laporan" },
  { label: "Pengaturan", icon: Settings, href: "/pengaturan" },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const [location, navigate] = useLocation();
  const isActive = location === item.href || location.startsWith(item.href + "/");
  const [open, setOpen] = useState(isActive);
  const Icon = item.icon;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <Icon className="shrink-0 w-4 h-4" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="mt-1 ml-7 space-y-0.5">
            {item.children.map(child => (
              <button
                key={child.href}
                onClick={() => navigate(child.href)}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors",
                  location === child.href
                    ? "text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                )}
              >
                {child.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate(item.href)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="shrink-0 w-4 h-4" />
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

export function Sidebar() {
  const { session, setSession } = useAuth();
  const [, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    setSession(null);
    navigate("/login");
  };

  const sidebarContent = (
    <div className={cn("flex flex-col h-full bg-sidebar text-sidebar-foreground", collapsed ? "w-14" : "w-56")}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border shrink-0">
        <div className="w-7 h-7 bg-sidebar-primary rounded-lg flex items-center justify-center shrink-0">
          <Warehouse className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-bold text-base leading-none text-sidebar-accent-foreground">GudangPro</div>
            <div className="text-[10px] text-sidebar-foreground/50 mt-0.5">Manajemen Inventaris</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors hidden md:block"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll p-2 space-y-1">
        {navItems.map(item => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Music Player link */}
      {!collapsed && (
        <div className="px-2 pb-2">
          <button
            onClick={() => navigate("/music")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors"
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>Pemutar Musik</span>
          </button>
        </div>
      )}

      {/* User */}
      <div className="px-2 pb-3 pt-2 border-t border-sidebar-border shrink-0">
        <div className={cn("flex items-center gap-2 px-2 py-2 rounded-lg", collapsed && "justify-center")}>
          <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 text-sidebar-primary flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(session?.fullName ?? "U")}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-sidebar-accent-foreground truncate">{session?.fullName}</div>
              <div className="text-[10px] text-sidebar-foreground/50">{session?.role}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-sidebar-foreground/40 hover:text-red-400 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex h-full shrink-0 border-r border-sidebar-border">
        {sidebarContent}
      </div>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 bg-sidebar text-sidebar-foreground p-1.5 rounded-lg border border-sidebar-border"
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>
      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
