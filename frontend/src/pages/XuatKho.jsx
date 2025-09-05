// import React, { useState, useEffect, useRef } from "react";
// import {
//   Plus,
//   Eye,
//   FileText,
//   Check,
//   X,
//   Search,
//   ArrowUpFromLine,
//   Upload,
//   CheckCircle,
//   Download,
//   FileDown,
//   Edit,
//   MoreVertical,
//   Send,
//   AlertTriangle,
//   RefreshCw,
//   Building,
//   Link2,
//   Info,
//   Filter,
//   ChevronDown,
// } from "lucide-react";
// import { xuatKhoService } from "../services/xuatKhoService";
// import { formatCurrency, formatDate } from "../utils/helpers";
// import {
//   TRANG_THAI_PHIEU,
//   LOAI_PHIEU_XUAT,
//   getActionPermissions,
//   TAB_CONFIG,
// } from "../utils/constants";
// import Modal from "../components/common/Modal";
// import Pagination from "../components/common/Pagination";
// import CreateXuatKhoForm from "../components/forms/CreateXuatKhoForm";
// import EditXuatKhoForm from "../components/forms/EditXuatKhoForm";
// import Loading from "../components/common/Loading";
// import PhieuXuatDetail from "../components/details/PhieuXuatDetail";
// import PrintPhieuXuatForm from "../components/forms/PrintPhieuXuatForm";
// import toast from "react-hot-toast";
// import { useAuth } from "../context/AuthContext";

// // Component for revision request modal
// const RevisionRequestModal = ({ isOpen, onClose, onSubmit, phieu }) => {
//   const [ghiChu, setGhiChu] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!ghiChu.trim()) {
//       toast.error("Vui lòng nhập lý do yêu cầu chỉnh sửa");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       await onSubmit(ghiChu);
//       setGhiChu("");
//       onClose();
//     } catch (error) {
//       console.error("Error submitting revision request:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Yêu cầu chỉnh sửa phiếu"
//       size="md"
//     >
//       <form onSubmit={handleSubmit} className="p-6 space-y-4">
//         <div>
//           <p className="text-sm text-gray-600 mb-3">
//             Phiếu xuất: <span className="font-medium">{phieu?.so_phieu}</span>
//           </p>

//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Lý do yêu cầu chỉnh sửa <span className="text-red-500">*</span>
//           </label>
//           <textarea
//             value={ghiChu}
//             onChange={(e) => setGhiChu(e.target.value)}
//             rows={4}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
//             placeholder="Nhập lý do cần chỉnh sửa phiếu xuất..."
//             required
//           />
//         </div>

//         <div className="flex justify-end space-x-3 pt-4 border-t">
//           <button
//             type="button"
//             onClick={onClose}
//             className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
//           >
//             Hủy
//           </button>
//           <button
//             type="submit"
//             disabled={isSubmitting || !ghiChu.trim()}
//             className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
//           </button>
//         </div>
//       </form>
//     </Modal>
//   );
// };

