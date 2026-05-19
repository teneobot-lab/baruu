import React, { useState } from "react";

interface GlassInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  hint,
  wrapperStyle,
  inputStyle,
  id,
  ...inputProps
}) => {
  const [focused, setFocused] = useState(false);
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%", ...wrapperStyle }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#334155",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: error
            ? "1px solid rgba(239,68,68,0.5)"
            : focused
            ? "1px solid rgba(59,130,246,0.5)"
            : "1px solid rgba(255,255,255,0.9)",
          borderRadius: "12px",
          padding: "10px 14px",
          fontSize: 13,
          color: "#1e2d40",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          outline: "none",
          width: "100%",
          boxShadow: error
            ? "0 0 0 3px rgba(239,68,68,0.08)"
            : focused
            ? "0 0 0 3px rgba(59,130,246,0.08)"
            : undefined,
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          ...inputStyle,
        }}
        {...inputProps}
      />
      {hint && !error && (
        <span style={{ fontSize: 11, color: "#94a3b8" }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 500 }}>{error}</span>
      )}
    </div>
  );
};

interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  wrapperStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  label,
  error,
  options,
  wrapperStyle,
  inputStyle,
  id,
  ...selectProps
}) => {
  const [focused, setFocused] = useState(false);
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%", ...wrapperStyle }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#334155",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: error
            ? "1px solid rgba(239,68,68,0.5)"
            : focused
            ? "1px solid rgba(59,130,246,0.5)"
            : "1px solid rgba(255,255,255,0.9)",
          borderRadius: "12px",
          padding: "10px 14px",
          fontSize: 13,
          color: "#1e2d40",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          outline: "none",
          width: "100%",
          cursor: "pointer",
          transition: "border-color 0.15s ease",
          ...inputStyle,
        }}
        {...selectProps}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 500 }}>{error}</span>
      )}
    </div>
  );
};

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperStyle?: React.CSSProperties;
}

export const GlassTextarea: React.FC<GlassTextareaProps> = ({
  label,
  error,
  wrapperStyle,
  id,
  ...textareaProps
}) => {
  const [focused, setFocused] = useState(false);
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%", ...wrapperStyle }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#334155",
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: error
            ? "1px solid rgba(239,68,68,0.5)"
            : focused
            ? "1px solid rgba(59,130,246,0.5)"
            : "1px solid rgba(255,255,255,0.9)",
          borderRadius: "12px",
          padding: "10px 14px",
          fontSize: 13,
          color: "#1e2d40",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          outline: "none",
          width: "100%",
          resize: "vertical",
          minHeight: 80,
          transition: "border-color 0.15s ease",
          ...textareaProps,
        }}
        {...textareaProps}
      />
      {error && (
        <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 500 }}>{error}</span>
      )}
    </div>
  );
};