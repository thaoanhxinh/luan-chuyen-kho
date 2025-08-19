// import React, { useState, useEffect } from "react";
// import {
//   Package,
//   Search,
//   Plus,
//   Edit,
//   Trash2,
//   Eye,
//   TrendingUp,
//   BarChart3,
//   DollarSign,
//   AlertTriangle,
//   Shield,
//   Building,
//   Info,
//   Network,
//   Users,
//   Filter,
//   RefreshCw,
// } from "lucide-react";
// import { hangHoaService } from "../services/hangHoaService";
// import { formatCurrency } from "../utils/helpers";
// import Pagination from "../components/common/Pagination";
// import Loading from "../components/common/Loading";
// import HangHoaDetailModal from "../components/details/HangHoaDetailModal";
// import EditHangHoaModal from "../components/forms/EditHangHoaModal";
// import toast from "react-hot-toast";

// const HangHoa = () => {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedLoaiHangHoa, setSelectedLoaiHangHoa] = useState("");
//   const [selectedCapBac, setSelectedCapBac] = useState("");
//   const [data, setData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [selectedHangHoaId, setSelectedHangHoaId] = useState(null);
//   const [userInfo, setUserInfo] = useState(null);
//   const [loaiHangHoaList, setLoaiHangHoaList] = useState([]);
//   const [departmentStats, setDepartmentStats] = useState([]);
//   const [showFilters, setShowFilters] = useState(false);

//   const hangHoaList = data?.data?.items || [];
//   const pagination = data?.data?.pagination || {};

//   useEffect(() => {
//     // Lấy thông tin user từ localStorage hoặc context
//     const user = JSON.parse(localStorage.getItem("user") || "{}");
//     setUserInfo(user);
//     loadLoaiHangHoa();
//     loadDepartmentStats();
//   }, []);

//   const loadLoaiHangHoa = async () => {
//     try {
//       const response = await hangHoaService.getLoaiHangHoa();
//       setLoaiHangHoaList(response.data?.data || response.data || []);
//     } catch (error) {
//       console.error("Error loading loai hang hoa:", error);
//     }
//   };

//   const loadDepartmentStats = async () => {
//     try {
//       const response = await hangHoaService.getStatsByDepartment();
//       setDepartmentStats(response.data || []);
//     } catch (error) {
//       console.error("Error loading department stats:", error);
//     }
//   };

//   const fetchData = async () => {
//     try {
//       setIsLoading(true);
//       const response = await hangHoaService.getList({
//         page: currentPage,
//         limit: 20,
//         search: searchTerm,
//         loai_hang_hoa_id: selectedLoaiHangHoa || undefined,
//         cap_bac: selectedCapBac || undefined,
//       });
//       setData(response);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       toast.error("Không thể tải dữ liệu hàng hóa");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [currentPage, searchTerm, selectedLoaiHangHoa, selectedCapBac]);

//   const handleViewDetail = (hangHoaId) => {
//     setSelectedHangHoaId(hangHoaId);
//     setShowDetailModal(true);
//   };

//   const handleEditHangHoa = (hangHoaId, canEdit) => {
//     if (!canEdit) {
//       toast.error("Bạn không có quyền chỉnh sửa hàng hóa này");
//       return;
//     }
//     setSelectedHangHoaId(hangHoaId);
//     setShowEditModal(true);
//   };

//   const handleCloseDetail = () => {
//     setShowDetailModal(false);
//     setSelectedHangHoaId(null);
//   };

//   const handleCloseEdit = () => {
//     setShowEditModal(false);
//     setSelectedHangHoaId(null);
//   };

//   const handleEditSuccess = () => {
//     fetchData();
//     loadDepartmentStats(); // Refresh stats after edit
//   };

//   const handleDeleteHangHoa = async (hangHoaId, tenHangHoa, canDelete) => {
//     if (!canDelete) {
//       toast.error("Bạn không có quyền xóa hàng hóa này");
//       return;
//     }

//     if (
//       !window.confirm(
//         `Bạn có chắc chắn muốn xóa hàng hóa "${tenHangHoa}"?\n\nLưu ý: Chỉ có thể xóa hàng hóa chưa có giao dịch và không còn tồn kho ở bất kỳ đơn vị nào.`
//       )
//     ) {
//       return;
//     }

//     try {
//       const loadingToast = toast.loading("Đang xóa hàng hóa...");

//       await hangHoaService.delete(hangHoaId);

//       toast.dismiss(loadingToast);
//       toast.success("Xóa hàng hóa thành công!");
//       fetchData();
//       loadDepartmentStats();
//     } catch (error) {
//       console.error("Error deleting hang hoa:", error);
//       const errorMessage =
//         error.response?.data?.message || "Không thể xóa hàng hóa";
//       toast.error(errorMessage);
//     }
//   };

