// import React, { useState, useEffect } from "react";
// import {
//   Download,
//   Calendar,
//   Building2,
//   TrendingUp,
//   FileText,
//   RefreshCw,
//   Filter,
//   BarChart3,
//   Package,
//   AlertCircle,
//   ChevronDown,
//   Eye,
//   Table,
// } from "lucide-react";

// const LuanChuyenReport = ({ user }) => {
//   const [filters, setFilters] = useState({
//     tu_ngay: (() => {
//       const date = new Date();
//       date.setDate(1); // Đầu tháng hiện tại
//       return date.toISOString().split("T")[0];
//     })(),
//     den_ngay: (() => {
//       const date = new Date();
//       return date.toISOString().split("T")[0];
//     })(),
//     phong_ban_id: user?.role === "admin" ? "all" : user?.phong_ban_id,
//   });

//   const [phongBanList, setPhongBanList] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isExporting, setIsExporting] = useState(false);
//   const [reportData, setReportData] = useState(null);
//   const [showFilters, setShowFilters] = useState(false);
//   const [activeTab, setActiveTab] = useState("main");

//   useEffect(() => {
//     if (user?.role === "admin") {
//       fetchPhongBanList();
//     }
//     fetchReportData();
//   }, [user, filters]);

//   // API Functions
//   const fetchPhongBanList = async () => {
//     try {
//       const response = await fetch("/api/departments/list", {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//           "Content-Type": "application/json",
//         },
//       });

//       const result = await response.json();
//       if (result.success && Array.isArray(result.data)) {
//         setPhongBanList(result.data);
//       }
//     } catch (error) {
//       console.error("Error fetching departments:", error);
//     }
//   };

//   const fetchReportData = async () => {
//     try {
//       setIsLoading(true);

//       const params = {
//         tu_ngay: filters.tu_ngay,
//         den_ngay: filters.den_ngay,
//       };

//       if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
//         params.phong_ban_id = filters.phong_ban_id;
//       }

//       // Chỉ gọi API luân chuyển chính
//       const luanChuyenResponse = await fetch(
//         `/api/bao-cao/luan-chuyen-data?${new URLSearchParams(params)}`,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (luanChuyenResponse.ok) {
//         const luanChuyenResult = await luanChuyenResponse.json();

//         if (luanChuyenResult.success) {
//           setReportData({
//             luanChuyen: luanChuyenResult.data,
//           });
//         } else {
//           console.error(
//             "Failed to fetch luan chuyen data:",
//             luanChuyenResult.message
//           );
//           setReportData(null);
//         }
//       } else {
//         console.error("API call failed:", luanChuyenResponse.status);
//         setReportData(null);
//       }
//     } catch (error) {
//       console.error("Error fetching report data:", error);
//       setReportData(null);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleExport = async () => {
//     try {
//       setIsExporting(true);

//       // Chuyển đổi ngày thành quý và năm để xuất Excel theo format cũ
//       //const startDate = new Date(filters.tu_ngay);
//       const endDate = new Date(filters.den_ngay);

//       const quy = Math.ceil((endDate.getMonth() + 1) / 3);
//       const nam = endDate.getFullYear();

//       const params = new URLSearchParams({
//         quy: quy.toString(),
//         nam: nam.toString(),
//       });

//       if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
//         params.append("phong_ban_id", filters.phong_ban_id);
//       }

//       const response = await fetch(`/api/bao-cao/luan-chuyen-kho?${params}`, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });

//       if (response.ok) {
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `bao-cao-luan-chuyen-kho-${filters.tu_ngay}-${filters.den_ngay}.xlsx`;
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//       } else {
//         throw new Error("Export failed");
//       }
//     } catch (error) {
//       console.error("Export error:", error);
//       alert("Có lỗi xảy ra khi tạo báo cáo!");
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   // Utility Functions
//   const formatCurrency = (amount) => {
//     if (!amount && amount !== 0) return "0";
//     return new Intl.NumberFormat("vi-VN").format(amount);
//   };

//   const formatDate = (dateStr) => {
//     return new Date(dateStr).toLocaleDateString("vi-VN");
//   };

