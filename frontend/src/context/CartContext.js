import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X } from "lucide-react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const EMPTY_CART = { restaurantId: null, restaurantName: "", items: [] };
const cartKey = (userId) => `cart_${userId}`;

/* ── Restaurant-switch confirmation modal ────────────────── */
const SwitchModal = ({ fromName, toName, onConfirm, onCancel }) => (
  <AnimatePresence>
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm bg-surface border border-white/8 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors p-1 -mr-1 -mt-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          <h3 className="font-heading font-bold text-white text-base mb-1.5">Start a new cart?</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your cart has items from{" "}
            <span className="text-white font-semibold">{fromName}</span>.
            Adding from{" "}
            <span className="text-white font-semibold">{toName}</span>{" "}
            will clear your current cart.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/5 hover:border-white/20 transition-all"
          >
            Keep current
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 active:scale-95 transition-all shadow-glow-sm"
          >
            Start new cart
          </button>
        </div>
      </motion.div>
    </div>
  </AnimatePresence>
);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  // Initialize cart synchronously from localStorage to avoid the race where the
  // persist effect fires with EMPTY_CART before the async load effect can update state.
  const [cart, setCart] = useState(() => {
    if (user?.id) {
      const saved = localStorage.getItem(cartKey(user.id));
      return saved ? JSON.parse(saved) : EMPTY_CART;
    }
    return EMPTY_CART;
  });
  const [pendingSwitch, setPending]   = useState(null); // { item, restaurantId, restaurantName }

  // When the logged-in user changes (login/logout), reload the cart for that user.
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(cartKey(user.id));
      setCart(saved ? JSON.parse(saved) : EMPTY_CART);
    } else {
      setCart(EMPTY_CART);
    }
  }, [user?.id]);

  // Persist cart to localStorage whenever it changes (only while logged in).
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(cartKey(user.id), JSON.stringify(cart));
    }
  }, [cart, user?.id]);

  const addItem = useCallback((item, restaurantId, restaurantName) => {
    setCart((prev) => {
      if (prev.restaurantId && prev.restaurantId !== restaurantId) {
        // Show custom modal instead of window.confirm — defer via setTimeout
        // so the state update doesn't block React's render cycle
        setTimeout(() => setPending({ item, restaurantId, restaurantName }), 0);
        return prev; // leave cart unchanged for now
      }

      const exists = prev.items.find((i) => i.id === item.id);
      if (exists) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        restaurantId,
        restaurantName,
        items: [...prev.items, { ...item, quantity: 1 }],
      };
    });
  }, []);

  const confirmSwitch = useCallback(() => {
    if (!pendingSwitch) return;
    const { item, restaurantId, restaurantName } = pendingSwitch;
    setCart({ restaurantId, restaurantName, items: [{ ...item, quantity: 1 }] });
    setPending(null);
  }, [pendingSwitch]);

  const cancelSwitch = useCallback(() => setPending(null), []);

  const removeItem = useCallback((itemId) => {
    setCart((prev) => {
      const updated = prev.items.filter((i) => i.id !== itemId);
      if (updated.length === 0) return EMPTY_CART;
      return { ...prev, items: updated };
    });
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) { removeItem(itemId); return; }
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => setCart(EMPTY_CART), []);

  const totalAmount = cart.items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const totalItems  = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQuantity, clearCart, totalAmount, totalItems }}>
      {children}

      {pendingSwitch && (
        <SwitchModal
          fromName={cart.restaurantName}
          toName={pendingSwitch.restaurantName}
          onConfirm={confirmSwitch}
          onCancel={cancelSwitch}
        />
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
