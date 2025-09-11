import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";

// Layout Components
import Layout from "./components/common/Layout";

// Pages - Main Pages Only (Forms are modals/components)
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Workflow Pages - Only existing files
import WorkflowManagement from "./pages/WorkflowManagement";

// Warehouse Operations Pages
import NhapKho from "./pages/NhapKho";
import XuatKho from "./pages/XuatKho";
import KiemKe from "./pages/KiemKe";

// Catalog/Master Data Pages
import HangHoa from "./pages/HangHoa";
import TonKho from "./pages/TonKho";
import LoaiHangHoa from "./pages/LoaiHangHoa";
import NhaCungCap from "./pages/NhaCungCap";
import DonViNhan from "./pages/DonViNhan";

// Reports Components - Existing files only
import LuanChuyenReport from "./components/reports/LuanChuyenReport";
import BaoCaoNhapReport from "./components/reports/BaoCaoNhapReport";
import BaoCaoXuatReport from "./components/reports/BaoCaoXuatReport";
import ThongKeDonViNhanReport from "./components/reports/ThongKeDonViNhanReport";
import ThongKeNhaCungCapReport from "./components/reports/ThongKeNhaCungCapReport";
import KiemKeReport from "./components/reports/KiemKeReport";

// Admin Pages
import Users from "./pages/admin/Users";
import Departments from "./pages/admin/Departments";
//import Settings from "./pages/admin/Settings";

// Notifications
import NotificationCenter from "./pages/NotificationCenter";
import AccountManagement from "./pages/AccountManagement";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin or Manager Route Component for admin pages visibility (cấp 1 và cấp 2)
const AdminOrManagerRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Admin-only Route Component (for Departments page)
const AdminOnlyRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Manager Route Component (for approvals)
const ManagerRoute = ({ children }) => {
  const { user } = useAuth();

  const isManager =
    user?.role === "admin" ||
    ["HCK", "TMKH"].includes(user?.phong_ban_info?.ma_phong_ban);

  if (!isManager) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout moved to components/common/Layout.jsx and used as a parent Route

// App Component Content
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected Routes under a single shared Layout (preserves sidebar state) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Dashboard />} />

        {/* Workflow Management - Manager/Admin only */}
        <Route
          path="workflow"
          element={
            <ManagerRoute>
              <WorkflowManagement />
            </ManagerRoute>
          }
        />

        {/* Warehouse */}
        <Route path="nhap-kho" element={<NhapKho />} />
        <Route path="xuat-kho" element={<XuatKho />} />
        <Route path="kiem-ke" element={<KiemKe />} />

        {/* Catalog / Master data */}
        <Route path="hang-hoa" element={<HangHoa />} />
        <Route path="ton-kho" element={<TonKho />} />
        <Route path="loai-hang-hoa" element={<LoaiHangHoa />} />
        <Route path="nha-cung-cap" element={<NhaCungCap />} />
        <Route path="don-vi-nhan" element={<DonViNhan />} />

        {/* Reports */}
        <Route path="bao-cao/luan-chuyen" element={<LuanChuyenReport />} />
        <Route path="bao-cao/nhap" element={<BaoCaoNhapReport />} />
        <Route path="bao-cao/xuat" element={<BaoCaoXuatReport />} />
        <Route path="bao-cao/kiem-ke" element={<KiemKeReport />} />
        <Route
          path="bao-cao/don-vi-nhan"
          element={<ThongKeDonViNhanReport />}
        />
        <Route
          path="bao-cao/nha-cung-cap"
          element={<ThongKeNhaCungCapReport />}
        />

        {/* Admin */}
        <Route
          path="admin/nhan-vien"
          element={
            <AdminOrManagerRoute>
              <Users />
            </AdminOrManagerRoute>
          }
        />
        <Route
          path="admin/phong-ban"
          element={
            <AdminOnlyRoute>
              <Departments />
            </AdminOnlyRoute>
          }
        />

        {/* Account Management and Notifications */}
        <Route path="quan-ly-tai-khoan" element={<AccountManagement />} />
        <Route path="notifications" element={<NotificationCenter />} />
      </Route>

      {/* REDIRECT ROUTES FOR CREATE ACTIONS */}
      {/* These redirect to main pages since create forms are modals */}
      <Route
        path="/yeu-cau-nhap/create"
        element={<Navigate to="/yeu-cau-nhap" replace />}
      />
      <Route
        path="/yeu-cau-xuat/create"
        element={<Navigate to="/yeu-cau-xuat" replace />}
      />
      <Route
        path="/nhap-kho/create"
        element={<Navigate to="/nhap-kho" replace />}
      />
      <Route
        path="/xuat-kho/create"
        element={<Navigate to="/xuat-kho" replace />}
      />
      <Route
        path="/kiem-ke/create"
        element={<Navigate to="/kiem-ke" replace />}
      />

      {/* Catch all route - redirect to dashboard for authenticated users */}
      <Route
        path="*"
        element={
          user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

// Main App Component with Providers
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#374151",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
