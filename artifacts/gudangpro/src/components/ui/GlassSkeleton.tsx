import React from "react";

interface GlassSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export const GlassSkeleton: React.FC<GlassSkeletonProps> = ({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
  className,
}) => (
  <div
    className={className}
    style={{
      width: typeof width === "number" ? `${width}px` : width,
      height: typeof height === "number" ? `${height}px` : height,
      borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
      background: "linear-gradient(90deg, rgba(226,232,240,0.5) 25%, rgba(241,245,249,0.7) 50%, rgba(226,232,240,0.5) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
      ...style,
    }}
  />
);

export const GlassCardSkeleton: React.FC<{ lines?: number }> = ({ lines = 4 }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.9)",
      borderRadius: "20px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}
  >
    {Array.from({ length: lines }).map((_, i) => (
      <GlassSkeleton
        key={i}
        height={14}
        width={i === lines - 1 ? "60%" : "100%"}
      />
    ))}
  </div>
);

// Add shimmer keyframe to global CSS helper
export const shimmerStyle = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;