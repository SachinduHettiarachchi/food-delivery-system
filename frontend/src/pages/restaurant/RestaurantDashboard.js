import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Package, Clock, CheckCircle, UtensilsCrossed,
  Plus, BarChart3, ChevronRight, Bell, Bike, ArrowRight,
  Store, Settings, Star,
} from "lucide-react";
import { restaurantAPI, orderAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import StatusBadge from "../../components/common/StatusBadge";
import toast from "react-hot-toast";

/* ── Helpers ─────────────────────────────────────────────────────────── */
const isToday = (iso) => {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() &&
         d.getMonth()    === n.getMonth()    &&
         d.getDate()     === n.getDate();
};

const timeAgo = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)  return "just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  return h < 24 ? `${h}h ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/* Status flow: what button to show for each status */
const NEXT_STATUS = {
  pending:          { label: "Accept",           next: "confirmed",        color: "bg-blue-500 hover:bg-blue-600 text-white" },
  confirmed:        { label: "Start Cooking",    next: "preparing",        color: "bg-violet-500 hover:bg-violet-600 text-white" },
  preparing:        { label: "Out for Delivery", next: "out_for_delivery", color: "bg-cyan-500 hover:bg-cyan-600 text-white" },
  out_for_delivery: { label: "Mark Delivered",   next: "delivered",        color: "bg-emerald-500 hover:bg-emerald-600 text-white" },
};

const STATUS_META = {
  pending:          { label: "New Order",    dot: "bg-amber-400",   ring: "ring-amber-500/20",  bg: "bg-amber-500/8"   },
  confirmed:        { label: "Confirmed",    dot: "bg-blue-400",    ring: "ring-blue-500/20",   bg: "bg-blue-500/8"    },
  preparing:        { label: "Preparing",    dot: "bg-violet-400",  ring: "ring-violet-500/20", bg: "bg-violet-500/8"  },
  out_for_delivery: { label: "On the Way",   dot: "bg-cyan-400",    ring: "ring-cyan-500/20",   bg: "bg-cyan-500/8"    },
};

