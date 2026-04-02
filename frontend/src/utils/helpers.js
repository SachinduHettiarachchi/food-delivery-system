/**
 * formatCurrency — formats a number as LKR currency
 */
export const formatCurrency = (amount) => {
  return `LKR ${parseFloat(amount || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * formatDate — formats ISO date string to readable form
 */
export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return "—";
  const defaults = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateStr).toLocaleDateString("en-US", { ...defaults, ...options });
};

/**
 * formatDateTime — date + time
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

/**
 * capitalizeWords — "out_for_delivery" → "Out For Delivery"
 */
export const capitalizeWords = (str) => {
  if (!str) return "";
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * truncate — truncates long strings
 */
export const truncate = (str, max = 80) => {
  if (!str || str.length <= max) return str;
  return str.slice(0, max) + "...";
};

/**
 * getOrderStatusColor — returns CSS class for a given order status
 */
export const getOrderStatusClass = (status) => {
  const map = {
    pending: "status-pending",
    confirmed: "status-confirmed",
    preparing: "status-preparing",
    out_for_delivery: "status-out_for_delivery",
    delivered: "status-delivered",
    cancelled: "status-cancelled",
  };
  return map[status] || "status-pending";
};

/**
 * generateTransactionId — generates a mock transaction reference
 */
export const generateTransactionId = (prefix = "TXN") => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

/**
 * validateEmail — basic email check
 */
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * groupBy — groups an array of objects by a key
 * e.g. groupBy(menuItems, "category")
 */
export const groupBy = (arr, key) => {
  return arr.reduce((acc, item) => {
    const group = item[key] || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
};
