// Order status pipeline
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export const ORDER_STATUS_LABELS = {
  pending:          "⏳ Pending",
  confirmed:        "✅ Confirmed",
  preparing:        "👨‍🍳 Preparing",
  out_for_delivery: "🚴 Out for Delivery",
  delivered:        "🎉 Delivered",
  cancelled:        "❌ Cancelled",
};

// Payment methods
export const PAYMENT_METHODS = [
  { value: "cash",   label: "💵 Cash on Delivery" },
  { value: "card",   label: "💳 Card Payment" },
  { value: "online", label: "🌐 Online Payment" },
];

// User roles
export const ROLES = {
  CUSTOMER:          "customer",
  RESTAURANT_ADMIN:  "restaurant_admin",
  SYSTEM_ADMIN:      "system_admin",
};

// Delivery fee (LKR)
export const DELIVERY_FEE = 150;

// Pagination defaults
export const PAGE_SIZE = 20;
