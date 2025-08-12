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
//   Calculator,
//   Edit,
//   Download,
//   FileDown,
//   MoreVertical,
// } from "lucide-react";
// import { xuatKhoService } from "../services/xuatKhoService";
// import { formatCurrency, formatDate } from "../utils/helpers";
// import { TRANG_THAI_PHIEU, LOAI_PHIEU_XUAT } from "../utils/constants";
// import Modal from "../components/common/Modal";
// import Pagination from "../components/common/Pagination";
// import XuatKhoForm from "../components/forms/XuatKhoForm";
// import Loading from "../components/common/Loading";
// import PhieuXuatDetail from "../components/details/PhieuXuatDetail";
// import PrintPhieuXuatForm from "../components/forms/PrintPhieuXuatForm";
// import toast from "react-hot-toast";

// // Component Dropdown Actions
// const ActionDropdown = ({ phieu, onAction }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef(null);

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

//   const actions = [
//     {
//       key: "view",
//       label: "Xem chi tiết",
//       icon: Eye,
//       color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
//       show: true,
//     },
//     {
//       key: "edit",
//       label: "Sửa phiếu",
//       icon: Edit,
//       color: "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50",
//       show: phieu.trang_thai === "draft",
//     },
//     {
//       key: "upload",
//       label: "Upload quyết định",
//       icon: Upload,
//       color: "text-green-600 hover:text-green-800 hover:bg-green-50",
//       show: phieu.trang_thai === "draft",
//     },
//     {
//       key: "update-quantity",
//       label: "Cập nhật SL thực xuất",
//       icon: Calculator,
//       color: "text-purple-600 hover:text-purple-800 hover:bg-purple-50",
//       show: phieu.trang_thai === "confirmed",
//     },
//     {
//       key: "approve",
//       label: "Duyệt phiếu",
//       icon: Check,
//       color: "text-green-600 hover:text-green-800 hover:bg-green-50",
//       show: phieu.trang_thai === "confirmed",
//     },
//     {
//       key: "cancel",
//       label: "Hủy phiếu",
//       icon: X,
//       color: "text-red-600 hover:text-red-800 hover:bg-red-50",
//       show: phieu.trang_thai === "draft" || phieu.trang_thai === "confirmed",
//     },
//     {
//       key: "download",
//       label: "Tải quyết định",
//       icon: FileDown,
//       color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
//       show: phieu.trang_thai === "completed" && phieu.decision_pdf_url,
//     },
//     {
//       key: "print",
//       label: "In phiếu",
//       icon: FileText,
//       color: "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
//       show: true,
//     },
//   ];

//   const visibleActions = actions.filter((action) => action.show);

//   const handleActionClick = (actionKey) => {
//     setIsOpen(false);
//     onAction(actionKey, phieu.id);
//   };

//   return (
//     <div className="relative inline-block" ref={dropdownRef}>
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
//         title="Thao tác"
//       >
//         <MoreVertical size={16} />
//       </button>

//       {isOpen && (
//         <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-none overflow-visible">
//           {visibleActions.map((action) => {
//             const IconComponent = action.icon;
//             return (
//               <button
//                 key={action.key}
//                 onClick={() => handleActionClick(action.key)}
//                 className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-all first:rounded-t-lg last:rounded-b-lg ${action.color}`}
//               >
//                 <IconComponent size={14} />
//                 <span>{action.label}</span>
//               </button>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// const XuatKho = () => {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filters, setFilters] = useState({
//     tu_ngay: "",
//     den_ngay: "",
//     trang_thai: "",
//     loai_xuat: "",
//   });
//   const [sortConfig, setSortConfig] = useState({
//     key: "ngay_xuat",
//     direction: "desc",
//   });

//   // Modal states
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [showUpdateQuantityModal, setShowUpdateQuantityModal] = useState(false);
//   const [showPrintModal, setShowPrintModal] = useState(false);

//   // Data states
//   const [selectedPhieu, setSelectedPhieu] = useState(null);
//   const [editPhieuId, setEditPhieuId] = useState(null);
//   const [printPhieuId, setPrintPhieuId] = useState(null);
//   const [data, setData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   const phieuXuatList = data?.data?.items || [];
//   const pagination = data?.data?.pagination || {};

