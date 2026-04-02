import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, Search, MapPin, Star, PowerOff } from "lucide-react";
import { adminAPI, restaurantAPI } from "../../services/api";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";

const AdminRestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [confirmId, setConfirmId]     = useState(null);

  useEffect(() => {
    adminAPI.getRestaurants()
      .then((res) => setRestaurants(res.data.data))
      .catch(() => toast.error("Failed to load restaurants."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter((r) => {
    const q = search.toLowerCase();
    return !q ||
      r.name.toLowerCase().includes(q) ||
      r.cuisine_type?.toLowerCase().includes(q) ||
      r.address?.toLowerCase().includes(q) ||
      r.owner?.name?.toLowerCase().includes(q);
  });

  const handleDeactivate = async () => {
    try {
      await restaurantAPI.delete(confirmId);
      setRestaurants((prev) => prev.map((r) => r.id === confirmId ? { ...r, is_active: false } : r));
      toast.success("Restaurant deactivated.");
    } catch { toast.error("Failed to deactivate restaurant."); }
  };

  const active   = restaurants.filter((r) => r.is_active).length;
  const inactive = restaurants.filter((r) => !r.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-white">Restaurant Management</h1>
        <p className="text-slate-500 text-sm mt-1">{restaurants.length} total restaurants</p>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { label: "Total",    value: restaurants.length, color: "text-slate-300",   bg: "bg-white/5" },
          { label: "Active",   value: active,             color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Inactive", value: inactive,           color: "text-red-400",     bg: "bg-red-500/10" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 ${bg}`}>
            <span className={`font-heading font-black text-lg ${color}`}>{value}</span>
            <span className="text-slate-500 text-sm">{label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, cuisine, owner, address..."
          className="input-field pl-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
                  {["#", "Restaurant", "Owner", "Cuisine", "Rating", "Status", "Joined", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {filtered.map((r) => (
                  <tr key={r.id} className={`hover:bg-white/2 transition-colors ${!r.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 text-slate-500 text-xs">#{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center text-xs font-bold text-primary-400 flex-shrink-0">
                          {(r.name || "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-200 font-medium truncate">{r.name}</p>
                          {r.address && (
                            <p className="text-slate-600 text-xs flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0" />{r.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.owner?.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.cuisine_type || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                        <Star className="w-3 h-3" />{r.rating || "New"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                        r.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${r.is_active ? "bg-emerald-400" : "bg-red-400"}`} />
                        {r.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {r.is_active && (
                        <button
                          onClick={() => setConfirmId(r.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors"
                        >
                          <PowerOff className="w-3 h-3" /> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-500">
              <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No restaurants match your search.</p>
            </div>
          )}
        </motion.div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Restaurant"
        message="Are you sure you want to deactivate this restaurant? It will no longer appear on the platform."
        confirmLabel="Deactivate"
        danger
      />
    </div>
  );
};

export default AdminRestaurantsPage;
