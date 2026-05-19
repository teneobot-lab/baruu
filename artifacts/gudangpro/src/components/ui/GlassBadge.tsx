import React from "react";
import { badgeConfig } from "@/lib/glass";

type BadgeType =
  | "IN"
  | "OUT"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "ACTIVE"
  | "INACTIVE"
  | "ADMIN"
  | "MANAGER"
  | "STAFF"
  | "SUPPLIER"
  | "CUSTOMER"
  | "PENDING"
  | "PROCESSED"
  | "DISPOSED"
  | "CRITICAL";

interface GlassBadgeProps {
  type: BadgeType | string;
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  type,
  label,
  style,
  className,
}) => {
  const cfg = badgeConfig[type] ?? {
    background: "rgba(148,163,184,0.12)",
    color: "#475569",
    label: type,
  };

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "9999px",
        fontSize: 11,
        fontWeight: 600,
        background: cfg.background,
        color: cfg.color,
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      {label ?? cfg.label}
    </span>
  );
};

// Convenience components
export const TypeBadge: React.FC<{ type: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT"; className?: string }> = ({ type, className }) => (
  <GlassBadge type={type} className={className} />
);

export const StatusBadge: React.FC<{ status: "ACTIVE" | "INACTIVE"; className?: string }> = ({ status, className }) => (
  <GlassBadge type={status} label={status === "ACTIVE" ? "Aktif" : "Nonaktif"} className={className} />
);

export const RoleBadge: React.FC<{ role: "ADMIN" | "MANAGER" | "STAFF"; className?: string }> = ({ role, className }) => (
  <GlassBadge type={role} className={className} />
);