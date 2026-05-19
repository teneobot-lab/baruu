import React from "react";

/**
 * Fixed ambient blob layer — call once inside a relative/fixed container.
 * pointer-events: none so it doesn't block clicks.
 */
export const AmbientBlobs: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
      pointerEvents: "none",
      overflow: "hidden",
      ...style,
    }}
    aria-hidden="true"
  >
    {/* Blob 1 — top-left blue */}
    <div
      style={{
        position: "absolute",
        top: -120,
        left: -80,
        width: 500,
        height: 500,
        background: "radial-gradient(circle, rgba(147,197,253,0.55) 0%, rgba(147,197,253,0.15) 45%, transparent 70%)",
        filter: "blur(1px)",
        borderRadius: "50%",
      }}
    />
    {/* Blob 2 — bottom-right purple */}
    <div
      style={{
        position: "absolute",
        bottom: -100,
        right: 100,
        width: 420,
        height: 420,
        background: "radial-gradient(circle, rgba(196,181,253,0.42) 0%, rgba(196,181,253,0.1) 40%, transparent 65%)",
        filter: "blur(1px)",
        borderRadius: "50%",
      }}
    />
    {/* Blob 3 — right-mid green */}
    <div
      style={{
        position: "absolute",
        top: "40%",
        right: 20,
        width: 280,
        height: 280,
        background: "radial-gradient(circle, rgba(167,243,208,0.32) 0%, rgba(167,243,208,0.08) 35%, transparent 60%)",
        filter: "blur(1px)",
        borderRadius: "50%",
      }}
    />
  </div>
);