import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Phone, MapPin, ArrowRight, ChefHat } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import logo from "../../assets/logo.png";
import { FOOD_ITEMS, FloatingFood } from "../../components/FloatingFood";

const PasswordStrength = ({ password }) => {
  const score = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-white/10"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${["","text-red-400","text-amber-400","text-blue-400","text-emerald-400"][score]}`}>
        {labels[score]}
      </p>
    </div>
  );
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "customer", phone: "", address: "",
  });

  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const handleMove = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    try {
      const user = await register({
        name: form.name, email: form.email, password: form.password,
        role: form.role, phone: form.phone, address: form.address,
      });
      toast.success("Account created! Welcome 🎉");
      if (user.role === "restaurant_admin") navigate("/restaurant/dashboard");
      else navigate("/restaurants");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left hero — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-[48%] bg-gradient-to-br from-slate-800 via-surface to-dark p-12 relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-hero-pattern opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />

        {/* Floating food — 8 items with parallax */}
        {FOOD_ITEMS.slice(0, 8).map((item, i) => (
          <FloatingFood key={i} {...item} mouseX={mouse.x} mouseY={mouse.y} />
        ))}

        <div className="relative z-10">
          <div className="flex items-center mb-16">
            <img src={logo} alt="HungryHub" className="h-14 w-auto object-contain mix-blend-multiply logo-glow" />
          </div>

          <h1 className="text-4xl font-heading font-black text-white leading-tight mb-4">
            Join thousands of<br />happy customers
          </h1>
          <p className="text-slate-400 text-lg">Order from the best restaurants near you.</p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: "🛵", text: "Fast delivery to your door" },
            { icon: "🍽️", text: "Hundreds of restaurants" },
            { icon: "📍", text: "Real-time order tracking" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-slate-300 font-medium">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-10 bg-dark overflow-y-auto relative">

        {/* Mobile floating food background */}
        <div className="absolute inset-0 lg:hidden overflow-hidden" style={{ pointerEvents: "none" }}>
          {FOOD_ITEMS.slice(0, 6).map((item, i) => (
            <FloatingFood key={i} {...item} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8 relative z-10"
        >
          {/* Mobile logo — outside card */}
          <div className="flex items-center mb-8 lg:hidden">
            <img src={logo} alt="HungryHub" className="h-12 w-auto object-contain mix-blend-multiply logo-glow" />
          </div>

          {/* Card wrapper */}
          <div style={{
            background: "rgba(15,23,42,0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 20,
            padding: 32,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}>
            <div className="mb-8">
              <h2 className="text-3xl font-heading font-bold text-white mb-2">Create account</h2>
              <p className="text-slate-400">Fill in your details to get started</p>
            </div>

            {/* Role toggle */}
            <div className="flex gap-2 p-1 rounded-xl bg-surface border border-white/5 mb-6">
              {[
                { val: "customer",         label: "Customer",   icon: <User className="w-4 h-4" /> },
                { val: "restaurant_admin", label: "Restaurant", icon: <ChefHat className="w-4 h-4" /> },
              ].map((r) => (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.val })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    form.role === r.val
                      ? "bg-primary-500 text-white shadow-glow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="John Doe" required className="input-field pl-10" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="you@example.com" required className="input-field pl-10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input name="password" type={showPass ? "text" : "password"}
                      value={form.password} onChange={handleChange}
                      placeholder="Min 6 chars" required className="input-field pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Confirm</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input name="confirmPassword" type="password"
                      value={form.confirmPassword} onChange={handleChange}
                      placeholder="Repeat password" required className="input-field pl-10" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Phone <span className="text-slate-600">(optional)</span></label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+94 77 123 4567" className="input-field pl-10" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  {form.role === "restaurant_admin" ? "Business Address" : "Delivery Address"}
                  <span className="text-slate-600"> (optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                  <textarea name="address" value={form.address} onChange={handleChange}
                    placeholder="Your address" rows={2} className="input-field pl-10 resize-none" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
