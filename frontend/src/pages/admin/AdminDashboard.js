import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Store, Package, TrendingUp, BarChart3, ArrowRight, RefreshCw } from "lucide-react";
import { adminAPI } from "../../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import StatusBadge from "../../components/common/StatusBadge";
import { capitalizeWords } from "../../utils/helpers";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  pending: "#F59E0B", confirmed: "#3B82F6", preparing: "#8B5CF6",
  out_for_delivery: "#06B6D4", delivered: "#10B981", cancelled: "#EF4444",
};

const StatCard = ({ label, value, icon: Icon, color, delay, to }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="card p-5 hover:border-white/10 transition-colors"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      {to && (
        <Link to={to} className="text-slate-600 hover:text-primary-400 transition-colors">
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
    <p className="text-2xl font-heading font-black text-white mb-1">{value}</p>
    <p className="text-slate-500 text-sm">{label}</p>
  </motion.div>
);

const AdminDashboard = () => {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      await adminAPI.recomputeInsights();
      toast.success("Insights recomputed successfully.");
    } catch {
      toast.error("Failed to recompute insights.");
    } finally {
      setRecomputing(false);
    }
  };

  useEffect(() => {
    adminAPI.getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => toast.error("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="skeleton h-8 w-56 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
      Failed to load dashboard data.
    </div>
  );

  const { summary, ordersByStatus, recentOrders } = data;

  const chartData = ordersByStatus.map((s) => ({
    status: capitalizeWords(s.status),
    count: parseInt(s.count),
    fill: STATUS_COLORS[s.status] || "#64748B",
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-white">System Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users"       value={summary.totalUsers}       icon={Users}     color="bg-blue-500/15 text-blue-400"    delay={0}    to="/admin/users" />
        <StatCard label="Restaurants"       value={summary.totalRestaurants} icon={Store}     color="bg-primary-500/15 text-primary-400" delay={0.05} to="/admin/restaurants" />
        <StatCard label="Total Orders"      value={summary.totalOrders}      icon={Package}   color="bg-violet-500/15 text-violet-400"delay={0.1}  to="/admin/orders" />
        <StatCard label="Total Revenue"     value={`LKR ${parseFloat(summary.totalRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={TrendingUp} color="bg-emerald-500/15 text-emerald-400" delay={0.15} />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { to: "/admin/users",       label: "Manage Users",       icon: Users },
          { to: "/admin/restaurants", label: "Manage Restaurants", icon: Store },
          { to: "/admin/orders",      label: "All Orders",         icon: Package },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="btn-outline gap-2 text-sm">
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
        <button
          onClick={handleRecompute}
          disabled={recomputing}
          className="btn-outline gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${recomputing ? "animate-spin" : ""}`} />
          {recomputing ? "Recomputing…" : "Recompute Insights"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* Recent orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-400" /> Recent Orders
            </h2>
            <Link to="/admin/orders" className="text-xs text-primary-400 hover:text-primary-300 font-semibold">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="text-left pb-3 font-semibold">#</th>
                  <th className="text-left pb-3 font-semibold">Customer</th>
                  <th className="text-left pb-3 font-semibold">Restaurant</th>
                  <th className="text-left pb-3 font-semibold">Amount</th>
                  <th className="text-left pb-3 font-semibold">Status</th>
                  <th className="text-left pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 text-slate-400">#{o.id}</td>
                    <td className="py-3 text-slate-200">{o.customer?.name}</td>
                    <td className="py-3 text-slate-400 text-xs">{o.restaurant?.name}</td>
                    <td className="py-3 text-white font-medium">LKR {parseFloat(o.total_amount).toFixed(2)}</td>
                    <td className="py-3"><StatusBadge status={o.status} /></td>
                    <td className="py-3 text-slate-500 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders by status chart */}
        <div className="card p-5">
          <h2 className="font-heading font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-400" /> Orders by Status
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="status" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#F1F5F9", fontSize: 12 }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}

          {/* Status legend */}
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
            {ordersByStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s.status] || "#64748B" }} />
                <span className="text-slate-500 text-xs truncate">{capitalizeWords(s.status)}</span>
                <span className="text-slate-300 text-xs font-bold ml-auto">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
