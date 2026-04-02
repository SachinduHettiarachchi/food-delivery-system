import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NotFoundPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const home = !user ? "/login"
    : user.role === "system_admin"     ? "/admin/dashboard"
    : user.role === "restaurant_admin" ? "/restaurant/dashboard"
    : "/restaurants";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)",
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-md w-full"
      >
        {/* Big 404 */}
        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[120px] font-heading font-black leading-none mb-2"
          style={{ color: "rgba(249,115,22,0.15)", letterSpacing: "-0.04em" }}
        >
          404
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-heading font-bold text-white mb-3">Page not found</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/8 text-slate-300 text-sm font-semibold hover:bg-white/4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Go back
            </motion.button>
            <Link to={home} className="btn-primary gap-2 text-sm px-5 py-2.5">
              <Home className="w-4 h-4" /> Home
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
