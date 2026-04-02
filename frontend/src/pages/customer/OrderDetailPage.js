import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Clock, CheckCircle2, ChefHat, Bike, PackageCheck,
  XCircle, MapPin, CreditCard, Store, StickyNote, ReceiptText, Star, MessageSquare, Ban,
} from "lucide-react";
import { orderAPI, reviewAPI } from "../../services/api";
import StatusBadge from "../../components/common/StatusBadge";
import toast from "react-hot-toast";

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery"];

const STATUS_STEPS = [
  { key: "pending",          icon: Clock,         label: "Order Placed",  desc: "We received your order" },
  { key: "confirmed",        icon: CheckCircle2,  label: "Confirmed",     desc: "Restaurant accepted" },
  { key: "preparing",        icon: ChefHat,       label: "Preparing",     desc: "Kitchen is cooking" },
  { key: "out_for_delivery", icon: Bike,          label: "On the Way",    desc: "Rider picked up" },
  { key: "delivered",        icon: PackageCheck,  label: "Delivered",     desc: "Enjoy your meal!" },
];

/* ── Star picker ──────────────────────────────────────── */
const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <motion.button
        key={s}
        type="button"
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.15 }}
        onClick={() => onChange(s)}
        className="p-0.5"
      >
        <Star
          className={`w-7 h-7 transition-colors ${s <= value ? "fill-amber-400 text-amber-400" : "text-white/15"}`}
        />
      </motion.button>
    ))}
  </div>
);

