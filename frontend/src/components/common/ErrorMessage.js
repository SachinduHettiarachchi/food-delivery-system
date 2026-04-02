import React from "react";

const ErrorMessage = ({ message, onRetry }) => (
  <div style={{
    background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "10px",
    padding: "20px 24px", margin: "20px 0", display: "flex",
    alignItems: "center", justifyContent: "space-between", gap: "16px",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "1.2rem" }}>⚠️</span>
      <p style={{ color: "#991b1b", fontSize: "0.9rem", margin: 0 }}>{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          background: "#dc2626", color: "white", border: "none",
          borderRadius: "6px", padding: "6px 14px", cursor: "pointer",
          fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap",
        }}
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorMessage;
