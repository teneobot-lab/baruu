import React, { useEffect } from "react";
import { X } from "lucide-react";

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string | number;
  maxWidth?: string | number;
  style?: React.CSSProperties;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width,
  maxWidth = 540,
  style,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* Container */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.95)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(148,163,184,0.22), 0 2px 8px rgba(148,163,184,0.12)",
          width: width ?? "100%",
          maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
          maxHeight: "90vh",
          overflow: "auto",
          ...style,
        }}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div
            style={{
              padding: "20px 24px 16px",
              borderBottom: subtitle ? "1px solid rgba(148,163,184,0.18)" : undefined,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                {title && (
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#1e2d40",
                      letterSpacing: "-0.3px",
                      margin: 0,
                    }}
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "rgba(148,163,184,0.12)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: 8,
                  padding: "6px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                  marginLeft: 12,
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        {children && (
          <div style={{ padding: "20px 24px" }}>{children}</div>
        )}

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "16px 24px 20px",
              borderTop: "1px solid rgba(148,163,184,0.18)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface GlassConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export const GlassConfirmModal: React.FC<GlassConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
  danger = false,
}) => (
  <GlassModal
    open={open}
    onClose={onClose}
    title={title}
    maxWidth={400}
    footer={
      <>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.9)",
            borderRadius: "10px",
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "#334155",
            cursor: "pointer",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          style={{
            background: danger ? "rgba(220,38,38,0.1)" : "linear-gradient(135deg, #1e3a5f, #2d5a9e)",
            border: danger ? "1px solid rgba(220,38,38,0.3)" : "none",
            borderRadius: "10px",
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: danger ? "#dc2626" : "#ffffff",
            cursor: "pointer",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {confirmLabel}
        </button>
      </>
    }
  >
    <p style={{ fontSize: 13, color: "#334155", margin: 0, lineHeight: 1.6 }}>{message}</p>
  </GlassModal>
);