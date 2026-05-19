import React from "react";
import { glassCard } from "@/lib/glass";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: string | number;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  style,
  padding = 20,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        ...glassCard,
        padding: typeof padding === "number" ? `${padding}px` : padding,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
};

interface GlassCardSubtleProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: string | number;
}

export const GlassCardSubtle: React.FC<GlassCardSubtleProps> = ({
  children,
  className,
  style,
  padding = 16,
}) => {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.42)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.7)",
        borderRadius: "16px",
        boxShadow: "0 2px 12px rgba(148,163,184,0.08)",
        padding: typeof padding === "number" ? `${padding}px` : padding,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
};