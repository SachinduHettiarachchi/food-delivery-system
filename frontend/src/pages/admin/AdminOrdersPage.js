import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { adminAPI, orderAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import { capitalizeWords } from "../../utils/helpers";
import toast from "react-hot-toast";

const STATUSES = ["pending","confirmed","preparing","out_for_delivery","delivered","cancelled"];
const PAGE_SIZE = 15;

const AdminOrdersPage = () => {
  const [orders, setOrders]         = useState([]);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  const resetPage = (fn) => (...args) => { setPage(1); fn(...args); };

  useEffect(() => {
    adminAPI.getOrders()
      .then((res) => setOrders(res.data.data))
      .catch(() => toast.error("Failed to load orders."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      String(o.id).includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.restaurant?.name?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      toast.success("Status updated.");
    } catch { toast.error("Failed to update status."); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-white">Order Management</h1>
        <p className="text-slate-500 text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={resetPage(setSearch)}
            placeholder="Search by order #, customer, restaurant..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={resetPage(setStatusFilter)}
          className="text-sm bg-surface border border-white/8 text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary-500/50"
        >
          <option value="all">All Statuses ({orders.length})</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{capitalizeWords(s)}</option>
          ))}
        </select>
        <span className="text-slate-600 text-sm self-center">{filtered.length} shown</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
                  {["#", "Customer", "Restaurant", "Items", "Total", "Payment", "Status", "Date", "Update"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {paginated.map((o) => (
                  <tr key={o.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">#{o.id}</td>
                    <td className="px-4 py-3 text-slate-200">{o.customer?.name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{o.restaurant?.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{o.orderItems?.length} items</td>
                    <td className="px-4 py-3 text-white font-medium">LKR {parseFloat(o.total_amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {o.payment ? `${o.payment.payment_method} / ${o.payment.payment_status}` : "—"}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                        disabled={o.status === "delivered" || o.status === "cancelled"}
                        className="text-xs bg-surface border border-white/8 text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-500">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No orders match your filters.</p>
            </div>
          )}
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-slate-500 text-sm">
            Showing <span className="text-white font-semibold">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="text-white font-semibold">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => p - 1)}
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
                    onClick={() => setPage(n)}
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
              onClick={() => setPage(p => p + 1)}
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

export default AdminOrdersPage;
