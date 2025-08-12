import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { USER_ROLES, ROLE_PERMISSIONS } from "../utils/constants";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const { token, user: userData } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return response;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  const hasPermission = (permission) => {
    if (!user?.role) return false;
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    return rolePermissions.includes(permission);
  };

  const isAdmin = () => {
    return user?.role === USER_ROLES.ADMIN;
  };

  const isManager = () => {
    return user?.role === USER_ROLES.MANAGER;
  };

  const isAuthenticated = Boolean(user);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    isAdmin,
    isManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
