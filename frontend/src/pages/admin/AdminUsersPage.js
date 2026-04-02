import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Shield, UserX } from "lucide-react";
import { adminAPI } from "../../services/api";
import toast from "react-hot-toast";

const roleConfig = {
  customer:         { label: "Customer",         color: "text-blue-400",    bg: "bg-blue-500/10" },
  restaurant_admin: { label: "Restaurant Admin", color: "text-primary-400", bg: "bg-primary-500/10" },
  system_admin:     { label: "System Admin",     color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

const AdminUsersPage = () => {
  const [users, setUsers]         = useState([]);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    adminAPI.getUsers()
      .then((res) => setUsers(res.data.data))
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesRole   = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this user?")) return;
    try {
      await adminAPI.deactivateUser(id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: false } : u));
      toast.success("User deactivated.");
    } catch { toast.error("Failed to deactivate user."); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-white">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">{users.length} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm bg-surface border border-white/8 text-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary-500/50"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="restaurant_admin">Restaurant Admins</option>
          <option value="system_admin">System Admins</option>
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
                  {["#", "Name", "Email", "Role", "Phone", "Status", "Joined", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {filtered.map((u) => {
                  const rc = roleConfig[u.role] || { label: u.role, color: "text-slate-400", bg: "bg-white/5" };
                  return (
                    <tr key={u.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs">#{u.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center text-xs font-bold text-primary-400 flex-shrink-0">
                            {(u.name || "?")[0].toUpperCase()}
                          </div>
                          <span className="text-slate-200 font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${rc.bg} ${rc.color}`}>
                          <Shield className="w-3 h-3" />{rc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{u.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                          u.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {u.is_active && u.role !== "system_admin" && (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors"
                          >
                            <UserX className="w-3 h-3" /> Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No users match your filters.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdminUsersPage;