//   const fetchData = async () => {
//     try {
//       setIsLoading(true);
//       const response = await xuatKhoService.getList({
//         page: currentPage,
//         limit: 20,
//         search: searchTerm,
//         sort_by: sortConfig.key,
//         sort_direction: sortConfig.direction,
//         ...filters,
//       });
//       setData(response);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       toast.error("Không thể tải dữ liệu phiếu xuất");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [currentPage, searchTerm, filters, sortConfig]);

//   const handleSort = (key) => {
//     setSortConfig((prev) => ({
//       key,
//       direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
//     }));
//   };

//   const getSortIcon = (key) => {
//     if (sortConfig.key !== key) return null;
//     return sortConfig.direction === "asc" ? "↑" : "↓";
//   };

//   const getTrangThaiColor = (trangThai) => {
//     const config = TRANG_THAI_PHIEU[trangThai] || {};
//     const colorMap = {
//       green: "bg-green-100 text-green-800",
//       blue: "bg-blue-100 text-blue-800",
//       yellow: "bg-yellow-100 text-yellow-800",
//       red: "bg-red-100 text-red-800",
//       gray: "bg-gray-100 text-gray-800",
//     };
//     return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//       colorMap[config.color] || colorMap.gray
//     }`;
//   };

//   // Action handlers
//   const handleViewDetail = async (id) => {
//     try {
//       const response = await xuatKhoService.getDetail(id);
//       setSelectedPhieu(response.data);
//       setShowDetailModal(true);
//     } catch (error) {
//       console.error("Error fetching detail:", error);
//       toast.error("Không thể tải chi tiết phiếu xuất");
//     }
//   };

//   const handleEditPhieu = async (id) => {
//     try {
//       const response = await xuatKhoService.getDetail(id);
//       setSelectedPhieu(response.data);
//       setEditPhieuId(id);
//       setShowEditModal(true);
//     } catch (error) {
//       console.error("Error fetching edit data:", error);
//       toast.error("Không thể tải dữ liệu để chỉnh sửa");
//     }
//   };

//   const handleUploadDecision = async (id) => {
//     try {
//       const response = await xuatKhoService.getDetail(id);
//       setSelectedPhieu(response.data);
//       setShowUploadModal(true);
//     } catch (error) {
//       console.error("Error fetching detail:", error);
//       toast.error("Không thể tải chi tiết phiếu xuất");
//     }
//   };

//   const handleUpdateQuantity = async (id) => {
//     try {
//       const response = await xuatKhoService.getDetail(id);
//       setSelectedPhieu(response.data);
//       setShowUpdateQuantityModal(true);
//     } catch (error) {
//       console.error("Error fetching detail:", error);
//       toast.error("Không thể tải chi tiết phiếu xuất");
//     }
//   };

//   const handleApprove = async (id) => {
//     if (window.confirm("Bạn có chắc muốn duyệt phiếu xuất này?")) {
//       try {
//         await xuatKhoService.approve(id);
//         toast.success("Duyệt phiếu xuất thành công");
//         fetchData();
//       } catch (error) {
//         console.error("Error approving:", error);
//         toast.error(
//           error.response?.data?.message || "Không thể duyệt phiếu xuất"
//         );
//       }
//     }
//   };

//   const handleCancel = async (id) => {
//     if (
//       window.confirm(
//         "Bạn có chắc muốn hủy phiếu xuất này? Hàng hóa sẽ được hoàn trả về kho."
//       )
//     ) {
//       try {
//         await xuatKhoService.cancel(id);
//         toast.success("Hủy phiếu xuất thành công");
//         fetchData();
//       } catch (error) {
//         console.error("Error canceling:", error);
//         toast.error("Không thể hủy phiếu xuất");
//       }
//     }
//   };

//   const handleDownloadDecision = async (id) => {
//     try {
//       const response = await xuatKhoService.downloadDecision(id);
//       const { url, filename } = response.data;

