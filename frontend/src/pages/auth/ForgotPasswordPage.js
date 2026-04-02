import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { authAPI } from "../../services/api";
import logo from "../../assets/logo.png";

const ForgotPasswordPage = () => {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0F172A",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.11, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: "-20%", left: "-10%", width: 500, height: 500,
          borderRadius: "50%", background: "radial-gradient(circle, #f97316, transparent 70%)", pointerEvents: "none" }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.09, 0.04] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        style={{ position: "absolute", bottom: "-15%", right: "-8%", width: 400, height: 400,
          borderRadius: "50%", background: "radial-gradient(circle, #f97316, transparent 70%)", pointerEvents: "none" }}
      />

      <div style={{ width: "100%", maxWidth: 420, zIndex: 10 }}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <img src={logo} alt="HungryHub"
            style={{ height: 70, width: "auto", objectFit: "contain", mixBlendMode: "multiply",
              filter: "saturate(1.6) contrast(1.1) drop-shadow(0 0 10px rgba(249,115,22,0.5))" }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "#1E293B", borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)", padding: "36px 32px",
          }}
        >
          <AnimatePresence mode="wait">
            {/* ── Sent state ── */}
            {sent ? (
              <motion.div key="sent"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center" }}
              >
                <div style={{ width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <CheckCircle2 size={26} style={{ color: "#34d399" }} />
                </div>
                <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "white", marginBottom: 10 }}>
                  Check your inbox
                </h2>
                <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: 28 }}>
                  If <strong style={{ color: "#94a3b8" }}>{email}</strong> is registered, you'll receive a password reset link in the next few minutes.
                  Check your spam folder if you don't see it.
                </p>
                <Link to="/login" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px", borderRadius: 12, background: "#f97316",
                  color: "white", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem",
                  boxShadow: "0 6px 20px rgba(249,115,22,0.4)",
                }}>
                  Back to Sign In
                </Link>
              </motion.div>
            ) : (
              /* ── Form state ── */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "white", marginBottom: 6 }}>
                  Forgot password?
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 28, lineHeight: 1.5 }}>
                  Enter the email address linked to your account and we'll send a reset link.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>
                      Email address
                    </label>
                    <div style={{ position: "relative" }}>
                      <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }} />
                      <input
                        type="email" value={email} required autoFocus
                        onChange={e => { setEmail(e.target.value); setError(""); }}
                        placeholder="you@example.com"
                        style={{
                          width: "100%", padding: "12px 14px 12px 40px",
                          borderRadius: 10, border: "1px solid #334155",
                          background: "#1e293b", color: "#f1f5f9", fontSize: "0.9rem",
                          outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                          transition: "border-color 0.2s, box-shadow 0.2s",
                        }}
                        onFocus={e => { e.target.style.borderColor = "#f97316"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)"; }}
                        onBlur={e  => { e.target.style.borderColor = "#334155";  e.target.style.boxShadow = "none"; }}
                      />
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px",
                          borderRadius: 8, background: "#fee2e2", borderLeft: "3px solid #ef4444" }}
                      >
                        <AlertCircle size={14} style={{ color: "#991b1b", flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: "0.8rem", color: "#991b1b", margin: 0 }}>{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="submit" disabled={loading} style={{
                    marginTop: 4, padding: "14px", borderRadius: 12,
                    background: loading ? "#334155" : "#f97316",
                    color: "white", fontWeight: 700, fontSize: "0.95rem",
                    border: "none", cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: loading ? "none" : "0 6px 20px rgba(249,115,22,0.4)", transition: "all 0.2s",
                  }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#ea6c0a"; }}
                    onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#f97316"; }}
                  >
                    {loading ? (
                      <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} /> Sending...</>
                    ) : (
                      <>Send Reset Link <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                <Link to="/login" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  marginTop: 20, color: "#64748b", fontSize: "0.875rem", textDecoration: "none",
                  transition: "color 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.color = "#f97316"}
                  onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
                >
                  <ArrowLeft size={15} /> Back to Sign In
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ForgotPasswordPage;
