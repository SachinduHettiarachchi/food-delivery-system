import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

/* Check localStorage first, then sessionStorage (for "don't remember me" sessions) */
const getStorage = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = getStorage("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = getStorage("token");
    if (token) {
      authAPI.getMe()
        .then((res) => setUser(res.data.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user, token } = res.data.data;
    // Clear sessionStorage first so no stale token from a prior non-remember session lingers
    sessionStorage.removeItem("token"); sessionStorage.removeItem("user");
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    const { user, token } = res.data.data;
    // Clear any existing session from the other storage before writing
    sessionStorage.removeItem("token"); sessionStorage.removeItem("user");
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isCustomer = user?.role === "customer";
  const isRestaurantAdmin = user?.role === "restaurant_admin";
  const isSystemAdmin = user?.role === "system_admin";

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isCustomer, isRestaurantAdmin, isSystemAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