// // Component Dropdown Actions
// const ActionDropdown = ({ phieu, onAction, userRole }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef(null);
//   const { user } = useAuth();

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const permissions = getActionPermissions(
//     phieu.trang_thai,
//     userRole,
//     user?.phong_ban?.cap_bac,
//     phieu,
//     user
//   );

//   const actions = [
//     {
//       key: "view",
//       label: "Xem chi tiết",
//       icon: Eye,
//       color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
//       show: permissions.canView,
//     },
//     {
//       key: "edit",
//       label: "Sửa phiếu",
//       icon: Edit,
//       color: "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50",
//       show: permissions.canEdit,
//     },
//     {
//       key: "edit-actual",
//       label: "Sửa số lượng thực tế",
//       icon: Edit,
//       color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
//       show: permissions.canEditActual,
//     },
//     {
//       key: "submit",
//       label: "Gửi duyệt",
//       icon: Send,
//       color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
//       show: permissions.canSubmit,
//     },
//     {
//       key: "approve",
//       label: "Duyệt phiếu",
//       icon: Check,
//       color: "text-green-600 hover:text-green-800 hover:bg-green-50",
//       show: permissions.canApprove,
//     },
//     {
//       key: "complete",
//       label: "Hoàn thành",
//       icon: CheckCircle,
//       color: "text-green-600 hover:text-green-800 hover:bg-green-50",
//       show: permissions.canComplete,
//     },
//     {
//       key: "revision",
//       label: "Yêu cầu sửa",
//       icon: AlertTriangle,
//       color: "text-orange-600 hover:text-orange-800 hover:bg-orange-50",
//       show: permissions.canRequestRevision,
//     },
//     {
//       key: "cancel",
//       label: "Hủy phiếu",
//       icon: X,
//       color: "text-red-600 hover:text-red-800 hover:bg-red-50",
//       show: permissions.canCancel,
//     },
//     {
//       key: "print",
//       label: "In phiếu",
//       icon: FileText,
//       color: "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
//       show: permissions.canPrint,
//     },
//   ];

//   const visibleActions = actions.filter((action) => action.show);

//   if (visibleActions.length === 0) {
//     return null;
//   }

//   return (
//     <div className="relative" ref={dropdownRef}>
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
//       >
//         <MoreVertical size={16} />
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 z-50 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
//           <div className="py-1">
//             {visibleActions.map((action) => {
//               const IconComponent = action.icon;
//               return (
//                 <button
//                   key={action.key}
//                   onClick={() => {
//                     onAction(action.key, phieu);
//                     setIsOpen(false);
//                   }}
//                   className={`group flex items-center w-full px-4 py-2 text-sm transition-colors ${action.color}`}
//                 >
//                   <IconComponent size={16} className="mr-3" />
//                   {action.label}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const XuatKho = () => {
//   const [phieuList, setPhieuList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [showPrintModal, setShowPrintModal] = useState(false);
//   const [showRevisionModal, setShowRevisionModal] = useState(false);
//   const [showEditActualModal, setShowEditActualModal] = useState(false);
//   const [selectedPhieu, setSelectedPhieu] = useState(null);
//   const [editPhieuId, setEditPhieuId] = useState(null);
//   const [printPhieuId, setPrintPhieuId] = useState(null);
//   const [editActualPhieuId, setEditActualPhieuId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pagination, setPagination] = useState({});
//   const [activeTab, setActiveTab] = useState("tat_ca");
//   const [filters, setFilters] = useState({
//     search: "",
//     phong_ban_filter: "own",
//     tu_ngay: "",
//     den_ngay: "",
//   });

//   const { user } = useAuth();
//   const userRole = user?.role || "user";
//   const userCapBac = user?.phong_ban?.cap_bac;
//   const isLevel3User = userRole === "user" && userCapBac === 3;
//   const shouldShowDropdown = userRole === "admin" || userRole === "manager";

//   useEffect(() => {
//     fetchPhieuList();
//   }, [currentPage, activeTab, filters]);

//   const fetchPhieuList = async () => {
//     try {
//       setLoading(true);

//       const params = {
//         page: currentPage,
//         limit: 20,
//         ...(activeTab !== "tat_ca" && {
//           trang_thai: TAB_CONFIG.XUAT_KHO.find((tab) => tab.key === activeTab)
//             ?.status?.[0],
//         }),
//         ...filters,
//       };

//       const response = await xuatKhoService.getList(params);

//       if (response.success) {
//         setPhieuList(response.data.items || []);
//         setPagination(response.data.pagination || {});
//       } else {
//         toast.error(response.message || "Lỗi khi tải danh sách");
//         setPhieuList([]);
//       }
//     } catch (error) {
//       console.error("Error fetching phieu list:", error);
//       toast.error("Lỗi khi tải danh sách phiếu xuất");
//       setPhieuList([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAction = async (action, phieu) => {
//     setSelectedPhieu(phieu);

//     switch (action) {
//       case "view":
//         setShowDetailModal(true);
//         break;
//       case "edit":
//         setEditPhieuId(phieu.id);
//         setShowEditModal(true);
//         break;
//       case "edit-actual":
//         setEditActualPhieuId(phieu.id);
//         setShowEditActualModal(true);
//         break;
//       case "submit":
//         await handleSubmit(phieu.id);
//         break;
//       case "approve":
//         await handleApprove(phieu.id);
//         break;
//       case "complete":
//         await handleComplete(phieu.id);
//         break;
//       case "revision":
//         setShowRevisionModal(true);
//         break;
//       case "cancel":
//         await handleCancel(phieu.id);
//         break;
//       case "print":
//         setPrintPhieuId(phieu.id);
//         setShowPrintModal(true);
//         break;
//     }
//   };

//   const handleSubmit = async (phieuId) => {
//     try {
//       const response = await xuatKhoService.submit(phieuId);
//       if (response.success) {
//         toast.success("Đã gửi phiếu để duyệt");
//         fetchPhieuList();
//       } else {
//         toast.error(response.message || "Lỗi khi gửi phiếu");
//       }
//     } catch (error) {
//       toast.error("Lỗi khi gửi phiếu: " + error.message);
//     }
//   };

//   const handleApprove = async (phieuId) => {
//     try {
//       const response = await xuatKhoService.approve(phieuId);
//       if (response.success) {
//         toast.success("Đã duyệt phiếu xuất");
//         fetchPhieuList();
//       } else {
//         toast.error(response.message || "Lỗi khi duyệt phiếu");
//       }
//     } catch (error) {
//       toast.error("Lỗi khi duyệt phiếu: " + error.message);
//     }
//   };

//   const handleComplete = async (phieuId) => {
//     try {
//       const response = await xuatKhoService.complete(phieuId);
//       if (response.success) {
//         toast.success("Đã hoàn thành phiếu xuất");
//         fetchPhieuList();
//       } else {
//         toast.error(response.message || "Lỗi khi hoàn thành phiếu");
//       }
//     } catch (error) {
//       toast.error("Lỗi khi hoàn thành phiếu: " + error.message);
//     }
//   };

//   const handleCancel = async (phieuId) => {
//     if (!window.confirm("Bạn có chắc chắn muốn hủy phiếu này?")) {
//       return;
//     }

//     try {
//       const response = await xuatKhoService.cancel(phieuId);
//       if (response.success) {
//         toast.success("Đã hủy phiếu xuất");
//         fetchPhieuList();
//       } else {
//         toast.error(response.message || "Lỗi khi hủy phiếu");
//       }
//     } catch (error) {
//       toast.error("Lỗi khi hủy phiếu: " + error.message);
//     }
//   };

//   const handleRevisionSubmit = async (ghiChu) => {
//     try {
//       const response = await xuatKhoService.requestRevision(selectedPhieu.id, {
//         ghi_chu_phan_hoi: ghiChu,
//       });

//       if (response.success) {
//         toast.success("Đã gửi yêu cầu chỉnh sửa");
//         fetchPhieuList();
//       } else {
//         toast.error(response.message || "Lỗi khi gửi yêu cầu");
//       }
//     } catch (error) {
//       toast.error("Lỗi khi gửi yêu cầu: " + error.message);
//     }
//   };

//   const handleFormSuccess = () => {
//     setShowCreateModal(false);
//     setShowEditModal(false);
//     setShowEditActualModal(false);
//     setEditPhieuId(null);
//     setEditActualPhieuId(null);
//     fetchPhieuList();
//   };

//   const handleFormCancel = () => {
//     setShowCreateModal(false);
//     setShowEditModal(false);
//     setShowEditActualModal(false);
//     setEditPhieuId(null);
//     setEditActualPhieuId(null);
//   };

//   const renderTrangThai = (trangThai) => {
//     const config = TRANG_THAI_PHIEU[trangThai];
//     if (!config) return <span className="text-gray-500">Không xác định</span>;

//     return (
//       <span
//         className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
//       >
//         {config.label}
//       </span>
//     );
//   };

//   const renderDonViNhan = (phieu) => {
//     if (phieu.loai_xuat === "don_vi_su_dung") {
//       return (
//         <div>
//           <div className="font-medium">Sử dụng nội bộ</div>
//           <div className="text-xs text-gray-500">Không xuất ra ngoài</div>
//         </div>
//       );
//     } else if (phieu.loai_xuat === "don_vi_nhan") {
//       if (phieu.ten_phong_ban_nhan) {
//         return (
//           <div>
//             <div className="font-medium">{phieu.ten_phong_ban_nhan}</div>
//             <div className="text-xs text-gray-500">Phòng ban nội bộ</div>
//           </div>
//         );
//       } else if (phieu.ten_don_vi) {
//         return (
//           <div>
//             <div className="font-medium">{phieu.ten_don_vi}</div>
//             <div className="text-xs text-gray-500">Đơn vị bên ngoài</div>
//           </div>
//         );
//       }
//     }
//     return <span className="text-gray-500">Chưa xác định</span>;
//   };

//   const renderPhieuLienKet = (phieu) => {
//     if (phieu.phieu_nhap_lien_ket) {
//       return (
//         <div className="flex items-center space-x-1 mt-1">
//           <Link2 size={12} className="text-green-500" />
//           <span className="text-xs text-green-600">
//             Liên kết: {phieu.phieu_nhap_lien_ket.so_phieu}
//           </span>
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <div className="container mx-auto px-4 py-6">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">
//             Quản lý phiếu xuất kho
//           </h1>
//           <p className="text-gray-600 mt-1">
//             {isLevel3User
//               ? "Tạo và quản lý phiếu xuất kho"
//               : "Duyệt và quản lý phiếu xuất kho"}
//           </p>
//         </div>

//         {/* Chỉ cấp 3 mới có nút tạo phiếu */}
//         {isLevel3User && (
//           <button
//             onClick={() => setShowCreateModal(true)}
//             className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//           >
//             <Plus size={16} className="mr-2" />
//             Tạo phiếu xuất
//           </button>
//         )}
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Tìm kiếm
//             </label>
//             <div className="relative">
//               <Search
//                 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//                 size={16}
//               />
//               <input
//                 type="text"
//                 placeholder="Tìm theo số phiếu, lý do..."
//                 value={filters.search}
//                 onChange={(e) =>
//                   setFilters((prev) => ({ ...prev, search: e.target.value }))
//                 }
//                 className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
//               />
//             </div>
//           </div>

//           {shouldShowDropdown && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Phòng ban
//               </label>
//               <select
//                 value={filters.phong_ban_filter}
//                 onChange={(e) =>
//                   setFilters((prev) => ({
//                     ...prev,
//                     phong_ban_filter: e.target.value,
//                   }))
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
//               >
//                 <option value="all">Tất cả phòng ban</option>
//                 <option value="own">Phòng ban của tôi</option>
//               </select>
//             </div>
//           )}

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Từ ngày
//             </label>
//             <input
//               type="date"
//               value={filters.tu_ngay}
//               onChange={(e) =>
//                 setFilters((prev) => ({ ...prev, tu_ngay: e.target.value }))
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Đến ngày
//             </label>
//             <input
//               type="date"
//               value={filters.den_ngay}
//               onChange={(e) =>
//                 setFilters((prev) => ({ ...prev, den_ngay: e.target.value }))
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
//             />
//           </div>
//         </div>

//         <div className="flex justify-between items-center mt-4">
//           <button
//             onClick={() => {
//               setFilters({
//                 search: "",
//                 phong_ban_filter: "own",
//                 tu_ngay: "",
//                 den_ngay: "",
//               });
//               setCurrentPage(1);
//             }}
//             className="text-sm text-gray-500 hover:text-gray-700"
//           >
//             Xóa bộ lọc
//           </button>

//           <button
//             onClick={fetchPhieuList}
//             className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
//           >
//             <RefreshCw size={16} className="mr-2" />
//             Làm mới
//           </button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="bg-white rounded-lg shadow-sm border">
//         <div className="border-b border-gray-200">
//           <nav className="-mb-px flex space-x-8 px-4">
//             {TAB_CONFIG.XUAT_KHO.map((tab) => (
//               <button
//                 key={tab.key}
//                 onClick={() => {
//                   setActiveTab(tab.key);
//                   setCurrentPage(1);
//                 }}
//                 className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
//                   activeTab === tab.key
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 {tab.label}
//                 {tab.count > 0 && (
//                   <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
//                     {tab.count}
//                   </span>
//                 )}
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Table */}
//         {loading ? (
//           <Loading />
//         ) : (
//           <>
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Số phiếu
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Ngày xuất
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Loại xuất
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Đơn vị nhận
//                     </th>
//                     {shouldShowDropdown &&
//                       filters.phong_ban_filter === "all" && (
//                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Phòng ban
//                         </th>
//                       )}
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Tổng tiền
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       File
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Trạng thái
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Hành động
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {phieuList.map((phieu) => (
//                     <tr
//                       key={phieu.id}
//                       className={`hover:bg-gray-50 ${
//                         phieu.ghi_chu_phan_hoi
//                           ? "bg-yellow-50 ring-2 ring-yellow-400"
//                           : ""
//                       }`}
//                     >
//                       <td className="px-4 py-3 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">
//                           {phieu.so_quyet_dinh || "Chưa có"}
//                         </div>
//                         {renderPhieuLienKet(phieu)}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           {formatDate(phieu.ngay_xuat)}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap">
//                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
//                           {LOAI_PHIEU_XUAT[phieu.loai_xuat] || "Cấp phát"}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="text-sm text-gray-900">
//                           {renderDonViNhan(phieu)}
//                         </div>
//                       </td>
//                       {shouldShowDropdown &&
//                         filters.phong_ban_filter === "all" && (
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <div className="text-sm text-gray-900">
//                               <div className="flex items-center space-x-1">
//                                 <Building size={12} className="text-gray-500" />
//                                 <span>
//                                   {phieu.ten_phong_ban || "Không xác định"}
//                                 </span>
//                               </div>
//                             </div>
//                           </td>
//                         )}
//                       <td className="px-4 py-3 whitespace-nowrap text-right">
//                         <div className="text-sm font-medium text-red-600">
//                           {formatCurrency(phieu.tong_tien)}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-center">
//                         <div className="flex items-center justify-center space-x-1">
//                           {phieu.decision_pdf_url ? (
//                             <FileDown size={16} className="text-green-500" />
//                           ) : (
//                             <span className="text-xs text-gray-400">
//                               Chưa có
//                             </span>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap">
//                         {renderTrangThai(phieu.trang_thai)}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-center">
//                         <ActionDropdown
//                           phieu={phieu}
//                           onAction={handleAction}
//                           userRole={userRole}
//                         />
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {phieuList.length === 0 && (
//               <div className="text-center py-8">
//                 <p className="text-gray-500">Không có phiếu xuất nào</p>
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

//       {/* Modals */}
//       <Modal
//         isOpen={showCreateModal}
//         onClose={() => setShowCreateModal(false)}
//         title="Tạo phiếu xuất kho"
//         size="xl"
//       >
//         <CreateXuatKhoForm
//           onSuccess={handleFormSuccess}
//           onCancel={handleFormCancel}
//         />
//       </Modal>

//       <Modal
//         isOpen={showDetailModal}
//         onClose={() => setShowDetailModal(false)}
//         size="xl"
//       >
//         {selectedPhieu && <PhieuXuatDetail phieu={selectedPhieu} />}
//       </Modal>

//       <Modal
//         isOpen={showEditModal}
//         onClose={() => setShowEditModal(false)}
//         title={`Sửa phiếu xuất: ${selectedPhieu?.so_phieu || "Loading..."}`}
//         size="xl"
//       >
//         {editPhieuId && (
//           <EditXuatKhoForm
//             mode="edit"
//             phieuId={editPhieuId}
//             onSuccess={handleFormSuccess}
//             onCancel={handleFormCancel}
//           />
//         )}
//       </Modal>

//       <Modal
//         isOpen={showPrintModal}
//         onClose={() => setShowPrintModal(false)}
//         title="In phiếu xuất kho"
//         size="md"
//       >
//         <PrintPhieuXuatForm
//           phieuId={printPhieuId}
//           onSuccess={handleFormSuccess}
//           onCancel={handleFormCancel}
//         />
//       </Modal>

//       <RevisionRequestModal
//         isOpen={showRevisionModal}
//         onClose={() => setShowRevisionModal(false)}
//         onSubmit={handleRevisionSubmit}
//         phieu={selectedPhieu}
//       />

//       <Modal
//         isOpen={showEditActualModal}
//         onClose={() => setShowEditActualModal(false)}
//         title="Chỉnh sửa số lượng thực tế"
//         size="xl"
//       >
//         {editActualPhieuId && (
//           <EditXuatKhoForm
//             mode="edit-actual"
//             phieuId={editActualPhieuId}
//             onSuccess={handleFormSuccess}
//             onCancel={handleFormCancel}
//           />
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default XuatKho;

// File: src/pages/XuatKho.jsx
// ✅ COMPLETE: Xuất kho frontend theo chuẩn nhập kho với đầy đủ workflow

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Printer,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Building,
  Calendar,
  FileText,
  Link2,
  Info,
  Package,
} from "lucide-react";
import { xuatKhoService } from "../services/xuatKhoService";
import { formatCurrency, formatDate } from "../utils/helpers";
import {
  TRANG_THAI_PHIEU,
  LOAI_PHIEU_XUAT,
  TAB_CONFIG,
  WORKFLOW_RULES,
} from "../utils/constants";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import CreateXuatKhoForm from "../components/forms/CreateXuatKhoForm";
import EditXuatKhoForm from "../components/forms/EditXuatKhoForm";
import Loading from "../components/common/Loading";
import PhieuXuatDetail from "../components/details/PhieuXuatDetail";
import PrintPhieuXuatForm from "../components/forms/PrintPhieuXuatForm";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/common/PageHeader";

// Component for revision request modal
const RevisionRequestModal = ({ isOpen, onClose, onSubmit }) => {
  const [ghiChu, setGhiChu] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ghiChu.trim()) {
      toast.error("Vui lòng nhập lý do yêu cầu chỉnh sửa");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(ghiChu);
      setGhiChu("");
      onClose();
    } catch (error) {
      console.error("Error submitting revision request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yêu cầu chỉnh sửa phiếu">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-yellow-600 mt-1" size={20} />
            <div>
              <h3 className="font-medium text-yellow-800">Lưu ý</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Phiếu sẽ được chuyển về trạng thái "Cần sửa" và người tạo sẽ
                nhận được thông báo để chỉnh sửa lại.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do yêu cầu chỉnh sửa <span className="text-red-500">*</span>
          </label>
          <textarea
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập lý do cần chỉnh sửa phiếu..."
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !ghiChu.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <AlertTriangle size={16} />
            <span>{isSubmitting ? "Đang gửi..." : "Yêu cầu chỉnh sửa"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ✅ Component Dropdown Actions với logic permissions CHÍNH XÁC cho XUẤT KHO
const ActionDropdown = ({ phieu, onAction, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Determine permissions based on CHÍNH XÁC backend logic
  const isAdmin = user.role === "admin";
  const isManager = user.role === "manager";
  const isOwner = phieu.nguoi_tao === user.id;
  const isLevel3User = user.role === "user" && user.phong_ban?.cap_bac === 3;

  // ✅ LOGIC ĐÚNG: Quyền submit - chỉ chủ sở hữu và phiếu ở draft hoặc revision_required
  const canSubmit =
    isOwner && ["draft", "revision_required"].includes(phieu.trang_thai);

  // ✅ LOGIC ĐÚNG: Quyền edit - chỉ chủ sở hữu và phiếu ở draft hoặc revision_required
  const canEdit =
    isOwner && ["draft", "revision_required"].includes(phieu.trang_thai);

  // ✅ LOGIC ĐÚNG XUẤT KHO: Quyền approve theo loại xuất (2-bước cho don_vi_nhan)
  let canApprove = false;
  const isStep1Status = ["confirmed", "pending_approval"].includes(
    phieu.trang_thai
  );
  const isStep2Status = phieu.trang_thai === "pending_level3_approval";

  if (phieu.loai_xuat === "don_vi_su_dung") {
    // XUẤT SỬ DỤNG: Admin/Manager duyệt một bước khi đã gửi
    canApprove = isStep1Status && (isAdmin || isManager);
  } else if (phieu.loai_xuat === "don_vi_nhan") {
    // Bước 1 (3A gửi → cấp 2 hoặc admin duyệt)
    if (isStep1Status) {
      canApprove = isAdmin || isManager;
    }
    // Bước 2 (sau khi tạo phiếu nhập cho 3B → 3B duyệt nhận)
    if (isStep2Status) {
      canApprove =
        isLevel3User && phieu.phong_ban_nhan_id === user.phong_ban_id;
    }
  }

  // ✅ LOGIC ĐÚNG: Quyền yêu cầu sửa - admin/manager với phiếu confirmed
  const canRequestRevision =
    (isAdmin || isManager) && phieu.trang_thai === "confirmed";

  // ✅ LOGIC ĐÚNG: Quyền cancel - chủ sở hữu hoặc admin với phiếu chưa hoàn thành
  const canCancel =
    (isOwner || isAdmin) &&
    ["draft", "confirmed", "revision_required"].includes(phieu.trang_thai);

  // ✅ LOGIC COMPLETE: admin/manager với phiếu approved
  const canComplete = (isAdmin || isManager) && phieu.trang_thai === "approved";

  const actions = [
    {
      key: "view",
      label: "Xem chi tiết",
      icon: Eye,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: true,
    },
    {
      key: "submit",
      label: "Gửi duyệt",
      icon: Send,
      color: "text-green-600 hover:text-green-800 hover:bg-green-50",
      show: canSubmit,
    },
    {
      key: "approve",
      label:
        phieu.loai_xuat === "don_vi_nhan" ? "Duyệt nhận hàng" : "Duyệt xuất",
      icon: CheckCircle,
      color: "text-green-600 hover:text-green-800 hover:bg-green-50",
      show: canApprove,
    },
    {
      key: "edit",
      label: "Chỉnh sửa",
      icon: Edit,
      color: "text-amber-600 hover:text-amber-800 hover:bg-amber-50",
      show: canEdit,
    },
    {
      key: "request_revision",
      label: "Yêu cầu sửa",
      icon: AlertTriangle,
      color: "text-orange-600 hover:text-orange-800 hover:bg-orange-50",
      show: canRequestRevision,
    },
    {
      key: "complete",
      label: "Hoàn thành",
      icon: CheckCircle,
      color: "text-green-600 hover:text-green-800 hover:bg-green-50",
      show: canComplete,
    },
    {
      key: "print",
      label: "In phiếu",
      icon: Printer,
      color: "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
      show: ["approved", "completed"].includes(phieu.trang_thai),
    },
    {
      key: "cancel",
      label: "Hủy phiếu",
      icon: XCircle,
      color: "text-red-600 hover:text-red-800 hover:bg-red-50",
      show: canCancel,
    },
  ];

  const visibleActions = actions.filter((action) => action.show);

  const handleActionClick = (actionKey) => {
    setIsOpen(false);
    onAction(actionKey, phieu.id);
  };

  if (visibleActions.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {visibleActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => handleActionClick(action.key)}
                className={`w-full px-4 py-3 text-left text-sm flex items-center space-x-3 transition-all first:rounded-t-lg last:rounded-b-lg ${action.color}`}
              >
                <IconComponent size={16} />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const XuatKho = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const validTabs = TAB_CONFIG.XUAT_KHO.map((t) => t.key);
    return tab && validTabs.includes(tab) ? tab : "tat_ca";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [filters, setFilters] = useState({
    tu_ngay: "",
    den_ngay: "",
    loai_xuat: "",
    phong_ban_filter: user?.role === "admin" ? "all" : "own",
  });
  const [highlightId, setHighlightId] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [editPhieuId, setEditPhieuId] = useState(null);
  const [printPhieuId, setPrintPhieuId] = useState(null);

  // Data states
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabCounts, setTabCounts] = useState({});
  //const [phongBanList, setPhongBanList] = useState([]);

  const phieuXuatList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  // ✅ FIX: Correct tab status filter
  const getTabStatusFilter = (tabKey) => {
    const tabConfig = TAB_CONFIG.XUAT_KHO.find((tab) => tab.key === tabKey);
    return tabConfig?.status || [];
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // ✅ FIX: Build filters based on active tab
      const statusFilter = getTabStatusFilter(activeTab);
      const queryParams = {
        page: currentPage,
        limit: 20,
        search: searchTerm,
        sort_by: sortConfig.key,
        sort_direction: sortConfig.direction,
        ...filters,
      };

      // ✅ FIX: Add status filter correctly
      if (activeTab !== "tat_ca" && statusFilter.length > 0) {
        queryParams.trang_thai = statusFilter;
      }

      console.log("✅ Fetching xuat kho with correct params:", queryParams);

      const response = await xuatKhoService.getList(queryParams);
      setData(response);

      // Fetch counts for all tabs
      await fetchTabCounts();
    } catch (error) {
      console.error("Error fetching xuat kho data:", error);
      toast.error("Không thể tải dữ liệu phiếu xuất");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTabCounts = async () => {
    try {
      const counts = {};

      // Get counts for each tab
      for (const tab of TAB_CONFIG.XUAT_KHO) {
        if (tab.key === "tat_ca") {
          const response = await xuatKhoService.getList({
            page: 1,
            limit: 1,
            search: searchTerm,
            ...filters,
          });
          counts[tab.key] = response.data?.pagination?.total || 0;
        } else {
          const response = await xuatKhoService.getList({
            page: 1,
            limit: 1,
            search: searchTerm,
            trang_thai: tab.status,
            ...filters,
          });
          counts[tab.key] = response.data?.pagination?.total || 0;
        }
      }

      setTabCounts(counts);
    } catch (error) {
      console.error("Error fetching tab counts:", error);
    }
  };

  // Check if user can create phieu
  const canCreatePhieu = WORKFLOW_RULES.CAN_CREATE[user?.role] || false;

  useEffect(() => {
    // Reset to first page when changing tabs or filters
    setCurrentPage(1);
  }, [activeTab, searchTerm, filters, sortConfig]);

  useEffect(() => {
    fetchData();
  }, [currentPage, activeTab, searchTerm, filters, sortConfig]);

  // Sync activeTab with URL changes (e.g., via notifications)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const validTabs = TAB_CONFIG.XUAT_KHO.map((t) => t.key);
    const next = tab && validTabs.includes(tab) ? tab : "tat_ca";
    if (next !== activeTab) setActiveTab(next);
    const hl = params.get("highlight");
    setHighlightId(hl ? Number(hl) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await xuatKhoService.getDetail(id);
      setSelectedPhieu(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải chi tiết phiếu xuất");
    }
  };

  // ✅ Handle submit với workflow chính xác
  const handleSubmit = async (id) => {
    if (window.confirm("Bạn có chắc muốn gửi phiếu này để duyệt?")) {
      try {
        const response = await xuatKhoService.submit(id);
        toast.success(response.message || "Đã gửi phiếu để duyệt");
        fetchData();
      } catch (error) {
        console.error("Error submitting:", error);
        const errorMessage =
          error.response?.data?.message || "Không thể gửi phiếu";

        // ✅ Handle stock validation error
        if (error.response?.data?.data?.stock_check) {
          const stockIssues = error.response.data.data.stock_check
            .filter((item) => !item.du_hang)
            .map(
              (item) =>
                `Hàng hóa ID ${item.hang_hoa_id}: cần ${item.so_luong_xuat}, còn ${item.ton_kho}`
            )
            .join("; ");
          toast.error(`${errorMessage}. Chi tiết: ${stockIssues}`);
        } else {
          toast.error(errorMessage);
        }
      }
    }
  };

  // ✅ Handle approve với workflow chính xác
  const handleApprove = async (id) => {
    if (window.confirm("Bạn có chắc muốn duyệt phiếu xuất này?")) {
      try {
        const response = await xuatKhoService.approve(id);
        toast.success(response.message || "Duyệt phiếu xuất thành công");
        fetchData();
      } catch (error) {
        console.error("Error approving:", error);
        toast.error(
          error.response?.data?.message || "Không thể duyệt phiếu xuất"
        );
      }
    }
  };

  const handleRequestRevision = async (ghiChu) => {
    try {
      await xuatKhoService.requestRevision(selectedPhieu.id, {
        ghi_chu_phan_hoi: ghiChu,
      });
      toast.success("Đã yêu cầu chỉnh sửa phiếu");
      setShowRevisionModal(false);
      setSelectedPhieu(null);
      fetchData();
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast.error("Không thể yêu cầu chỉnh sửa");
    }
  };

  const handleComplete = async (id) => {
    if (window.confirm("Bạn có chắc muốn hoàn thành phiếu xuất này?")) {
      try {
        await xuatKhoService.complete(id);
        toast.success("Hoàn thành phiếu thành công");
        fetchData();
      } catch (error) {
        console.error("Error completing:", error);
        toast.error(
          error.response?.data?.message || "Không thể hoàn thành phiếu"
        );
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Bạn có chắc muốn hủy phiếu xuất này?")) {
      try {
        await xuatKhoService.cancel(id);
        toast.success("Hủy phiếu thành công");
        fetchData();
      } catch (error) {
        console.error("Error canceling:", error);
        toast.error("Không thể hủy phiếu");
      }
    }
  };

  // Action handler
  const handleAction = async (action, id) => {
    switch (action) {
      case "view":
        handleViewDetail(id);
        break;
      case "submit":
        handleSubmit(id);
        break;
      case "approve":
        handleApprove(id);
        break;
      case "edit":
        try {
          const response = await xuatKhoService.getDetail(id);
          setSelectedPhieu(response.data);
          setEditPhieuId(id);
          setShowEditModal(true);
          // eslint-disable-next-line no-unused-vars
        } catch (error) {
          toast.error("Không thể tải dữ liệu để chỉnh sửa");
        }
        break;
      case "request_revision":
        try {
          const response = await xuatKhoService.getDetail(id);
          setSelectedPhieu(response.data);
          setShowRevisionModal(true);
          // eslint-disable-next-line no-unused-vars
        } catch (error) {
          toast.error("Không thể tải dữ liệu phiếu");
        }
        break;
      case "complete":
        handleComplete(id);
        break;
      case "print":
        setPrintPhieuId(id);
        setShowPrintModal(true);
        break;
      case "cancel":
        handleCancel(id);
        break;
      default:
        console.warn("Unknown action:", action);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  const getStatusBadge = (trangThai) => {
    const config = TRANG_THAI_PHIEU[trangThai] || TRANG_THAI_PHIEU.draft;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
      >
        {config.label}
      </span>
    );
  };

  const getLoaiXuatBadge = (loaiXuat) => {
    const colors = {
      don_vi_su_dung: "bg-blue-100 text-blue-800",
      don_vi_nhan: "bg-green-100 text-green-800",
    };

    // ✅ FIX: Lấy label từ LOAI_PHIEU_XUAT với structure mới
    const config = LOAI_PHIEU_XUAT[loaiXuat];
    const label = config?.label || "Không xác định";

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[loaiXuat] || "bg-gray-100 text-gray-800"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Quản lý xuất kho"
        subtitle="Quản lý các phiếu xuất hàng khỏi kho theo quy trình duyệt"
        Icon={Package}
      />

      {canCreatePhieu && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>Tạo phiếu xuất</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {TAB_CONFIG.XUAT_KHO.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  const params = new URLSearchParams(location.search);
                  if (tab.key === "tat_ca") params.delete("tab");
                  else params.set("tab", tab.key);
                  navigate(
                    {
                      pathname: location.pathname,
                      search: params.toString(),
                    },
                    { replace: true }
                  );
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tabCounts[tab.key] !== undefined && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.key
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Tìm theo số phiếu, lý do..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
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
                  setFilters((prev) => ({
                    ...prev,
                    den_ngay: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại xuất
              </label>
              <select
                value={filters.loai_xuat}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    loai_xuat: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
              >
                <option value="">Tất cả</option>
                {Object.entries(LOAI_PHIEU_XUAT).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => {
                setFilters({
                  tu_ngay: "",
                  den_ngay: "",
                  loai_xuat: "",
                  phong_ban_filter: user?.role === "admin" ? "all" : "own",
                });
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Xóa bộ lọc
            </button>

            <button
              onClick={fetchData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw size={16} className="mr-2" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("so_phieu")}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Số phiếu</span>
                        {getSortIcon("so_phieu")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("ngay_xuat")}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Ngày xuất</span>
                        {getSortIcon("ngay_xuat")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại xuất
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("trang_thai")}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Trạng thái</span>
                        {getSortIcon("trang_thai")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("tong_tien")}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Tổng tiền</span>
                        {getSortIcon("tong_tien")}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đơn vị nhận
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phòng ban
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {phieuXuatList.map((phieu) => (
                    <tr
                      key={phieu.id}
                      className={`hover:bg-gray-50 ${
                        highlightId === phieu.id
                          ? "ring-2 ring-red-400 bg-red-50"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {phieu.so_phieu}
                          </span>
                          {phieu.so_quyet_dinh && (
                            <span className="text-xs text-gray-500 truncate">
                              {phieu.so_quyet_dinh}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar size={14} className="mr-2 text-gray-400" />
                          {formatDate(phieu.ngay_xuat)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getLoaiXuatBadge(phieu.loai_xuat)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(phieu.trang_thai)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(phieu.tong_tien)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Building size={14} className="mr-2 text-gray-400" />
                          <span className="truncate">
                            {phieu.loai_xuat === "don_vi_su_dung"
                              ? "Sử dụng nội bộ"
                              : phieu.ten_phong_ban_nhan // ← Đơn vị nhận (cấp 3)
                              ? phieu.ten_phong_ban_nhan
                              : phieu.ten_don_vi_nhan // ← Đơn vị nhận ngoài
                              ? phieu.ten_don_vi_nhan
                              : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 truncate">
                          {phieu.phong_ban?.ten_phong_ban || "Chưa xác định"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <ActionDropdown
                          phieu={phieu}
                          onAction={handleAction}
                          user={user}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {phieuXuatList.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.currentPage || 1}
                  totalPages={pagination.totalPages || 1}
                  onPageChange={setCurrentPage}
                  totalItems={pagination.total || 0}
                  itemsPerPage={pagination.limit || 20}
                />
              </div>
            )}

            {/* Empty state */}
            {phieuXuatList.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Không có phiếu xuất nào
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeTab === "tat_ca"
                    ? "Hệ thống chưa có phiếu xuất nào."
                    : `Không có phiếu xuất nào ở trạng thái "${
                        TAB_CONFIG.XUAT_KHO.find((t) => t.key === activeTab)
                          ?.label
                      }".`}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo phiếu xuất kho"
        size="xl"
      >
        <CreateXuatKhoForm
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPhieu(null);
        }}
        title={`Chi tiết phiếu xuất: ${selectedPhieu?.so_phieu || ""}`}
        size="full"
      >
        {selectedPhieu && <PhieuXuatDetail phieu={selectedPhieu} />}
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPhieu(null);
          setEditPhieuId(null);
        }}
        title={`Sửa phiếu xuất: ${selectedPhieu?.so_phieu || ""}`}
        size="xl"
      >
        {editPhieuId && (
          <EditXuatKhoForm
            phieuId={editPhieuId}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedPhieu(null);
              setEditPhieuId(null);
              fetchData();
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedPhieu(null);
              setEditPhieuId(null);
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setPrintPhieuId(null);
        }}
        title="In phiếu xuất kho"
        size="md"
      >
        <PrintPhieuXuatForm
          phieuId={printPhieuId}
          onSuccess={() => setShowPrintModal(false)}
          onCancel={() => setShowPrintModal(false)}
        />
      </Modal>

      <RevisionRequestModal
        isOpen={showRevisionModal}
        onClose={() => {
          setShowRevisionModal(false);
          setSelectedPhieu(null);
        }}
        onSubmit={handleRequestRevision}
        phieu={selectedPhieu}
      />
    </div>
  );
};

export default XuatKho;