//   const getInventoryStatusColor = (soLuongTon) => {
//     if (!soLuongTon || soLuongTon === 0) return "text-red-600";
//     if (soLuongTon < 10) return "text-yellow-600";
//     return "text-green-600";
//   };

//   const getInventoryStatusBadge = (soLuongTon) => {
//     if (!soLuongTon || soLuongTon === 0) return "bg-red-100 text-red-800";
//     if (soLuongTon < 10) return "bg-yellow-100 text-yellow-800";
//     return "bg-green-100 text-green-800";
//   };

//   const getInventoryStatusText = (soLuongTon) => {
//     if (!soLuongTon || soLuongTon === 0) return "Hết hàng";
//     if (soLuongTon < 10) return "Sắp hết";
//     return "Còn hàng";
//   };

//   const formatInteger = (value) => {
//     if (!value) return "0";
//     return Math.floor(value).toLocaleString();
//   };

//   const calculateStats = () => {
//     const total = hangHoaList.length;
//     const inStock = hangHoaList.filter((h) => h.so_luong_ton > 0).length;
//     const lowStock = hangHoaList.filter(
//       (h) => h.so_luong_ton > 0 && h.so_luong_ton < 10
//     ).length;
//     const outOfStock = hangHoaList.filter(
//       (h) => !h.so_luong_ton || h.so_luong_ton === 0
//     ).length;
//     const totalValue = hangHoaList.reduce((sum, h) => {
//       const giaTriTon = parseFloat(h.gia_tri_ton) || 0;
//       return sum + giaTriTon;
//     }, 0);

//     // Thống kê theo nguồn gốc
//     const hangHoaGoc = hangHoaList.filter(
//       (h) => h.nguon_goc === "Hàng hóa gốc"
//     ).length;
//     const hangTuCapTren = hangHoaList.filter(
//       (h) => h.nguon_goc === "Nhận từ cấp trên"
//     ).length;

//     return {
//       total,
//       inStock,
//       lowStock,
//       outOfStock,
//       totalValue,
//       hangHoaGoc,
//       hangTuCapTren,
//     };
//   };

//   const stats = calculateStats();

//   const clearFilters = () => {
//     setSearchTerm("");
//     setSelectedLoaiHangHoa("");
//     setSelectedCapBac("");
//     setCurrentPage(1);
//   };

//   // Helper function để hiển thị badge quyền
//   const PermissionBadge = ({ hangHoa }) => {
//     const badges = [];

//     if (hangHoa.can_edit) {
//       badges.push(
//         <span
//           key="edit"
//           className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1"
//         >
//           Sửa
//         </span>
//       );
//     }

//     if (hangHoa.can_delete) {
//       badges.push(
//         <span
//           key="delete"
//           className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-1"
//         >
//           Xóa
//         </span>
//       );
//     }

//     if (badges.length === 0) {
//       badges.push(
//         <span
//           key="readonly"
//           className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
//         >
//           Chỉ đọc
//         </span>
//       );
//     }

//     return <div className="flex flex-wrap mt-1">{badges}</div>;
//   };

//   // Component hiển thị nguồn gốc hàng hóa
//   const OriginBadge = ({ hangHoa }) => {
//     if (hangHoa.nguon_goc === "Hàng hóa gốc") {
//       return (
//         <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
//           <Building className="h-3 w-3 mr-1" />
//           Hàng gốc
//         </span>
//       );
//     } else if (hangHoa.nguon_goc === "Nhận từ cấp trên") {
//       return (
//         <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
//           <Network className="h-3 w-3 mr-1" />
//           Từ cấp trên
//         </span>
//       );
//     }
//     return null;
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-gray-900 flex items-center">
//             <Package className="mr-2 h-5 w-5 text-blue-600" />
//             Quản lý hàng hóa
//           </h1>
//           <p className="mt-1 text-sm text-gray-600 flex items-center">
//             <Shield className="h-4 w-4 mr-1" />
//             Quản lý thông tin hàng hóa theo phân quyền cấp bậc
//             {userInfo && (
//               <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
//                 {userInfo.role === "admin"
//                   ? "Quản trị viên"
//                   : userInfo.role === "manager"
//                   ? "Quản lý"
//                   : "Người dùng"}{" "}
//                 - Cấp {userInfo.cap_bac || "N/A"}
//               </span>
//             )}
//           </p>
//         </div>
//         <div className="flex space-x-2">
//           <button
//             onClick={() => {
//               fetchData();
//               loadDepartmentStats();
//             }}
//             className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors text-sm"
//           >
//             <RefreshCw size={16} />
//             <span>Làm mới</span>
//           </button>
//           <button
//             onClick={() => {
//               toast.info("Tính năng thêm mới hàng hóa đang được phát triển");
//             }}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors text-sm"
//           >
//             <Plus size={16} />
//             <span>Thêm hàng hóa</span>
//           </button>
//         </div>
//       </div>

