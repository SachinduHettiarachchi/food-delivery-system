import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Star, Clock, MapPin, Phone, Plus, Minus, ShoppingCart, ChevronLeft, Flame, Zap } from "lucide-react";
import { restaurantAPI } from "../../services/api";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

/* ── Flying +1 particle ───────────────────────────────── */
const FlyParticle = ({ id, onDone }) => (
  <motion.div
    key={id}
    initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
    animate={{ opacity: 0, y: -60, x: 20, scale: 0.6 }}
    transition={{ duration: 0.7, ease: "easeOut" }}
    onAnimationComplete={onDone}
    style={{
      position: "fixed", pointerEvents: "none", zIndex: 9999,
      right: 64, top: 56,
      color: "#FF6B35", fontWeight: 900, fontSize: 18,
    }}
  >
    +1
  </motion.div>
);

/* ── Tag-specific pill styles ─────────────────────────── */
const TAG_STYLES = {
  "🔥 Best Seller": { bg: "rgba(249,115,22,0.18)", text: "#fb923c", border: "rgba(249,115,22,0.30)" },
  "⭐ Top Rated":   { bg: "rgba(251,191,36,0.18)", text: "#fbbf24", border: "rgba(251,191,36,0.30)" },
  "📈 Trending":    { bg: "rgba(34,197,94,0.18)",  text: "#22c55e", border: "rgba(34,197,94,0.30)" },
  "✨ New":          { bg: "rgba(96,165,250,0.18)", text: "#60a5fa", border: "rgba(96,165,250,0.30)" },
};

/* ── Category-based placeholder colours ──────────────── */
const CATEGORY_COLORS = {
  pizza:    "#7c2d12",
  pasta:    "#1e3a5f",
  starters: "#14532d",
  desserts: "#4a044e",
  mains:    "#422006",
  noodles:  "#0c4a6e",
  rice:     "#365314",
  burgers:  "#451a03",
  salads:   "#052e16",
  drinks:   "#0f172a",
};

