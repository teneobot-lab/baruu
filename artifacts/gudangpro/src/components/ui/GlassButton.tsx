import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  danger?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const baseBtn: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  outline: "none",
  transition: "all 0.18s ease",
  letterSpacing: "0.01em",
  whiteSpace: "nowrap",
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, #1e3a5f, #2d5a9e)",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "9px 18px",
    boxShadow: "0 2px 12px rgba(30,58,95,0.35), 0 1px 3px rgba(30,58,95,0.2)",
  },
  secondary: {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    color: "#1e3a5f",
    border: "1px solid rgba(255,255,255,0.9)",
    borderRadius: "12px",
    padding: "9px 18px",
    boxShadow: "0 2px 8px rgba(148,163,184,0.12)",
  },
  danger: {
    background: "rgba(239,68,68,0.10)",
    color: "#dc2626",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: "12px",
    padding: "9px 18px",
  },
  ghost: {
    background: "rgba(255,255,255,0.42)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: "#334155",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: "12px",
    padding: "8px 14px",
  },
};

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = "primary",
  danger,
  children,
  style,
  className,
  disabled,
  ...props
}) => {
  const resolvedVariant = danger ? "danger" : variant;
  return (
    <button
      className={className}
      style={{
        ...baseBtn,
        ...variantStyles[resolvedVariant],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

interface GlassButtonGroupProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const GlassButtonGroup: React.FC<GlassButtonGroupProps> = ({ children, style, className }) => (
  <div
    style={{ display: "flex", gap: 8, alignItems: "center", ...style }}
    className={className}
  >
    {children}
  </div>
);