/* ── Review modal for a single item ──────────────────── */
const ReviewModal = ({ item, orderId, onClose, onDone }) => {
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    setLoading(true);
    try {
      await reviewAPI.submit({
        order_id:     orderId,
        menu_item_id: item.menu_item_id,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Review submitted!");
      onDone(item.menu_item_id);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit review.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-sm bg-[#1e293b] rounded-2xl border border-white/8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Rate this item</p>
              <h3 className="text-white font-heading font-semibold text-base leading-tight">{item.menuItem?.name}</h3>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors mt-0.5">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {/* Stars */}
          <div>
            <p className="text-xs text-slate-400 mb-2.5">How would you rate it?</p>
            <StarPicker value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-xs text-slate-500 mt-1.5">
                {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Leave a comment <span className="text-slate-600">(optional)</span></p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="What did you think?"
              className="w-full bg-[#0f172a] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600
                focus:outline-none focus:border-primary-500/50 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/8 text-slate-400 text-sm font-semibold hover:bg-white/4 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading || rating === 0}
            onClick={submit}
            className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Submitting…" : "Submit Review"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Section wrapper ──────────────────────────────────── */
const Section = ({ title, icon: Icon, iconColor = "text-slate-500", children, className = "" }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`card overflow-hidden ${className}`}>
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <h3 className="font-heading font-semibold text-white text-sm">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </motion.div>
);

/* ── Main ─────────────────────────────────────────────── */
const OrderDetailPage = () => {
  const { id } = useParams();
  const [order,         setOrder]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [reviewed,      setReviewed]      = useState(new Set());
  const [activeItem,    setActiveItem]    = useState(null);
  const [cancelling,    setCancelling]    = useState(false);

  useEffect(() => {
    orderAPI.getById(id)
      .then(res => setOrder(res.data.data))
      .catch(() => toast.error("Failed to load order."))
      .finally(() => setLoading(false));
  }, [id]);

  // Poll every 15 s while order is still active
  useEffect(() => {
    if (!order || !ACTIVE_STATUSES.includes(order.status)) return;
    const interval = setInterval(() => {
      orderAPI.getById(id)
        .then(res => setOrder(res.data.data))
        .catch(() => {});
    }, 15_000);
    return () => clearInterval(interval);
  }, [id, order?.status]);

  // Once order loads (and is delivered), fetch which items are already reviewed
  useEffect(() => {
    if (!order || order.status !== "delivered") return;
    reviewAPI.getMyOrderReviews(order.id)
      .then(res => {
        const ids = res.data.data.map(r => r.menu_item_id);
        setReviewed(new Set(ids));
      })
      .catch(() => {});
  }, [order]);

  const handleReviewDone = useCallback((menuItemId) => {
    setReviewed(prev => new Set([...prev, menuItemId]));
  }, []);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setCancelling(true);
    try {
      const res = await orderAPI.cancel(order.id);
      setOrder(res.data.data);
      toast.success("Order cancelled.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="skeleton h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!order) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-slate-500">Order not found.</p>
    </div>
  );

  const currentIdx = STATUS_STEPS.findIndex(s => s.key === order.status);
  const cancelled  = order.status === "cancelled";
  const delivered  = order.status === "delivered";
  const dateStr    = new Date(order.created_at).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const reviewableItems   = order.orderItems ?? [];
  const allReviewed       = reviewableItems.length > 0 && reviewableItems.every(oi => reviewed.has(oi.menu_item_id));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
        <Link to="/orders"
          className="w-9 h-9 rounded-xl bg-surface border border-white/6 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold text-white">Order #{order.id}</h1>
          <p className="text-slate-500 text-xs mt-0.5">{dateStr}</p>
        </div>
        <StatusBadge status={order.status} />
        {order.status === "pending" && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/25 bg-red-500/8 text-red-400 text-xs font-semibold hover:bg-red-500/18 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Ban className="w-3.5 h-3.5" />
            {cancelling ? "Cancelling…" : "Cancel Order"}
          </motion.button>
        )}
      </motion.div>

      {/* Cancelled banner */}
      {cancelled && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 rounded-2xl border border-red-500/20 bg-red-500/6 mb-5">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Order Cancelled</p>
            <p className="text-red-400/60 text-xs">This order has been cancelled.</p>
          </div>
        </motion.div>
      )}

      {/* Delivery complete banner */}
      {delivered && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/6 mb-5">
          <PackageCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-400 font-semibold text-sm">Delivered Successfully</p>
            <p className="text-emerald-400/60 text-xs">Enjoy your meal! Thank you for ordering.</p>
          </div>
        </motion.div>
      )}

      {/* Progress tracker */}
      {!cancelled && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="card p-6 mb-5">
          <p className="section-label mb-6">Order Tracking</p>

          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-white/6" />
            <div
              className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-700"
              style={{ width: currentIdx >= 0 ? `calc(${(currentIdx / (STATUS_STEPS.length - 1)) * 100}% - 0px)` : "0%" }}
            />
            <div className="relative z-10 flex justify-between">
              {STATUS_STEPS.map((step, idx) => {
                const done   = idx <= currentIdx;
                const active = idx === currentIdx;
                const Icon   = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2.5" style={{ width: "20%" }}>
                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      done ? "bg-primary-500 border-primary-500 shadow-glow-sm" : "bg-dark border-white/12"
                    } ${active ? "ring-4 ring-primary-500/25" : ""}`}>
                      <Icon className={`w-4 h-4 ${done ? "text-white" : "text-slate-600"}`} />
                      {active && !delivered && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary-400 border-2 border-dark animate-ping" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-[10px] font-bold leading-tight ${done ? "text-slate-200" : "text-slate-600"}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {currentIdx >= 0 && !cancelled && (
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
              <p className="text-sm text-slate-400">
                <span className="text-white font-semibold">{STATUS_STEPS[currentIdx]?.label}: </span>
                {STATUS_STEPS[currentIdx]?.desc}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Rate Your Items (delivered orders only) ── */}
      {delivered && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="card overflow-hidden mb-5"
        >
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="font-heading font-semibold text-white text-sm flex-1">Rate Your Items</h3>
            {allReviewed && (
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">All reviewed ✓</span>
            )}
          </div>
          <div className="p-5 space-y-3">
            {reviewableItems.map((oi) => {
              const isReviewed = reviewed.has(oi.menu_item_id);
              return (
                <div key={oi.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-white/4 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium truncate">{oi.menuItem?.name}</p>
                    <p className="text-slate-600 text-xs">× {oi.quantity}</p>
                  </div>
                  {isReviewed ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                    </span>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setActiveItem(oi)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20
                        text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors flex-shrink-0"
                    >
                      <Star className="w-3 h-3" /> Rate
                    </motion.button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Order items */}
        <Section title="Order Items" icon={ReceiptText} iconColor="text-primary-400">
          <div className="space-y-3">
            {order.orderItems?.map((oi, i) => (
              <div key={oi.id} className={`flex items-center justify-between ${i < order.orderItems.length - 1 ? "pb-3 border-b border-white/5" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{oi.menuItem?.name}</p>
                  <p className="text-slate-600 text-xs">× {oi.quantity}</p>
                </div>
                <p className="text-white font-semibold text-sm ml-3">LKR {parseFloat(oi.subtotal).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/8 flex justify-between items-center">
            <span className="text-slate-400 text-sm font-medium">Order Total</span>
            <span className="text-primary-400 font-black text-base">LKR {parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
        </Section>

        {/* Delivery info */}
        <Section title="Delivery Info" icon={MapPin} iconColor="text-emerald-400">
          <div className="space-y-4">
            <div>
              <p className="section-label mb-1.5">Delivery Address</p>
              <p className="text-slate-200 text-sm leading-relaxed">{order.delivery_address}</p>
            </div>
            {order.delivery_notes && (
              <div>
                <p className="section-label mb-1.5 flex items-center gap-1"><StickyNote className="w-3 h-3" /> Notes</p>
                <p className="text-slate-400 text-sm">{order.delivery_notes}</p>
              </div>
            )}
            <div>
              <p className="section-label mb-1.5 flex items-center gap-1"><Store className="w-3 h-3" /> Restaurant</p>
              <p className="text-slate-200 text-sm">{order.restaurant?.name}</p>
            </div>
          </div>
        </Section>

        {/* Payment */}
        {order.payment && (
          <Section title="Payment Details" icon={CreditCard} iconColor="text-blue-400" className="sm:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Method",    value: order.payment.payment_method?.replace(/_/g, " "), capitalize: true },
                { label: "Status",    value: <StatusBadge status={order.payment.payment_status} /> },
                { label: "Amount",    value: `LKR ${parseFloat(order.payment.amount).toFixed(2)}`, bold: true },
                order.payment.transaction_id && { label: "Transaction ID", value: order.payment.transaction_id, mono: true },
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="card-inset">
                  <p className="section-label mb-1.5">{item.label}</p>
                  {typeof item.value === "string" ? (
                    <p className={`text-sm ${item.bold ? "text-primary-400 font-bold text-base" : "text-slate-200"} ${item.mono ? "font-mono text-xs text-slate-400" : ""} ${item.capitalize ? "capitalize" : ""}`}>
                      {item.value}
                    </p>
                  ) : item.value}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Review modal */}
      <AnimatePresence>
        {activeItem && (
          <ReviewModal
            item={activeItem}
            orderId={order.id}
            onClose={() => setActiveItem(null)}
            onDone={handleReviewDone}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderDetailPage;
