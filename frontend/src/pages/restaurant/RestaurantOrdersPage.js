import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ChevronDown, ChevronUp, MapPin, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { restaurantAPI, orderAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import { formatDateTime, formatCurrency, capitalizeWords } from "../../utils/helpers";
import toast from "react-hot-toast";

const RestaurantOrdersPage = () => {
  const [restaurants, setRestaurants]           = useState([]);
  const [orders, setOrders]                     = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [statusFilter, setStatusFilter]         = useState("all");
  const [loading, setLoading]                   = useState(true);
  const [expandedOrder, setExpandedOrder]       = useState(null);
  const [page, setPage]                         = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    restaurantAPI.getMine()
      .then(async (res) => {
        const myRestaurants = res.data.data;
        setRestaurants(myRestaurants);
        if (myRestaurants.length > 0) await loadOrders(myRestaurants[0]);
        else setLoading(false);
      })
      .catch(() => { toast.error("Failed to load."); setLoading(false); });
  }, []); // eslint-disable-line

  const loadOrders = async (restaurant) => {
    setLoading(true);
    setSelectedRestaurant(restaurant);
    setPage(1);
    try {
      const res = await orderAPI.getRestaurantOrders(restaurant.id);
      setOrders(res.data.data);
    } catch { toast.error("Failed to load orders."); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Updated to "${capitalizeWords(newStatus)}"`);
    } catch { toast.error("Failed to update status."); }
  };

  const filtered   = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    out_for_delivery: orders.filter((o) => o.status === "out_for_delivery").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-white">Orders</h1>
        <p className="text-slate-500 text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Restaurant tabs */}
      {restaurants.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {restaurants.map((r) => (
            <button key={r.id} onClick={() => loadOrders(r)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedRestaurant?.id === r.id ? "bg-primary-500 text-white" : "bg-surface border border-white/5 text-slate-400 hover:text-white"
              }`}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Counter chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { key: "pending",           label: "Pending",      color: "text-amber-400",  bg: "bg-amber-500/10" },
          { key: "confirmed",         label: "Confirmed",    color: "text-blue-400",   bg: "bg-blue-500/10" },
          { key: "preparing",         label: "Preparing",    color: "text-violet-400", bg: "bg-violet-500/10" },
          { key: "out_for_delivery",  label: "On the Way",   color: "text-cyan-400",   bg: "bg-cyan-500/10" },
        ].map(({ key, label, color, bg }) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(statusFilter === key ? "all" : key); setPage(1); }}
            className={`p-3 rounded-xl border transition-all text-left ${
              statusFilter === key ? "border-white/20 bg-white/5" : "border-white/5 bg-surface hover:border-white/10"
            }`}
          >
            <p className={`text-xl font-heading font-black ${color}`}>{counts[key]}</p>
            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm bg-surface border border-white/8 text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary-500/50"
        >
          <option value="all">All Orders ({orders.length})</option>
          {["pending","confirmed","preparing","out_for_delivery","delivered","cancelled"].map((s) => (
            <option key={s} value={s}>{capitalizeWords(s)}</option>
          ))}
        </select>
        <span className="text-slate-600 text-sm">Showing {filtered.length} orders</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No orders {statusFilter !== "all" ? `with status "${capitalizeWords(statusFilter)}"` : "yet"}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/2 transition-colors"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">#{order.id}</span>
                    <span className="text-slate-400 text-sm">— {order.customer?.name}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">{formatDateTime(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-sm">{formatCurrency(order.total_amount)}</span>
                  {expandedOrder === order.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </div>

              {/* Expanded */}
              <AnimatePresence>
                {expandedOrder === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/5"
                  >
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Items */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Items</p>
                        <div className="space-y-1.5">
                          {order.orderItems?.map((oi) => (
                            <div key={oi.id} className="flex justify-between text-sm">
                              <span className="text-slate-300">{oi.menuItem?.name}</span>
                              <span className="text-slate-500">×{oi.quantity} — {formatCurrency(oi.subtotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Delivery */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Delivery</p>
                        <div className="space-y-1.5 text-sm">
                          <p className="flex items-start gap-1.5 text-slate-300"><MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />{order.delivery_address}</p>
                          {order.customer?.phone && <p className="flex items-center gap-1.5 text-slate-400"><Phone className="w-3.5 h-3.5 text-slate-500" />{order.customer.phone}</p>}
                          {order.delivery_notes && <p className="text-slate-400 italic text-xs">{order.delivery_notes}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Status actions */}
                    {order.status !== "delivered" && order.status !== "cancelled" && (
                      <div className="px-4 pb-4 flex flex-wrap gap-2">
                        {[
                          { val: "confirmed",         label: "✅ Confirm" },
                          { val: "preparing",          label: "👨‍🍳 Preparing" },
                          { val: "out_for_delivery",   label: "🚴 Out for Delivery" },
                          { val: "delivered",          label: "🎉 Delivered" },
                          { val: "cancelled",          label: "❌ Cancel", danger: true },
                        ]
                          .filter((s) => s.val !== order.status)
                          .map((s) => (
                            <button
                              key={s.val}
                              onClick={() => handleStatusUpdate(order.id, s.val)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                                s.danger
                                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-slate-500 text-sm">
            Showing <span className="text-white font-semibold">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="text-white font-semibold">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setPage(p => p - 1); setExpandedOrder(null); }}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-white/8 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === "…" ? (
                  <span key={`ellipsis-${i}`} className="w-8 text-center text-slate-600 text-sm">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => { setPage(n); setExpandedOrder(null); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                      page === n
                        ? "bg-primary-500 text-white shadow-glow-sm"
                        : "bg-surface border border-white/8 text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
            <button
              onClick={() => { setPage(p => p + 1); setExpandedOrder(null); }}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-white/8 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantOrdersPage;
