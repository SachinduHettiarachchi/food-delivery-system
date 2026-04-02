import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import "./index.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Navbar from "./components/common/Navbar";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Customer Pages
import RestaurantsPage from "./pages/customer/RestaurantsPage";
import RestaurantDetailPage from "./pages/customer/RestaurantDetailPage";
import CartPage from "./pages/customer/CartPage";
import OrdersPage from "./pages/customer/OrdersPage";
import OrderDetailPage from "./pages/customer/OrderDetailPage";

// Restaurant Admin Pages
import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";
import MenuManagementPage from "./pages/restaurant/MenuManagementPage";
import RestaurantFormPage from "./pages/restaurant/RestaurantFormPage";
import RestaurantOrdersPage from "./pages/restaurant/RestaurantOrdersPage";

// System Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminRestaurantsPage from "./pages/admin/AdminRestaurantsPage";

// Shared Pages
import ProfilePage from "./pages/auth/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const PageWrapper = ({ children }) => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
);

const Unauthorized = () => {
  const { user } = useAuth();
  const home = !user ? "/login"
    : user.role === "system_admin"     ? "/admin/dashboard"
    : user.role === "restaurant_admin" ? "/restaurant/dashboard"
    : "/restaurants";
  return <Navigate to={home} replace />;
};

/* Pages where the Navbar should be hidden (full-screen own design) */
const HIDE_NAV_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<Navigate to="/restaurants" replace />} />
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<PageWrapper><RegisterPage /></PageWrapper>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/restaurants" element={<PageWrapper><RestaurantsPage /></PageWrapper>} />
        <Route path="/restaurants/:id" element={<PageWrapper><RestaurantDetailPage /></PageWrapper>} />
        <Route path="/unauthorized"    element={<Unauthorized />} />

        {/* Customer */}
        <Route path="/cart" element={
          <ProtectedRoute roles={["customer"]}><PageWrapper><CartPage /></PageWrapper></ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute roles={["customer"]}><PageWrapper><OrdersPage /></PageWrapper></ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute roles={["customer","restaurant_admin","system_admin"]}>
            <PageWrapper><OrderDetailPage /></PageWrapper>
          </ProtectedRoute>
        } />

        {/* Restaurant Admin */}
        <Route path="/restaurant/dashboard" element={
          <ProtectedRoute roles={["restaurant_admin"]}><PageWrapper><RestaurantDashboard /></PageWrapper></ProtectedRoute>
        } />
        <Route path="/restaurant/menu" element={
          <ProtectedRoute roles={["restaurant_admin"]}><PageWrapper><MenuManagementPage /></PageWrapper></ProtectedRoute>
        } />
        <Route path="/restaurant/orders" element={
          <ProtectedRoute roles={["restaurant_admin"]}><PageWrapper><RestaurantOrdersPage /></PageWrapper></ProtectedRoute>
        } />
        <Route path="/restaurant/new" element={
          <ProtectedRoute roles={["restaurant_admin"]}><PageWrapper><RestaurantFormPage /></PageWrapper></ProtectedRoute>
        } />
        <Route path="/restaurant/edit/:id" element={
          <ProtectedRoute roles={["restaurant_admin"]}><PageWrapper><RestaurantFormPage /></PageWrapper></ProtectedRoute>
        } />

        {/* System Admin */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={["system_admin"]}><PageWrapper><AdminDashboard /></PageWrapper></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={["system_admin"]}><PageWrapper><AdminUsersPage /></PageWrapper></ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute roles={["system_admin"]}><PageWrapper><AdminOrdersPage /></PageWrapper></ProtectedRoute>
        } />
        <Route path="/admin/restaurants" element={
          <ProtectedRoute roles={["system_admin"]}><PageWrapper><AdminRestaurantsPage /></PageWrapper></ProtectedRoute>
        } />

        {/* Profile */}
        <Route path="/profile" element={
          <ProtectedRoute roles={["customer","restaurant_admin","system_admin"]}>
            <PageWrapper><ProfilePage /></PageWrapper>
          </ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppLayout = () => {
  const location = useLocation();
  const hideNav = HIDE_NAV_PATHS.includes(location.pathname);
  return (
    <div className="min-h-screen bg-dark">
      {!hideNav && <Navbar />}
      <AnimatedRoutes />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppLayout />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#1E293B",
                color: "#F1F5F9",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                fontSize: "14px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                padding: "12px 16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              },
              success: { iconTheme: { primary: "#10B981", secondary: "#F1F5F9" } },
              error:   { iconTheme: { primary: "#EF4444", secondary: "#F1F5F9" } },
            }}
          />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
