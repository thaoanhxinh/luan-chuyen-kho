import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";

// Layout Components
import Sidebar from "./components/common/Sidebar";
import Header from "./components/common/Header";

// Pages - Main Pages Only (Forms are modals/components)
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Workflow Pages - Only existing files
import YeuCauNhap from "./pages/YeuCauNhap";
import YeuCauXuat from "./pages/YeuCauXuat";
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

// Main Layout Component using our fixed layout system
const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* SIDEBAR - FIXED POSITION */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* MAIN CONTENT - Margin left to avoid sidebar */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "ml-12" : "ml-56"
        }`}
      >
        {/* HEADER - FIXED TOP */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16">
          <Header />
        </div>

        {/* PAGE CONTENT */}
        <main className="min-h-[calc(100vh-4rem)] overflow-hidden">
          <div className="p-4 h-full overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
};

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

      {/* Protected Routes with Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* WORKFLOW ROUTES */}
      {/* Yêu cầu nhập kho - Main page (create form is modal) */}
      <Route
        path="/yeu-cau-nhap"
        element={
          <ProtectedRoute>
            <Layout>
              <YeuCauNhap />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Yêu cầu xuất kho - Main page (create form is modal) */}
      <Route
        path="/yeu-cau-xuat"
        element={
          <ProtectedRoute>
            <Layout>
              <YeuCauXuat />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Workflow Management - Manager/Admin only */}
      <Route
        path="/workflow"
        element={
          <ProtectedRoute>
            <ManagerRoute>
              <Layout>
                <WorkflowManagement />
              </Layout>
            </ManagerRoute>
          </ProtectedRoute>
        }
      />

      {/* WAREHOUSE OPERATIONS ROUTES */}
      {/* Phiếu nhập kho - Main page (create form is modal) */}
      <Route
        path="/nhap-kho"
        element={
          <ProtectedRoute>
            <Layout>
              <NhapKho />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Phiếu xuất kho - Main page (create form is modal) */}
      <Route
        path="/xuat-kho"
        element={
          <ProtectedRoute>
            <Layout>
              <XuatKho />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Kiểm kê - Main page (create form is modal) */}
      <Route
        path="/kiem-ke"
        element={
          <ProtectedRoute>
            <Layout>
              <KiemKe />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* CATALOG/MASTER DATA ROUTES */}
      {/* Hàng hóa - Main page (create/edit forms are modals) */}
      <Route
        path="/hang-hoa"
        element={
          <ProtectedRoute>
            <Layout>
              <HangHoa />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Tồn kho - View only page */}
      <Route
        path="/ton-kho"
        element={
          <ProtectedRoute>
            <Layout>
              <TonKho />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Loại hàng hóa - Main page (create/edit forms are modals) */}
      <Route
        path="/loai-hang-hoa"
        element={
          <ProtectedRoute>
            <Layout>
              <LoaiHangHoa />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Nhà cung cấp - Main page (create/edit forms are modals) */}
      <Route
        path="/nha-cung-cap"
        element={
          <ProtectedRoute>
            <Layout>
              <NhaCungCap />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Đơn vị nhận - Main page (create/edit forms are modals) */}
      <Route
        path="/don-vi-nhan"
        element={
          <ProtectedRoute>
            <Layout>
              <DonViNhan />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* REPORTS ROUTES - Using existing components only */}
      {/* Báo cáo Luân chuyển */}
      <Route
        path="/bao-cao/luan-chuyen"
        element={
          <ProtectedRoute>
            <Layout>
              <LuanChuyenReport />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Báo cáo Nhập */}
      <Route
        path="/bao-cao/nhap"
        element={
          <ProtectedRoute>
            <Layout>
              <BaoCaoNhapReport />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Báo cáo Xuất */}
      <Route
        path="/bao-cao/xuat"
        element={
          <ProtectedRoute>
            <Layout>
              <BaoCaoXuatReport />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Báo cáo Kiểm kê */}
      <Route
        path="/bao-cao/kiem-ke"
        element={
          <ProtectedRoute>
            <Layout>
              <KiemKeReport />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Thống kê Đơn vị nhận */}
      <Route
        path="/bao-cao/don-vi-nhan"
        element={
          <ProtectedRoute>
            <Layout>
              <ThongKeDonViNhanReport />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Thống kê Nhà cung cấp */}
      <Route
        path="/bao-cao/nha-cung-cap"
        element={
          <ProtectedRoute>
            <Layout>
              <ThongKeNhaCungCapReport />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ADMIN ROUTES - Admin and Manager visibility */}
      {/* Quản lý nhân viên */}
      <Route
        path="/admin/nhan-vien"
        element={
          <ProtectedRoute>
            <AdminOrManagerRoute>
              <Layout>
                <Users />
              </Layout>
            </AdminOrManagerRoute>
          </ProtectedRoute>
        }
      />

      {/* Quản lý phòng ban */}
      <Route
        path="/admin/phong-ban"
        element={
          <ProtectedRoute>
            <AdminOrManagerRoute>
              <Layout>
                <Departments />
              </Layout>
            </AdminOrManagerRoute>
          </ProtectedRoute>
        }
      />

      {/* Quản lý tài khoản (thay cho cài đặt hệ thống) */}
      <Route
        path="/quan-ly-tai-khoan"
        element={
          <ProtectedRoute>
            <Layout>
              <AccountManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* NOTIFICATIONS */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <NotificationCenter />
            </Layout>
          </ProtectedRoute>
        }
      />

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
