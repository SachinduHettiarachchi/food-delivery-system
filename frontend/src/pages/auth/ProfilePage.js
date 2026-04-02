import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Phone, MapPin, Mail, Shield, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import toast from "react-hot-toast";

const TABS = [
  { key: "profile", label: "Edit Profile", icon: User },
  { key: "password", label: "Change Password", icon: Lock },
];

const roleConfig = {
  customer:         { label: "Customer",         color: "text-blue-400",    bg: "bg-blue-500/10" },
  restaurant_admin: { label: "Restaurant Admin", color: "text-primary-400", bg: "bg-primary-500/10" },
  system_admin:     { label: "System Admin",     color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
      <Icon className="w-3 h-3" />{label}
    </label>
    {children}
  </div>
);

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });

  const role   = roleConfig[user?.role] || { label: user?.role, color: "text-slate-400", bg: "bg-white/5" };
  const initials = (user?.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateMe(profileForm);
      updateUser(res.data.data);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally { setSaving(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match."); return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters."); return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally { setSaving(false); }
  };

  const strength = (() => {
    const p = passwordForm.newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][strength];
  const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-yellow-400", "bg-emerald-400", "bg-emerald-500"][strength];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-glow-sm">
            <span className="text-white font-heading font-black text-xl">{initials}</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-white text-xl truncate">{user?.name}</h1>
            <p className="text-slate-500 text-sm truncate">{user?.email}</p>
            <span className={`inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${role.bg} ${role.color}`}>
              <Shield className="w-3 h-3" />{role.label}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-white/5 relative">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors relative ${
                  active ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "profile" && (
            <motion.form
              key="profile"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleProfileSave}
              className="p-6 space-y-5"
            >
              <Field label="Full Name" icon={User}>
                <input
                  name="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                  className="input-field"
                  placeholder="Your full name"
                />
              </Field>

              <Field label="Email Address" icon={Mail}>
                <input value={user?.email} disabled className="input-field opacity-40 cursor-not-allowed" />
                <p className="text-xs text-slate-600">Email cannot be changed.</p>
              </Field>

              <Field label="Phone Number" icon={Phone}>
                <input
                  name="phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="input-field"
                  placeholder="+94 77 123 4567"
                />
              </Field>

              <Field label="Default Delivery Address" icon={MapPin}>
                <textarea
                  name="address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Your default delivery address"
                />
              </Field>

              <div className="flex justify-end pt-1">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving
                    ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>
                    : <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Save Changes</span>}
                </button>
              </div>
            </motion.form>
          )}

          {activeTab === "password" && (
            <motion.form
              key="password"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              onSubmit={handlePasswordSave}
              className="p-6 space-y-5"
            >
              <Field label="Current Password" icon={Lock}>
                <div className="relative">
                  <input
                    name="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    className="input-field pr-10"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <Field label="New Password" icon={Lock}>
                <div className="relative">
                  <input
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    className="input-field pr-10"
                    placeholder="At least 6 characters"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.newPassword && (
                  <div className="space-y-1.5 mt-1">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : "bg-white/8"}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${strengthColor.replace("bg-", "text-")}`}>{strengthLabel}</p>
                  </div>
                )}
              </Field>

              <Field label="Confirm New Password" icon={Lock}>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    className="input-field pr-10"
                    placeholder="Repeat new password"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-red-400 font-medium">Passwords do not match</p>
                )}
              </Field>

              <div className="p-4 rounded-xl bg-surface/50 border border-white/5 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-400 mb-2">Password tips</p>
                <p>• Minimum 6 characters</p>
                <p>• Mix uppercase, lowercase, numbers &amp; symbols</p>
                <p>• Avoid using personal information</p>
              </div>

              <div className="flex justify-end pt-1">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving
                    ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Changing...</span>
                    : <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</span>}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
