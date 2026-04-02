import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { authAPI } from "../../services/api";
import logo from "../../assets/logo.png";

const ResetPasswordPage = () => {
  const [searchParams]        = useSearchParams();
  const navigate              = useNavigate();
  const token                 = searchParams.get("token");

  const [form, setForm]       = useState({ password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  /* If no token in URL at all */
  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <XCircle size={48} style={{ color: "#ef4444", margin: "0 auto 16px" }} />
          <h2 style={{ color: "white", fontFamily: "'Sora',sans-serif", fontWeight: 800, marginBottom: 8 }}>Invalid link</h2>
          <p style={{ color: "#64748b", marginBottom: 24 }}>This password reset link is missing or malformed.</p>
          <Link to="/forgot-password" style={{ padding: "12px 24px", borderRadius: 10, background: "#f97316", color: "white", fontWeight: 700, textDecoration: "none" }}>
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    setError("");
    try {
      await authAPI.resetPassword({ token, password: form.password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 42px 12px 40px",
    borderRadius: 10, border: "1px solid #334155",
    background: "#0f172a", color: "#f1f5f9", fontSize: "0.9rem",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };
  const onFocus = e => { e.target.style.borderColor = "#f97316"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)"; };
  const onBlur  = e => { e.target.style.borderColor = "#334155";  e.target.style.boxShadow = "none"; };

  return (
    <div style={{
      minHeight: "100vh", background: "#0F172A",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background orb */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.11, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: "-20%", left: "-10%", width: 500, height: 500,
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
            {/* ── Success ── */}
            {success ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <CheckCircle2 size={26} style={{ color: "#34d399" }} />
                </div>
                <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "white", marginBottom: 10 }}>
                  Password reset!
                </h2>
                <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: 24 }}>
                  Your password has been updated. Redirecting to sign in…
                </p>
                <Link to="/login" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px", borderRadius: 12, background: "#f97316",
                  color: "white", fontWeight: 700, textDecoration: "none",
                  boxShadow: "0 6px 20px rgba(249,115,22,0.4)",
                }}>
                  Sign In Now
                </Link>
              </motion.div>
            ) : (
              /* ── Form ── */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "white", marginBottom: 6 }}>
                  Set new password
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 28 }}>
                  Choose a strong password you haven't used before.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {/* New password */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>
                      New password
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }} />
                      <input
                        type={showPass ? "text" : "password"}
                        value={form.password} required
                        onChange={e => { setForm({ ...form, password: e.target.value }); setError(""); }}
                        placeholder="Min 6 characters"
                        style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", padding: 0 }}>
                        {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>
                      Confirm password
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }} />
                      <input
                        type="password"
                        value={form.confirm} required
                        onChange={e => { setForm({ ...form, confirm: e.target.value }); setError(""); }}
                        placeholder="Repeat new password"
                        style={{ ...inputStyle, paddingRight: 14 }} onFocus={onFocus} onBlur={onBlur}
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
                      <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} /> Resetting...</>
                    ) : (
                      <>Reset Password <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.875rem", color: "#475569" }}>
                  Remember it?{" "}
                  <Link to="/login" style={{ color: "#f97316", fontWeight: 700, textDecoration: "none" }}>Sign In</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ResetPasswordPage;
