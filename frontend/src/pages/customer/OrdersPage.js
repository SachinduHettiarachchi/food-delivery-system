import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ChevronRight, Clock, CheckCircle2, ChefHat,
  Bike, XCircle, ReceiptText, Star, Zap, Ban,
} from "lucide-react";
import { orderAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import toast from "react-hot-toast";

const ACTIVE_STATUSES   = ["pending", "confirmed", "preparing", "out_for_delivery"];
const STATUS_STEPS      = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];
const PAGE_SIZE         = 10;

const STATUS_META = {
  pending:          { icon: Clock,        color: "text-amber-400",   bg: "bg-amber-500/10"   },
  confirmed:        { icon: CheckCircle2, color: "text-blue-400",    bg: "bg-blue-500/10"    },
  preparing:        { icon: ChefHat,      color: "text-violet-400",  bg: "bg-violet-500/10"  },
  out_for_delivery: { icon: Bike,         color: "text-cyan-400",    bg: "bg-cyan-500/10"    },
  delivered:        { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  cancelled:        { icon: XCircle,      color: "text-red-400",     bg: "bg-red-500/10"     },
};

/* ── Date grouping helper ─────────────────────────────── */
function dateGroup(isoStr) {
  const d     = new Date(isoStr);
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff  = today - new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (diff <= 0)             return "Today";
  if (diff <= 86_400_000)    return "Yesterday";
  if (diff <= 6 * 86_400_000) return "This Week";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/* ── Order card ───────────────────────────────────────── */
const OrderCard = ({ order, index, onCancelled }) => {
  const [cancelling, setCancelling] = React.useState(false);

  const handleCancel = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setCancelling(true);
    try {
      await orderAPI.cancel(order.id);
      toast.success("Order cancelled.");
      onCancelled(order.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };
  const meta     = STATUS_META[order.status] || STATUS_META.pending;
  const Icon     = meta.icon;
  const isActive  = ACTIVE_STATUSES.includes(order.status);
  const stepIdx   = STATUS_STEPS.indexOf(order.status);
  const orderDate = new Date(order.created_at);
  const isToday   = orderDate.toDateString() === new Date().toDateString();
  const timeStr   = isToday
    ? orderDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : orderDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        + " · " + orderDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.3 }}
    >
      <Link
        to={`/orders/${order.id}`}
        className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-200
          hover:shadow-card
          ${isActive
            ? "bg-primary-500/5 border-primary-500/20 hover:border-primary-500/35"
            : "card hover:border-white/12"}`}
      >
        {/* Active progress bar */}
        {isActive && (
          <div className="h-0.5 bg-white/4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((stepIdx + 1) / STATUS_STEPS.length) * 100}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary-500 to-amber-400"
            />
          </div>
        )}

        <div className="flex items-center gap-3 p-4">
          {/* Icon */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
            <Icon className={`w-5 h-5 ${meta.color}`} />
          </div>

          {/* Middle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-white text-sm">Order #{order.id}</p>
              {isActive && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs truncate">{order.restaurant?.name}</p>

            {/* Item chips */}
            {order.orderItems?.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-1.5">
                {order.orderItems.slice(0, 2).map((oi, i) => (
                  <span key={i} className="text-[11px] text-slate-500 bg-white/4 px-1.5 py-0.5 rounded-md">
                    {oi.menuItem?.name}
                  </span>
                ))}
                {order.orderItems.length > 2 && (
                  <span className="text-[11px] text-slate-600">+{order.orderItems.length - 2}</span>
                )}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <StatusBadge status={order.status} />
            <p className="text-white font-bold text-sm">LKR {parseFloat(order.total_amount).toFixed(2)}</p>
            <p className="text-slate-600 text-[10px]">{timeStr}</p>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors flex-shrink-0" />
        </div>

        {/* Footer: Rate (delivered) or Cancel (pending) */}
        {order.status === "delivered" && (
          <div className="px-4 pb-3 flex justify-end">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400
              bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 rounded-lg
              group-hover:bg-amber-500/20 transition-colors">
              <Star className="w-3 h-3 fill-amber-400" /> Rate your order
            </span>
          </div>
        )}
        {order.status === "pending" && (
          <div className="px-4 pb-3 flex justify-end">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-400
                bg-red-500/8 border border-red-500/20 px-3 py-1.5 rounded-lg
                hover:bg-red-500/18 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Ban className="w-3 h-3" /> {cancelling ? "Cancelling…" : "Cancel Order"}
            </button>
          </div>
        )}
      </Link>
    </motion.div>
  );
};

/* ── Date section divider ─────────────────────────────── */
const GroupLabel = ({ label }) => (
  <div className="flex items-center gap-3 my-4 first:mt-0">
    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{label}</p>
    <div className="flex-1 h-px bg-white/5" />
  </div>
);

/* ── Skeleton ─────────────────────────────────────────── */
const Skeleton = () => (
  <div className="card p-4">
    <div className="flex items-center gap-3">
      <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-24 rounded" />
        <div className="skeleton h-3 w-36 rounded" />
      </div>
      <div className="space-y-2 text-right">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-3.5 w-14 rounded" />
      </div>
    </div>
  </div>
);

/* ── Page ─────────────────────────────────────────────── */
const TABS = [
  { key: "all",       label: "All" },
  { key: "active",    label: "Active",    statuses: ACTIVE_STATUSES },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("all");
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    orderAPI.getMyOrders()
      .then(r  => setOrders(r.data.data))
      .catch(() => toast.error("Failed to load orders."))
      .finally(() => setLoading(false));
  }, []);

  // Poll every 20 s while there are active orders
  useEffect(() => {
    const hasActive = orders.some(o => ACTIVE_STATUSES.includes(o.status));
    if (!hasActive) return;
    const interval = setInterval(() => {
      orderAPI.getMyOrders()
        .then(r => setOrders(r.data.data))
        .catch(() => {});
    }, 20_000);
    return () => clearInterval(interval);
  }, [orders]);

  const handleCancelled = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
  };

  // Reset pagination when switching tabs
  const handleTab = (key) => { setTab(key); setPage(1); };

  const activeOrders = useMemo(
    () => orders.filter(o => ACTIVE_STATUSES.includes(o.status)),
    [orders]
  );

  // History = non-active orders, filtered by tab, sorted newest first
  const historyOrders = useMemo(() => {
    const base = orders
      .filter(o => !ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (tab === "all" || tab === "active") return base;
    const t = TABS.find(t => t.key === tab);
    return t?.statuses ? base.filter(o => t.statuses.includes(o.status)) : base;
  }, [orders, tab]);

  // Paginated slice of history
  const visibleHistory = historyOrders.slice(0, page * PAGE_SIZE);
  const hasMore        = visibleHistory.length < historyOrders.length;

  // Group visible history by date
  const grouped = useMemo(() => {
    const map = [];
    let lastLabel = null;
    visibleHistory.forEach((o, i) => {
      const label = dateGroup(o.created_at);
      if (label !== lastLabel) { map.push({ type: "label", label }); lastLabel = label; }
      map.push({ type: "order", order: o, index: i });
    });
    return map;
  }, [visibleHistory]);

  const tabCount = (t) => {
    if (t.key === "all") return orders.length;
    return orders.filter(o => t.statuses?.includes(o.status)).length;
  };

  const showActiveSection = (tab === "all" || tab === "active") && activeOrders.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* ── Header ─────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <ReceiptText className="w-5 h-5 text-primary-400" />
          <h1 className="text-2xl font-heading font-bold text-white">My Orders</h1>
        </div>
        {!loading && (
          <p className="text-slate-500 text-sm ml-8">
            {activeOrders.length > 0
              ? <span><span className="text-primary-400 font-semibold">{activeOrders.length} active</span> · {orders.length} total</span>
              : `${orders.length} order${orders.length !== 1 ? "s" : ""} total`}
          </p>
        )}
      </motion.div>

      {/* ── Tab filters ────────────────────────────────── */}
      {!loading && orders.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {TABS.map(t => {
            const count = tabCount(t);
            if (count === 0 && t.key !== "all") return null;
            const active = tab === t.key;
            return (
              <motion.button key={t.key} whileTap={{ scale: 0.93 }}
                onClick={() => handleTab(t.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  active
                    ? "bg-primary-500 text-white shadow-glow-sm"
                    : "bg-surface border border-white/6 text-slate-400 hover:text-white hover:border-white/12"
                }`}>
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  active ? "bg-white/20 text-white" : "bg-white/6 text-slate-500"
                }`}>{count}</span>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0,1,2,3].map(i => <Skeleton key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-surface border border-white/6 flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-700" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-white mb-1">No orders yet</h3>
            <p className="text-slate-500 text-sm">Your order history will appear here.</p>
          </div>
          <Link to="/restaurants" className="btn-primary px-8 mt-1">Browse Restaurants</Link>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            {/* ── Active orders (always at top) ─────────── */}
            {showActiveSection && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                  <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">
                    Active Orders
                  </p>
                </div>
                <div className="space-y-3">
                  {activeOrders.map((order, i) => (
                    <OrderCard key={order.id} order={order} index={i} onCancelled={handleCancelled} />
                  ))}
                </div>

                {/* Divider before history */}
                {historyOrders.length > 0 && tab === "all" && (
                  <div className="flex items-center gap-3 mt-6">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Order History</p>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                )}
              </div>
            )}

            {/* ── History (date-grouped, paginated) ─────── */}
            {tab === "active" ? (
              activeOrders.length === 0 && (
                <div className="text-center py-16 text-slate-500 text-sm">No active orders right now.</div>
              )
            ) : historyOrders.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No {tab !== "all" ? tab : "past"} orders found.
              </div>
            ) : (
              <div>
                <div className="space-y-1">
                  {grouped.map((entry, i) =>
                    entry.type === "label"
                      ? <GroupLabel key={`lbl-${entry.label}`} label={entry.label} />
                      : <OrderCard key={entry.order.id} order={entry.order} index={entry.index} onCancelled={handleCancelled} />
                  )}
                </div>

                {/* Load more / summary */}
                <div className="mt-6 flex flex-col items-center gap-2">
                  {hasMore ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setPage(p => p + 1)}
                      className="px-6 py-2.5 rounded-xl border border-white/8 text-slate-400 text-sm font-semibold
                        hover:bg-white/4 hover:text-white transition-all duration-200"
                    >
                      Show more · {historyOrders.length - visibleHistory.length} remaining
                    </motion.button>
                  ) : historyOrders.length > PAGE_SIZE && (
                    <p className="text-slate-600 text-xs">All {historyOrders.length} orders shown</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
