import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { FOOD_ITEMS, FloatingFood } from "../../components/FloatingFood";
import logo from "../../assets/logo.png";


/* ── Main ──────────────────────────────────────────────── */
const LoginPage = () => {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from = location.state?.from?.pathname || null;

  const [form, setForm]           = useState({ email: "", password: "" });
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [shake, setShake]         = useState(false);
  const [remember, setRemember]   = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");
  const [mouse, setMouse]         = useState({ x: 0, y: 0 });

  /* ── Mouse parallax (pointer devices only) ──────────── */
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    if (!mq.matches) return;
    const handler = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMsg("");
    try {
      const user = await login(form.email, form.password);
      if (!remember) {
        const token    = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        localStorage.removeItem("token"); localStorage.removeItem("user");
        sessionStorage.setItem("token", token); sessionStorage.setItem("user", userData);
      }
      const roleHome =
        user.role === "system_admin"     ? "/admin/dashboard" :
        user.role === "restaurant_admin" ? "/restaurant/dashboard" :
        "/restaurants";
      const fromOk = from && (
        (user.role === "customer"         && !from.startsWith("/admin") && !from.startsWith("/restaurant")) ||
        (user.role === "restaurant_admin" && from.startsWith("/restaurant")) ||
        (user.role === "system_admin"     && from.startsWith("/admin"))
      );
      navigate(fromOk ? from : roleHome, { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Invalid email or password. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0F172A",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Background glow orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: "-20%", left: "-10%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, #f97316, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.09, 0.04] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        style={{
          position: "absolute", bottom: "-15%", right: "-8%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, #f97316, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Parallax floating food — all 12 items with depth layers */}
      {FOOD_ITEMS.map((item, i) => (
        <FloatingFood key={i} {...item} mouseX={mouse.x} mouseY={mouse.y} />
      ))}

      {/* Scroll wrapper */}
      <div style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: 10,
      }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 28, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        >
          <motion.div
            animate={{ opacity: [0.25, 0.8, 0.25], scale: [0.85, 1.05, 0.85] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", width: "100%", height: "100%",
              background: "radial-gradient(circle, rgba(249,115,22,0.7) 0%, rgba(249,115,22,0.15) 55%, transparent 75%)",
              filter: "blur(20px)", borderRadius: "50%", pointerEvents: "none",
            }}
          />
          <motion.div
            animate={{ opacity: [0.15, 0.45, 0.15], scale: [1, 1.3, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            style={{
              position: "absolute", width: "150%", height: "150%",
              background: "radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 65%)",
              filter: "blur(30px)", borderRadius: "50%", pointerEvents: "none",
            }}
          />
          <img
            src={logo} alt="HungryHub"
            className="logo-glow"
            style={{ height: 110, width: "auto", objectFit: "contain", mixBlendMode: "multiply", position: "relative", zIndex: 1 }}
          />
        </motion.div>

        {/* Glow + Card wrapper */}
        <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
          {/* Warm ambient glow behind the card */}
          <div style={{
            position: "absolute",
            width: "140%", height: "140%",
            top: "-20%", left: "-20%",
            background: "radial-gradient(ellipse at center, rgba(249,115,22,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }} />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative", zIndex: 1,
              width: "100%",
              maxHeight: "95vh", overflowY: "auto",
              background: "#1E293B",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
              padding: "36px 32px",
            }}
          >
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "white", marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ color: "#64748B", fontSize: "0.875rem", marginBottom: 28 }}>
              Sign in to your account to continue
            </p>

            <motion.form
              onSubmit={handleSubmit}
              animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.45 }}
              style={{ display: "flex", flexDirection: "column", gap: 18 }}
            >
              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#94A3B8", marginBottom: 8 }}>
                  Email address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none", zIndex: 1 }} />
                  <input
                    name="email" type="email" value={form.email} required autoFocus
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#94A3B8" }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: "0.78rem", color: "#f97316", fontWeight: 600, textDecoration: "none" }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none", zIndex: 1 }} />
                  <input
                    name="password" type={showPass ? "text" : "password"}
                    value={form.password} required
                    onChange={handleChange}
                    placeholder="Your password"
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", padding: 0, zIndex: 1 }}
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <input
                    type="checkbox" checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                  />
                  <div style={{
                    width: 18, height: 18, borderRadius: 5,
                    border: `2px solid ${remember ? "#f97316" : "#334155"}`,
                    background: remember ? "#f97316" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {remember && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: "0.83rem", color: "#94A3B8", fontWeight: 500 }}>Remember me</span>
              </label>

              {/* Inline error */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 14px", borderRadius: 8,
                      background: "#fee2e2", borderLeft: "3px solid #ef4444",
                      overflow: "hidden",
                    }}
                  >
                    <AlertCircle size={15} style={{ color: "#991b1b", flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: "0.8rem", color: "#991b1b", lineHeight: 1.4, margin: 0 }}>{errorMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign In button */}
              <button
                type="submit" disabled={loading}
                style={{
                  marginTop: 2, padding: "14px", borderRadius: 12,
                  background: loading ? "#334155" : "#f97316",
                  color: "white", fontWeight: 700, fontSize: "0.95rem",
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: loading ? "none" : "0 6px 20px rgba(249,115,22,0.4)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "#ea6c0a"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = "#f97316"; e.currentTarget.style.transform = "translateY(0)"; }}}
              >
                {loading ? (
                  <><div style={{ width: 17, height: 17, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />Signing in...</>
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>

            </motion.form>

            {/* Demo credentials — dev only */}
            {process.env.NODE_ENV === "development" && (
              <div style={{
                marginTop: 22, padding: "12px 14px", borderRadius: 10,
                background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.18)",
              }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                  Demo Accounts
                </p>
                <div style={{ fontSize: "0.75rem", color: "#64748B", lineHeight: 1.9 }}>
                  <p><span style={{ color: "#94A3B8" }}>Customer:</span> customer@demo.com / password123</p>
                  <p><span style={{ color: "#94A3B8" }}>Restaurant:</span> restaurant@demo.com / password123</p>
                  <p><span style={{ color: "#94A3B8" }}>Admin:</span> admin@demo.com / password123</p>
                </div>
              </div>
            )}

            <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.875rem", color: "#475569" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "#f97316", fontWeight: 700, textDecoration: "none" }}>
                Create one
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LoginPage;