//       {/* Thông báo về phân quyền và workflow 3 cấp */}
//       {userInfo?.role !== "admin" && (
//         <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
//           <div className="flex">
//             <div className="flex-shrink-0">
//               <Info className="h-5 w-5 text-blue-400" />
//             </div>
//             <div className="ml-3">
//               <p className="text-sm text-blue-700">
//                 <strong>Quy trình 3 cấp:</strong> Bạn chỉ có thể xem và quản lý
//                 hàng hóa trong phạm vi quyền hạn của mình. Hệ thống tự động lọc
//                 và hiển thị tồn kho theo cấp bậc quản lý. Hàng hóa có thể được
//                 chuyển giữa các cấp thông qua quy trình phê duyệt.
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Thống kê tổng quan */}
//       <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <Package className="h-5 w-5 text-blue-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">Tổng HH</div>
//               <div className="text-lg font-bold text-gray-900">
//                 {stats.total}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">Còn hàng</div>
//               <div className="text-lg font-bold text-green-600">
//                 {stats.inStock}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <TrendingUp className="h-5 w-5 text-yellow-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">Sắp hết</div>
//               <div className="text-lg font-bold text-yellow-600">
//                 {stats.lowStock}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">Hết hàng</div>
//               <div className="text-lg font-bold text-red-600">
//                 {stats.outOfStock}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <Building className="h-5 w-5 text-blue-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">HH Gốc</div>
//               <div className="text-lg font-bold text-blue-600">
//                 {stats.hangHoaGoc}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <Network className="h-5 w-5 text-green-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">Từ cấp trên</div>
//               <div className="text-lg font-bold text-green-600">
//                 {stats.hangTuCapTren}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center">
//             <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
//             <div>
//               <div className="text-xs text-gray-500">Giá trị tồn</div>
//               <div className="text-sm font-bold text-purple-600">
//                 {formatCurrency(stats.totalValue)}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Thống kê theo phòng ban */}
//       {departmentStats.length > 0 && (
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="text-lg font-medium text-gray-900 flex items-center">
//               <Users className="h-5 w-5 mr-2 text-purple-600" />
//               Thống kê theo đơn vị ({departmentStats.length} đơn vị)
//             </h3>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
//             {departmentStats.map((dept, index) => (
//               <div key={index} className="bg-gray-50 rounded-lg p-3 border">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <div className="font-medium text-gray-900 text-sm">
//                       {dept.ten_phong_ban}
//                     </div>
//                     <div className="text-xs text-gray-600 flex items-center">
//                       <Building className="h-3 w-3 mr-1" />
//                       Cấp {dept.cap_bac} • {dept.ma_phong_ban}
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-lg font-bold text-blue-600">
//                       {dept.so_loai_hang_hoa}
//                     </div>
//                     <div className="text-xs text-gray-500">loại HH</div>
//                   </div>
//                 </div>
//                 <div className="mt-2 flex justify-between text-xs">
//                   <span className="text-green-600">
//                     Tồn: {formatInteger(dept.tong_ton_kho || 0)}
//                   </span>
//                   <span className="text-purple-600">
//                     {formatCurrency(dept.gia_tri_ton || 0)}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Bộ lọc và tìm kiếm */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 space-y-3">
//         <div className="flex items-center justify-between">
//           <div className="relative flex-1 max-w-md">
//             <Search
//               className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//               size={16}
//             />
//             <input
//               type="text"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
//               placeholder="Tìm kiếm theo tên hoặc mã hàng hóa..."
//             />
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => setShowFilters(!showFilters)}
//               className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
//             >
//               <Filter size={16} />
//               <span>Lọc</span>
//             </button>
//             {(searchTerm || selectedLoaiHangHoa || selectedCapBac) && (
//               <button
//                 onClick={clearFilters}
//                 className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
//               >
//                 <RefreshCw size={16} />
//                 <span>Xóa lọc</span>
//               </button>
//             )}
//           </div>
//         </div>