//   // Table Components
//   const TongHopTable = ({ data }) => (
//     <div className="overflow-x-auto">
//       <table className="w-full min-w-full border-collapse">
//         <thead>
//           <tr className="bg-gray-50">
//             <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
//               Nội dung
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Tồn đầu kỳ
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Trên cấp
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Tự mua
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Khác
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Cộng nhập
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Xuất sử dụng
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Cấp cho ĐV
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Thanh lý
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Xuất khác
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Cộng xuất
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Tồn cuối kỳ
//             </th>
//           </tr>
//         </thead>
//         <tbody>
//           {data.map((row, index) => (
//             <tr key={index} className="hover:bg-gray-50">
//               <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
//                 {row.noi_dung}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-gray-900">
//                 {formatCurrency(row.ton_dau_ky)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-600">
//                 {formatCurrency(row.nhap_tren_cap)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-600">
//                 {formatCurrency(row.nhap_tu_mua)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-600">
//                 {formatCurrency(row.nhap_khac)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-green-600 font-medium">
//                 {formatCurrency(row.cong_nhap)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
//                 {formatCurrency(row.xuat_su_dung)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
//                 {formatCurrency(row.xuat_cap_cho)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
//                 {formatCurrency(row.xuat_thanh_ly)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
//                 {formatCurrency(row.xuat_khac)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600 font-medium">
//                 {formatCurrency(row.cong_xuat)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-purple-600 font-medium">
//                 {formatCurrency(row.ton_cuoi_ky)}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   const TrenCapTable = ({ data }) => (
//     <div className="overflow-x-auto">
//       <table className="w-full min-w-full border-collapse">
//         <thead>
//           <tr className="bg-green-50">
//             <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
//               Nội dung
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Tồn kho đầu kỳ
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Nhập kho trong kỳ
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Xuất kho trong kỳ
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Tồn cuối kỳ
//             </th>
//           </tr>
//         </thead>
//         <tbody>
//           {data.map((row, index) => (
//             <tr key={index} className="hover:bg-green-25">
//               <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
//                 {row.noi_dung}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-gray-900">
//                 {formatCurrency(row.ton_dau_ky || 0)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-green-600 font-medium">
//                 {formatCurrency(row.nhap_tren_cap || 0)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
//                 {formatCurrency(row.xuat_trong_ky || 0)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-600 font-medium">
//                 {formatCurrency(row.ton_cuoi_ky || 0)}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   const TuMuaTable = ({ data }) => (
//     <div className="overflow-x-auto">
//       <table className="w-full min-w-full border-collapse">
//         <thead>
//           <tr className="bg-blue-50">
//             <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
//               Nội dung
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Tồn kho đầu kỳ
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Nhập kho trong kỳ
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Xuất kho trong kỳ
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Tồn cuối kỳ
//             </th>
//           </tr>
//         </thead>
//         <tbody>
//           {data.map((row, index) => (
//             <tr key={index} className="hover:bg-blue-25">
//               <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
//                 {row.noi_dung}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-gray-900">
//                 {formatCurrency(row.ton_dau_ky || 0)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-600 font-medium">
//                 {formatCurrency(row.nhap_tu_mua || 0)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
//                 {formatCurrency(row.xuat_trong_ky || 0)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-purple-600 font-medium">
//                 {formatCurrency(row.ton_cuoi_ky || 0)}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   const KhacTable = ({ data }) => (
//     <div className="overflow-x-auto">
//       <table className="w-full min-w-full border-collapse">
//         <thead>
//           <tr className="bg-purple-50">
//             <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
//               Nội dung
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Tồn kho đầu kỳ
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Nhập kho trong kỳ
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Xuất kho trong kỳ
//             </th>
//             <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
//               Tồn cuối kỳ
//             </th>
//           </tr>
//         </thead>
//         <tbody>
//           {data.map((row, index) => (
//             <tr key={index} className="hover:bg-purple-25">
//               <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
//                 {row.noi_dung}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-gray-900">
//                 {formatCurrency(row.ton_dau_ky || 0)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-purple-600 font-medium">
//                 {formatCurrency(row.nhap_khac || 0)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
//                 {formatCurrency(row.xuat_trong_ky || 0)}
//               </td>
//               <td className="border border-gray-300 px-3 py-2 text-sm text-right text-indigo-600 font-medium">
//                 {formatCurrency(row.ton_cuoi_ky || 0)}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   // Loading State
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//         <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
//       </div>
//     );
//   }