//       const link = document.createElement("a");
//       link.href = `http://localhost:5000${url}`;
//       link.download = filename || "quyet_dinh_xuat.pdf";
//       link.target = "_blank";

//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);

//       toast.success("Đang tải file...");
//     } catch (error) {
//       console.error("Error downloading file:", error);
//       toast.error("Không thể tải file");
//     }
//   };

//   const handlePrintPhieu = (id) => {
//     setPrintPhieuId(id);
//     setShowPrintModal(true);
//   };

//   // Main action handler for dropdown
//   const handleActionClick = (actionKey, phieuId) => {
//     switch (actionKey) {
//       case "view":
//         handleViewDetail(phieuId);
//         break;
//       case "edit":
//         handleEditPhieu(phieuId);
//         break;
//       case "upload":
//         handleUploadDecision(phieuId);
//         break;
//       case "update-quantity":
//         handleUpdateQuantity(phieuId);
//         break;
//       case "approve":
//         handleApprove(phieuId);
//         break;
//       case "cancel":
//         handleCancel(phieuId);
//         break;
//       case "download":
//         handleDownloadDecision(phieuId);
//         break;
//       case "print":
//         handlePrintPhieu(phieuId);
//         break;
//       default:
//         break;
//     }
//   };

//   // Form handlers
//   const handleFormSuccess = () => {
//     setShowCreateModal(false);
//     setShowEditModal(false);
//     setShowUploadModal(false);
//     setShowUpdateQuantityModal(false);
//     setShowPrintModal(false);
//     setSelectedPhieu(null);
//     setEditPhieuId(null);
//     setPrintPhieuId(null);
//     fetchData();
//   };

