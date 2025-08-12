// import React, { useState, useEffect } from "react";
// import {
//   Download,
//   Calendar,
//   Building2,
//   Package,
//   TrendingUp,
//   RefreshCw,
//   Filter,
//   Eye,
//   Search,
// } from "lucide-react";

// const BaoCaoNhapReport = ({ user }) => {
//   const [filters, setFilters] = useState({
//     tu_ngay: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
//       .toISOString()
//       .split("T")[0],
//     den_ngay: new Date().toISOString().split("T")[0],
//     timeFrame: "month",
//     phong_ban_id: user?.role === "admin" ? "all" : user?.phong_ban_id,
//   });

//   const [data, setData] = useState({ items: [] });
//   const [phongBanList, setPhongBanList] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isExporting, setIsExporting] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);

//   useEffect(() => {
//     if (user?.role === "admin") {
//       fetchPhongBanList();
//     }
//   }, [user]);

//   useEffect(() => {
//     fetchNhapData();
//   }, [filters]);

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

//   const fetchNhapData = async () => {
//     try {
//       setIsLoading(true);
//       const params = new URLSearchParams({
//         tu_ngay: filters.tu_ngay,
//         den_ngay: filters.den_ngay,
//         page: 1,
//         limit: 1000,
//       });

//       if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
//         params.append("phong_ban_id", filters.phong_ban_id);
//       }

//       const response = await fetch(`/api/nhap-kho?${params}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//           "Content-Type": "application/json",
//         },
//       });

//       const result = await response.json();
//       if (result.success) {
//         // Chỉ lấy các phiếu đã hoàn thành
//         const completedItems = result.data.items.filter(
//           (item) => item.trang_thai === "completed"
//         );
//         setData({ ...result.data, items: completedItems });
//       } else {
//         setData({ items: [] });
//       }
//     } catch (error) {
//       console.error("Error fetching nhap data:", error);
//       setData({ items: [] });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleExport = async () => {
//     try {
//       setIsExporting(true);

//       const params = new URLSearchParams({
//         tu_ngay: filters.tu_ngay,
//         den_ngay: filters.den_ngay,
//         timeFrame: filters.timeFrame,
//       });

//       if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
//         params.append("phong_ban_id", filters.phong_ban_id);
//       }

//       const response = await fetch(
//         `/api/bao-cao/export/nhap-xuat-nhap?${params}`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );

//       if (response.ok) {
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `bao-cao-nhap-${filters.timeFrame}-${Date.now()}.xlsx`;
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

//   const formatCurrency = (amount) => {
//     if (!amount || amount === 0) return "0 ₫";
//     return new Intl.NumberFormat("vi-VN", {
//       style: "currency",
//       currency: "VND",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   const formatNumber = (num) => {
//     return new Intl.NumberFormat("vi-VN").format(num);
//   };

//   const formatDate = (dateStr) => {
//     return new Date(dateStr).toLocaleDateString("vi-VN");
//   };

//   const calculateStats = () => {
//     const items = data.items || [];
//     const totalValue = items.reduce(
//       (sum, item) => sum + (parseFloat(item.tong_tien) || 0),
//       0
//     );
//     const totalItems = items.length;
//     const avgValue = totalItems > 0 ? totalValue / totalItems : 0;

//     return { totalValue, totalItems, avgValue };
//   };

//   const stats = calculateStats();

//   // Quick date selections
//   const handleQuickDate = (type) => {
//     const today = new Date();
//     let startDate,
//       endDate = today;

//     switch (type) {
//       case "thisMonth":
//         startDate = new Date(today.getFullYear(), today.getMonth(), 1);
//         setFilters((prev) => ({ ...prev, timeFrame: "month" }));
//         break;
//       case "lastMonth":
//         startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//         endDate = new Date(today.getFullYear(), today.getMonth(), 0);
//         setFilters((prev) => ({ ...prev, timeFrame: "month" }));
//         break;
//       case "thisQuarter":
//         const quarter = Math.floor(today.getMonth() / 3);
//         startDate = new Date(today.getFullYear(), quarter * 3, 1);
//         setFilters((prev) => ({ ...prev, timeFrame: "quarter" }));
//         break;
//       case "thisYear":
//         startDate = new Date(today.getFullYear(), 0, 1);
//         setFilters((prev) => ({ ...prev, timeFrame: "year" }));
//         break;
//       default:
//         return;
//     }