/* ── Active order card ───────────────────────────────────────────────── */
const ActiveOrderCard = ({ order, onUpdate, index }) => {
  const meta    = STATUS_META[order.status];
  const advance = NEXT_STATUS[order.status];
  const [busy, setBusy] = useState(false);

  const handleAdvance = async () => {
    setBusy(true);
    await onUpdate(order.id, advance.next);
    setBusy(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`relative rounded-2xl border ring-1 ${meta.ring} ${meta.bg} border-white/8 p-4 overflow-hidden`}
    >
      {/* Pulsing indicator top-left */}
      <span className={`absolute top-3.5 right-3.5 w-2 h-2 rounded-full ${meta.dot} ${order.status === "pending" ? "animate-ping" : ""}`} />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-bold text-white text-sm">Order #{order.id}</p>
          <p className="text-slate-400 text-xs mt-0.5">{order.customer?.name} · {timeAgo(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Items */}
      <div className="flex flex-wrap gap-1 mb-3">
        {order.orderItems?.map((oi, i) => (
          <span key={i} className="text-[11px] bg-white/6 text-slate-300 px-2 py-0.5 rounded-md">
            {oi.quantity > 1 && <span className="text-primary-400 font-bold">{oi.quantity}× </span>}
            {oi.menuItem?.name}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-primary-400 font-black text-sm">LKR {parseFloat(order.total_amount).toFixed(2)}</p>
        {advance && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={busy}
            onClick={handleAdvance}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${advance.color} disabled:opacity-50`}
          >
            {busy ? "Updating…" : advance.label}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

/* ── Stat card ───────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, icon: Icon, iconBg, iconColor, urgent, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className={`card p-5 relative overflow-hidden ${urgent ? "border-amber-500/30 bg-amber-500/4" : ""}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      {urgent && (
        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          ACTION
        </span>
      )}
    </div>
    <p className="text-2xl font-heading font-black text-white leading-none mb-1">{value}</p>
    <p className="text-slate-500 text-xs">{label}</p>
    {sub && <p className="text-slate-600 text-[10px] mt-0.5">{sub}</p>}
  </motion.div>
);

/* ── Main ────────────────────────────────────────────────────────────── */
const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [restaurants,   setRestaurants]   = useState([]);
  const [allOrders,     setAllOrders]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const restaurantsRef = React.useRef([]);

  const fetchOrders = React.useCallback(async (rList) => {
    const settled = await Promise.all(
      rList.map(r => orderAPI.getRestaurantOrders(r.id).then(o => o.data.data).catch(() => []))
    );
    setAllOrders(settled.flat());
  }, []);

  useEffect(() => {
    restaurantAPI.getMine()
      .then(async (res) => {
        const mine = res.data.data;
        restaurantsRef.current = mine;
        setRestaurants(mine);
        await fetchOrders(mine);
      })
      .catch(() => toast.error("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, [fetchOrders]);

  // Poll for new orders every 30 s
  useEffect(() => {
    const interval = setInterval(() => {
      if (restaurantsRef.current.length > 0) fetchOrders(restaurantsRef.current);
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status);
      setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success("Order updated.");
    } catch { toast.error("Failed to update order."); }
  };

  /* ── Derived data ─────────────────────────────────────────────── */
  const activeOrders    = useMemo(() => allOrders.filter(o => ["pending","confirmed","preparing","out_for_delivery"].includes(o.status)), [allOrders]);
  const pendingCount    = useMemo(() => allOrders.filter(o => o.status === "pending").length, [allOrders]);
  const preparingCount  = useMemo(() => allOrders.filter(o => o.status === "preparing" || o.status === "confirmed").length, [allOrders]);
  const deliveredToday  = useMemo(() => allOrders.filter(o => o.status === "delivered" && isToday(o.created_at)).length, [allOrders]);
  const revenueToday    = useMemo(() => allOrders.filter(o => o.status === "delivered" && isToday(o.created_at)).reduce((s, o) => s + parseFloat(o.total_amount), 0), [allOrders]);
  const revenueTotal    = useMemo(() => allOrders.filter(o => o.status === "delivered").reduce((s, o) => s + parseFloat(o.total_amount), 0), [allOrders]);

  const recentCompleted = useMemo(() =>
    allOrders
      .filter(o => o.status === "delivered" || o.status === "cancelled")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8),
    [allOrders]
  );

  /* ── Chart: orders per day (last 7 days) ─────────────────────── */
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.toDateString(),
        count: 0,
      };
    });
    allOrders.forEach(o => {
      const dateStr = new Date(o.created_at).toDateString();
      const slot = days.find(d => d.date === dateStr);
      if (slot) slot.count += 1;
    });
    return days;
  }, [allOrders]);

  const todayIdx = 6; // last element is always today

  /* ── Loading skeleton ─────────────────────────────────────────── */
  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="skeleton h-7 w-52 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  );

  /* ── No restaurant ────────────────────────────────────────────── */
  if (restaurants.length === 0) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} className="card p-10">
        <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-6 text-4xl">🍽️</div>
        <h1 className="text-2xl font-heading font-bold text-white mb-3">Set up your restaurant</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Create your restaurant to start receiving orders, manage your menu, and track revenue.
        </p>
        <Link to="/restaurant/new" className="btn-primary gap-2 inline-flex">
          <Plus className="w-4 h-4" /> Create My Restaurant
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-start justify-between mb-8">
        <div>
          <p className="text-slate-500 text-sm mb-0.5">{greeting()},</p>
          <h1 className="text-2xl font-heading font-bold text-white">{user.name}</h1>
          <p className="text-slate-500 text-xs mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {pendingCount > 0 && (
              <span className="ml-3 text-amber-400 font-semibold">
                · {pendingCount} new order{pendingCount !== 1 ? "s" : ""} waiting
              </span>
            )}
          </p>
        </div>

        {/* Quick nav */}
        <div className="hidden sm:flex items-center gap-2">
          <Link to="/restaurant/menu"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 transition-colors">
            <UtensilsCrossed className="w-3.5 h-3.5" /> Menu
          </Link>
          <Link to="/restaurant/orders"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-white/8 text-slate-300 text-xs font-semibold hover:text-white transition-colors">
            <Package className="w-3.5 h-3.5" /> All Orders
          </Link>
          <Link to="/restaurant/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-white/8 text-slate-300 text-xs font-semibold hover:text-white hover:border-primary-500/40 transition-colors"
            title="Add another restaurant">
            <Plus className="w-3.5 h-3.5" /> Add Restaurant
          </Link>
          {restaurants.length === 1 ? (
            <Link to={`/restaurant/edit/${restaurants[0].id}`}
              className="w-9 h-9 rounded-xl bg-surface border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              title={`Settings — ${restaurants[0].name}`}>
              <Settings className="w-4 h-4" />
            </Link>
          ) : (
            restaurants.map((r) => (
              <Link key={r.id} to={`/restaurant/edit/${r.id}`}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-surface border border-white/8 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
                title={`Settings — ${r.name}`}>
                <Settings className="w-3.5 h-3.5" />
                {r.name.split(" ")[0]}
              </Link>
            ))
          )}
        </div>
      </motion.div>

      {/* ── Stats row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="New Orders"
          value={pendingCount}
          sub={pendingCount > 0 ? "Needs your attention" : "All caught up"}
          icon={Bell}
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
          urgent={pendingCount > 0}
          delay={0}
        />
        <StatCard
          label="In Kitchen"
          value={preparingCount}
          sub={preparingCount > 0 ? "Confirmed + preparing" : "Kitchen idle"}
          icon={UtensilsCrossed}
          iconBg="bg-violet-500/15"
          iconColor="text-violet-400"
          delay={0.05}
        />
        <StatCard
          label="Delivered Today"
          value={deliveredToday}
          sub={`${allOrders.filter(o => o.status === "delivered").length} total`}
          icon={CheckCircle}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
          delay={0.1}
        />
        <StatCard
          label="Revenue Today"
          value={`LKR ${revenueToday.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={`LKR ${revenueTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} total`}
          icon={TrendingUp}
          iconBg="bg-primary-500/15"
          iconColor="text-primary-400"
          delay={0.15}
        />
      </div>

      {/* ── Active order queue ─────────────────────────────────── */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            <h2 className="font-heading font-bold text-white text-base">Active Orders</h2>
            {activeOrders.length > 0 && (
              <span className="bg-primary-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                {activeOrders.length}
              </span>
            )}
          </div>
          <Link to="/restaurant/orders"
            className="text-xs text-slate-500 hover:text-primary-400 transition-colors flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <AnimatePresence mode="popLayout">
          {activeOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="card p-8 text-center"
            >
              <div className="text-3xl mb-3">🎉</div>
              <p className="text-white font-semibold text-sm">All caught up!</p>
              <p className="text-slate-500 text-xs mt-1">No active orders right now. New orders will appear here.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {activeOrders.map((order, i) => (
                <ActiveOrderCard
                  key={order.id}
                  order={order}
                  index={i}
                  onUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Bottom grid: history + chart ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

        {/* Recent completed orders */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }} className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="font-heading font-bold text-white text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Completed Orders
            </h2>
            <Link to="/restaurant/orders"
              className="text-xs text-slate-500 hover:text-primary-400 transition-colors flex items-center gap-1">
              All orders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentCompleted.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No completed orders yet.</div>
          ) : (
            <div className="divide-y divide-white/4">
              {recentCompleted.map((o) => (
                <Link
                  key={o.id}
                  to={`/restaurant/orders`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors group"
                >
                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-slate-200 text-sm font-semibold">#{o.id}</span>
                      <span className="text-slate-500 text-xs truncate">{o.customer?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {o.orderItems?.slice(0, 2).map((oi, i) => (
                        <span key={i} className="text-[10px] text-slate-600 bg-white/3 px-1.5 py-0.5 rounded">
                          {oi.menuItem?.name}
                        </span>
                      ))}
                      {(o.orderItems?.length ?? 0) > 2 && (
                        <span className="text-[10px] text-slate-600">+{o.orderItems.length - 2}</span>
                      )}
                    </div>
                  </div>

                  {/* Amount + time */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold text-sm">LKR {parseFloat(o.total_amount).toFixed(0)}</p>
                    <p className="text-slate-600 text-[10px] mt-0.5">{timeAgo(o.created_at)}</p>
                  </div>

                  <StatusBadge status={o.status} />
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right column: chart + restaurants */}
        <div className="space-y-5">

          {/* 7-day chart */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.28 }} className="card p-5">
            <h2 className="font-heading font-bold text-white text-sm flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary-400" /> Orders — Last 7 Days
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 0, right: 0, bottom: 0, left: -24 }}>
                <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#F1F5F9", fontSize: 11 }}
                  cursor={{ fill: "rgba(255,107,53,0.06)" }}
                  formatter={(v) => [v, "Orders"]}
                />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === todayIdx ? "#FF6B35" : "rgba(255,107,53,0.25)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-slate-600 mt-2 text-center">
              Today: <span className="text-primary-400 font-bold">{chartData[todayIdx]?.count ?? 0}</span> orders
            </p>
          </motion.div>

          {/* Restaurant list */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.32 }} className="card p-5">
            <h2 className="font-heading font-bold text-white text-sm flex items-center gap-2 mb-4">
              <Store className="w-4 h-4 text-slate-400" /> My Restaurants
            </h2>
            <div className="space-y-3">
              {restaurants.map((r) => (
                <Link
                  key={r.id}
                  to={`/restaurant/edit/${r.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center text-sm font-black text-primary-400 flex-shrink-0">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-xs font-semibold truncate group-hover:text-white transition-colors">
                      {r.name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] text-slate-500">
                        {parseFloat(r.rating) > 0 ? parseFloat(r.rating).toFixed(1) : "No ratings yet"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>

            <Link to="/restaurant/new"
              className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-white/3 hover:bg-primary-500/10 hover:text-primary-400 border border-white/5 hover:border-primary-500/25 transition-all">
              <Plus className="w-3.5 h-3.5" /> Add another restaurant
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
