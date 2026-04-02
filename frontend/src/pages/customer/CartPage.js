import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Trash2, Plus, Minus, MapPin, MessageSquare,
  Banknote, CreditCard, Globe, ArrowRight, ChevronLeft, Tag, Gift, CheckCircle2,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { orderAPI, paymentAPI, menuAPI } from "../../services/api";
import toast from "react-hot-toast";

const DELIVERY_FEE = 150;
const FREE_THRESHOLD = 2000;

const CATEGORY_COLORS = {
  pizza:    "#7c2d12",
  pasta:    "#1e3a5f",
  starters: "#14532d",
  desserts: "#4a044e",
  mains:    "#422006",
  noodles:  "#0c4a6e",
  rice:     "#365314",
  burgers:  "#451a03",
  salads:   "#052e16",
  drinks:   "#0f172a",
};

/* ── Payment option ───────────────────────────────────── */
const PAYMENT_OPTS = [
  { value: "cash",   icon: Banknote,    label: "Cash on Delivery", desc: "Pay when delivered",  color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { value: "card",   icon: CreditCard,  label: "Card Payment",     desc: "Visa / Mastercard",   color: "text-blue-400",    bg: "bg-blue-500/10" },
  { value: "online", icon: Globe,       label: "Online Transfer",  desc: "Bank transfer",        color: "text-violet-400",  bg: "bg-violet-500/10" },
];

const PaymentOption = ({ opt, selected, onSelect }) => {
  const Icon = opt.icon;
  return (
    <motion.button
      type="button" whileTap={{ scale: 0.97 }} onClick={onSelect}
      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left w-full transition-all duration-200 ${
        selected
          ? "border-primary-500/50 bg-primary-500/8 ring-1 ring-primary-500/30"
          : "border-white/6 hover:border-white/16 hover:bg-white/[0.02]"
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? opt.bg : "bg-white/5"}`}>
        <Icon className={`w-4 h-4 ${selected ? opt.color : "text-slate-500"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${selected ? "text-white" : "text-slate-300"}`}>{opt.label}</p>
        <p className="text-xs text-slate-500">{opt.desc}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
        selected ? "border-primary-500 bg-primary-500" : "border-slate-600"
      }`}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </motion.button>
  );
};

/* ── Empty cart ───────────────────────────────────────── */
const EmptyCart = ({ onBrowse }) => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 px-4">
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
      <div className="w-28 h-28 rounded-3xl bg-surface border border-white/6 flex items-center justify-center">
        <ShoppingCart className="w-14 h-14 text-slate-700" />
      </div>
    </motion.div>
    <div className="text-center">
      <h2 className="text-2xl font-heading font-bold text-white mb-2">Your cart is empty</h2>
      <p className="text-slate-500 text-sm">Add some delicious items from a restaurant to get started.</p>
    </div>
    <button onClick={onBrowse} className="btn-primary px-8 py-3 text-base">
      Browse Restaurants
    </button>
  </div>
);