//     setFilters((prev) => ({
//       ...prev,
//       tu_ngay: startDate.toISOString().split("T")[0],
//       den_ngay: endDate.toISOString().split("T")[0],
//     }));
//   };

//   // Pagination
//   const itemsPerPage = 10;
//   const totalPages = Math.ceil(data.items.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const paginatedItems = data.items.slice(
//     startIndex,
//     startIndex + itemsPerPage
//   );

//   return (
//     <div className="space-y-6">
//       {/* Header Card */}
//       <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg text-white">
//         <div className="p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-2xl font-bold mb-2">Báo cáo phiếu nhập</h2>
//               <p className="text-green-100 mb-4">
//                 Danh sách và thống kê các phiếu nhập theo thời gian
//               </p>
//               <div className="flex items-center space-x-4 text-sm">
//                 <div className="flex items-center">
//                   <Calendar className="h-4 w-4 mr-2" />
//                   {formatDate(filters.tu_ngay)} - {formatDate(filters.den_ngay)}
//                 </div>
//                 <div className="flex items-center">
//                   <Package className="h-4 w-4 mr-2" />
//                   {stats.totalItems} phiếu nhập
//                 </div>
//               </div>
//             </div>
//             <div className="text-right">
//               <div className="text-3xl font-bold">
//                 {formatCurrency(stats.totalValue)}
//               </div>
//               <div className="text-sm text-green-100">Tổng giá trị nhập</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Filter Section */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-900">
//             Bộ lọc và tùy chọn
//           </h3>
//           <button
//             onClick={handleExport}
//             disabled={isExporting}
//             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             {isExporting ? (
//               <>
//                 <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
//                 Đang xuất...
//               </>
//             ) : (
//               <>
//                 <Download className="h-4 w-4 mr-2" />
//                 Xuất Excel
//               </>
//             )}
//           </button>
//         </div>

//         {/* Quick Date Filters */}
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Chọn nhanh thời gian
//           </label>
//           <div className="flex flex-wrap gap-2">
//             {[
//               { key: "thisMonth", label: "Tháng này" },
//               { key: "lastMonth", label: "Tháng trước" },
//               { key: "thisQuarter", label: "Quý này" },
//               { key: "thisYear", label: "Năm này" },
//             ].map((option) => (
//               <button
//                 key={option.key}
//                 onClick={() => handleQuickDate(option.key)}
//                 className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
//               >
//                 {option.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Main Filters */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Từ ngày
//             </label>
//             <input
//               type="date"
//               value={filters.tu_ngay}
//               onChange={(e) =>
//                 setFilters((prev) => ({ ...prev, tu_ngay: e.target.value }))
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Đến ngày
//             </label>
//             <input
//               type="date"
//               value={filters.den_ngay}
//               onChange={(e) =>
//                 setFilters((prev) => ({ ...prev, den_ngay: e.target.value }))
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Loại báo cáo
//             </label>
//             <select
//               value={filters.timeFrame}
//               onChange={(e) =>
//                 setFilters((prev) => ({ ...prev, timeFrame: e.target.value }))
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//             >
//               <option value="month">Theo tháng</option>
//               <option value="quarter">Theo quý</option>
//               <option value="year">Theo năm</option>
//             </select>
//           </div>

