// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider } from "./context/AuthContext";
// import ProtectedRoute from "./components/common/ProtectedRoute";
// import Layout from "./components/common/Layout";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import HangHoa from "./pages/HangHoa";
// import NhapKho from "./pages/NhapKho";
// import XuatKho from "./pages/XuatKho";
// import KiemKe from "./pages/KiemKe";
// import BaoCao from "./pages/BaoCao";
// import LuanChuyenReport from "./components/reports/LuanChuyenReport";
// import BaoCaoNhapReport from "./components/reports/BaoCaoNhapReport";
// import BaoCaoXuatReport from "./components/reports/BaoCaoXuatReport";
// import ThongKeDonViNhanReport from "./components/reports/ThongKeDonViNhanReport";
// import ThongKeNhaCungCapReport from "./components/reports/ThongKeNhaCungCapReport";

// // Import admin components
// import UserManagement from "./components/admin/UserManagement";
// import DepartmentManagement from "./components/admin/DepartmentManagement";

// // Import constants
// import { PERMISSIONS, USER_ROLES } from "./utils/constants";

// function App() {
//   return (
//     <AuthProvider>
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route
//           path="/"
//           element={
//             <ProtectedRoute>
//               <Layout />
//             </ProtectedRoute>
//           }
//         >
//           <Route index element={<Navigate to="/dashboard" replace />} />

//           {/* Dashboard - requires VIEW_DASHBOARD permission */}
//           <Route
//             path="dashboard"
//             element={
//               <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_DASHBOARD}>
//                 <Dashboard />
//               </ProtectedRoute>
//             }
//           />

//           {/* Inventory management routes - require MANAGE_INVENTORY permission */}
//           <Route
//             path="hang-hoa"
//             element={
//               <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_INVENTORY}>
//                 <HangHoa />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="nhap-kho"
//             element={
//               <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_INVENTORY}>
//                 <NhapKho />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="xuat-kho"
//             element={
//               <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_INVENTORY}>
//                 <XuatKho />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/bao-cao/luan-chuyen"
//             element={
//               <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_INVENTORY}>
//                 <LuanChuyenReport />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/bao-cao/nhap"
//             element={
//               <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_INVENTORY}>
//                 <BaoCaoNhapReport />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/bao-cao/xuat"
//             element={
//               <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_INVENTORY}>
//                 <BaoCaoXuatReport />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/bao-cao/don-vi-nhan"
//             element={
//               <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_INVENTORY}>
//                 <ThongKeDonViNhanReport />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/bao-cao/nha-cung-cap"
//             element={
//               <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_INVENTORY}>
//                 <ThongKeNhaCungCapReport />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="kiem-ke"
//             element={
//               <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_INVENTORY}>
//                 <KiemKe />
//               </ProtectedRoute>
//             }
//           />

//           {/* Reports - require VIEW_REPORTS permission */}
//           <Route
//             path="bao-cao"
//             element={
//               <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_REPORTS}>
//                 <BaoCao />
//               </ProtectedRoute>
//             }
//           />

//           {/* Admin routes - require ADMIN role */}
//           <Route
//             path="admin/nhan-vien"
//             element={
//               <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
//                 <UserManagement />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="admin/phong-ban"
//             element={
//               <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
//                 <DepartmentManagement />
//               </ProtectedRoute>
//             }
//           />

//           {/* Catch-all route for 404 */}
//           <Route
//             path="*"
//             element={
//               <div className="text-center py-12">
//                 <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
//                   <svg
//                     className="h-6 w-6 text-gray-600"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
//                     />
//                   </svg>
//                 </div>
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">
//                   Trang không tồn tại
//                 </h3>
//                 <p className="mt-1 text-sm text-gray-500">
//                   Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
//                 </p>
//                 <div className="mt-6">
//                   <Navigate to="/dashboard" replace />
//                 </div>
//               </div>
//             }
//           />
//         </Route>
//       </Routes>
//     </AuthProvider>
//   );
// }

// export default App;

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

// Admin Route Component
const AdminRoute = ({ children }) => {
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

// Main Layout Component using our fixed layout system
const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
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
        <main className="min-h-[calc(100vh-4rem)]">
          <div className="p-4 h-full">{children}</div>
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

      {/* ADMIN ROUTES - Admin only */}
      {/* Quản lý nhân viên */}
      <Route
        path="/admin/nhan-vien"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Users />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      {/* Quản lý phòng ban */}
      <Route
        path="/admin/phong-ban"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Departments />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      {/* Cài đặt hệ thống */}
      {/* <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Layout>
                <Settings />
              </Layout>
            </AdminRoute>
          </ProtectedRoute>
        }
      /> */}

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