//         {showFilters && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-200">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Loại hàng hóa
//               </label>
//               <select
//                 value={selectedLoaiHangHoa}
//                 onChange={(e) => setSelectedLoaiHangHoa(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
//               >
//                 <option value="">-- Tất cả loại --</option>
//                 {loaiHangHoaList.map((loai) => (
//                   <option key={loai.id} value={loai.id}>
//                     {loai.ten_loai}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Cấp đơn vị quản lý
//               </label>
//               <select
//                 value={selectedCapBac}
//                 onChange={(e) => setSelectedCapBac(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
//               >
//                 <option value="">-- Tất cả cấp --</option>
//                 <option value="1">Cấp 1 (BTL Vùng)</option>
//                 <option value="2">Cấp 2 (Phòng ban/Ban chuyên môn)</option>
//                 <option value="3">Cấp 3 (Đơn vị tác nghiệp)</option>
//               </select>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Bảng dữ liệu */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//         {isLoading ? (
//           <div className="flex items-center justify-center py-12">
//             <Loading size="large" />
//           </div>
//         ) : (
//           <>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50 border-b border-gray-200">
//                   <tr>
//                     <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Hàng hóa
//                     </th>
//                     <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Loại / ĐVT
//                     </th>
//                     <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Giá gần nhất
//                     </th>
//                     <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Tồn kho
//                     </th>
//                     <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Giá trị tồn
//                     </th>
//                     <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Trạng thái
//                     </th>
//                     <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Nguồn gốc
//                     </th>
//                     <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Quyền
//                     </th>
//                     <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Thao tác
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {hangHoaList.map((hangHoa) => (
//                     <tr
//                       key={hangHoa.id}
//                       className="hover:bg-gray-50 transition-colors"
//                     >
//                       <td className="px-3 py-2">
//                         <div className="text-sm text-gray-900 font-medium">
//                           {hangHoa.ten_hang_hoa}
//                         </div>
//                         <div className="text-xs text-gray-500 mt-1">
//                           Mã: {hangHoa.ma_hang_hoa}
//                         </div>
//                         <div className="text-xs text-gray-500 flex items-center">
//                           <Building className="h-3 w-3 mr-1" />
//                           {hangHoa.ten_phong_ban}
//                           {hangHoa.cap_bac && (
//                             <span className="ml-1 text-blue-600">
//                               (Cấp {hangHoa.cap_bac})
//                             </span>
//                           )}
//                         </div>
//                         {hangHoa.la_tai_san_co_dinh && (
//                           <div className="mt-1">
//                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
//                               TSCĐ
//                             </span>
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap">
//                         <div className="text-xs text-gray-900">
//                           {hangHoa.ten_loai || "Chưa phân loại"}
//                         </div>
//                         <div className="text-xs text-gray-500 mt-1">
//                           {hangHoa.don_vi_tinh}
//                         </div>
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-right">
//                         <div className="text-sm font-medium text-green-600">
//                           {hangHoa.gia_nhap_gan_nhat > 0
//                             ? formatCurrency(hangHoa.gia_nhap_gan_nhat)
//                             : "Chưa có"}
//                         </div>
//                         {hangHoa.don_gia_binh_quan > 0 &&
//                           hangHoa.don_gia_binh_quan !==
//                             hangHoa.gia_nhap_gan_nhat && (
//                             <div className="text-xs text-blue-600 mt-1">
//                               BQ: {formatCurrency(hangHoa.don_gia_binh_quan)}
//                             </div>
//                           )}
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-right">
//                         <div
//                           className={`text-sm font-medium ${getInventoryStatusColor(
//                             hangHoa.so_luong_ton
//                           )}`}
//                         >
//                           {formatInteger(hangHoa.so_luong_ton)}
//                         </div>
//                         {hangHoa.so_lan_nhap > 0 && (
//                           <div className="text-xs text-gray-500 mt-1">
//                             {hangHoa.so_lan_nhap} lần nhập
//                           </div>
//                         )}
//                         {hangHoa.so_don_vi_co_ton > 1 && (
//                           <div className="text-xs text-blue-600 mt-1">
//                             {hangHoa.so_don_vi_co_ton} đơn vị có tồn
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-right">
//                         <div className="text-sm font-medium text-gray-900">
//                           {hangHoa.gia_tri_ton && hangHoa.gia_tri_ton > 0
//                             ? formatCurrency(hangHoa.gia_tri_ton)
//                             : "0 ₫"}
//                         </div>
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-center">
//                         <span
//                           className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getInventoryStatusBadge(
//                             hangHoa.so_luong_ton
//                           )}`}
//                         >
//                           {getInventoryStatusText(hangHoa.so_luong_ton)}
//                         </span>
//                         {hangHoa.co_so_seri && (
//                           <div className="text-xs text-blue-600 mt-1">
//                             Có số seri
//                           </div>
//                         )}
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-center">
//                         <OriginBadge hangHoa={hangHoa} />
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-center">
//                         <PermissionBadge hangHoa={hangHoa} />
//                       </td>
//                       <td className="px-3 py-2 whitespace-nowrap text-center">
//                         <div className="flex items-center justify-center space-x-1">
//                           <button
//                             onClick={() => handleViewDetail(hangHoa.id)}
//                             className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
//                             title="Xem chi tiết"
//                           >
//                             <Eye size={14} />
//                           </button>

//                           <button
//                             onClick={() =>
//                               handleEditHangHoa(hangHoa.id, hangHoa.can_edit)
//                             }
//                             disabled={!hangHoa.can_edit}
//                             className={`p-1 rounded transition-all ${
//                               hangHoa.can_edit
//                                 ? "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
//                                 : "text-gray-400 cursor-not-allowed"
//                             }`}
//                             title={
//                               hangHoa.can_edit
//                                 ? "Chỉnh sửa"
//                                 : "Không có quyền chỉnh sửa"
//                             }
//                           >
//                             <Edit size={14} />
//                           </button>

//                           <button
//                             onClick={() =>
//                               handleDeleteHangHoa(
//                                 hangHoa.id,
//                                 hangHoa.ten_hang_hoa,
//                                 hangHoa.can_delete
//                               )
//                             }
//                             disabled={!hangHoa.can_delete}
//                             className={`p-1 rounded transition-all ${
//                               hangHoa.can_delete
//                                 ? "text-red-600 hover:text-red-800 hover:bg-red-50"
//                                 : "text-gray-400 cursor-not-allowed"
//                             }`}
//                             title={
//                               hangHoa.can_delete ? "Xóa" : "Không có quyền xóa"
//                             }
//                           >
//                             <Trash2 size={14} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {hangHoaList.length === 0 && (
//               <div className="text-center py-8">
//                 <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
//                 <h3 className="text-sm font-medium text-gray-900 mb-1">
//                   Không có dữ liệu
//                 </h3>
//                 <p className="text-xs text-gray-500">
//                   Chưa có hàng hóa nào được tạo hoặc không tìm thấy kết quả phù
//                   hợp trong phạm vi quyền hạn của bạn.
//                 </p>
//                 {(searchTerm || selectedLoaiHangHoa || selectedCapBac) && (
//                   <button
//                     onClick={clearFilters}
//                     className="mt-2 text-sm text-blue-600 hover:text-blue-800"
//                   >
//                     Xóa bộ lọc để xem tất cả
//                   </button>
//                 )}
//               </div>
//             )}

//             {pagination.pages > 1 && (
//               <div className="px-4 py-3 border-t border-gray-200">
//                 <Pagination
//                   currentPage={pagination.page || 1}
//                   totalPages={pagination.pages || 1}
//                   onPageChange={setCurrentPage}
//                 />
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       <HangHoaDetailModal
//         hangHoaId={selectedHangHoaId}
//         isOpen={showDetailModal}
//         onClose={handleCloseDetail}
//       />

//       <EditHangHoaModal
//         hangHoaId={selectedHangHoaId}
//         isOpen={showEditModal}
//         onClose={handleCloseEdit}
//         onSuccess={handleEditSuccess}
//       />
//     </div>
//   );
// };

// export default HangHoa;

import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  BarChart3,
  DollarSign,
  AlertTriangle,
  Shield,
  Building,
  Info,
  Network,
  Users,
  Filter,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { hangHoaService } from "../services/hangHoaService";
import { formatCurrency } from "../utils/helpers";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import HangHoaDetailModal from "../components/details/HangHoaDetailModal";
import EditHangHoaModal from "../components/forms/EditHangHoaModal";
import toast from "react-hot-toast";

const HangHoa = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoaiHangHoa, setSelectedLoaiHangHoa] = useState("");
  const [selectedPhongBan, setSelectedPhongBan] = useState(""); // Thêm filter phòng ban
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHangHoaId, setSelectedHangHoaId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loaiHangHoaList, setLoaiHangHoaList] = useState([]);
  const [phongBanList, setPhongBanList] = useState([]);

  const hangHoaList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  useEffect(() => {
    // Lấy thông tin user từ localStorage hoặc context
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserInfo(user);
    loadLoaiHangHoa();

    // Chỉ load danh sách phòng ban nếu user có quyền xem nhiều phòng ban
    if (user.role === "admin" || user.role === "manager") {
      loadPhongBanList();
    }
  }, []);

  const loadLoaiHangHoa = async () => {
    try {
      const response = await hangHoaService.getLoaiHangHoa();
      setLoaiHangHoaList(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Error loading loai hang hoa:", error);
    }
  };

  const loadPhongBanList = async () => {
    try {
      // Sử dụng API có sẵn
      const response = await hangHoaService.getPhongBanList();
      setPhongBanList(response.data || response || []);
    } catch (error) {
      console.error("Error loading phong ban list:", error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await hangHoaService.getList({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        loai_hang_hoa_id: selectedLoaiHangHoa || undefined,
        phong_ban_id: selectedPhongBan || undefined, // Thêm filter theo phòng ban
      });
      setData(response);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu hàng hóa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, selectedLoaiHangHoa, selectedPhongBan]);

  const handleViewDetail = (hangHoaId) => {
    setSelectedHangHoaId(hangHoaId);
    setShowDetailModal(true);
  };

  const handleEditHangHoa = (hangHoaId, canEdit) => {
    if (!canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa hàng hóa này");
      return;
    }
    setSelectedHangHoaId(hangHoaId);
    setShowEditModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedHangHoaId(null);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setSelectedHangHoaId(null);
  };

  const handleEditSuccess = () => {
    fetchData();
  };

  const handleDeleteHangHoa = async (hangHoaId, tenHangHoa, canDelete) => {
    if (!canDelete) {
      toast.error("Bạn không có quyền xóa hàng hóa này");
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa hàng hóa "${tenHangHoa}"?\n\nLưu ý: Chỉ có thể xóa hàng hóa chưa có giao dịch và không còn tồn kho ở bất kỳ đơn vị nào.`
      )
    ) {
      return;
    }

    try {
      const loadingToast = toast.loading("Đang xóa hàng hóa...");

      await hangHoaService.delete(hangHoaId);

      toast.dismiss(loadingToast);
      toast.success("Xóa hàng hóa thành công!");
      fetchData();
    } catch (error) {
      console.error("Error deleting hang hoa:", error);
      const errorMessage =
        error.response?.data?.message || "Không thể xóa hàng hóa";
      toast.error(errorMessage);
    }
  };

  const getInventoryStatusColor = (soLuongTon) => {
    if (!soLuongTon || soLuongTon === 0) return "text-red-600";
    if (soLuongTon < 10) return "text-yellow-600";
    return "text-green-600";
  };

  const getInventoryStatusBadge = (soLuongTon) => {
    if (!soLuongTon || soLuongTon === 0) return "bg-red-100 text-red-800";
    if (soLuongTon < 10) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getInventoryStatusText = (soLuongTon) => {
    if (!soLuongTon || soLuongTon === 0) return "Hết hàng";
    if (soLuongTon < 10) return "Sắp hết";
    return "Còn hàng";
  };

  const formatInteger = (value) => {
    if (!value) return "0";
    return Math.floor(value).toLocaleString();
  };

  const calculateStats = () => {
    const total = hangHoaList.length;
    const inStock = hangHoaList.filter((h) => h.so_luong_ton > 0).length;
    const lowStock = hangHoaList.filter(
      (h) => h.so_luong_ton > 0 && h.so_luong_ton < 10
    ).length;
    const outOfStock = hangHoaList.filter(
      (h) => !h.so_luong_ton || h.so_luong_ton === 0
    ).length;
    const totalValue = hangHoaList.reduce((sum, h) => {
      const giaTriTon = parseFloat(h.gia_tri_ton) || 0;
      return sum + giaTriTon;
    }, 0);

    // Thống kê theo nguồn gốc
    const hangHoaGoc = hangHoaList.filter(
      (h) => h.nguon_goc === "Hàng hóa gốc"
    ).length;
    const hangTuCapTren = hangHoaList.filter(
      (h) => h.nguon_goc === "Nhận từ cấp trên"
    ).length;

    return {
      total,
      inStock,
      lowStock,
      outOfStock,
      totalValue,
      hangHoaGoc,
      hangTuCapTren,
    };
  };

  const stats = calculateStats();

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLoaiHangHoa("");
    setSelectedPhongBan("");
    setCurrentPage(1);
  };

  // Helper function để hiển thị badge quyền
  const PermissionBadge = ({ hangHoa }) => {
    const badges = [];

    if (hangHoa.can_edit) {
      badges.push(
        <span
          key="edit"
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1"
        >
          Sửa
        </span>
      );
    }

    if (hangHoa.can_delete) {
      badges.push(
        <span
          key="delete"
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-1"
        >
          Xóa
        </span>
      );
    }

    if (badges.length === 0) {
      badges.push(
        <span
          key="readonly"
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
        >
          Chỉ đọc
        </span>
      );
    }

    return <div className="flex flex-wrap mt-1">{badges}</div>;
  };

  // Component hiển thị nguồn gốc hàng hóa
  const OriginBadge = ({ hangHoa }) => {
    if (hangHoa.nguon_goc === "Hàng hóa gốc") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
          <Building className="h-3 w-3 mr-1" />
          Hàng gốc
        </span>
      );
    } else if (hangHoa.nguon_goc === "Nhận từ cấp trên") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
          <Network className="h-3 w-3 mr-1" />
          Từ cấp trên
        </span>
      );
    }
    return null;
  };

  // Lấy tên phòng ban đang xem tồn kho
  const getSelectedPhongBanName = () => {
    if (!selectedPhongBan) {
      if (userInfo?.role === "admin") {
        return "BTL Vùng (Cấp 1) - Tồn kho của mình";
      } else if (userInfo?.role === "manager") {
        return `${
          userInfo?.ten_phong_ban || "Phòng ban hiện tại"
        } (Cấp 2) - Tồn kho của mình`;
      } else {
        return `${
          userInfo?.ten_phong_ban || "Đơn vị hiện tại"
        } (Cấp 3) - Tồn kho của mình`;
      }
    }
    const phongBan = availablePhongBan.find(
      (pb) => pb.id === parseInt(selectedPhongBan)
    );
    return phongBan
      ? `${phongBan.ten_phong_ban} (Cấp ${phongBan.cap_bac}) - Đang xem tồn kho`
      : "Đang tải...";
  };

  // Lọc danh sách phòng ban theo quyền
  const getAvailablePhongBan = () => {
    if (userInfo?.role === "admin") {
      // Admin xem được tất cả
      return phongBanList;
    } else if (userInfo?.role === "manager") {
      // Manager chỉ xem được cấp 3 dưới quyền
      return phongBanList.filter(
        (pb) =>
          pb.cap_bac === 3 && pb.phong_ban_cha_id === userInfo.phong_ban_id
      );
    }
    return [];
  };

  const availablePhongBan = getAvailablePhongBan();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Package className="mr-2 h-5 w-5 text-blue-600" />
            Quản lý hàng hóa
          </h1>
          <p className="mt-1 text-sm text-gray-600 flex items-center">
            <Shield className="h-4 w-4 mr-1" />
            Quản lý thông tin hàng hóa theo phân quyền cấp bậc
            {userInfo && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {userInfo.role === "admin"
                  ? "Quản trị viên"
                  : userInfo.role === "manager"
                  ? "Quản lý"
                  : "Người dùng"}{" "}
                - Cấp {userInfo.cap_bac || "N/A"}
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              fetchData();
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors text-sm"
          >
            <RefreshCw size={16} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={() => {
              toast.info("Tính năng thêm mới hàng hóa đang được phát triển");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Thêm hàng hóa</span>
          </button>
        </div>
      </div>

      {/* Selector phòng ban cho admin/manager */}
      {(userInfo?.role === "admin" || userInfo?.role === "manager") && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Đang xem tồn kho của:
                </h3>
                <div className="text-lg font-bold text-blue-900">
                  {getSelectedPhongBanName()}
                </div>
                {data?.context?.message && (
                  <div className="text-xs text-blue-600 mt-1">
                    {data.context.message}
                  </div>
                )}
              </div>
            </div>

            {availablePhongBan.length > 0 && (
              <div className="relative">
                <select
                  value={selectedPhongBan}
                  onChange={(e) => setSelectedPhongBan(e.target.value)}
                  className="appearance-none bg-white border border-blue-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[200px]"
                >
                  <option value="">
                    {userInfo?.role === "admin"
                      ? "BTL Vùng (Cấp 1) - Tồn kho của mình"
                      : `${userInfo?.ten_phong_ban} (Cấp ${userInfo?.cap_bac}) - Tồn kho của mình`}
                  </option>
                  {availablePhongBan.map((phongBan) => (
                    <option key={phongBan.id} value={phongBan.id}>
                      {phongBan.ten_phong_ban} (Cấp {phongBan.cap_bac}) - Xem
                      tồn kho
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          {selectedPhongBan && (
            <div className="mt-3 text-sm text-blue-700 bg-blue-100 rounded-lg p-2">
              <Info className="h-4 w-4 inline mr-1" />
              Đang hiển thị SỐ LƯỢNG TỒN KHO từ góc nhìn của đơn vị được chọn
            </div>
          )}
        </div>
      )}

      {/* Thông báo về phân quyền và workflow 3 cấp - chỉ hiện cho user/manager */}
      {userInfo?.role !== "admin" && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Quy trình 3 cấp:</strong> Bạn chỉ có thể xem và quản lý
                hàng hóa trong phạm vi quyền hạn của mình. Hệ thống tự động lọc
                và hiển thị tồn kho theo cấp bậc quản lý. Hàng hóa có thể được
                chuyển giữa các cấp thông qua quy trình phê duyệt.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Tổng HH</div>
              <div className="text-lg font-bold text-gray-900">
                {stats.total}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Còn hàng</div>
              <div className="text-lg font-bold text-green-600">
                {stats.inStock}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Sắp hết</div>
              <div className="text-lg font-bold text-yellow-600">
                {stats.lowStock}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Hết hàng</div>
              <div className="text-lg font-bold text-red-600">
                {stats.outOfStock}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Building className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">HH Gốc</div>
              <div className="text-lg font-bold text-blue-600">
                {stats.hangHoaGoc}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Network className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Từ cấp trên</div>
              <div className="text-lg font-bold text-green-600">
                {stats.hangTuCapTren}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <div className="text-xs text-gray-500">Giá trị tồn</div>
              <div className="text-sm font-bold text-purple-600">
                {formatCurrency(stats.totalValue)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          {/* Thanh tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              placeholder="Tìm kiếm theo tên hoặc mã hàng hóa..."
            />
          </div>

          {/* Dropdown loại hàng hóa */}
          <div className="min-w-[200px]">
            <select
              value={selectedLoaiHangHoa}
              onChange={(e) => setSelectedLoaiHangHoa(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Tất cả loại --</option>
              {loaiHangHoaList.map((loai) => (
                <option key={loai.id} value={loai.id}>
                  {loai.ten_loai}
                </option>
              ))}
            </select>
          </div>

          {/* Nút xóa lọc */}
          {(searchTerm || selectedLoaiHangHoa) && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <RefreshCw size={16} />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="large" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Hàng hóa
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Loại / ĐVT
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Giá gần nhất
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Tồn kho
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Giá trị tồn
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Nguồn gốc
                    </th>

                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {hangHoaList.map((hangHoa) => (
                    <tr
                      key={hangHoa.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <div className="text-sm text-gray-900 font-medium">
                          {hangHoa.ten_hang_hoa}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Mã: {hangHoa.ma_hang_hoa}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          {hangHoa.ten_phong_ban_goc}
                          {hangHoa.cap_bac && (
                            <span className="ml-1 text-blue-600">
                              (Cấp {hangHoa.cap_bac})
                            </span>
                          )}
                        </div>
                        {hangHoa.la_tai_san_co_dinh && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              TSCĐ
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {hangHoa.ten_loai || "Chưa phân loại"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {hangHoa.don_vi_tinh}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-green-600">
                          {hangHoa.gia_nhap_gan_nhat > 0
                            ? formatCurrency(hangHoa.gia_nhap_gan_nhat)
                            : "Chưa có"}
                        </div>
                        {hangHoa.don_gia_binh_quan > 0 &&
                          hangHoa.don_gia_binh_quan !==
                            hangHoa.gia_nhap_gan_nhat && (
                            <div className="text-xs text-blue-600 mt-1">
                              BQ: {formatCurrency(hangHoa.don_gia_binh_quan)}
                            </div>
                          )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div
                          className={`text-sm font-medium ${getInventoryStatusColor(
                            hangHoa.so_luong_ton
                          )}`}
                        >
                          {formatInteger(hangHoa.so_luong_ton)}
                        </div>
                        {hangHoa.so_lan_nhap > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {hangHoa.so_lan_nhap} lần nhập
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {hangHoa.gia_tri_ton && hangHoa.gia_tri_ton > 0
                            ? formatCurrency(hangHoa.gia_tri_ton)
                            : "0 ₫"}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getInventoryStatusBadge(
                            hangHoa.so_luong_ton
                          )}`}
                        >
                          {getInventoryStatusText(hangHoa.so_luong_ton)}
                        </span>
                        {hangHoa.co_so_seri && (
                          <div className="text-xs text-blue-600 mt-1">
                            Có số seri
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <OriginBadge hangHoa={hangHoa} />
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleViewDetail(hangHoa.id)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            onClick={() =>
                              handleEditHangHoa(hangHoa.id, hangHoa.can_edit)
                            }
                            disabled={!hangHoa.can_edit}
                            className={`p-1 rounded transition-all ${
                              hangHoa.can_edit
                                ? "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            title={
                              hangHoa.can_edit
                                ? "Chỉnh sửa"
                                : "Không có quyền chỉnh sửa"
                            }
                          >
                            <Edit size={14} />
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteHangHoa(
                                hangHoa.id,
                                hangHoa.ten_hang_hoa,
                                hangHoa.can_delete
                              )
                            }
                            disabled={!hangHoa.can_delete}
                            className={`p-1 rounded transition-all ${
                              hangHoa.can_delete
                                ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                                : "text-gray-400 cursor-not-allowed"
                            }`}
                            title={
                              hangHoa.can_delete ? "Xóa" : "Không có quyền xóa"
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hangHoaList.length === 0 && (
              <div className="text-center py-8">
                <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Không có hàng hóa
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedPhongBan || searchTerm || selectedLoaiHangHoa
                    ? "Phòng ban được chọn không có hàng hóa phù hợp với bộ lọc."
                    : `Phòng ban ${
                        getSelectedPhongBanName().split(" - ")[0]
                      } không có hàng hóa nào trong kho.`}
                </p>
                {(searchTerm || selectedLoaiHangHoa || selectedPhongBan) && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Xóa bộ lọc để xem tất cả
                  </button>
                )}
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.page || 1}
                  totalPages={pagination.pages || 1}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <HangHoaDetailModal
        hangHoaId={selectedHangHoaId}
        isOpen={showDetailModal}
        onClose={handleCloseDetail}
      />

      <EditHangHoaModal
        hangHoaId={selectedHangHoaId}
        isOpen={showEditModal}
        onClose={handleCloseEdit}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default HangHoa;