//   // Main Render
//   return (
//     <div className="space-y-4">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-gray-900 flex items-center">
//             <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
//             Báo cáo luân chuyển kho
//           </h1>
//         </div>
//         <div className="flex space-x-2">
//           <button
//             onClick={() => setShowFilters(!showFilters)}
//             className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
//           >
//             <Filter size={16} />
//             <span>Bộ lọc</span>
//             <ChevronDown
//               size={16}
//               className={`transform transition-transform ${
//                 showFilters ? "rotate-180" : ""
//               }`}
//             />
//           </button>
//           <button
//             onClick={handleExport}
//             disabled={isExporting}
//             className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isExporting ? (
//               <>
//                 <RefreshCw className="h-4 w-4 animate-spin" />
//                 <span>Đang xuất...</span>
//               </>
//             ) : (
//               <>
//                 <Download className="h-4 w-4" />
//                 <span>Xuất Excel</span>
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Filters */}
//       {showFilters && (
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Từ ngày
//               </label>
//               <input
//                 type="date"
//                 value={filters.tu_ngay}
//                 onChange={(e) =>
//                   setFilters((prev) => ({ ...prev, tu_ngay: e.target.value }))
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Đến ngày
//               </label>
//               <input
//                 type="date"
//                 value={filters.den_ngay}
//                 onChange={(e) =>
//                   setFilters((prev) => ({ ...prev, den_ngay: e.target.value }))
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
//               />
//             </div>

//             {user?.role === "admin" && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Phòng ban
//                 </label>
//                 <select
//                   value={filters.phong_ban_id}
//                   onChange={(e) =>
//                     setFilters((prev) => ({
//                       ...prev,
//                       phong_ban_id: e.target.value,
//                     }))
//                   }
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
//                 >
//                   <option value="all">Tất cả phòng ban</option>
//                   {phongBanList.map((pb) => (
//                     <option key={pb.id} value={pb.id}>
//                       {pb.ten_phong_ban}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Tabs */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//         <div className="border-b border-gray-200">
//           <nav className="flex space-x-8 px-4" aria-label="Tabs">
//             {[
//               { id: "main", name: "Tổng hợp luân chuyển kho", icon: BarChart3 },
//               { id: "tren-cap", name: "Trên cấp", icon: TrendingUp },
//               { id: "tu-mua", name: "Tự mua sắm", icon: Package },
//               { id: "khac", name: "Khác", icon: FileText },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`${
//                   activeTab === tab.id
//                     ? "border-blue-500 text-blue-600 bg-blue-50"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
//               >
//                 <tab.icon className="h-4 w-4 mr-2" />
//                 {tab.name}
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Tab Content */}
//         <div className="p-6">
//           {activeTab === "main" && (
//             <div>
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   Tổng hợp giá trị vật tư hàng hóa luân chuyển qua kho
//                 </h3>
//                 <div className="text-sm text-gray-600">
//                   Từ {formatDate(filters.tu_ngay)} đến{" "}
//                   {formatDate(filters.den_ngay)}
//                 </div>
//               </div>

//               {reportData?.luanChuyen?.tongHop ? (
//                 <TongHopTable data={reportData.luanChuyen.tongHop} />
//               ) : (
//                 <div className="text-center py-8 text-gray-500">
//                   <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
//                   <p>Chưa có dữ liệu tổng hợp</p>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === "tren-cap" && (
//             <div>
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   Tổng hợp giá trị vật tư hàng hóa TRÊN CẤP luân chuyển qua kho
//                 </h3>
//                 <div className="text-sm text-gray-600">
//                   Từ {formatDate(filters.tu_ngay)} đến{" "}
//                   {formatDate(filters.den_ngay)}
//                 </div>
//               </div>