/* ── Menu item card ───────────────────────────────────── */
const MenuItemCard = ({ item, cartQty, onAdd, onRemove }) => {
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 400);
  };

  const placeholderBg = CATEGORY_COLORS[item.category?.toLowerCase()] || "#1e293b";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer
        ${cartQty > 0
          ? "bg-primary-500/5 border-primary-500/20"
          : "bg-surface border-white/6 hover:border-white/14 hover:bg-white/[0.03]"}
        ${!item.is_available ? "opacity-50 pointer-events-none" : ""}`}
    >
      {/* In-cart indicator */}
      {cartQty > 0 && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute top-3 left-3 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center z-10 shadow-glow-sm"
        >
          <span className="text-white text-[10px] font-black">{cartQty}</span>
        </motion.div>
      )}

      {/* Image — real or category-coloured placeholder */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-surface relative">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center rounded-xl"
            style={{ background: placeholderBg }}
          >
            <span style={{ fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.28)" }}>
              {item.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {item.preparation_time && item.preparation_time <= 15 && (
          <div className="absolute bottom-1 left-1 bg-amber-500 rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5 text-white" />
            <span className="text-[9px] font-black text-white">FAST</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Smart tag pill */}
          {item.tag && (() => {
            const ts = TAG_STYLES[item.tag] || { bg: "rgba(251,191,36,0.18)", text: "#fbbf24", border: "rgba(251,191,36,0.30)" };
            return (
              <span
                className="inline-block mb-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"
                style={{ background: ts.bg, color: ts.text, borderColor: ts.border }}
              >
                {item.tag}
              </span>
            );
          })()}

          {/* Category pill — hide when a smart tag already occupies that slot */}
          {item.category && !item.tag && (
            <span
              className="inline-block mb-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
              style={{
                background: "rgba(249,115,22,0.15)",
                color: "#f97316",
                letterSpacing: "0.02em",
              }}
            >
              {item.category}
            </span>
          )}

          {/* Item name */}
          <div className="flex items-start gap-2 mb-1">
            <h4
              className="font-bold leading-snug flex-1"
              style={{ fontSize: 17, color: "#f1f5f9" }}
            >
              {item.name}
            </h4>
            {(item.category === "Specials" || item.category === "Popular") && (
              <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 flex-wrap">
            {parseFloat(item.avg_rating) > 0 ? (
              <span className="flex items-center gap-1 text-[13px] text-amber-400 font-medium">
                <Star className="w-3 h-3 fill-amber-400" />
                {parseFloat(item.avg_rating).toFixed(1)}
                <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 400 }}>
                  ({item.review_count} reviews)
                </span>
              </span>
            ) : (
              <span style={{ color: "#475569", fontSize: 12 }}>No ratings yet</span>
            )}
          </div>

          {item.description && (
            <p className="text-slate-400 text-[13px] mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
          )}
        </div>

        {/* Review insight — visually distinct from item description */}
        {item.review_description && (
          <div className="mt-2 pt-2 border-t border-white/5">
            {item.tag ? (
              <span style={{
                fontSize: 13, color: "#94a3b8", fontWeight: 400, lineHeight: 1.5,
                background: "rgba(255,255,255,0.04)", padding: "4px 8px",
                borderRadius: 8, display: "inline-block",
              }}>
                💬 {item.review_description}
              </span>
            ) : (
              <p style={{ fontSize: 13, color: "#94a3b8", fontWeight: 400, lineHeight: 1.5 }}>
                💬 {item.review_description}
              </p>
            )}
          </div>
        )}

        {/* Price + controls */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <span className="text-primary-400 font-black text-base">
              LKR {parseFloat(item.price).toFixed(2)}
            </span>
            {item.preparation_time && (
              <span
                title="Estimated preparation time"
                className="flex items-center gap-1 text-slate-500 text-xs"
              >
                <Clock className="w-3 h-3" />~{item.preparation_time} min
              </span>
            )}
          </div>

          {item.is_available ? (
            cartQty > 0 ? (
              <div className="flex items-center gap-2 bg-surface rounded-xl p-1">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={onRemove}
                  className="w-7 h-7 rounded-lg bg-white/8 text-slate-300 flex items-center justify-center hover:bg-primary-500/20 hover:text-primary-400 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </motion.button>
                <motion.span
                  key={cartQty}
                  initial={{ scale: 1.5, color: "#FF6B35" }}
                  animate={{ scale: 1, color: "#ffffff" }}
                  transition={{ duration: 0.25 }}
                  className="w-6 text-center font-black text-sm"
                >
                  {cartQty}
                </motion.span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleAdd}
                  animate={justAdded ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="w-7 h-7 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors shadow-glow-sm"
                >
                  <Plus className="w-3 h-3" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                animate={justAdded ? { scale: [1, 1.2, 1] } : {}}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold
                           transition-all duration-150 border
                           bg-[#1e293b] text-[#f97316] border-[#f97316]/60
                           hover:bg-[#f97316] hover:text-white hover:scale-[1.03] hover:border-transparent hover:shadow-glow-sm
                           active:scale-[0.97]"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </motion.button>
            )
          ) : (
            <span className="text-xs text-slate-600 font-medium px-3 py-1.5 bg-surface rounded-lg">Unavailable</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ── Main page ────────────────────────────────────────── */
const RestaurantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, removeItem, updateQuantity, cart, totalItems, totalAmount } = useCart();
  const { user } = useAuth();

  const [restaurant, setRestaurant]   = useState(null);
  const [menuItems, setMenuItems]     = useState([]);
  const [categories, setCategories]   = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading]         = useState(true);
  const [particles, setParticles]     = useState([]);
  const [cartPulse, setCartPulse]     = useState(false);
  const prevTotalRef = useRef(0);

  useEffect(() => {
    restaurantAPI.getById(id)
      .then(res => {
        const r = res.data.data;
        setRestaurant(r);
        const items = r.menuItems || [];
        setMenuItems(items);
        const cats = ["All", ...new Set(items.map(i => i.category || "Other").filter(Boolean))];
        setCategories(cats);
      })
      .catch(() => toast.error("Failed to load restaurant."))
      .finally(() => setLoading(false));
  }, [id]);

  // Pulse cart when items change
  useEffect(() => {
    if (totalItems > prevTotalRef.current) {
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 600);
    }
    prevTotalRef.current = totalItems;
  }, [totalItems]);

  const getCartQty = useCallback((itemId) => {
    const found = cart.items.find(i => i.id === itemId);
    return found ? found.quantity : 0;
  }, [cart.items]);

  const handleAdd = (item) => {
    if (!user) { toast.error("Please sign in to order."); navigate("/login"); return; }
    if (user.role !== "customer") { toast.error("Only customers can place orders."); return; }
    addItem(item, restaurant.id, restaurant.name);
    // spawn +1 particle
    const pid = Date.now();
    setParticles(p => [...p, pid]);
    toast.success(`${item.name} added!`, { icon: "🛒", duration: 1200 });
  };

  const handleRemove = (item) => {
    const qty = getCartQty(item.id);
    if (qty <= 1) removeItem(item.id);
    else updateQuantity(item.id, qty - 1);
  };

  const catCounts = categories.reduce((acc, cat) => {
    acc[cat] = cat === "All"
      ? menuItems.length
      : menuItems.filter(i => (i.category || "Other") === cat).length;
    return acc;
  }, {});

  const filtered = activeCategory === "All"
    ? menuItems
    : menuItems.filter(i => (i.category || "Other") === activeCategory);

  /* ── Loading ── */
  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="skeleton h-56 w-full rounded-2xl" />
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="flex gap-2">
        {[1,2,3].map(i => <div key={i} className="skeleton h-8 w-20 rounded-full" />)}
      </div>
      <div className="space-y-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-surface rounded-2xl p-4 flex gap-4 border border-white/6">
            <div className="skeleton w-24 h-24 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-1/2 rounded-lg" />
              <div className="skeleton h-4 w-3/4 rounded-lg" />
              <div className="skeleton h-8 w-20 rounded-xl mt-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!restaurant) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-slate-500">Restaurant not found.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-36">

      {/* +1 particles */}
      {particles.map(pid => (
        <FlyParticle key={pid} id={pid} onDone={() => setParticles(p => p.filter(x => x !== pid))} />
      ))}

      {/* Back */}
      <motion.button
        whileTap={{ x: -4 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-medium transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to restaurants
      </motion.button>

      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden mb-6 border border-white/6"
      >
        <div className="relative h-52 bg-gradient-to-br from-primary-500/10 to-surface overflow-hidden">
          {restaurant.image_url ? (
            <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">🍽️</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />

          {/* Floating info pill */}
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-heading font-black text-white drop-shadow-lg">{restaurant.name}</h1>
              {restaurant.cuisine_type && (
                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-400 text-xs font-semibold">
                  {restaurant.cuisine_type}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-amber-400 text-sm font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                {parseFloat(restaurant.rating) > 0 ? parseFloat(restaurant.rating).toFixed(1) : "New"}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                restaurant.is_active
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}>
                {restaurant.is_active ? "● Open" : "● Closed"}
              </span>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="px-5 py-3 bg-surface flex flex-wrap gap-4 text-xs text-slate-400">
          {restaurant.description && (
            <p className="w-full text-slate-400 text-sm mb-1">{restaurant.description}</p>
          )}
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" />{restaurant.address}</span>
          {restaurant.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" />{restaurant.phone}</span>}
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" />25–40 min delivery</span>
        </div>
      </motion.div>

      {/* Category tabs — scrollable with right-edge fade */}
      <div className="relative mb-5 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {categories.map(cat => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-primary-500 text-white shadow-glow-sm"
                  : "bg-surface border border-white/6 text-slate-400 hover:text-white hover:border-white/16"
              }`}
            >
              {cat}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeCategory === cat ? "bg-white/20 text-white" : "bg-white/6 text-slate-500"
              }`}>
                {catCounts[cat] || 0}
              </span>
            </motion.button>
          ))}
        </div>
        {/* Fade hint — matches #0f172a page background */}
        <div
          className="pointer-events-none absolute top-0 right-0 h-full w-16"
          style={{ background: "linear-gradient(to right, transparent, #0f172a)" }}
        />
      </div>

      {/* Menu list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">No items in this category.</div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            {filtered.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                cartQty={getCartQty(item.id)}
                onAdd={() => handleAdd(item)}
                onRemove={() => handleRemove(item)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Floating cart */}
      <AnimatePresence>
        {totalItems > 0 && cart.restaurantId === restaurant.id && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto"
          >
            <motion.button
              onClick={() => navigate("/cart")}
              animate={cartPulse ? {
                scale: [1, 1.04, 1],
                boxShadow: ["0 0 24px rgba(255,107,53,0.35)", "0 0 40px rgba(255,107,53,0.7)", "0 0 24px rgba(255,107,53,0.35)"],
              } : {}}
              transition={{ duration: 0.4 }}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-primary-500 text-white font-semibold shadow-glow hover:bg-primary-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold leading-none">View Cart</p>
                  <p className="text-xs text-white/70 mt-0.5">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-base">LKR {totalAmount.toFixed(2)}</p>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantDetailPage;
