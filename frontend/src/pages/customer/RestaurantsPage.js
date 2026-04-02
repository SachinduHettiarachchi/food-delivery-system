import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, Clock, MapPin, ChevronRight, SlidersHorizontal, X, Utensils } from "lucide-react";
import { restaurantAPI } from "../../services/api";
import toast from "react-hot-toast";

/* ── Helpers ──────────────────────────────────────────── */
const PLACEHOLDERS = ["Search pizza...", "Search burgers...", "Search sushi...", "Search biryani...", "Search pasta..."];

const toTitleCase = (s) =>
  s ? s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()) : s;

/* Cuisine → consistent color palette */
const CUISINE_COLORS = {
  Indian:        { pill: "#fb923c", bg: "rgba(251,146,60,0.18)",  border: "rgba(251,146,60,0.35)", gradient: "from-orange-500/20" },
  Italian:       { pill: "#f87171", bg: "rgba(239,68,68,0.18)",   border: "rgba(239,68,68,0.35)",  gradient: "from-red-500/20"    },
  American:      { pill: "#60a5fa", bg: "rgba(59,130,246,0.18)",  border: "rgba(59,130,246,0.35)", gradient: "from-blue-500/20"   },
  Chinese:       { pill: "#facc15", bg: "rgba(234,179,8,0.18)",   border: "rgba(234,179,8,0.35)",  gradient: "from-yellow-500/20" },
  Japanese:      { pill: "#f472b6", bg: "rgba(236,72,153,0.18)",  border: "rgba(236,72,153,0.35)", gradient: "from-pink-500/20"   },
  Mexican:       { pill: "#34d399", bg: "rgba(16,185,129,0.18)",  border: "rgba(16,185,129,0.35)", gradient: "from-emerald-500/20"},
  Thai:          { pill: "#c084fc", bg: "rgba(168,85,247,0.18)",  border: "rgba(168,85,247,0.35)", gradient: "from-purple-500/20" },
  French:        { pill: "#818cf8", bg: "rgba(99,102,241,0.18)",  border: "rgba(99,102,241,0.35)", gradient: "from-indigo-500/20" },
  Mediterranean: { pill: "#2dd4bf", bg: "rgba(45,212,191,0.18)",  border: "rgba(45,212,191,0.35)", gradient: "from-teal-500/20"  },
  Korean:        { pill: "#fb7185", bg: "rgba(251,113,133,0.18)", border: "rgba(251,113,133,0.35)",gradient: "from-rose-500/20"   },
};
const getCuisineColor = (c) => CUISINE_COLORS[toTitleCase(c)] || {
  pill: "#94a3b8", bg: "rgba(148,163,184,0.18)", border: "rgba(148,163,184,0.35)", gradient: "from-slate-500/20",
};

const CUISINE_ICONS = {
  Italian: "🍕", American: "🍔", Chinese: "🥡", Japanese: "🍣",
  Indian: "🍛", Mexican: "🌮", Thai: "🍜", French: "🥐",
  Mediterranean: "🫒", Korean: "🍱", default: "🍽️",
};
const getCuisineIcon = (c) => CUISINE_ICONS[toTitleCase(c)] || CUISINE_ICONS.default;

/* ── Skeleton ─────────────────────────────────────────── */
const CardSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="skeleton" style={{ aspectRatio: "16/9", width: "100%" }} />
    <div className="p-4 space-y-2.5">
      <div className="skeleton h-5 w-3/4 rounded-lg" />
      <div className="skeleton h-4 w-1/2 rounded-lg" />
      <div className="skeleton h-4 w-2/3 rounded-lg" />
      <div className="flex gap-2 pt-1">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
    </div>
  </div>
);

const TAG_STYLES = {
  "🔥 Best Seller": { bg: "rgba(249,115,22,0.18)", text: "#fb923c", border: "rgba(249,115,22,0.30)" },
  "⭐ Top Rated":   { bg: "rgba(251,191,36,0.18)", text: "#fbbf24", border: "rgba(251,191,36,0.30)" },
  "📈 Trending":    { bg: "rgba(34,197,94,0.18)",  text: "#22c55e", border: "rgba(34,197,94,0.30)" },
  "✨ New":          { bg: "rgba(96,165,250,0.18)", text: "#60a5fa", border: "rgba(96,165,250,0.30)" },
};

