import React from "react";

// ─── Color palette ────────────────────────────────────────────────────────────

export const colors = {
  primary: "#1e3a5f",
  primaryLight: "#2d5a9e",
  accent: "#3b82f6",
  accentLight: "#60a5fa",

  text: "#1e2d40",
  body: "#334155",
  muted: "#94a3b8",
  mutedLight: "#b8c5d4",

  // Glass surfaces
  glassWhite: "rgba(255,255,255,0.72)",
  glassWhiteLight: "rgba(255,255,255,0.55)",
  glassWhiteSubtle: "rgba(255,255,255,0.38)",
  glassBorder: "rgba(255,255,255,0.9)",

  // Background gradient
  bgGradientStart: "#dde8f5",
  bgGradientMid: "#e8eef8",
  bgGradientEnd: "#d6e4f0",

  // Blob colors
  blobBlue: "#93c5fd",
  blobPurple: "#c4b5fd",
  blobGreen: "#a7f3d0",

  // Badge tints
  badgeIn: "rgba(59,130,246,0.12)",
  badgeOut: "rgba(234,88,12,0.12)",
  badgeTransfer: "rgba(16,185,129,0.12)",
  badgeAdjustment: "rgba(139,92,246,0.12)",
  badgeActive: "rgba(16,185,129,0.12)",
  badgeInactive: "rgba(100,116,139,0.12)",
  badgeAdmin: "rgba(30,58,95,0.12)",
  badgeManager: "rgba(59,130,246,0.12)",
  badgeStaff: "rgba(16,185,129,0.12)",
  badgeSupplier: "rgba(16,185,129,0.12)",
  badgeCustomer: "rgba(139,92,246,0.12)",
  badgeCritical: "rgba(239,68,68,0.12)",
};

// ─── Glass card styles ─────────────────────────────────────────────────────────

export const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.9)",
  borderRadius: "20px",
  boxShadow: "0 4px 24px rgba(148,163,184,0.13), 0 1.5px 4px rgba(148,163,184,0.08)",
};

export const glassCardSubtle: React.CSSProperties = {
  background: "rgba(255,255,255,0.42)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: "16px",
  boxShadow: "0 2px 12px rgba(148,163,184,0.08)",
};

export const glassCardHover: React.CSSProperties = {
  ...glassCard,
  transition: "all 0.2s ease",
  cursor: "pointer",
};

export const glassRow: React.CSSProperties = {
  background: "rgba(241,245,249,0.6)",
  borderRadius: "10px",
  transition: "background 0.15s ease",
};

// ─── Button styles ─────────────────────────────────────────────────────────────

export const primaryBtn: React.CSSProperties = {
  background: "linear-gradient(135deg, #1e3a5f, #2d5a9e)",
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  fontWeight: 600,
  fontSize: 13,
  padding: "9px 18px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  boxShadow: "0 2px 12px rgba(30,58,95,0.35), 0 1px 3px rgba(30,58,95,0.2)",
  transition: "all 0.18s ease",
  fontFamily: "'DM Sans', system-ui, sans-serif",
  letterSpacing: "0.01em",
};

export const secondaryBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  color: colors.primary,
  border: "1px solid rgba(255,255,255,0.9)",
  borderRadius: "12px",
  fontWeight: 600,
  fontSize: 13,
  padding: "9px 18px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  boxShadow: "0 2px 8px rgba(148,163,184,0.12)",
  transition: "all 0.18s ease",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

export const ghostBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.42)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  color: colors.body,
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: "12px",
  fontWeight: 500,
  fontSize: 13,
  padding: "8px 14px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  transition: "all 0.18s ease",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

export const dangerBtn: React.CSSProperties = {
  background: "rgba(239,68,68,0.12)",
  color: "#dc2626",
  border: "1px solid rgba(239,68,68,0.25)",
  borderRadius: "12px",
  fontWeight: 600,
  fontSize: 13,
  padding: "9px 18px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  transition: "all 0.18s ease",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

// ─── Input styles ──────────────────────────────────────────────────────────────

export const glassInput: React.CSSProperties = {
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.9)",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: 13,
  color: colors.text,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

export const glassInputFocused: React.CSSProperties = {
  ...glassInput,
  border: "1px solid rgba(59,130,246,0.5)",
  boxShadow: "0 0 0 3px rgba(59,130,246,0.08)",
};

// ─── Layout constants ───────────────────────────────────────────────────────────

export const layout = {
  sidebarWidth: 64,
  sidebarCollapsed: true,
  topbarHeight: 60,
};

// ─── Badge config ─────────────────────────────────────────────────────────────

export const badgeConfig: Record<string, {
  background: string;
  color: string;
  label: string;
}> = {
  IN:        { background: colors.badgeIn,         color: "#1d4ed8", label: "Masuk" },
  OUT:       { background: colors.badgeOut,        color: "#c2410c", label: "Keluar" },
  TRANSFER:  { background: colors.badgeTransfer,  color: "#047857", label: "Transfer" },
  ADJUSTMENT:{ background: colors.badgeAdjustment, color: "#6d28d9", label: "Penyesuaian" },
  ACTIVE:    { background: colors.badgeActive,    color: "#047857", label: "Aktif" },
  INACTIVE:  { background: colors.badgeInactive,  color: "#475569", label: "Nonaktif" },
  ADMIN:     { background: colors.badgeAdmin,      color: colors.primary, label: "Admin" },
  MANAGER:   { background: colors.badgeManager,    color: "#1d4ed8", label: "Manager" },
  STAFF:     { background: colors.badgeStaff,      color: "#047857", label: "Staff" },
  SUPPLIER:  { background: colors.badgeSupplier,   color: "#047857", label: "Pemasok" },
  CUSTOMER:  { background: colors.badgeCustomer,  color: "#6d28d9", label: "Pelanggan" },
  PENDING:   { background: "rgba(245,158,11,0.12)", color: "#b45309", label: "Menunggu" },
  PROCESSED: { background: "rgba(59,130,246,0.12)", color: "#1d4ed8", label: "Diproses" },
  DISPOSED:  { background: "rgba(239,68,68,0.12)",  color: "#b91c1c", label: "Dibuang" },
  CRITICAL:  { background: colors.badgeCritical,   color: "#b91c1c", label: "Kritis" },
};

// ─── Section label style ──────────────────────────────────────────────────────

export const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: colors.muted,
  marginBottom: 4,
};

export const pageTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: colors.text,
  letterSpacing: "-0.3px",
  margin: 0,
};

// ─── App background gradient ───────────────────────────────────────────────────

export const appBackground: React.CSSProperties = {
  background: "linear-gradient(135deg, #dde8f5 0%, #e8eef8 40%, #d6e4f0 100%)",
  minHeight: "100vh",
  position: "relative",
};

// ─── Typography ────────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  heading: {
    fontWeight: 700,
    color: colors.text,
    letterSpacing: "-0.3px",
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: colors.muted,
  },
  body: {
    fontSize: 13,
    color: colors.body,
  },
  caption: {
    fontSize: 12,
    color: colors.muted,
  },
};