//   const handleFormCancel = () => {
//     setShowCreateModal(false);
//     setShowEditModal(false);
//     setShowUploadModal(false);
//     setShowUpdateQuantityModal(false);
//     setShowPrintModal(false);
//     setSelectedPhieu(null);
//     setEditPhieuId(null);
//     setPrintPhieuId(null);
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 flex items-center">
//             <ArrowUpFromLine className="mr-2 h-6 w-6 text-red-600" />
//             Quản lý xuất kho
//           </h1>
//           <p className="mt-1 text-sm text-gray-600">
//             Quản lý các phiếu xuất hàng ra khỏi kho
//           </p>
//         </div>
//         <button
//           onClick={() => setShowCreateModal(true)}
//           className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
//         >
//           <Plus size={18} />
//           <span>Tạo phiếu xuất</span>
//         </button>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//         <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
//           <div className="md:col-span-2">
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
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
//                 placeholder="Tìm theo số quyết định hoặc đơn vị nhận..."
//               />
//             </div>
//           </div>

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
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
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
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Trạng thái
//             </label>
//             <select
//               value={filters.trang_thai}
//               onChange={(e) =>
//                 setFilters((prev) => ({ ...prev, trang_thai: e.target.value }))
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
//             >
//               <option value="">Tất cả</option>
//               {Object.entries(TRANG_THAI_PHIEU).map(([key, config]) => (
//                 <option key={key} value={key}>
//                   {config.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Loại phiếu
//             </label>
//             <select
//               value={filters.loai_xuat}
//               onChange={(e) =>
//                 setFilters((prev) => ({ ...prev, loai_xuat: e.target.value }))
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
//             >
//               <option value="">Tất cả</option>
//               {Object.entries(LOAI_PHIEU_XUAT).map(([key, label]) => (
//                 <option key={key} value={key}>
//                   {label}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//         {isLoading ? (
//           <div className="flex items-center justify-center h-64">
//             <Loading size="large" />
//           </div>
//         ) : (
//           <>
//             <div className="w-full">
//               <table className="w-full min-w-full">
//                 <thead className="bg-gray-50 border-b border-gray-200">
//                   <tr>
//                     <th
//                       className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
//                       onClick={() => handleSort("so_phieu")}
//                     >
//                       Số phiếu {getSortIcon("so_phieu")}
//                     </th>
//                     <th
//                       className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
//                       onClick={() => handleSort("so_quyet_dinh")}
//                     >
//                       Số qđ {getSortIcon("so_quyet_dinh")}
//                     </th>
//                     <th
//                       className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
//                       onClick={() => handleSort("ngay_xuat")}
//                     >
//                       Ngày xuất {getSortIcon("ngay_xuat")}
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Loại phiếu
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Đơn vị nhận
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Người nhận
//                     </th>
//                     <th
//                       className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
//                       onClick={() => handleSort("tong_tien")}
//                     >
//                       Tổng tiền {getSortIcon("tong_tien")}
//                     </th>
//                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Quyết định
//                     </th>
//                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
//                       Trạng thái
//                     </th>
//                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-16">
//                       Thao tác
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {phieuXuatList.map((phieu) => (
//                     <tr
//                       key={phieu.id}
//                       className="hover:bg-gray-50 transition-colors"
//                     >
//                       <td className="px-4 py-3 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">
//                           {phieu.so_phieu}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           {phieu.so_quyet_dinh || "Chưa có"}
//                         </div>
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
//                           {phieu.don_vi_nhan?.ten_don_vi || "Chưa có"}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="text-sm text-gray-900">
//                           {phieu.nguoi_nhan || "Chưa có"}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-right">
//                         <div className="text-sm font-medium text-red-600">
//                           {formatCurrency(phieu.tong_tien)}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-center">
//                         <div className="flex items-center justify-center space-x-1">
//                           {phieu.decision_pdf_url ? (
//                             <div className="flex items-center space-x-1">
//                               <button
//                                 onClick={() => handleDownloadDecision(phieu.id)}
//                                 className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
//                                 title={`Tải về: ${
//                                   phieu.decision_pdf_filename || "Quyết định"
//                                 }`}
//                               >
//                                 <FileDown size={14} />
//                               </button>
//                               {phieu.ghi_chu_xac_nhan && (
//                                 <span
//                                   className="text-xs text-gray-500 cursor-help"
//                                   title={phieu.ghi_chu_xac_nhan}
//                                 >
//                                   📝
//                                 </span>
//                               )}
//                             </div>
//                           ) : (
//                             <span className="text-xs text-gray-400">-</span>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-center">
//                         <span className={getTrangThaiColor(phieu.trang_thai)}>
//                           {TRANG_THAI_PHIEU[phieu.trang_thai]?.label}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-center">
//                         <ActionDropdown
//                           phieu={phieu}
//                           onAction={handleActionClick}
//                         />
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {phieuXuatList.length === 0 && (
//               <div className="text-center py-8">
//                 <ArrowUpFromLine className="mx-auto h-8 w-8 text-gray-400 mb-2" />
//                 <h3 className="text-sm font-medium text-gray-900 mb-1">
//                   Không có dữ liệu
//                 </h3>
//                 <p className="text-xs text-gray-500">
//                   Chưa có phiếu xuất nào được tạo.
//                 </p>
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

//       {/* Create Modal */}
//       <Modal
//         isOpen={showCreateModal}
//         onClose={() => setShowCreateModal(false)}
//         title="Tạo phiếu xuất kho"
//         size="xl"
//       >
//         <XuatKhoForm
//           mode="create"
//           onSuccess={handleFormSuccess}
//           onCancel={handleFormCancel}
//         />
//       </Modal>

//       {/* Detail Modal */}
//       <Modal
//         isOpen={showDetailModal}
//         onClose={() => setShowDetailModal(false)}
//         size="xl"
//       >
//         {selectedPhieu && <PhieuXuatDetail phieu={selectedPhieu} />}
//       </Modal>

//       {/* Edit Modal */}
//       <Modal
//         isOpen={showEditModal}
//         onClose={() => setShowEditModal(false)}
//         title={`Sửa phiếu xuất: ${selectedPhieu?.so_phieu || "Loading..."}`}
//         size="xl"
//       >
//         {editPhieuId && (
//           <XuatKhoForm
//             mode="edit"
//             phieuId={editPhieuId}
//             onSuccess={handleFormSuccess}
//             onCancel={handleFormCancel}
//           />
//         )}
//       </Modal>

//       {/* Upload Decision Modal */}
//       <Modal
//         isOpen={showUploadModal}
//         onClose={() => setShowUploadModal(false)}
//         title={`Upload quyết định: ${selectedPhieu?.so_phieu}`}
//         size="md"
//       >
//         {selectedPhieu && (
//           <UploadDecisionForm
//             phieu={selectedPhieu}
//             onSuccess={handleFormSuccess}
//             onCancel={handleFormCancel}
//           />
//         )}
//       </Modal>

//       {/* Update Quantity Modal */}
//       <Modal
//         isOpen={showUpdateQuantityModal}
//         onClose={() => setShowUpdateQuantityModal(false)}
//         title={`Cập nhật số lượng thực xuất: ${selectedPhieu?.so_phieu}`}
//         size="lg"
//       >
//         {selectedPhieu && (
//           <UpdateQuantityForm
//             phieu={selectedPhieu}
//             onSuccess={handleFormSuccess}
//             onCancel={handleFormCancel}
//           />
//         )}
//       </Modal>

//       {/* Print Modal */}
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
//     </div>
//   );
// };

// // Component cập nhật số lượng thực xuất
// const UpdateQuantityForm = ({ phieu, onSuccess, onCancel }) => {
//   const [chiTietList, setChiTietList] = useState([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     if (phieu?.chi_tiet) {
//       setChiTietList(
//         phieu.chi_tiet.map((item) => ({
//           hang_hoa_id: item.hang_hoa_id,
//           ten_hang_hoa: item.hang_hoa?.ten_hang_hoa,
//           so_luong_yeu_cau: item.so_luong_yeu_cau,
//           so_luong_thuc_xuat: item.so_luong_thuc_xuat || item.so_luong_yeu_cau,
//           don_vi_tinh: item.hang_hoa?.don_vi_tinh,
//         }))
//       );
//     }
//   }, [phieu]);

//   const handleQuantityChange = (index, value) => {
//     const newList = [...chiTietList];
//     newList[index].so_luong_thuc_xuat = parseFloat(value) || 0;
//     setChiTietList(newList);
//   };

//   const handleSubmit = async () => {
//     setIsSubmitting(true);
//     try {
//       await xuatKhoService.updateSoLuongThucXuat(phieu.id, {
//         chi_tiet_cap_nhat: chiTietList.map((item) => ({
//           hang_hoa_id: item.hang_hoa_id,
//           so_luong_thuc_xuat: item.so_luong_thuc_xuat,
//         })),
//       });
//       toast.success("Cập nhật số lượng thực xuất thành công");
//       onSuccess();
//     } catch (error) {
//       console.error("Error updating quantity:", error);
//       toast.error(error.response?.data?.message || "Có lỗi xảy ra");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="p-6">
//       <div className="mb-4">
//         <p className="text-sm text-gray-600">
//           Cập nhật số lượng thực tế sẽ xuất cho từng hàng hóa. Số lượng không
//           được vượt quá 110% số lượng yêu cầu.
//         </p>
//       </div>

//       <div className="space-y-4">
//         {chiTietList.map((item, index) => (
//           <div key={item.hang_hoa_id} className="border rounded-lg p-4">
//             <div className="flex justify-between items-start mb-2">
//               <div>
//                 <h4 className="font-medium text-gray-900">
//                   {item.ten_hang_hoa}
//                 </h4>
//                 <p className="text-sm text-gray-600">
//                   Yêu cầu: {item.so_luong_yeu_cau} {item.don_vi_tinh}
//                 </p>
//               </div>
//             </div>
//             <div className="mt-2">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Số lượng thực xuất
//               </label>
//               <input
//                 type="number"
//                 min="0"
//                 max={item.so_luong_yeu_cau * 1.1}
//                 step="0.01"
//                 value={item.so_luong_thuc_xuat}
//                 onChange={(e) => handleQuantityChange(index, e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               />
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
//         <button
//           type="button"
//           onClick={onCancel}
//           className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
//         >
//           Hủy
//         </button>
//         <button
//           type="button"
//           onClick={handleSubmit}
//           disabled={isSubmitting}
//           className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//         >
//           {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
//         </button>
//       </div>
//     </div>
//   );
// };

// // Component upload quyết định
// const UploadDecisionForm = ({ phieu, onSuccess, onCancel }) => {
//   const [file, setFile] = useState(null);
//   const [ghi_chu, setGhiChu] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     if (selectedFile && selectedFile.type === "application/pdf") {
//       setFile(selectedFile);
//     } else {
//       toast.error("Chỉ chấp nhận file PDF");
//       e.target.value = "";
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!file) {
//       toast.error("Vui lòng chọn file PDF");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const formData = new FormData();
//       formData.append("decision_pdf", file);
//       formData.append("ghi_chu_xac_nhan", ghi_chu);

//       await xuatKhoService.uploadDecision(phieu.id, formData);
//       toast.success("Upload quyết định thành công");
//       onSuccess();
//     } catch (error) {
//       console.error("Error uploading:", error);
//       toast.error(error.response?.data?.message || "Có lỗi xảy ra");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="p-6">
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             File quyết định (PDF) <span className="text-red-500">*</span>
//           </label>
//           <input
//             type="file"
//             accept=".pdf"
//             onChange={handleFileChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             required
//           />
//           <p className="text-xs text-gray-500 mt-1">
//             Chỉ chấp nhận file PDF, tối đa 10MB
//           </p>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Ghi chú xác nhận
//           </label>
//           <textarea
//             value={ghi_chu}
//             onChange={(e) => setGhiChu(e.target.value)}
//             rows={3}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
//             placeholder="Nhập ghi chú về quyết định xuất kho..."
//           />
//         </div>

//         <div className="flex justify-end space-x-3 pt-4 border-t">
//           <button
//             type="button"
//             onClick={onCancel}
//             className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
//           >
//             Hủy
//           </button>
//           <button
//             type="submit"
//             disabled={isSubmitting || !file}
//             className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             {isSubmitting ? "Đang upload..." : "Upload & Xác nhận"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default XuatKho;

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Eye,
  FileText,
  Check,
  X,
  Search,
  ArrowUpFromLine,
  Upload,
  CheckCircle,
  Download,
  FileDown,
  Edit,
  MoreVertical,
} from "lucide-react";
import { xuatKhoService } from "../services/xuatKhoService";
import { formatCurrency, formatDate } from "../utils/helpers";
import { TRANG_THAI_PHIEU, LOAI_PHIEU_XUAT } from "../utils/constants";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import XuatKhoForm from "../components/forms/XuatKhoForm";
import EditXuatKhoForm from "../components/forms/EditXuatKhoForm";
import Loading from "../components/common/Loading";
import PhieuXuatDetail from "../components/details/PhieuXuatDetail";
import PrintPhieuXuatForm from "../components/forms/PrintPhieuXuatForm";
import toast from "react-hot-toast";

// Component Dropdown Actions - Cập nhật theo quy trình mới
const ActionDropdown = ({ phieu, onAction }) => {
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

  const actions = [
    {
      key: "view",
      label: "Xem chi tiết",
      icon: Eye,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: true,
    },
    {
      key: "edit",
      label: "Sửa phiếu",
      icon: Edit,
      color: "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50",
      show: phieu.trang_thai !== "completed", // Chỉ cho sửa khi chưa hoàn thành
    },
    {
      key: "approve",
      label: "Duyệt phiếu",
      icon: Check,
      color: "text-green-600 hover:text-green-800 hover:bg-green-50",
      show: phieu.trang_thai === "draft",
    },
    {
      key: "cancel",
      label: "Hủy phiếu",
      icon: X,
      color: "text-red-600 hover:text-red-800 hover:bg-red-50",
      show: phieu.trang_thai === "draft",
    },
    {
      key: "upload",
      label: "Upload quyết định",
      icon: Upload,
      color: "text-purple-600 hover:text-purple-800 hover:bg-purple-50",
      show: phieu.trang_thai === "approved",
    },
    {
      key: "complete",
      label: "Hoàn thành",
      icon: CheckCircle,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: phieu.trang_thai === "approved" && phieu.decision_pdf_url,
    },
    {
      key: "download",
      label: "Tải quyết định",
      icon: FileDown,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: phieu.decision_pdf_url,
    },
    {
      key: "print",
      label: "In phiếu",
      icon: FileText,
      color: "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
      show: true,
    },
  ];

  const visibleActions = actions.filter((action) => action.show);

  const handleActionClick = (actionKey) => {
    setIsOpen(false);
    onAction(actionKey, phieu.id);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
        title="Thao tác"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-none overflow-visible">
          {visibleActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => handleActionClick(action.key)}
                className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-all first:rounded-t-lg last:rounded-b-lg ${action.color}`}
              >
                <IconComponent size={14} />
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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    tu_ngay: "",
    den_ngay: "",
    trang_thai: "",
    loai_xuat: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "ngay_xuat",
    direction: "desc",
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Data states
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [editPhieuId, setEditPhieuId] = useState(null);
  const [printPhieuId, setPrintPhieuId] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const phieuXuatList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await xuatKhoService.getList({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        sort_by: sortConfig.key,
        sort_direction: sortConfig.direction,
        ...filters,
      });
      setData(response);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu phiếu xuất");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const getTrangThaiColor = (trangThai) => {
    const config = TRANG_THAI_PHIEU[trangThai] || {};
    const colorMap = {
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      yellow: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
  };

  // Action handlers
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

  const handleEditPhieu = async (id) => {
    try {
      const response = await xuatKhoService.getDetail(id);
      setSelectedPhieu(response.data);
      setEditPhieuId(id);
      setShowEditModal(true);
    } catch (error) {
      console.error("Error fetching edit data:", error);
      toast.error("Không thể tải dữ liệu để chỉnh sửa");
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm("Bạn có chắc muốn duyệt phiếu xuất này?")) {
      try {
        await xuatKhoService.approve(id);
        toast.success("Duyệt phiếu xuất thành công");
        fetchData();
      } catch (error) {
        console.error("Error approving:", error);
        toast.error(
          error.response?.data?.message || "Không thể duyệt phiếu xuất"
        );
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Bạn có chắc muốn hủy phiếu xuất này?")) {
      try {
        await xuatKhoService.cancel(id);
        toast.success("Hủy phiếu xuất thành công");
        fetchData();
      } catch (error) {
        console.error("Error canceling:", error);
        toast.error("Không thể hủy phiếu xuất");
      }
    }
  };

  const handleUploadDecision = async (id) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        toast.error("Chỉ chấp nhận file PDF");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File không được vượt quá 10MB");
        return;
      }

      const ghiChu = prompt("Nhập ghi chú (không bắt buộc):");

      const formData = new FormData();
      formData.append("decision_pdf", file);
      formData.append("ghi_chu_xac_nhan", ghiChu || "");

      try {
        await xuatKhoService.uploadDecision(id, formData);
        toast.success("Upload quyết định thành công");
        fetchData();
      } catch (error) {
        console.error("Error uploading decision:", error);
        toast.error("Không thể upload quyết định");
      }
    };

    input.click();
  };

  const handleDownloadDecision = async (id) => {
    try {
      const response = await xuatKhoService.downloadDecision(id);
      const { url, filename } = response.data;

      const link = document.createElement("a");
      link.href = `http://localhost:5000${url}`;
      link.download = filename || "quyet_dinh_xuat.pdf";
      link.target = "_blank";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Đang tải file...");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Không thể tải file");
    }
  };

  const handleComplete = async (id) => {
    if (
      window.confirm(
        "Bạn có chắc muốn hoàn thành phiếu xuất này? Tồn kho sẽ được điều chỉnh theo số lượng thực xuất."
      )
    ) {
      try {
        await xuatKhoService.complete(id);
        toast.success("Hoàn thành phiếu xuất thành công");
        fetchData();
      } catch (error) {
        console.error("Error completing:", error);
        toast.error("Không thể hoàn thành phiếu xuất");
      }
    }
  };

  const handlePrintPhieu = (id) => {
    setPrintPhieuId(id);
    setShowPrintModal(true);
  };

  // Main action handler for dropdown
  const handleActionClick = (actionKey, phieuId) => {
    switch (actionKey) {
      case "view":
        handleViewDetail(phieuId);
        break;
      case "edit":
        handleEditPhieu(phieuId);
        break;
      case "approve":
        handleApprove(phieuId);
        break;
      case "cancel":
        handleCancel(phieuId);
        break;
      case "upload":
        handleUploadDecision(phieuId);
        break;
      case "complete":
        handleComplete(phieuId);
        break;
      case "download":
        handleDownloadDecision(phieuId);
        break;
      case "print":
        handlePrintPhieu(phieuId);
        break;
      default:
        break;
    }
  };

  // Form handlers
  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowPrintModal(false);
    setSelectedPhieu(null);
    setEditPhieuId(null);
    setPrintPhieuId(null);
    fetchData();
  };

  const handleFormCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowPrintModal(false);
    setSelectedPhieu(null);
    setEditPhieuId(null);
    setPrintPhieuId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <ArrowUpFromLine className="mr-2 h-5 w-5 text-red-600" />
            Quản lý xuất kho
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý các phiếu xuất hàng ra khỏi kho
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>Tạo phiếu xuất</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
                placeholder="Tìm theo số quyết định hoặc đơn vị nhận..."
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.trang_thai}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, trang_thai: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(TRANG_THAI_PHIEU).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại phiếu
            </label>
            <select
              value={filters.loai_xuat}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, loai_xuat: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(LOAI_PHIEU_XUAT).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loading size="large" />
          </div>
        ) : (
          <>
            <div className="w-full">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {/* <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("so_phieu")}
                    >
                      Số phiếu {getSortIcon("so_phieu")}
                    </th> */}
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("so_quyet_dinh")}
                    >
                      Số qđ {getSortIcon("so_quyet_dinh")}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("ngay_xuat")}
                    >
                      Ngày xuất {getSortIcon("ngay_xuat")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Loại phiếu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Đơn vị nhận
                    </th>
                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Người nhận
                    </th> */}
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("tong_tien")}
                    >
                      Tổng tiền {getSortIcon("tong_tien")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Quyết định
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-16">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {phieuXuatList.map((phieu) => (
                    <tr
                      key={phieu.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {phieu.so_phieu}
                        </div>
                      </td> */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {phieu.so_quyet_dinh || "Chưa có"}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(phieu.ngay_xuat)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {LOAI_PHIEU_XUAT[phieu.loai_xuat] || "Cấp phát"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {phieu.don_vi_nhan?.ten_don_vi || "Chưa có"}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-red-600">
                          {formatCurrency(phieu.tong_tien)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {phieu.decision_pdf_url ? (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleDownloadDecision(phieu.id)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                                title={`Tải về: ${
                                  phieu.decision_pdf_filename || "Quyết định"
                                }`}
                              >
                                <FileDown size={14} />
                              </button>
                              {phieu.ghi_chu_xac_nhan && (
                                <span
                                  className="text-xs text-gray-500 cursor-help"
                                  title={phieu.ghi_chu_xac_nhan}
                                >
                                  📝
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={getTrangThaiColor(phieu.trang_thai)}>
                          {TRANG_THAI_PHIEU[phieu.trang_thai]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <ActionDropdown
                          phieu={phieu}
                          onAction={handleActionClick}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {phieuXuatList.length === 0 && (
              <div className="text-center py-8">
                <ArrowUpFromLine className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Không có dữ liệu
                </h3>
                <p className="text-xs text-gray-500">
                  Chưa có phiếu xuất nào được tạo.
                </p>
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

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo phiếu xuất kho"
        size="xl"
      >
        <XuatKhoForm
          mode="create"
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="xl"
      >
        {selectedPhieu && <PhieuXuatDetail phieu={selectedPhieu} />}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Sửa phiếu xuất: ${selectedPhieu?.so_phieu || "Loading..."}`}
        size="xl"
      >
        {editPhieuId && (
          <EditXuatKhoForm
            phieuId={editPhieuId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </Modal>

      {/* Print Modal */}
      <Modal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="In phiếu xuất kho"
        size="md"
      >
        <PrintPhieuXuatForm
          phieuId={printPhieuId}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>
    </div>
  );
};

export default XuatKho;
