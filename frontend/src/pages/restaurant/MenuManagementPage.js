import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Image, Tag, Clock, DollarSign, ToggleLeft, ToggleRight, Star } from "lucide-react";
import { restaurantAPI, menuAPI } from "../../services/api";
import toast from "react-hot-toast";

const TAG_STYLES = {
  "🔥 Best Seller": { bg: "rgba(249,115,22,0.18)", text: "#fb923c", border: "rgba(249,115,22,0.30)" },
  "⭐ Top Rated":   { bg: "rgba(251,191,36,0.18)", text: "#fbbf24", border: "rgba(251,191,36,0.30)" },
  "📈 Trending":    { bg: "rgba(34,197,94,0.18)",  text: "#22c55e", border: "rgba(34,197,94,0.30)" },
  "✨ New":          { bg: "rgba(96,165,250,0.18)", text: "#60a5fa", border: "rgba(96,165,250,0.30)" },
};

const MenuManagementPage = () => {
  const [restaurants, setRestaurants]         = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems]             = useState([]);
  const [showForm, setShowForm]               = useState(false);
  const [editItem, setEditItem]               = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", price: "", category: "",
    preparation_time: "", image_url: "", is_available: true,
  });

  useEffect(() => {
    restaurantAPI.getMine()
      .then((res) => {
        setRestaurants(res.data.data);
        if (res.data.data.length > 0) loadMenu(res.data.data[0]);
      })
      .catch(() => toast.error("Failed to load restaurants."))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const loadMenu = (restaurant) => {
    setSelectedRestaurant(restaurant);
    menuAPI.getAllByRestaurant(restaurant.id)
      .then((res) => setMenuItems(res.data.data))
      .catch(() => toast.error("Failed to load menu."));
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", description: "", price: "", category: "", preparation_time: "", image_url: "", is_available: true });
    setShowForm(true);
  };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, description: item.description || "", price: item.price,
      category: item.category || "", preparation_time: item.preparation_time || "",
      image_url: item.image_url || "", is_available: item.is_available !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        const res = await menuAPI.update(editItem.id, form);
        setMenuItems((prev) => prev.map((i) => i.id === editItem.id ? res.data.data : i));
        toast.success("Item updated.");
      } else {
        const res = await menuAPI.create(selectedRestaurant.id, form);
        setMenuItems((prev) => [...prev, res.data.data]);
        toast.success("Item added to menu.");
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save item.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this item?")) return;
    try {
      await menuAPI.delete(id);
      setMenuItems((prev) => prev.map((i) => i.id === id ? { ...i, is_available: false } : i));
      toast.success("Item removed.");
    } catch { toast.error("Failed to remove item."); }
  };

  const handleToggleAvail = async (item) => {
    try {
      const res = await menuAPI.update(item.id, { is_available: !item.is_available });
      setMenuItems((prev) => prev.map((i) => i.id === item.id ? res.data.data : i));
      toast.success(item.is_available ? "Item hidden from menu." : "Item added back to menu.");
    } catch { toast.error("Failed to update item."); }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
      </div>
    </div>
  );

  if (restaurants.length === 0) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} className="card p-10">
        <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-6 text-4xl">🍽️</div>
        <h1 className="text-2xl font-heading font-bold text-white mb-3">No restaurant yet</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          You need to create a restaurant before you can add menu items.
        </p>
        <Link to="/restaurant/new" className="btn-primary gap-2 inline-flex">
          <Plus className="w-4 h-4" /> Create My Restaurant
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Menu Management</h1>
          <p className="text-slate-500 text-sm mt-1">{menuItems.length} items</p>
        </div>
        <button onClick={openCreate} disabled={!selectedRestaurant} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Restaurant tabs */}
      {restaurants.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {restaurants.map((r) => (
            <button key={r.id} onClick={() => loadMenu(r)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedRestaurant?.id === r.id
                  ? "bg-primary-500 text-white"
                  : "bg-surface border border-white/5 text-slate-400 hover:text-white"
              }`}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {menuItems.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossedIcon />
          </div>
          <h3 className="text-lg font-heading font-bold text-white mb-2">No items yet</h3>
          <p className="text-slate-400 text-sm mb-4">Add your first menu item.</p>
          <button onClick={openCreate} className="btn-primary">Add Item</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <div key={item.id} className={`card overflow-hidden transition-all duration-200 ${!item.is_available ? "opacity-60" : ""}`}>
              <div className="h-32 bg-surface relative overflow-hidden">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🍽️</div>
                }
                {!item.is_available && (
                  <div className="absolute inset-0 bg-dark/60 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-400 bg-dark/80 px-2 py-1 rounded-full">Hidden</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-white text-sm leading-tight">{item.name}</h4>
                  <span className="text-primary-400 font-bold text-sm flex-shrink-0">LKR {parseFloat(item.price).toFixed(2)}</span>
                </div>
                {/* Insight indicators — read-only */}
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {item.tag && (() => {
                    const ts = TAG_STYLES[item.tag] || { bg: "rgba(251,191,36,0.18)", text: "#fbbf24", border: "rgba(251,191,36,0.30)" };
                    return (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"
                        style={{ background: ts.bg, color: ts.text, borderColor: ts.border }}
                      >
                        {item.tag}
                      </span>
                    );
                  })()}
                  {parseFloat(item.avg_rating) > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-amber-400 font-medium">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {parseFloat(item.avg_rating).toFixed(1)}
                      <span className="text-slate-500 font-normal">({item.review_count})</span>
                    </span>
                  )}
                </div>
                {item.category && <p className="text-[10px] text-primary-400/70 font-semibold uppercase tracking-wider mb-2">{item.category}</p>}
                {item.description && <p className="text-slate-500 text-xs line-clamp-2 mb-3">{item.description}</p>}
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleAvail(item)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      item.is_available ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    }`}>
                    {item.is_available ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {item.is_available ? "Available" : "Hidden"}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="w-full max-w-lg card p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-bold text-white text-lg">{editItem ? "Edit Item" : "Add Menu Item"}</h2>
                <button onClick={() => setShowForm(false)} className="btn-ghost p-1.5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Item Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} required className="input-field" placeholder="e.g. Margherita Pizza" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><DollarSign className="w-3 h-3" /> Price (LKR) *</label>
                    <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required className="input-field" placeholder="0.00" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="input-field resize-none" placeholder="Describe this item..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Tag className="w-3 h-3" /> Category</label>
                    <input name="category" value={form.category} onChange={handleChange} className="input-field" placeholder="e.g. Mains" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Prep Time (min)</label>
                    <input name="preparation_time" type="number" min="0" value={form.preparation_time} onChange={handleChange} className="input-field" placeholder="15" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Image className="w-3 h-3" /> Image URL</label>
                  <input name="image_url" value={form.image_url} onChange={handleChange} className="input-field" placeholder="https://..." />
                  {form.image_url && (
                    <div className="h-24 rounded-xl overflow-hidden mt-2">
                      <img src={form.image_url} alt="preview" className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = "none"; }} />
                    </div>
                  )}
                </div>

                {editItem && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/50 border border-white/5">
                    <span className="text-sm text-slate-300 flex-1">Available for ordering</span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, is_available: !form.is_available })}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.is_available ? "bg-primary-500" : "bg-white/10"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${form.is_available ? "right-1" : "left-1"}`} />
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>
                      : editItem ? "Update Item" : "Add Item"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UtensilsCrossedIcon = () => (
  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm0 0V3m0 5v13m-4-8c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm0 0V3m0 5v13" />
  </svg>
);

export default MenuManagementPage;