//           {user?.role === "admin" && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Phòng ban
//               </label>
//               <select
//                 value={filters.phong_ban_id}
//                 onChange={(e) =>
//                   setFilters((prev) => ({
//                     ...prev,
//                     phong_ban_id: e.target.value,
//                   }))
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//               >
//                 <option value="all">Tất cả phòng ban</option>
//                 {phongBanList.map((pb) => (
//                   <option key={pb.id} value={pb.id}>
//                     {pb.ten_phong_ban}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Statistics Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//           <div className="flex items-center">
//             <Package className="h-8 w-8 text-blue-600 mr-3" />
//             <div>
//               <div className="text-2xl font-bold text-gray-900">
//                 {formatNumber(stats.totalItems)}
//               </div>
//               <div className="text-sm text-gray-600">Tổng phiếu nhập</div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//           <div className="flex items-center">
//             <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
//             <div>
//               <div className="text-xl font-bold text-green-600">
//                 {formatCurrency(stats.totalValue)}
//               </div>
//               <div className="text-sm text-gray-600">Tổng giá trị</div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//           <div className="flex items-center">
//             <Calendar className="h-8 w-8 text-purple-600 mr-3" />
//             <div>
//               <div className="text-lg font-bold text-purple-600">
//                 {formatCurrency(stats.avgValue)}
//               </div>
//               <div className="text-sm text-gray-600">Giá trị TB/phiếu</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Data Table */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//         <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
//           <h3 className="text-lg font-semibold text-gray-900">
//             Danh sách phiếu nhập ({formatNumber(data.items.length)} phiếu)
//           </h3>
//           {isLoading && (
//             <div className="flex items-center text-blue-600">
//               <RefreshCw className="h-4 w-4 animate-spin mr-2" />
//               <span className="text-sm">Đang tải...</span>
//             </div>
//           )}
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50 border-b border-gray-200">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
//                   Số phiếu
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
//                   Ngày nhập
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
//                   Nhà cung cấp
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
//                   Lý do nhập
//                 </th>
//                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
//                   Tổng tiền
//                 </th>
//                 <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
//                   Trạng thái
//                 </th>
//                 <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
//                   Thao tác
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {paginatedItems.map((item, index) => (
//                 <tr
//                   key={item.id}
//                   className="hover:bg-gray-50 transition-colors"
//                 >
//                   <td className="px-6 py-4">
//                     <div className="text-sm font-medium text-gray-900">
//                       {item.so_phieu}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="text-sm text-gray-900">
//                       {formatDate(item.ngay_nhap)}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="text-sm text-gray-900 max-w-xs truncate">
//                       {item.nha_cung_cap?.ten_ncc || "Chưa xác định"}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4">
//                     <div className="text-sm text-gray-900 max-w-xs truncate">
//                       {item.ly_do_nhap || "Nhập kho"}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 text-right">
//                     <div className="text-sm font-medium text-green-600">
//                       {formatCurrency(item.tong_tien)}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 text-center">
//                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                       Hoàn thành
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 text-center">
//                     <button
//                       className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
//                       title="Xem chi tiết"
//                     >
//                       <Eye size={16} />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {paginatedItems.length === 0 && !isLoading && (
//           <div className="text-center py-8">
//             <Package className="mx-auto h-10 w-10 text-gray-400 mb-3" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               Không có dữ liệu
//             </h3>
//             <p className="text-sm text-gray-600">
//               Không tìm thấy phiếu nhập nào trong khoảng thời gian này
//             </p>
//           </div>
//         )}

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
//             <div className="text-sm text-gray-700">
//               Hiển thị {startIndex + 1} đến{" "}
//               {Math.min(startIndex + itemsPerPage, data.items.length)} trong
//               tổng số {data.items.length} kết quả
//             </div>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//                 disabled={currentPage === 1}
//                 className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Trước
//               </button>

//               <span className="px-3 py-2 text-sm text-gray-700">
//                 Trang {currentPage} / {totalPages}
//               </span>

//               <button
//                 onClick={() =>
//                   setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//                 }
//                 disabled={currentPage === totalPages}
//                 className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Sau
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default BaoCaoNhapReport;

import React, { useState, useEffect } from "react";
import {
  Download,
  Calendar,
  Building2,
  Package,
  TrendingUp,
  RefreshCw,
  Filter,
  Eye,
  FileText,
  Users,
  ArrowDownToLine,
} from "lucide-react";

const BaoCaoNhapReport = ({ user }) => {
  const [activeTab, setActiveTab] = useState("tu_mua");
  const [filters, setFilters] = useState({
    tu_ngay: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    den_ngay: new Date().toISOString().split("T")[0],
    timeFrame: "month",
    phong_ban_id: user?.role === "admin" ? "all" : user?.phong_ban_id,
  });

  const [data, setData] = useState({
    tu_mua: { items: [], total: 0 },
    tren_cap: { items: [], total: 0 },
  });
  const [phongBanList, setPhongBanList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatures, setSignatures] = useState({
    nguoi_lap: "",
    truong_ban_tmkh: "",
    chu_nhiem_hckt: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPhongBanList();
    }
  }, [user]);

  useEffect(() => {
    fetchNhapData();
  }, [filters]);

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

  const fetchNhapData = async () => {
    try {
      setIsLoading(true);

      // Fetch data for both types using real API
      const [tuMuaResponse, trenCapResponse] = await Promise.all([
        fetchDataByType("tu_mua"),
        fetchDataByType("tren_cap"),
      ]);

      setData({
        tu_mua: tuMuaResponse,
        tren_cap: trenCapResponse,
      });
    } catch (error) {
      console.error("Error fetching nhap data:", error);
      setData({
        tu_mua: { items: [], total: 0 },
        tren_cap: { items: [], total: 0 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDataByType = async (loaiPhieu) => {
    const params = new URLSearchParams({
      tu_ngay: filters.tu_ngay,
      den_ngay: filters.den_ngay,
      page: 1,
      limit: 1000,
      loai_phieu: loaiPhieu,
    });

    if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
      params.append("phong_ban_id", filters.phong_ban_id);
    }

    const response = await fetch(`/api/bao-cao/nhap-by-type?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    if (result.success) {
      const items = result.data.items || [];
      const total = items.reduce(
        (sum, item) => sum + (parseFloat(item.tong_tien) || 0),
        0
      );
      return { items, total };
    }
    return { items: [], total: 0 };
  };

  const handleExport = () => {
    setShowSignatureModal(true);
  };

  const handleExportConfirm = async () => {
    try {
      setIsExporting(true);

      const params = new URLSearchParams({
        tu_ngay: filters.tu_ngay,
        den_ngay: filters.den_ngay,
        timeFrame: filters.timeFrame,
      });

      if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
        params.append("phong_ban_id", filters.phong_ban_id);
      }

      // Add signature data
      Object.entries(signatures).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(
        `/api/bao-cao/export/nhap-with-tabs?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bao-cao-nhap-${filters.timeFrame}-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setShowSignatureModal(false);

        // Reset signature form
        setSignatures({
          nguoi_lap: "",
          truong_ban_tmkh: "",
          chu_nhiem_hckt: "",
        });
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
    if (!amount || amount === 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  // const handleQuickDate = (type) => {
  //   const today = new Date();
  //   let startDate,
  //     endDate = today;

  //   switch (type) {
  //     case "thisMonth":
  //       startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  //       setFilters((prev) => ({ ...prev, timeFrame: "month" }));
  //       break;
  //     case "lastMonth":
  //       startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  //       endDate = new Date(today.getFullYear(), today.getMonth(), 0);
  //       setFilters((prev) => ({ ...prev, timeFrame: "month" }));
  //       break;
  //     case "thisQuarter": {
  //       const quarter = Math.floor(today.getMonth() / 3);
  //       startDate = new Date(today.getFullYear(), quarter * 3, 1);
  //       setFilters((prev) => ({ ...prev, timeFrame: "quarter" }));
  //       break;
  //     }
  //     case "thisYear":
  //       startDate = new Date(today.getFullYear(), 0, 1);
  //       setFilters((prev) => ({ ...prev, timeFrame: "year" }));
  //       break;
  //     default:
  //       return;
  //   }

  //   setFilters((prev) => ({
  //     ...prev,
  //     tu_ngay: startDate.toISOString().split("T")[0],
  //     den_ngay: endDate.toISOString().split("T")[0],
  //   }));
  // };

  const getCurrentData = () => data[activeTab] || { items: [], total: 0 };
  const currentData = getCurrentData();

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(currentData.items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = currentData.items.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getTotalStats = () => {
    const tuMuaTotal = data.tu_mua?.total || 0;
    const trenCapTotal = data.tren_cap?.total || 0;
    return {
      totalValue: tuMuaTotal + trenCapTotal,
      totalItems:
        (data.tu_mua?.items?.length || 0) + (data.tren_cap?.items?.length || 0),
    };
  };

  const totalStats = getTotalStats();

  // Reset pagination when changing tab
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  return (
    <div className="space-y-4">
      {/* Header Card - Simplified */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center">
          <ArrowDownToLine className="mr-2 h-5 w-5 text-green-600" />
          Báo cáo phiếu nhập
        </h1>

        <div className="text-right">
          <div className="text-xl font-bold">
            {formatCurrency(totalStats.totalValue)}
          </div>
          <div className="text-sm text-black-100">Tổng giá trị nhập</div>
        </div>
      </div>

      {/* Filter Section - Simplified */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Main Filters - Reduced columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.tu_ngay}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, tu_ngay: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.den_ngay}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, den_ngay: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xuất báo cáo
            </label>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Xuất Excel
                </>
              )}
            </button>
          </div>

          {user?.role === "admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

      {/* Tab Navigation & Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("tu_mua")}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === "tu_mua"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Tự mua sắm ({data.tu_mua?.items?.length || 0})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("tren_cap")}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === "tren_cap"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Trên cấp ({data.tren_cap?.items?.length || 0})
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === "tu_mua" ? "Hàng tự mua sắm" : "Hàng trên cấp"}(
              {formatNumber(currentData.items.length)} phiếu)
            </h3>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(currentData.total)}
                </div>
                <div className="text-sm text-gray-600">Tổng giá trị</div>
              </div>
              {isLoading && (
                <div className="flex items-center text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Đang tải...</span>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-16">
                    STT
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Số quyết định
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Ngày, tháng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Nội dung
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Số tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {startIndex + index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {item.so_quyet_dinh || item.so_phieu}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-900">
                        {formatDate(item.ngay_nhap)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.ly_do_nhap || "Nhập kho"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(item.tong_tien)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center font-bold text-gray-900"
                  >
                    Cộng
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    {formatCurrency(currentData.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {paginatedItems.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Package className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không có dữ liệu
              </h3>
              <p className="text-sm text-gray-600">
                Không tìm thấy phiếu nhập{" "}
                {activeTab === "tu_mua" ? "tự mua sắm" : "trên cấp"} nào trong
                khoảng thời gian này
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} đến{" "}
                {Math.min(startIndex + itemsPerPage, currentData.items.length)}{" "}
                trong tổng số {currentData.items.length} kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>

                <span className="px-3 py-2 text-sm text-gray-700">
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Thông tin người ký
              </h3>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Người lập
                </label>
                <input
                  type="text"
                  value={signatures.nguoi_lap}
                  onChange={(e) =>
                    setSignatures((prev) => ({
                      ...prev,
                      nguoi_lap: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên người lập"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trưởng ban TMKH
                </label>
                <input
                  type="text"
                  value={signatures.truong_ban_tmkh}
                  onChange={(e) =>
                    setSignatures((prev) => ({
                      ...prev,
                      truong_ban_tmkh: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên trưởng ban"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chủ nhiệm HC-KT
                </label>
                <input
                  type="text"
                  value={signatures.chu_nhiem_hckt}
                  onChange={(e) =>
                    setSignatures((prev) => ({
                      ...prev,
                      chu_nhiem_hckt: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên chủ nhiệm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleExportConfirm}
                disabled={isExporting}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isExporting ? "Đang xuất..." : "Xuất Excel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaoCaoNhapReport;