//               {reportData?.luanChuyen?.trenCap ? (
//                 <TrenCapTable data={reportData.luanChuyen.trenCap} />
//               ) : (
//                 <div className="text-center py-8 text-gray-500">
//                   <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
//                   <p>Chưa có dữ liệu nhập từ trên cấp</p>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === "tu-mua" && (
//             <div>
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   Tổng hợp giá trị vật tư hàng hóa TỰ MUA SẮM luân chuyển qua
//                   kho
//                 </h3>
//                 <div className="text-sm text-gray-600">
//                   Từ {formatDate(filters.tu_ngay)} đến{" "}
//                   {formatDate(filters.den_ngay)}
//                 </div>
//               </div>

//               {reportData?.luanChuyen?.tuMua ? (
//                 <TuMuaTable data={reportData.luanChuyen.tuMua} />
//               ) : (
//                 <div className="text-center py-8 text-gray-500">
//                   <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
//                   <p>Chưa có dữ liệu nhập tự mua sắm</p>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === "khac" && (
//             <div>
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   Tổng hợp giá trị vật tư hàng hóa KHÁC luân chuyển qua kho
//                 </h3>
//                 <div className="text-sm text-gray-600">
//                   Từ {formatDate(filters.tu_ngay)} đến{" "}
//                   {formatDate(filters.den_ngay)}
//                 </div>
//               </div>

//               {reportData?.luanChuyen?.khac ? (
//                 <KhacTable data={reportData.luanChuyen.khac} />
//               ) : (
//                 <div className="text-center py-8 text-gray-500">
//                   <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
//                   <p>Chưa có dữ liệu nhập khác</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Export Information */}

//       {/* No Data Message */}
//       {!reportData && !isLoading && (
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
//           <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">
//             Không có dữ liệu
//           </h3>
//           <p className="text-sm text-gray-600 mb-4">
//             Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.
//           </p>
//           <button
//             onClick={fetchReportData}
//             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
//           >
//             <RefreshCw className="h-4 w-4 mr-2" />
//             Tải lại
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LuanChuyenReport;

import React, { useState, useEffect } from "react";
import {
  Download,
  Calendar,
  Building2,
  TrendingUp,
  FileText,
  RefreshCw,
  Filter,
  BarChart3,
  Package,
  AlertCircle,
  ChevronDown,
  Eye,
  Table,
} from "lucide-react";

