import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import {
  LayoutDashboard, Package, ArrowLeftRight, AlertTriangle,
  Settings, Warehouse, Bell, X, Menu, ChevronRight,
} from "lucide-react";
import { AmbientBlobs } from "@/components/ui/AmbientBlobs";

interface NavItemDef {
  label: string;
  icon: React.ElementType;
  href: string;
}

const navItems: NavItemDef[] = [
  { label: "Dashboard",   icon: LayoutDashboard, href: "/dashboard" },
  { label: "Inventaris",   icon: Package,        href: "/inventory" },
  { label: "Transaksi",   icon: ArrowLeftRight, href: "/transaksi" },
  { label: "Reject",       icon: AlertTriangle,  href: "/reject" },
  { label: "Pengaturan",   icon: Settings,      href: "/pengaturan" },
];

function NavButton({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: NavItemDef;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={item.label}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        padding: "10px 0",
        border: "none",
        background: isActive ? "rgba(30,58,95,0.10)" : "transparent",
        borderRadius: 12,
        cursor: "pointer",
        position: "relative",
        transition: "background 0.18s ease",
        color: isActive ? "#1e3a5f" : "#94a3b8",
        outline: "none",
      }}
    >
      {/* Active left bar */}
      {isActive && (
        <div style={{
          position: "absolute",
          left: 0,
          top: "20%",
          height: "60%",
          width: 3,
          background: "#1e3a5f",
          borderRadius: "0 3px 3px 0",
        }} />
      )}
      <Icon size={20} style={{ color: isActive ? "#1e3a5f" : "#94a3b8", transition: "color 0.18s" }} />
      {!collapsed && (
        <span style={{
          fontSize: 11,
          fontWeight: isActive ? 600 : 500,
          color: isActive ? "#1e3a5f" : "#94a3b8",
          letterSpacing: "0.01em",
        }}>
          {item.label}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const { session, setSession } = useAuth();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    setSession(null);
    navigate("/login");
  };

  const sidebarStyle: React.CSSProperties = {
    width: 64,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRight: "1px solid rgba(255,255,255,0.9)",
    overflow: "hidden",
    position: "relative",
    zIndex: 10,
  };

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 8px" }}>
      {/* Logo */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px 0 12px",
        borderBottom: "1px solid rgba(148,163,184,0.18)",
        marginBottom: 8,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36,
          height: 36,
          background: "#1e3a5f",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Warehouse size={18} color="#ffffff" />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {navItems.map(item => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <NavButton
              key={item.href}
              item={item}
              isActive={isActive}
              collapsed={true}
              onClick={() => navigate(item.href)}
            />
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(148,163,184,0.18)", margin: "8px 0" }} />

      {/* User + Bell */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "12px 0 16px", flexShrink: 0 }}>
        {/* Bell notification dot */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <Bell size={18} color="#94a3b8" />
          <div style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 7,
            height: 7,
            background: "#ef4444",
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.9)",
          }} />
        </div>

        {/* Avatar */}
        <div style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #60a5fa, #818cf8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: "0.02em",
          boxShadow: "0 2px 8px rgba(96,165,250,0.4)",
          cursor: "pointer",
        }}>
          {getInitials(session?.fullName ?? "U")}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Keluar"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: "#94a3b8",
            padding: "4px",
            borderRadius: 6,
            transition: "color 0.15s ease",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div style={sidebarStyle} className="hidden md:flex">
        {sidebarContent}
      </div>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(o => !o)}
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 50,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.9)",
          borderRadius: 10,
          padding: "8px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(148,163,184,0.15)",
        }}
        className="md:hidden"
      >
        {mobileOpen ? <X size={16} color="#1e3a5f" /> : <Menu size={16} color="#1e3a5f" />}
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          display: "flex",
        }}>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ flex: 1, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              ...sidebarStyle,
              width: 240,
              boxShadow: "4px 0 20px rgba(0,0,0,0.1)",
            }}
          >
            {/* Expanded nav for mobile */}
            <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 12px" }}>
              {/* Logo + close */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 0 12px",
                borderBottom: "1px solid rgba(148,163,184,0.18)",
                marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    background: "#1e3a5f",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Warehouse size={18} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#1e3a5f", letterSpacing: "-0.3px" }}>
                    GudangPro
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                {navItems.map(item => {
                  const isActive = location === item.href || location.startsWith(item.href + "/");
                  return (
                    <NavButton
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      collapsed={false}
                      onClick={() => { navigate(item.href); setMobileOpen(false); }}
                    />
                  );
                })}
              </nav>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderTop: "1px solid rgba(148,163,184,0.18)" }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #60a5fa, #818cf8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#ffffff",
                  flexShrink: 0,
                }}>
                  {getInitials(session?.fullName ?? "U")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2d40" }}>
                    {session?.fullName}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{session?.role}</div>
                </div>
                <button onClick={handleLogout} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}