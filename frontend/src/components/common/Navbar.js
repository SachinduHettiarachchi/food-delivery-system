import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Menu, X, LayoutDashboard, Package, Users, Store, User, LogOut, ChevronRight } from "lucide-react";
import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const Navbar = () => {
  const { user, logout, isCustomer, isRestaurantAdmin, isSystemAdmin } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(true); };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const navLinkClass = (path) =>
    `text-sm font-medium transition-all duration-200 border-b-2 pb-0.5 ${
      isActive(path)
        ? "text-primary-400 border-primary-400"
        : "text-slate-400 hover:text-slate-100 border-transparent"
    }`;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-dark/80 backdrop-blur-xl border-b border-white/5 shadow-xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group" style={{ position: "relative" }}>
            {/* Glow layer */}
            <motion.div
              animate={{ opacity: [0.4, 0.75, 0.4], scale: [0.85, 1.05, 0.85] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: "-4px -8px",
                background: "radial-gradient(circle, rgba(255,107,53,0.55) 0%, transparent 70%)",
                filter: "blur(14px)",
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />
            <motion.img
              src={logo}
              alt="HungryHub"
              className="object-contain mix-blend-multiply flex-shrink-0"
              style={{ height: 44, width: "auto", position: "relative", zIndex: 1 }}
              whileHover={{ scale: 1.07 }}
              transition={{ duration: 0.22 }}
            />
            {/* Text: hidden on mobile, shown on md+ */}
            <span
              className="hidden md:block relative z-10"
              style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1 }}
            >
              <span style={{ color: "#ffffff" }}>Hungry</span>
              <span style={{ color: "#f97316" }}>Hub</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            {!user && (
              <>
                <Link to="/restaurants" className={navLinkClass("/restaurants")}>Restaurants</Link>
                <Link to="/login" className="btn-outline text-sm px-4 py-2">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
              </>
            )}

            {isCustomer && (
              <>
                <Link to="/restaurants" className={navLinkClass("/restaurants")}>Restaurants</Link>
                <Link to="/orders" className={navLinkClass("/orders")}>My Orders</Link>
                <Link to="/profile" className={navLinkClass("/profile")}>Profile</Link>
                <Link to="/cart" className="relative btn-ghost px-3">
                  <motion.div
                    animate={totalItems > 0 ? { rotate: [-8, 8, -8, 8, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    key={totalItems}
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </motion.div>
                  <AnimatePresence>
                    {totalItems > 0 && (
                      <motion.span
                        key={totalItems}
                        initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} exit={{ scale: 0 }}
                        transition={{ duration: 0.35, times: [0, 0.6, 1] }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center shadow-glow-sm"
                      >
                        {totalItems > 9 ? "9+" : totalItems}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
                <button onClick={handleLogout} className="btn-ghost px-3 text-slate-500 hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}

            {isRestaurantAdmin && (
              <>
                <Link to="/restaurant/dashboard" className={navLinkClass("/restaurant/dashboard")}>Dashboard</Link>
                <Link to="/restaurant/menu" className={navLinkClass("/restaurant/menu")}>Menu</Link>
                <Link to="/restaurant/orders" className={navLinkClass("/restaurant/orders")}>Orders</Link>
                <Link to="/profile" className={navLinkClass("/profile")}>Profile</Link>
                <button onClick={handleLogout} className="btn-ghost px-3 text-slate-500 hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}

            {isSystemAdmin && (
              <>
                <Link to="/admin/dashboard" className={navLinkClass("/admin/dashboard")}>Dashboard</Link>
                <Link to="/admin/users" className={navLinkClass("/admin/users")}>Users</Link>
                <Link to="/admin/restaurants" className={navLinkClass("/admin/restaurants")}>Restaurants</Link>
                <Link to="/admin/orders" className={navLinkClass("/admin/orders")}>Orders</Link>
                <button onClick={handleLogout} className="btn-ghost px-3 text-slate-500 hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {isCustomer && (
              <Link to="/cart" className="relative btn-ghost px-3">
                <motion.div
                  animate={totalItems > 0 ? { rotate: [-8, 8, -8, 8, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  key={totalItems}
                >
                  <ShoppingCart className="w-5 h-5" />
                </motion.div>
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} exit={{ scale: 0 }}
                      transition={{ duration: 0.35, times: [0, 0.6, 1] }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center shadow-glow-sm"
                    >
                      {totalItems > 9 ? "9+" : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn-ghost p-2"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-surface border-l border-white/5 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <span className="font-heading font-bold text-white">Menu</span>
                <button onClick={() => setDrawerOpen(false)} className="btn-ghost p-1.5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {!user && (
                  <>
                    <DrawerLink to="/restaurants" icon={<Store className="w-4 h-4" />} label="Restaurants" />
                    <div className="pt-4 space-y-2">
                      <Link to="/login" className="btn-outline w-full text-sm">Sign In</Link>
                      <Link to="/register" className="btn-primary w-full text-sm">Get Started</Link>
                    </div>
                  </>
                )}
                {isCustomer && (
                  <>
                    <DrawerLink to="/restaurants" icon={<Store className="w-4 h-4" />} label="Restaurants" />
                    <DrawerLink to="/orders" icon={<Package className="w-4 h-4" />} label="My Orders" />
                    <DrawerLink to="/profile" icon={<User className="w-4 h-4" />} label="Profile" />
                  </>
                )}
                {isRestaurantAdmin && (
                  <>
                    <DrawerLink to="/restaurant/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
                    <DrawerLink to="/restaurant/menu" icon={<UtensilsCrossed className="w-4 h-4" />} label="Menu" />
                    <DrawerLink to="/restaurant/orders" icon={<Package className="w-4 h-4" />} label="Orders" />
                    <DrawerLink to="/profile" icon={<User className="w-4 h-4" />} label="Profile" />
                  </>
                )}
                {isSystemAdmin && (
                  <>
                    <DrawerLink to="/admin/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
                    <DrawerLink to="/admin/users" icon={<Users className="w-4 h-4" />} label="Users" />
                    <DrawerLink to="/admin/restaurants" icon={<Store className="w-4 h-4" />} label="Restaurants" />
                    <DrawerLink to="/admin/orders" icon={<Package className="w-4 h-4" />} label="Orders" />
                  </>
                )}
              </nav>

              {user && (
                <div className="p-4 border-t border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
};

const DrawerLink = ({ to, icon, label }) => {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-primary-500/15 text-primary-400"
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <span className={active ? "text-primary-400" : "text-slate-500"}>{icon}</span>
      {label}
      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary-400/60" />}
    </Link>
  );
};

export default Navbar;