const LuanChuyenReport = ({ user }) => {
  const [filters, setFilters] = useState({
    tu_ngay: (() => {
      const date = new Date();
      date.setDate(1); // Đầu tháng hiện tại
      return date.toISOString().split("T")[0];
    })(),
    den_ngay: (() => {
      const date = new Date();
      return date.toISOString().split("T")[0];
    })(),
    phong_ban_id: user?.role === "admin" ? "all" : user?.phong_ban_id,
  });

  const [phongBanList, setPhongBanList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState("main");

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPhongBanList();
    }
    fetchReportData();
  }, [user, filters]);

  // API Functions
  const fetchPhongBanList = async () => {
    try {
      const response = await fetch("/api/departments/list", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setPhongBanList(result.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchReportData = async () => {
    try {
      setIsLoading(true);

      const params = {
        tu_ngay: filters.tu_ngay,
        den_ngay: filters.den_ngay,
      };

      if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
        params.phong_ban_id = filters.phong_ban_id;
      }

      // Chỉ gọi API luân chuyển chính
      const luanChuyenResponse = await fetch(
        `/api/bao-cao/luan-chuyen-data?${new URLSearchParams(params)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (luanChuyenResponse.ok) {
        const luanChuyenResult = await luanChuyenResponse.json();

        if (luanChuyenResult.success) {
          setReportData({
            luanChuyen: luanChuyenResult.data,
          });
        } else {
          console.error(
            "Failed to fetch luan chuyen data:",
            luanChuyenResult.message
          );
          setReportData(null);
        }
      } else {
        console.error("API call failed:", luanChuyenResponse.status);
        setReportData(null);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleExport = async () => {
  //   try {
  //     setIsExporting(true);

  //     // Chuyển đổi ngày thành quý và năm để xuất Excel theo format cũ
  //     //const startDate = new Date(filters.tu_ngay);
  //     const endDate = new Date(filters.den_ngay);

  //     const quy = Math.ceil((endDate.getMonth() + 1) / 3);
  //     const nam = endDate.getFullYear();

  //     const params = new URLSearchParams({
  //       quy: quy.toString(),
  //       nam: nam.toString(),
  //     });

  //     if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
  //       params.append("phong_ban_id", filters.phong_ban_id);
  //     }

  //     const response = await fetch(`/api/bao-cao/luan-chuyen-kho?${params}`, {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //       },
  //     });

  //     if (response.ok) {
  //       const blob = await response.blob();
  //       const url = window.URL.createObjectURL(blob);
  //       const a = document.createElement("a");
  //       a.href = url;
  //       a.download = `bao-cao-luan-chuyen-kho-${filters.tu_ngay}-${filters.den_ngay}.xlsx`;
  //       document.body.appendChild(a);
  //       a.click();
  //       window.URL.revokeObjectURL(url);
  //       document.body.removeChild(a);
  //     } else {
  //       throw new Error("Export failed");
  //     }
  //   } catch (error) {
  //     console.error("Export error:", error);
  //     alert("Có lỗi xảy ra khi tạo báo cáo!");
  //   } finally {
  //     setIsExporting(false);
  //   }
  // };

  // Utility Functions
  const handleExport = async () => {
    try {
      setIsExporting(true);

      // SỬA: Truyền trực tiếp tu_ngay và den_ngay thay vì chuyển đổi thành quý
      const params = new URLSearchParams({
        tu_ngay: filters.tu_ngay,
        den_ngay: filters.den_ngay,
      });

      if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
        params.append("phong_ban_id", filters.phong_ban_id);
      }

      const response = await fetch(`/api/bao-cao/luan-chuyen-kho?${params}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bao-cao-luan-chuyen-kho-${filters.tu_ngay}-${filters.den_ngay}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Có lỗi xảy ra khi tạo báo cáo!");
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0";
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  // Table Components
  const TongHopTable = ({ data }) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
              Nội dung
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Tồn đầu kỳ
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Trên cấp
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Tự mua
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Khác
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Cộng nhập
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Xuất sử dụng
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Cấp cho ĐV
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Thanh lý
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Xuất khác
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Cộng xuất
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Tồn cuối kỳ
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                {row.noi_dung}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-gray-900">
                {formatCurrency(row.ton_dau_ky)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-600">
                {formatCurrency(row.nhap_tren_cap)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-600">
                {formatCurrency(row.nhap_tu_mua)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-600">
                {formatCurrency(row.nhap_khac)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-green-600 font-medium">
                {formatCurrency(row.cong_nhap)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
                {formatCurrency(row.xuat_su_dung)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
                {formatCurrency(row.xuat_cap_cho)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
                {formatCurrency(row.xuat_thanh_ly)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
                {formatCurrency(row.xuat_khac)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600 font-medium">
                {formatCurrency(row.cong_xuat)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-purple-600 font-medium">
                {formatCurrency(row.ton_cuoi_ky)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const TrenCapTable = ({ data }) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full border-collapse">
        <thead>
          <tr className="bg-green-50">
            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
              Nội dung
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Tồn kho đầu kỳ
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Nhập kho trong kỳ
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Xuất kho trong kỳ
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Tồn cuối kỳ
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-green-25">
              <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                {row.noi_dung}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-gray-900">
                {formatCurrency(row.ton_dau_ky || 0)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-green-600 font-medium">
                {formatCurrency(row.nhap_tren_cap || 0)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
                {formatCurrency(row.xuat_trong_ky || 0)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-600 font-medium">
                {formatCurrency(row.ton_cuoi_ky || 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const TuMuaTable = ({ data }) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full border-collapse">
        <thead>
          <tr className="bg-blue-50">
            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
              Nội dung
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Tồn kho đầu kỳ
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Nhập kho trong kỳ
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Xuất kho trong kỳ
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Tồn cuối kỳ
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-blue-25">
              <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                {row.noi_dung}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-gray-900">
                {formatCurrency(row.ton_dau_ky || 0)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-blue-600 font-medium">
                {formatCurrency(row.nhap_tu_mua || 0)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
                {formatCurrency(row.xuat_trong_ky || 0)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-purple-600 font-medium">
                {formatCurrency(row.ton_cuoi_ky || 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const KhacTable = ({ data }) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full border-collapse">
        <thead>
          <tr className="bg-purple-50">
            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
              Nội dung
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Tồn kho đầu kỳ
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Nhập kho trong kỳ
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Xuất kho trong kỳ
            </th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">
              Tồn cuối kỳ
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-purple-25">
              <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                {row.noi_dung}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-gray-900">
                {formatCurrency(row.ton_dau_ky || 0)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-purple-600 font-medium">
                {formatCurrency(row.nhap_khac || 0)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-red-600">
                {formatCurrency(row.xuat_trong_ky || 0)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-sm text-right text-indigo-600 font-medium">
                {formatCurrency(row.ton_cuoi_ky || 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  // Main Render
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
            Báo cáo luân chuyển kho
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Đang xuất...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Xuất Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters - Hiển thị luôn */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.tu_ngay}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, tu_ngay: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.den_ngay}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, den_ngay: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          {user?.role === "admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phòng ban
              </label>
              <select
                value={filters.phong_ban_id}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    phong_ban_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              >
                <option value="all">Tất cả phòng ban</option>
                {phongBanList.map((pb) => (
                  <option key={pb.id} value={pb.id}>
                    {pb.ten_phong_ban}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            {[
              { id: "main", name: "Tổng hợp luân chuyển kho", icon: BarChart3 },
              { id: "tren-cap", name: "Trên cấp", icon: TrendingUp },
              { id: "tu-mua", name: "Tự mua sắm", icon: Package },
              { id: "khac", name: "Khác", icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "main" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tổng hợp giá trị vật tư hàng hóa luân chuyển qua kho
                </h3>
                <div className="text-sm text-gray-600">
                  Từ {formatDate(filters.tu_ngay)} đến{" "}
                  {formatDate(filters.den_ngay)}
                </div>
              </div>

              {reportData?.luanChuyen?.tongHop ? (
                <TongHopTable data={reportData.luanChuyen.tongHop} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Chưa có dữ liệu tổng hợp</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "tren-cap" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tổng hợp giá trị vật tư hàng hóa TRÊN CẤP luân chuyển qua kho
                </h3>
                <div className="text-sm text-gray-600">
                  Từ {formatDate(filters.tu_ngay)} đến{" "}
                  {formatDate(filters.den_ngay)}
                </div>
              </div>

              {reportData?.luanChuyen?.trenCap ? (
                <TrenCapTable data={reportData.luanChuyen.trenCap} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Chưa có dữ liệu nhập từ trên cấp</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "tu-mua" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tổng hợp giá trị vật tư hàng hóa TỰ MUA SẮM luân chuyển qua
                  kho
                </h3>
                <div className="text-sm text-gray-600">
                  Từ {formatDate(filters.tu_ngay)} đến{" "}
                  {formatDate(filters.den_ngay)}
                </div>
              </div>

              {reportData?.luanChuyen?.tuMua ? (
                <TuMuaTable data={reportData.luanChuyen.tuMua} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Chưa có dữ liệu nhập tự mua sắm</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "khac" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tổng hợp giá trị vật tư hàng hóa KHÁC luân chuyển qua kho
                </h3>
                <div className="text-sm text-gray-600">
                  Từ {formatDate(filters.tu_ngay)} đến{" "}
                  {formatDate(filters.den_ngay)}
                </div>
              </div>

              {reportData?.luanChuyen?.khac ? (
                <KhacTable data={reportData.luanChuyen.khac} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Chưa có dữ liệu nhập khác</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* No Data Message */}
      {!reportData && !isLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không có dữ liệu
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.
          </p>
          <button
            onClick={fetchReportData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tải lại
          </button>
        </div>
      )}
    </div>
  );
};

export default LuanChuyenReport;
