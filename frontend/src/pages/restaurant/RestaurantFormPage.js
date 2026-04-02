import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Store, Phone, Mail, MapPin, Clock, Image } from "lucide-react";
import { restaurantAPI } from "../../services/api";
import toast from "react-hot-toast";

const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
      <Icon className="w-3 h-3" />{label}
    </label>
    {children}
  </div>
);

const RestaurantFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    name: "", description: "", address: "", phone: "",
    email: "", cuisine_type: "", opening_time: "", closing_time: "", image_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    restaurantAPI.getById(id)
      .then((res) => {
        const r = res.data.data;
        setForm({
          name: r.name||"", description: r.description||"", address: r.address||"",
          phone: r.phone||"", email: r.email||"", cuisine_type: r.cuisine_type||"",
          opening_time: r.opening_time||"", closing_time: r.closing_time||"", image_url: r.image_url||"",
        });
      })
      .catch(() => { toast.error("Failed to load."); navigate("/restaurant/dashboard"); })
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) { await restaurantAPI.update(id, form); toast.success("Restaurant updated."); }
      else { await restaurantAPI.create(form); toast.success("Restaurant created!"); }
      navigate("/restaurant/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save.");
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate("/restaurant/dashboard")}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm font-medium transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-white text-xl">
              {isEdit ? "Edit Restaurant" : "Add New Restaurant"}
            </h1>
            <p className="text-slate-500 text-sm">{isEdit ? "Update details" : "List your restaurant on FoodExpress"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Restaurant Name *" icon={Store}>
              <input name="name" value={form.name} onChange={handleChange} required className="input-field" placeholder="Pizza Palace" />
            </Field>
            <Field label="Cuisine Type" icon={Store}>
              <input name="cuisine_type" value={form.cuisine_type} onChange={handleChange} className="input-field" placeholder="Italian, Chinese..." />
            </Field>
          </div>

          <Field label="Description" icon={Store}>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} className="input-field resize-none" placeholder="Describe your restaurant..." />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone *" icon={Phone}>
              <input name="phone" value={form.phone} onChange={handleChange} required className="input-field" placeholder="011 234 5678" />
            </Field>
            <Field label="Email" icon={Mail}>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" placeholder="restaurant@example.com" />
            </Field>
          </div>

          <Field label="Address *" icon={MapPin}>
            <textarea name="address" value={form.address} onChange={handleChange}
              required rows={2} className="input-field resize-none" placeholder="Full street address" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Opening Time" icon={Clock}>
              <input name="opening_time" type="time" value={form.opening_time} onChange={handleChange} className="input-field" />
            </Field>
            <Field label="Closing Time" icon={Clock}>
              <input name="closing_time" type="time" value={form.closing_time} onChange={handleChange} className="input-field" />
            </Field>
          </div>

          <Field label="Cover Image URL" icon={Image}>
            <input name="image_url" value={form.image_url} onChange={handleChange} className="input-field" placeholder="https://..." />
            {form.image_url && (
              <div className="h-32 rounded-xl overflow-hidden mt-2 border border-white/8">
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }} />
              </div>
            )}
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate("/restaurant/dashboard")} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEdit ? "Updating..." : "Creating..."}</span>
                : isEdit ? "Update Restaurant" : "Create Restaurant"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RestaurantFormPage;
