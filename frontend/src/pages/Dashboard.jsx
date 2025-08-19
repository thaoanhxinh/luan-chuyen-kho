// import React, { useState, useEffect } from "react";
// import {
//   Package,
//   ArrowDownToLine,
//   ArrowUpFromLine,
//   AlertTriangle,
//   TrendingUp,
//   ChartColumnBig,
// } from "lucide-react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";
// import { baoCaoService } from "../services/baoCaoService";
// import { formatCurrency, formatNumber } from "../utils/helpers";
// import Loading from "../components/common/Loading";

// const Dashboard = () => {
//   const [thongKe, setThongKe] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const fetchDashboardStats = async () => {
//       try {
//         setIsLoading(true);
//         const response = await baoCaoService.getDashboardStats();
//         setThongKe(response);
//       } catch (error) {
//         console.error("Error fetching dashboard stats:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchDashboardStats();
//   }, []);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Loading size="large" />
//       </div>
//     );
//   }

//   const stats = thongKe?.data || {};

//   const statCards = [
//     {
//       title: "Tổng hàng hóa",
//       value: formatNumber(stats.tong_hang_hoa || 0),
//       icon: Package,
//       color: "bg-blue-500",
//       bgColor: "bg-blue-50",
//       textColor: "text-blue-600",
//       change: "+5.2%",
//     },
//     {
//       title: "Phiếu nhập tháng này",
//       value: formatNumber(stats.phieu_nhap_thang || 0),
//       icon: ArrowDownToLine,
//       color: "bg-green-500",
//       bgColor: "bg-green-50",
//       textColor: "text-green-600",
//       change: "+12.3%",
//     },
//     {
//       title: "Phiếu xuất tháng này",
//       value: formatNumber(stats.phieu_xuat_thang || 0),
//       icon: ArrowUpFromLine,
//       color: "bg-orange-500",
//       bgColor: "bg-orange-50",
//       textColor: "text-orange-600",
//       change: "-2.1%",
//     },
//     {
//       title: "Hàng sắp hết",
//       value: formatNumber(stats.hang_sap_het || 0),
//       icon: AlertTriangle,
//       color: "bg-red-500",
//       bgColor: "bg-red-50",
//       textColor: "text-red-600",
//       change: "-8.4%",
//     },
//   ];

//   const chartData = [
//     { thang: "T1", nhap: 2400, xuat: 2100 },
//     { thang: "T2", nhap: 1398, xuat: 1800 },
//     { thang: "T3", nhap: 9800, xuat: 3200 },
//     { thang: "T4", nhap: 3908, xuat: 2800 },
//     { thang: "T5", nhap: 4800, xuat: 4300 },
//     { thang: "T6", nhap: 3800, xuat: 3900 },
//   ];

//   const pieData = [
//     { name: "Tốt", value: 70, color: "#22c55e" },
//     { name: "Kém phẩm chất", value: 20, color: "#f59e0b" },
//     { name: "Mất phẩm chất", value: 7, color: "#ef4444" },
//     { name: "Hỏng", value: 3, color: "#6b7280" },
//   ];

//   return (
//     <div className="space-y-6 ">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-900 flex items-center">
//           <ChartColumnBig className="mr-2 h-6 w-6 text-green-600" />
//           Dashboard
//         </h1>

//         <div className="text-sm text-gray-500">
//           Cập nhật lần cuối: {new Date().toLocaleString("vi-VN")}
//         </div>
//       </div>