/* ── Cart item row ────────────────────────────────────── */
const CartItem = ({ item, onIncrease, onDecrease, onRemove }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
    transition={{ duration: 0.25 }}
    className="flex items-center gap-3 py-4 border-b border-white/5 last:border-0"
  >
    {/* Image */}
    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center rounded-xl"
          style={{ background: CATEGORY_COLORS[item.category?.toLowerCase()] || "#1e293b" }}
        >
          <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
            {item.name?.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>

    {/* Name + price */}
    <div className="flex-1 min-w-0">
      <p className="text-white font-semibold text-sm truncate">{item.name}</p>
      <p className="text-slate-500 text-xs mt-0.5">LKR {parseFloat(item.price).toFixed(2)} each</p>
    </div>

    {/* Qty controls */}
    <div className="flex items-center gap-2">
      <motion.button
        whileTap={item.quantity > 1 ? { scale: 0.85 } : {}}
        onClick={item.quantity > 1 ? onDecrease : undefined}
        disabled={item.quantity <= 1}
        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all
          ${item.quantity > 1
            ? "bg-white/6 border-white/8 text-slate-400 hover:bg-white/12 hover:text-white cursor-pointer"
            : "bg-white/2 border-white/4 text-slate-700 cursor-not-allowed"}`}
      >
        <Minus className="w-3.5 h-3.5" />
      </motion.button>
      <motion.span key={item.quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
        className="w-6 text-center text-white font-bold text-sm">
        {item.quantity}
      </motion.span>
      <motion.button whileTap={{ scale: 0.85 }} onClick={onIncrease}
        className="w-8 h-8 rounded-lg bg-primary-500/15 text-primary-400 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all">
        <Plus className="w-3.5 h-3.5" />
      </motion.button>
    </div>

    {/* Line total */}
    <div className="text-right w-20 flex-shrink-0">
      <p className="text-white font-bold text-sm">LKR {(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
      <button onClick={onRemove} className="text-slate-600 hover:text-red-400 transition-colors mt-1 inline-flex items-center gap-1 text-xs">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  </motion.div>
);

/* ── Main ─────────────────────────────────────────────── */
const CartPage = () => {
  const { cart, updateQuantity, removeItem, clearCart, totalAmount, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || "");
  const [deliveryNotes, setDeliveryNotes]     = useState("");
  const [paymentMethod, setPaymentMethod]     = useState("cash");
  const [loading, setLoading]                 = useState(false);

  const remaining       = Math.max(0, FREE_THRESHOLD - totalAmount);
  const progress        = Math.min(100, (totalAmount / FREE_THRESHOLD) * 100);
  const deliveryFee     = totalAmount >= FREE_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal      = totalAmount + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) { toast.error("Please enter a delivery address."); return; }
    setLoading(true);
    try {
      // Stale cart check — verify every item is still available before submitting
      const checks = await Promise.all(cart.items.map(i => menuAPI.getById(i.id).catch(() => null)));
      const unavailable = cart.items.filter((item, idx) => {
        const fresh = checks[idx]?.data?.data;
        return !fresh || !fresh.is_available;
      });
      if (unavailable.length > 0) {
        const names = unavailable.map(i => i.name).join(", ");
        toast.error(`Some items are no longer available: ${names}. Please remove them from your cart.`);
        setLoading(false);
        return;
      }

      const orderRes = await orderAPI.place({
        restaurant_id: cart.restaurantId,
        items: cart.items.map(i => ({ menu_item_id: i.id, quantity: i.quantity })),
        delivery_address: deliveryAddress,
        delivery_notes: deliveryNotes,
      });
      const order = orderRes.data.data;
      await paymentAPI.process({ order_id: order.id, payment_method: paymentMethod });
      toast.success("🎉 Order placed successfully!");
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order.");
    } finally { setLoading(false); }
  };

  if (totalItems === 0) return <EmptyCart onBrowse={() => navigate("/restaurants")} />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <motion.button whileTap={{ x: -4 }} onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-surface border border-white/6 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Your Cart</h1>
          <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
            <span>{cart.restaurantName}</span>
            <span className="text-slate-700">·</span>
            <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
          </p>
        </div>
        <button onClick={clearCart} className="ml-auto text-xs text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1">
          <Trash2 className="w-3 h-3" /> Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

        {/* ── Left: Cart items ── */}
        <div className="card p-5">
          {/* Free delivery progress */}
          <div className="mb-5 p-3.5 rounded-xl bg-dark/60 border border-white/5">
            {remaining > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-primary-400" />
                    Add <span className="text-primary-400 font-bold ml-1">LKR {remaining.toFixed(0)}</span>&nbsp;more for free delivery
                  </p>
                  <span className="text-xs font-bold text-slate-500">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/6 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-amber-400"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Free delivery unlocked!</span>
              </div>
            )}
          </div>

          {/* Items list */}
          <p className="section-label mb-3">Order Items</p>
          <AnimatePresence initial={false}>
            {cart.items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* ── Right: Order summary (sticky) ── */}
        <div className="lg:sticky lg:top-20 space-y-4">

          {/* Delivery */}
          <div className="card p-5 space-y-4">
            <p className="section-label">Delivery Details</p>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-primary-400" /> Delivery Address *
              </label>
              <textarea
                value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="e.g. 45 Galle Road, Colombo 3" rows={2}
                className="input-field text-sm resize-none"
              />
              {user?.address && deliveryAddress !== user.address && (
                <button onClick={() => setDeliveryAddress(user.address)}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
                  <Tag className="w-3 h-3" /> Use saved address
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <MessageSquare className="w-3.5 h-3.5" /> Special Instructions <span className="text-slate-600 font-normal">(optional)</span>
              </label>
              <input value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)}
                placeholder="e.g. Leave at the door, no onions..." className="input-field text-sm" />
            </div>
          </div>

          {/* Payment */}
          <div className="card p-5 space-y-3">
            <p className="section-label">Payment Method</p>
            {PAYMENT_OPTS.map(opt => (
              <PaymentOption key={opt.value} opt={opt} selected={paymentMethod === opt.value} onSelect={() => setPaymentMethod(opt.value)} />
            ))}
          </div>

          {/* Price summary */}
          <div className="card p-5">
            <p className="section-label mb-4">Price Summary</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({totalItems} items)</span>
                <span className="text-slate-200">LKR {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery fee</span>
                {deliveryFee === 0
                  ? <span className="text-emerald-400 font-semibold">Free ✓</span>
                  : <span className="text-slate-200">LKR {deliveryFee.toFixed(2)}</span>
                }
              </div>
              <div className="h-px bg-white/6 my-1" />
              <div className="flex justify-between font-bold text-white text-base">
                <span>Total</span>
                <motion.span key={grandTotal} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className="text-primary-400">
                  LKR {grandTotal.toFixed(2)}
                </motion.span>
              </div>
            </div>

            <motion.button
              onClick={handlePlaceOrder} disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="btn-primary w-full py-4 mt-5 text-base"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>Place Order · LKR {grandTotal.toFixed(2)} <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
            <p className="text-center text-xs text-slate-600 mt-3">
              By placing your order you agree to our terms of service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