/* ── Restaurant Card ──────────────────────────────────── */
const RestaurantCard = ({ r, index }) => {
  const cuisineColor  = getCuisineColor(r.cuisine_type);
  const cuisineLabel  = toTitleCase(r.cuisine_type);
  const hasRating     = parseFloat(r.rating) > 0;
  const displayName   = r.name
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
    >
      <Link
        to={`/restaurants/${r.id}`}
        className="group block card overflow-hidden"
        style={{ transition: "box-shadow 0.25s, background 0.25s, border-color 0.25s" }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,107,53,0.22)";
          e.currentTarget.style.background = "rgba(30,41,59,0.95)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = "";
          e.currentTarget.style.background = "";
        }}
      >
        {/* Image area — 16/9 */}
        <div className="relative overflow-hidden bg-surface" style={{ aspectRatio: "16/9" }}>
          {r.image_url ? (
            <img
              src={r.image_url}
              alt={displayName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            /* Letter placeholder */
            <div
              className={`w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br ${cuisineColor.gradient} to-surface`}
            >
              <span
                className="text-5xl font-black leading-none"
                style={{ color: cuisineColor.pill, textShadow: `0 0 24px ${cuisineColor.pill}60` }}
              >
                {displayName.charAt(0)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cuisineColor.pill, opacity: 0.6 }}>
                {cuisineLabel || "Restaurant"}
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500 text-white text-sm font-bold shadow-glow transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
              View Menu <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          {/* Open/Closed badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
              r.is_active
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : "bg-red-500/20 border border-red-500/30 text-red-400"
            }`}>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-px align-middle"
                style={{
                  background: r.is_active ? "#34d399" : "#f87171",
                  boxShadow:  r.is_active ? "0 0 6px #34d399" : "0 0 6px #f87171",
                }}
              />
              {r.is_active ? "Open" : "Closed"}
            </span>
          </div>

          {/* Rating OR "New" badge */}
          <div className="absolute top-3 right-3">
            {hasRating ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-sm text-xs font-bold text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
                {parseFloat(r.rating).toFixed(1)}
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-500/20 backdrop-blur-sm border border-primary-500/30 text-xs font-bold text-primary-400">
                ✦ New
              </div>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          {/* Name */}
          <h3 className="font-heading font-bold text-white group-hover:text-primary-300 transition-colors text-base leading-tight mb-1.5 truncate">
            {displayName}
          </h3>

          {/* Cuisine badge */}
          {cuisineLabel && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full mb-2.5"
              style={{ background: cuisineColor.bg, color: cuisineColor.pill, border: `1px solid ${cuisineColor.border}` }}
            >
              {getCuisineIcon(r.cuisine_type)} {cuisineLabel}
            </span>
          )}

          {/* Top item tag signal — only shown if menu items are included in API response */}
          {r.menuItems?.some(mi => mi.tag) && (() => {
            const topItem = r.menuItems.find(mi => mi.tag);
            const ts = TAG_STYLES[topItem.tag] || { bg: "rgba(251,191,36,0.18)", text: "#fbbf24", border: "rgba(251,191,36,0.30)" };
            return (
              <span
                className="inline-block mb-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"
                style={{ background: ts.bg, color: ts.text, borderColor: ts.border }}
              >
                {topItem.tag}
              </span>
            );
          })()}

          {/* Address */}
          <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{r.address}</span>
          </div>

          {/* Footer row — rating already shown in image overlay, use this for delivery time */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Clock className="w-3.5 h-3.5" />
              ~{r.delivery_time ? r.delivery_time : "25–40"} min
            </div>

            {!hasRating && (
              <div className="flex items-center gap-1 text-primary-400 text-xs font-semibold">
                <Utensils className="w-3 h-3" /> New
              </div>
            )}

            <span className="ml-auto text-xs font-semibold text-slate-600 group-hover:text-primary-400 transition-colors">
              View menu →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ── Main Page ─────────────────────────────────────────── */
const RestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [search, setSearch]           = useState("");
  const [activeCuisine, setActiveCuisine] = useState("All");
  const [cuisines, setCuisines]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [phIdx, setPhIdx]             = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    restaurantAPI.getAll()
      .then(res => {
        const data = res.data.data;
        setRestaurants(data);
        setFiltered(data);
        /* Deduplicate after normalizing to title case */
        const seen = new Set();
        const types = ["All"];
        data.forEach(r => {
          if (r.cuisine_type) {
            const normalized = toTitleCase(r.cuisine_type.trim());
            if (!seen.has(normalized)) { seen.add(normalized); types.push(normalized); }
          }
        });
        setCuisines(types);
      })
      .catch(() => toast.error("Failed to load restaurants."))
      .finally(() => setLoading(false));
  }, []);

  const applyFilters = useCallback((q, cuisine) => {
    let result = restaurants;
    if (cuisine !== "All") {
      result = result.filter(r =>
        toTitleCase(r.cuisine_type?.trim()) === cuisine
      );
    }
    if (q) {
      const lower = q.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(lower) ||
        r.cuisine_type?.toLowerCase().includes(lower) ||
        r.address?.toLowerCase().includes(lower)
      );
    }
    setFiltered(result);
  }, [restaurants]);

  useEffect(() => { applyFilters(search, activeCuisine); }, [search, activeCuisine, applyFilters]);

  const clearSearch = () => { setSearch(""); setActiveCuisine("All"); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Hero */}
      <div className="text-center mb-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-heading font-black text-white mb-3"
        >
          What are you <span className="text-primary-400">craving</span>?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="text-slate-400 text-lg mb-8"
        >
          Discover the best food from top restaurants near you
        </motion.p>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative max-w-xl mx-auto"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none z-10" />
          <motion.input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={PLACEHOLDERS[phIdx]}
            animate={searchFocused ? { scale: 1.01 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full pl-12 pr-10 py-4 rounded-2xl bg-surface border border-white/8 text-slate-100 placeholder-slate-500 text-base focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 shadow-card"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Cuisine filter chips */}
      {!loading && cuisines.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none"
        >
          {cuisines.map(c => {
            const isAll    = c === "All";
            const isActive = activeCuisine === c;
            const col      = !isAll ? getCuisineColor(c) : null;

            return (
              <motion.button
                key={c}
                onClick={() => setActiveCuisine(c)}
                whileTap={{ scale: 0.93 }}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200"
                style={
                  isActive
                    ? isAll
                      ? { background: "var(--color-primary-500, #ff6b35)", color: "white", borderColor: "var(--color-primary-500, #ff6b35)", boxShadow: "0 0 12px rgba(255,107,53,0.4)" }
                      : { background: col.bg, color: col.pill, borderColor: col.border, boxShadow: `0 0 12px ${col.pill}35` }
                    : { background: "transparent", color: "#94a3b8", borderColor: "rgba(255,255,255,0.08)" }
                }
              >
                {isAll
                  ? <SlidersHorizontal className="w-3.5 h-3.5" />
                  : <span>{getCuisineIcon(c)}</span>
                }
                {c}
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Status bar */}
      {!loading && (
        <div className="flex items-center justify-between mb-6">
          <motion.p
            key={filtered.length + search + activeCuisine}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-slate-400"
          >
            <span className="text-white font-bold text-[15px]">{filtered.length}</span>{" "}
            restaurant{filtered.length !== 1 ? "s" : ""}
            {activeCuisine !== "All" && (
              <span style={{ color: getCuisineColor(activeCuisine).pill }}> · {activeCuisine}</span>
            )}
            {search && (
              <span className="text-slate-400"> matching "<span className="text-primary-400">{search}</span>"</span>
            )}
          </motion.p>
          {(search || activeCuisine !== "All") && (
            <button
              onClick={clearSearch}
              className="text-xs text-slate-500 hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-20 h-20 rounded-2xl bg-surface border border-white/5 flex items-center justify-center text-4xl"
          >
            🔍
          </motion.div>
          <h3 className="text-xl font-heading font-bold text-white">No restaurants found</h3>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            {search
              ? `No results for "${search}"${activeCuisine !== "All" ? ` in ${activeCuisine}` : ""}`
              : `No ${activeCuisine} restaurants available right now`}
          </p>
          <button onClick={clearSearch} className="btn-primary mt-2 px-6">
            Clear Filters
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCuisine}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filtered.map((r, i) => <RestaurantCard key={r.id} r={r} index={i} />)}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default RestaurantsPage;
