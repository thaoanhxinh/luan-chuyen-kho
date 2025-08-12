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

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./App.css";

// Layout Components
import Sidebar from "./components/common/Sidebar";
import NotificationBell from "./components/notifications/NotificationBell";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NhapKho from "./pages/NhapKho";
import XuatKho from "./pages/XuatKho";
import KiemKe from "./pages/KiemKe";
import TonKho from "./pages/TonKho";
import BaoCao from "./pages/BaoCao";
import HangHoa from "./pages/HangHoa";
import Settings from "./pages/Settings";

// New Workflow Pages
import YeuCauNhap from "./pages/YeuCauNhap";
import YeuCauXuat from "./pages/YeuCauXuat";
import WorkflowManagement from "./pages/WorkflowManagement";
import NotificationCenter from "./pages/NotificationCenter";

// Admin Pages
import Users from "./pages/admin/Users";
import Departments from "./pages/admin/Departments";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
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
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main Layout Component
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 fixed inset-y-0 left-0 z-50">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          {/* Top Navigation */}
          <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-end">
              <NotificationBell />
            </div>
          </div>

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

// App Component
const AppContent = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Inventory Management */}
        <Route path="/hang-hoa" element={<HangHoa />} />
        <Route path="/ton-kho" element={<TonKho />} />

        {/* Traditional Warehouse Operations */}
        <Route path="/nhap-kho" element={<NhapKho />} />
        <Route path="/xuat-kho" element={<XuatKho />} />
        <Route path="/kiem-ke" element={<KiemKe />} />

        {/* Workflow Management */}
        <Route path="/yeu-cau-nhap" element={<YeuCauNhap />} />
        <Route path="/yeu-cau-xuat" element={<YeuCauXuat />} />
        <Route path="/workflow" element={<WorkflowManagement />} />

        {/* Notifications */}
        <Route path="/notifications" element={<NotificationCenter />} />

        {/* Reports */}
        <Route path="/bao-cao" element={<BaoCao />} />

        {/* Admin Routes */}
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <AdminRoute>
              <Departments />
            </AdminRoute>
          }
        />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

// Main App Component with Providers
function App() {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;