//       {/* Stat Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {statCards.map((stat, index) => {
//           const Icon = stat.icon;
//           return (
//             <div
//               key={index}
//               className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
//             >
//               <div className="flex items-center justify-between">
//                 <div className="flex-1">
//                   <p className="text-sm font-medium text-gray-600 mb-1">
//                     {stat.title}
//                   </p>
//                   <p className="text-2xl font-bold text-gray-900 mb-2">
//                     {stat.value}
//                   </p>
//                   <div className="flex items-center">
//                     <TrendingUp size={14} className="text-green-500 mr-1" />
//                     <span className="text-sm text-green-600 font-medium">
//                       {stat.change}
//                     </span>
//                     <span className="text-xs text-gray-500 ml-1">
//                       so với tháng trước
//                     </span>
//                   </div>
//                 </div>
//                 <div className={`p-3 rounded-lg ${stat.bgColor}`}>
//                   <Icon size={24} className={stat.textColor} />
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Bar Chart */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">
//             Thống kê nhập/xuất 6 tháng gần đây
//           </h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart
//               data={chartData}
//               margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
//             >
//               <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
//               <XAxis
//                 dataKey="thang"
//                 tick={{ fontSize: 12 }}
//                 axisLine={{ stroke: "#e5e7eb" }}
//               />
//               <YAxis tick={{ fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
//               <Tooltip
//                 formatter={(value) => formatNumber(value)}
//                 contentStyle={{
//                   backgroundColor: "white",
//                   border: "1px solid #e5e7eb",
//                   borderRadius: "8px",
//                   boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//                 }}
//               />
//               <Bar
//                 dataKey="nhap"
//                 fill="#22c55e"
//                 name="Nhập kho"
//                 radius={[4, 4, 0, 0]}
//               />
//               <Bar
//                 dataKey="xuat"
//                 fill="#ef4444"
//                 name="Xuất kho"
//                 radius={[4, 4, 0, 0]}
//               />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         {/* Pie Chart */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">
//             Phân bố phẩm chất hàng hóa
//           </h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={pieData}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={60}
//                 outerRadius={100}
//                 paddingAngle={2}
//                 dataKey="value"
//               >
//                 {pieData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//               </Pie>
//               <Tooltip
//                 formatter={(value) => `${value}%`}
//                 contentStyle={{
//                   backgroundColor: "white",
//                   border: "1px solid #e5e7eb",
//                   borderRadius: "8px",
//                   boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
//                 }}
//               />
//             </PieChart>
//           </ResponsiveContainer>
//           <div className="flex flex-wrap justify-center mt-4 gap-4">
//             {pieData.map((entry, index) => (
//               <div key={index} className="flex items-center">
//                 <div
//                   className="w-3 h-3 rounded-full mr-2"
//                   style={{ backgroundColor: entry.color }}
//                 ></div>
//                 <span className="text-sm text-gray-600 font-medium">
//                   {entry.name}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Recent Activities */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">
//             Phiếu nhập gần đây
//           </h3>
//           <div className="space-y-3">
//             {stats.phieu_nhap_gan_day?.map((phieu, index) => (
//               <div
//                 key={index}
//                 className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
//               >
//                 <div>
//                   <p className="font-medium text-gray-900 text-sm">
//                     {phieu.so_phieu}
//                   </p>
//                   <p className="text-xs text-gray-500">{phieu.nha_cung_cap}</p>
//                 </div>
//                 <div className="text-right">
//                   <p className="font-medium text-green-600 text-sm">
//                     {formatCurrency(phieu.tong_tien)}
//                   </p>
//                   <p className="text-xs text-gray-500">{phieu.ngay_nhap}</p>
//                 </div>
//               </div>
//             )) || (
//               <div className="text-center py-8">
//                 <Package className="mx-auto h-12 w-12 text-gray-300" />
//                 <p className="text-gray-500 text-sm mt-2">
//                   Chưa có phiếu nhập nào
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">
//             Phiếu xuất gần đây
//           </h3>
//           <div className="space-y-3">
//             {stats.phieu_xuat_gan_day?.map((phieu, index) => (
//               <div
//                 key={index}
//                 className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
//               >
//                 <div>
//                   <p className="font-medium text-gray-900 text-sm">
//                     {phieu.so_phieu}
//                   </p>
//                   <p className="text-xs text-gray-500">{phieu.don_vi_nhan}</p>
//                 </div>
//                 <div className="text-right">
//                   <p className="font-medium text-red-600 text-sm">
//                     {formatCurrency(phieu.tong_tien)}
//                   </p>
//                   <p className="text-xs text-gray-500">{phieu.ngay_xuat}</p>
//                 </div>
//               </div>
//             )) || (
//               <div className="text-center py-8">
//                 <ArrowUpFromLine className="mx-auto h-12 w-12 text-gray-300" />
//                 <p className="text-gray-500 text-sm mt-2">
//                   Chưa có phiếu xuất nào
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Top Items */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">
//           Top hàng hóa có giá trị tồn kho cao nhất
//         </h3>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-gray-200">
//                 <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Mã hàng hóa
//                 </th>
//                 <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Tên hàng hóa
//                 </th>
//                 <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Đơn vị tính
//                 </th>
//                 <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Số lượng tồn
//                 </th>
//                 <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Giá trị tồn
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {stats.top_hang_hoa_gia_tri?.map((item, index) => (
//                 <tr key={index} className="hover:bg-gray-50 transition-colors">
//                   <td className="py-4 px-4 text-sm font-medium text-gray-900">
//                     {item.ma_hang_hoa}
//                   </td>
//                   <td className="py-4 px-4 text-sm text-gray-900">
//                     {item.ten_hang_hoa}
//                   </td>
//                   <td className="py-4 px-4 text-sm text-gray-500">
//                     {item.don_vi_tinh}
//                   </td>
//                   <td className="py-4 px-4 text-sm text-gray-900 text-right">
//                     {formatNumber(item.so_luong_ton)}
//                   </td>
//                   <td className="py-4 px-4 text-sm font-medium text-blue-600 text-right">
//                     {formatCurrency(item.gia_tri_ton)}
//                   </td>
//                 </tr>
//               )) || (
//                 <tr>
//                   <td colSpan={5} className="text-center py-8">
//                     <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
//                     <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

import React, { useState, useEffect } from "react";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  ChartColumnBig,
  Bell,
  Clock,
  CheckCircle,
  Users,
  FileText,
  Send,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { baoCaoService } from "../services/baoCaoService";
import { workflowService } from "../services/workflowService";
import { notificationService } from "../services/notificationService";
import { formatCurrency, formatNumber } from "../utils/helpers";
import Loading from "../components/common/Loading";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [thongKe, setThongKe] = useState(null);
  const [workflowStats, setWorkflowStats] = useState(null);
  const [notificationStats, setNotificationStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setIsLoading(true);
        const [dashboardResponse, workflowResponse, notificationResponse] =
          await Promise.all([
            baoCaoService.getDashboardStats(),
            workflowService.getStatistics().catch(() => null), // Don't fail if workflow service unavailable
            notificationService.getUnreadCount().catch(() => null), // Don't fail if notification service unavailable
          ]);

        setThongKe(dashboardResponse);
        setWorkflowStats(workflowResponse);
        setNotificationStats(notificationResponse);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="large" />
      </div>
    );
  }

  const stats = thongKe?.data || {};
  const workflow = workflowStats?.data || {};
  const notifications = notificationStats?.data || {};

  const statCards = [
    {
      title: "Tổng hàng hóa",
      value: formatNumber(stats.tong_hang_hoa || 0),
      icon: Package,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      change: "+5.2%",
      link: "/hang-hoa",
    },
    {
      title: "Phiếu nhập tháng này",
      value: formatNumber(stats.phieu_nhap_thang || 0),
      icon: ArrowDownToLine,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      change: "+12.3%",
      link: "/nhap-kho",
    },
    {
      title: "Phiếu xuất tháng này",
      value: formatNumber(stats.phieu_xuat_thang || 0),
      icon: ArrowUpFromLine,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      change: "-2.1%",
      link: "/xuat-kho",
    },
    {
      title: "Hàng sắp hết",
      value: formatNumber(stats.hang_sap_het || 0),
      icon: AlertTriangle,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      change: "-8.4%",
      link: "/ton-kho",
    },
  ];

  // Workflow stats cards
  const workflowCards = [
    {
      title: "Yêu cầu chờ duyệt",
      value: formatNumber(workflow.pending_count || 0),
      icon: Clock,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      link: "/workflow",
    },
    {
      title: "Đã duyệt hôm nay",
      value: formatNumber(workflow.approved_today || 0),
      icon: CheckCircle,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      link: "/workflow",
    },
    {
      title: "Yêu cầu nhập mới",
      value: formatNumber(workflow.nhap_kho?.draft || 0),
      icon: FileText,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      link: "/yeu-cau-nhap",
    },
    {
      title: "Thông báo chưa đọc",
      value: formatNumber(notifications.unread_count || 0),
      icon: Bell,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      link: "/notifications",
    },
  ];

  const chartData = [
    { thang: "T1", nhap: 2400, xuat: 2100, yeuCauNhap: 15, yeuCauXuat: 12 },
    { thang: "T2", nhap: 1398, xuat: 1800, yeuCauNhap: 18, yeuCauXuat: 14 },
    { thang: "T3", nhap: 9800, xuat: 3200, yeuCauNhap: 22, yeuCauXuat: 19 },
    { thang: "T4", nhap: 3908, xuat: 2800, yeuCauNhap: 20, yeuCauXuat: 16 },
    { thang: "T5", nhap: 4800, xuat: 4300, yeuCauNhap: 25, yeuCauXuat: 21 },
    { thang: "T6", nhap: 3800, xuat: 3900, yeuCauNhap: 23, yeuCauXuat: 18 },
  ];

  const pieData = [
    { name: "Tốt", value: 70, color: "#22c55e" },
    { name: "Kém phẩm chất", value: 20, color: "#f59e0b" },
    { name: "Mất phẩm chất", value: 7, color: "#ef4444" },
    { name: "Hỏng", value: 3, color: "#6b7280" },
  ];

  // Workflow trend data
  const workflowTrendData = [
    { ngay: "T2", confirmed: 5, approved: 3, rejected: 1 },
    { ngay: "T3", confirmed: 8, approved: 6, rejected: 2 },
    { ngay: "T4", confirmed: 12, approved: 10, rejected: 1 },
    { ngay: "T5", confirmed: 15, approved: 12, rejected: 3 },
    { ngay: "T6", confirmed: 10, approved: 8, rejected: 2 },
    { ngay: "T7", confirmed: 6, approved: 5, rejected: 1 },
    { ngay: "CN", confirmed: 3, approved: 2, rejected: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <ChartColumnBig className="mr-2 h-6 w-6 text-green-600" />
          Dashboard
        </h1>

        <div className="text-sm text-gray-500">
          Cập nhật lần cuối: {new Date().toLocaleString("vi-VN")}
        </div>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={stat.link}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center">
                    <TrendingUp size={14} className="text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      so với tháng trước
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon size={24} className={stat.textColor} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Workflow Stats Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="mr-2 h-5 w-5 text-purple-600" />
            Workflow & Thông báo
          </h2>
          <Link
            to="/workflow"
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={index}
                to={card.link}
                className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${card.bgColor} mr-3`}>
                    <Icon size={20} className={card.textColor} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Enhanced */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thống kê nhập/xuất & yêu cầu 6 tháng gần đây
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="thang"
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis tick={{ fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "nhap" || name === "xuat") {
                    return [
                      formatNumber(value),
                      name === "nhap" ? "Nhập kho" : "Xuất kho",
                    ];
                  }
                  return [
                    formatNumber(value),
                    name === "yeuCauNhap" ? "YC Nhập" : "YC Xuất",
                  ];
                }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar
                dataKey="nhap"
                fill="#22c55e"
                name="nhap"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="xuat"
                fill="#ef4444"
                name="xuat"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="yeuCauNhap"
                fill="#3b82f6"
                name="yeuCauNhap"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="yeuCauXuat"
                fill="#f59e0b"
                name="yeuCauXuat"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Phân bố phẩm chất hàng hóa
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center mt-4 gap-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600 font-medium">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Xu hướng workflow 7 ngày gần đây
          </h3>
          <Link
            to="/workflow"
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            Xem chi tiết →
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={workflowTrendData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="ngay"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis tick={{ fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
            <Tooltip
              formatter={(value, name) => [
                formatNumber(value),
                name === "confirmed"
                  ? "Đã gửi"
                  : name === "approved"
                  ? "Đã duyệt"
                  : "Từ chối",
              ]}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="confirmed"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="approved"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="rejected"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Phiếu nhập gần đây
            </h3>
            <Link
              to="/nhap-kho"
              className="text-sm text-green-600 hover:text-green-800 font-medium"
            >
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.phieu_nhap_gan_day?.map((phieu, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {phieu.so_phieu}
                  </p>
                  <p className="text-xs text-gray-500">{phieu.nha_cung_cap}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600 text-sm">
                    {formatCurrency(phieu.tong_tien)}
                  </p>
                  <p className="text-xs text-gray-500">{phieu.ngay_nhap}</p>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-300" />
                <p className="text-gray-500 text-sm mt-2">
                  Chưa có phiếu nhập nào
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Yêu cầu gần đây
            </h3>
            <Link
              to="/yeu-cau-nhap"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Xem tất cả →
            </Link>
          </div>
          <div className="space-y-3">
            {/* Mock recent requests data */}
            {[
              {
                so_yeu_cau: "YCN20250101001",
                loai: "Nhập kho",
                trang_thai: "confirmed",
                ngay: "01/01/2025",
              },
              {
                so_yeu_cau: "YCX20250101002",
                loai: "Xuất kho",
                trang_thai: "approved",
                ngay: "01/01/2025",
              },
              {
                so_yeu_cau: "YCN20250101003",
                loai: "Nhập kho",
                trang_thai: "under_review",
                ngay: "31/12/2024",
              },
            ].map((request, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {request.so_yeu_cau}
                  </p>
                  <p className="text-xs text-gray-500">{request.loai}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {request.trang_thai === "confirmed" && (
                      <Send size={12} className="text-blue-500" />
                    )}
                    {request.trang_thai === "approved" && (
                      <CheckCircle size={12} className="text-green-500" />
                    )}
                    {request.trang_thai === "under_review" && (
                      <Clock size={12} className="text-yellow-500" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        request.trang_thai === "confirmed"
                          ? "text-blue-600"
                          : request.trang_thai === "approved"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {request.trang_thai === "confirmed"
                        ? "Đã gửi"
                        : request.trang_thai === "approved"
                        ? "Đã duyệt"
                        : "Đang xem xét"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{request.ngay}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Top hàng hóa có giá trị tồn kho cao nhất
          </h3>
          <Link
            to="/ton-kho"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Xem báo cáo tồn kho →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã hàng hóa
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên hàng hóa
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn vị tính
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng tồn
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá trị tồn
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.top_hang_hoa_gia_tri?.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">
                    {item.ma_hang_hoa}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {item.ten_hang_hoa}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {item.don_vi_tinh}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900 text-right">
                    {formatNumber(item.so_luong_ton)}
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-blue-600 text-right">
                    {formatCurrency(item.gia_tri_ton)}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
