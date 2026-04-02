import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
// Check both storages: localStorage (remember me) or sessionStorage (session-only)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — clear both storages and redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => API.post("/auth/register", data),
  login:          (data) => API.post("/auth/login", data),
  getMe:          ()     => API.get("/auth/me"),
  updateMe:       (data) => API.put("/auth/me", data),
  changePassword: (data) => API.put("/auth/change-password", data),
  forgotPassword: (data) => API.post("/auth/forgot-password", data),
  resetPassword:  (data) => API.post("/auth/reset-password", data),
  googleAuth:     (data) => API.post("/auth/google", data),
  facebookAuth:   (data) => API.post("/auth/facebook", data),
};

// ─── Restaurants ──────────────────────────────────────────────────────────────
export const restaurantAPI = {
  getAll: () => API.get("/restaurants"),
  getById: (id) => API.get(`/restaurants/${id}`),
  getMine: () => API.get("/restaurants/my/restaurants"),
  create: (data) => API.post("/restaurants", data),
  update: (id, data) => API.put(`/restaurants/${id}`, data),
  delete: (id) => API.delete(`/restaurants/${id}`),
};

// ─── Menu ─────────────────────────────────────────────────────────────────────
export const menuAPI = {
  getByRestaurant: (restaurantId) => API.get(`/restaurants/${restaurantId}/menu`),
  getAllByRestaurant: (restaurantId) => API.get(`/restaurants/${restaurantId}/menu/manage`),
  getById: (id) => API.get(`/menu/${id}`),
  create: (restaurantId, data) => API.post(`/restaurants/${restaurantId}/menu`, data),
  update: (id, data) => API.put(`/menu/${id}`, data),
  delete: (id) => API.delete(`/menu/${id}`),
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderAPI = {
  place: (data) => API.post("/orders", data),
  getMyOrders: () => API.get("/orders/my"),
  getById: (id) => API.get(`/orders/${id}`),
  getRestaurantOrders: (restaurantId) => API.get(`/orders/restaurant/${restaurantId}`),
  updateStatus: (id, status) => API.patch(`/orders/${id}/status`, { status }),
  cancel: (id) => API.post(`/orders/${id}/cancel`),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentAPI = {
  process: (data) => API.post("/payments", data),
  getByOrder: (orderId) => API.get(`/payments/order/${orderId}`),
  getAll: () => API.get("/payments"),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewAPI = {
  submit:           (data)        => API.post("/reviews", data),
  getByMenuItem:    (menuItemId)  => API.get(`/reviews/menu/${menuItemId}`),
  getMyOrderReviews:(orderId)     => API.get(`/reviews/order/${orderId}`),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => API.get("/admin/dashboard"),
  getUsers: () => API.get("/admin/users"),
  getUsersByRole: (role) => API.get(`/admin/users/role/${role}`),
  deactivateUser: (id) => API.delete(`/admin/users/${id}`),
  getRestaurants: () => API.get("/admin/restaurants"),
  getOrders: () => API.get("/admin/orders"),
  recomputeInsights: () => API.post("/admin/insights/recompute"),
};

export default API;
