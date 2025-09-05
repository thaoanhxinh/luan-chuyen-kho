// import React, { createContext, useContext, useState, useEffect } from "react";
// import { authService } from "../services/authService";
// import { USER_ROLES, ROLE_PERMISSIONS } from "../utils/constants";

// const AuthContext = createContext();

// // eslint-disable-next-line react-refresh/only-export-components
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = async () => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       const savedUser = localStorage.getItem("user");
//       if (savedUser) {
//         setUser(JSON.parse(savedUser));
//       }
//     }
//     setLoading(false);
//   };

//   const login = async (credentials) => {
//     const response = await authService.login(credentials);
//     const { token, user: userData } = response.data;

//     localStorage.setItem("token", token);
//     localStorage.setItem("user", JSON.stringify(userData));
//     setUser(userData);

//     return response;
//   };

//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setUser(null);
//     window.location.href = "/login";
//   };

//   const hasPermission = (permission) => {
//     if (!user?.role) return false;
//     const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
//     return rolePermissions.includes(permission);
//   };

//   const isAdmin = () => {
//     return user?.role === USER_ROLES.ADMIN;
//   };

//   const isManager = () => {
//     return user?.role === USER_ROLES.MANAGER;
//   };

//   const isAuthenticated = Boolean(user);

//   const value = {
//     user,
//     loading,
//     isAuthenticated,
//     login,
//     logout,
//     hasPermission,
//     isAdmin,
//     isManager,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { USER_ROLES, WORKFLOW_RULES } from "../utils/constants";

const AuthContext = createContext();

// Định nghĩa permissions cho từng role (tạm thời)
const ROLE_PERMISSIONS = {
  admin: ["view_all", "approve_all", "manage_system"],
  manager: ["view_managed", "approve_managed", "view_reports"],
  user: ["view_own", "create_phieu", "edit_own"],
};

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
    return user?.role === "admin";
  };

  const isManager = () => {
    return user?.role === "manager";
  };

  const isUser = () => {
    return user?.role === "user";
  };

  // Kiểm tra quyền theo workflow mới
  const canCreatePhieu = () => {
    return WORKFLOW_RULES.CAN_CREATE[user?.role] === true;
  };

  const canApprove = () => {
    return WORKFLOW_RULES.CAN_APPROVE[user?.role] === true;
  };

  const getViewScope = () => {
    return WORKFLOW_RULES.CAN_VIEW[user?.role] || "none";
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
    isUser,
    canCreatePhieu,
    canApprove,
    getViewScope,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
