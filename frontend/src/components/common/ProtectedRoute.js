import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, loggingOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Manual logout: don't carry the current path as `from` so the next
    // user who logs in isn't redirected to a different user's page.
    if (loggingOut.current) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect each role to their own home instead of a dead-end page
    if (user.role === "system_admin")      return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "restaurant_admin")  return <Navigate to="/restaurant/dashboard" replace />;
    return <Navigate to="/restaurants" replace />;
  }

  return children;
};

export default ProtectedRoute;
