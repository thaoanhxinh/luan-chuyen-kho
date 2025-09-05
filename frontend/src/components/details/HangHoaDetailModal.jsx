// import React, { useState, useEffect } from "react";
// import {
//   Package,
//   TrendingUp,
//   TrendingDown,
//   BarChart3,
//   DollarSign,
//   Building,
//   Tag,
//   Download,
//   Upload,
//   History,
// } from "lucide-react";
// import { hangHoaService } from "../../services/hangHoaService";
// import { formatCurrency, formatDate } from "../../utils/helpers";
// import { PHAM_CHAT, TRANG_THAI_PHIEU } from "../../utils/constants";
// import Modal from "../common/Modal";
// import Loading from "../common/Loading";
// import toast from "react-hot-toast";

// const HangHoaDetailModal = ({ hangHoaId, isOpen, onClose }) => {
//   const [hangHoa, setHangHoa] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("statistics");
//   const [timePeriod, setTimePeriod] = useState("thang");

//   useEffect(() => {
//     if (isOpen && hangHoaId) {
//       loadHangHoaDetail();
//     }
//   }, [isOpen, hangHoaId]);

//   const loadHangHoaDetail = async () => {
//     try {
//       setLoading(true);
//       const response = await hangHoaService.getDetail(hangHoaId);
//       setHangHoa(response.data);
//     } catch (error) {
//       console.error("Error loading hang hoa detail:", error);
//       toast.error("Không thể tải chi tiết hàng hóa");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getPhamChatColor = (phamChat) => {
//     const config = PHAM_CHAT[phamChat] || {};
//     const colorMap = {
//       green: "bg-green-100 text-green-800",
//       yellow: "bg-yellow-100 text-yellow-800",
//       orange: "bg-orange-100 text-orange-800",
//       red: "bg-red-100 text-red-800",
//       gray: "bg-gray-100 text-gray-800",
//     };
//     return `inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
//       colorMap[config.color] || colorMap.gray
//     }`;
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
//     return `inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
//       colorMap[config.color] || colorMap.gray
//     }`;
//   };

//   const formatInteger = (value) => {
//     if (!value) return "0";
//     return Math.floor(value).toLocaleString();
//   };

//   const getInventorySerials = () => {
//     if (!hangHoa?.danh_sach_seri) return [];
//     return hangHoa.danh_sach_seri
//       .filter((seri) => seri.trang_thai === "ton_kho")
//       .map((seri) => ({
//         so_seri: seri.so_seri,
//         ngay_nhap: seri.ngay_nhap,
//         don_gia: seri.don_gia,
//         pham_chat: seri.pham_chat,
//         so_phieu: seri.so_phieu,
//       }));
//   };

//   const getStatsByPeriod = () => {
//     if (!hangHoa?.thong_ke) return { nhap: [], xuat: [] };

//     switch (timePeriod) {
//       case "thang":
//         return {
//           nhap: hangHoa.thong_ke.nhap_theo_thang || [],
//           xuat: hangHoa.thong_ke.xuat_theo_thang || [],
//         };
//       case "quy":
//         return {
//           nhap: hangHoa.thong_ke.nhap_theo_quy || [],
//           xuat: hangHoa.thong_ke.xuat_theo_quy || [],
//         };
//       case "nam":
//         return {
//           nhap: hangHoa.thong_ke.nhap_theo_nam || [],
//           xuat: hangHoa.thong_ke.xuat_theo_nam || [],
//         };
//       default:
//         return { nhap: [], xuat: [] };
//     }
//   };

//   const formatPeriodLabel = (item) => {
//     switch (timePeriod) {
//       case "thang":
//         return `${item.thang}/${item.nam}`;
//       case "quy":
//         return `Q${item.quy}/${item.nam}`;
//       case "nam":
//         return `${item.nam}`;
//       default:
//         return "";
//     }
//   };

//   // Lọc chỉ các phiếu đã hoàn thành
//   const getCompletedImportHistory = () => {
//     if (!hangHoa?.cac_dot_nhap) return [];
//     return hangHoa.cac_dot_nhap.filter(
//       (batch) => batch.trang_thai === "completed"
//     );
//   };

//   const getCompletedExportHistory = () => {
//     if (!hangHoa?.lich_su_xuat) return [];
//     return hangHoa.lich_su_xuat.filter(
//       (record) => record.trang_thai === "completed"
//     );
//   };

//   const getCompletedPriceHistory = () => {
//     if (!hangHoa?.lich_su_gia) return [];
//     return hangHoa.lich_su_gia.filter(
//       (price) => price.trang_thai === "completed"
//     );
//   };

//   if (loading) {
//     return (
//       <Modal
//         isOpen={isOpen}
//         onClose={onClose}
//         title="Chi tiết hàng hóa"
//         size="xl"
//       >
//         <div className="flex items-center justify-center py-12">
//           <Loading size="large" />
//         </div>
//       </Modal>
//     );
//   }

//   if (!hangHoa) {
//     return (
//       <Modal
//         isOpen={isOpen}
//         onClose={onClose}
//         title="Chi tiết hàng hóa"
//         size="xl"
//       >
//         <div className="text-center py-12">
//           <p className="text-gray-500">Không tìm thấy dữ liệu hàng hóa</p>
//         </div>
//       </Modal>
//     );
//   }

//   const inventorySerials = getInventorySerials();
//   const statsData = getStatsByPeriod();
//   const completedImportHistory = getCompletedImportHistory();
//   const completedExportHistory = getCompletedExportHistory();
//   const completedPriceHistory = getCompletedPriceHistory();

//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={onClose}
//       title={`Chi tiết: ${hangHoa.ten_hang_hoa}`}
//       size="xl"
//     >
//       <div className="space-y-4">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
//           <div className="flex items-start justify-between">
//             <div className="flex items-start space-x-3">
//               <div className="p-2 bg-blue-100 rounded-lg">
//                 <Package className="h-6 w-6 text-blue-600" />
//               </div>
//               <div>
//                 <h2 className="text-xl font-bold text-gray-900">
//                   {hangHoa.ten_hang_hoa}
//                 </h2>
//                 <p className="text-gray-600">Mã: {hangHoa.ma_hang_hoa}</p>
//                 <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
//                   <span className="flex items-center">
//                     <Building className="h-3 w-3 mr-1" />
//                     {hangHoa.ten_phong_ban}
//                   </span>
//                   <span className="flex items-center">
//                     <Tag className="h-3 w-3 mr-1" />
//                     {hangHoa.ten_loai}
//                   </span>
//                   <span>Đơn vị: {hangHoa.don_vi_tinh}</span>
//                 </div>
//               </div>
//             </div>
//             <div className="text-right">
//               <div className="text-xs text-gray-500">Giá nhập gần nhất</div>
//               <div className="text-lg font-bold text-green-600">
//                 {formatCurrency(hangHoa.gia_nhap_gan_nhat || 0)}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Quick Stats */}
//         <div className="grid grid-cols-3 gap-3">
//           <div className="bg-green-50 p-3 rounded-lg border border-green-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <div className="text-xs text-green-600 font-medium">
//                   Tồn kho
//                 </div>
//                 <div className="text-lg font-bold text-green-800">
//                   {formatInteger(hangHoa.thong_ke?.tong_con_ton || 0)}
//                 </div>
//               </div>
//               <Package className="h-5 w-5 text-green-600" />
//             </div>
//           </div>

//           <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <div className="text-xs text-blue-600 font-medium">Đã nhập</div>
//                 <div className="text-lg font-bold text-blue-800">
//                   {formatInteger(hangHoa.thong_ke?.tong_da_nhap || 0)}
//                 </div>
//               </div>
//               <Download className="h-5 w-5 text-blue-600" />
//             </div>
//           </div>

//           <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <div className="text-xs text-orange-600 font-medium">
//                   Đã xuất
//                 </div>
//                 <div className="text-lg font-bold text-orange-800">
//                   {formatInteger(hangHoa.thong_ke?.tong_da_xuat || 0)}
//                 </div>
//               </div>
//               <Upload className="h-5 w-5 text-orange-600" />
//             </div>
//           </div>
//         </div>

//         {/* Quality breakdown */}
//         {hangHoa.so_luong_ton && (
//           <div className="flex flex-wrap gap-2">
//             {[
//               { key: "sl_tot", label: "Tốt", color: "green" },
//               { key: "sl_kem_pham_chat", label: "Kém", color: "yellow" },
//               { key: "sl_mat_pham_chat", label: "Mất", color: "orange" },
//               //{ key: "sl_hong", label: "Hỏng", color: "red" },
//               //{ key: "sl_can_thanh_ly", label: "Thanh lý", color: "gray" },
//             ].map(({ key, label, color }) => (
//               <div
//                 key={key}
//                 className={`inline-flex items-center px-2 py-1 rounded-md bg-${color}-50 border border-${color}-200`}
//               >
//                 <span className={`text-xs text-${color}-600 mr-1`}>
//                   {label}:
//                 </span>
//                 <span className={`text-xs font-semibold text-${color}-800`}>
//                   {formatInteger(hangHoa[key])}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Tabs */}
//         <div className="border-b border-gray-200">
//           <nav className="-mb-px flex space-x-6">
//             {[
//               { id: "statistics", label: "Thống kê", icon: BarChart3 },
//               {
//                 id: "import-history",
//                 label: `Lịch sử nhập (${completedImportHistory.length})`,
//                 icon: Download,
//               },
//               {
//                 id: "export-history",
//                 label: `Lịch sử xuất (${completedExportHistory.length})`,
//                 icon: Upload,
//               },
//               {
//                 id: "price-history",
//                 label: `Lịch sử giá (${completedPriceHistory.length})`,
//                 icon: DollarSign,
//               },
//               ...(hangHoa.co_so_seri
//                 ? [
//                     {
//                       id: "serial",
//                       label: `Số seri (${inventorySerials.length})`,
//                       icon: Tag,
//                     },
//                   ]
//                 : []),
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
//                   activeTab === tab.id
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 {tab.icon && <tab.icon className="h-4 w-4 mr-1" />}
//                 {tab.label}
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Tab Content */}
//         <div className="mt-4">
//           {activeTab === "statistics" && (
//             <div className="space-y-4">
//               {/* Time Period Selector */}
//               <div className="flex justify-between items-center">
//                 <h3 className="text-md font-semibold text-gray-900">
//                   Thống kê nhập xuất (chỉ phiếu hoàn thành)
//                 </h3>
//                 <div className="flex space-x-1">
//                   {[
//                     { value: "thang", label: "Tháng" },
//                     { value: "quy", label: "Quý" },
//                     { value: "nam", label: "Năm" },
//                   ].map((period) => (
//                     <button
//                       key={period.value}
//                       onClick={() => setTimePeriod(period.value)}
//                       className={`px-3 py-1 text-xs rounded-md ${
//                         timePeriod === period.value
//                           ? "bg-blue-100 text-blue-700 border border-blue-300"
//                           : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//                       }`}
//                     >
//                       {period.label}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Statistics Tables */}
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//                 {/* Import Statistics */}
//                 <div className="bg-white border rounded-lg overflow-hidden">
//                   <div className="px-3 py-2 bg-blue-50 border-b">
//                     <h4 className="font-medium text-blue-900 flex items-center text-sm">
//                       <Download className="h-4 w-4 mr-1" />
//                       Thống kê nhập
//                     </h4>
//                   </div>
//                   <div className="overflow-x-auto">
//                     <table className="w-full text-xs">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th className="px-3 py-2 text-left font-medium text-gray-500">
//                             Thời gian
//                           </th>
//                           <th className="px-3 py-2 text-right font-medium text-gray-500">
//                             SL nhập
//                           </th>
//                           <th className="px-3 py-2 text-right font-medium text-gray-500">
//                             Phiếu
//                           </th>
//                           <th className="px-3 py-2 text-right font-medium text-gray-500">
//                             Giá trị
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-gray-200">
//                         {statsData.nhap.length > 0 ? (
//                           statsData.nhap.map((item, index) => (
//                             <tr key={index} className="hover:bg-gray-50">
//                               <td className="px-3 py-2 font-medium">
//                                 {formatPeriodLabel(item)}
//                               </td>
//                               <td className="px-3 py-2 text-right text-blue-600 font-medium">
//                                 {formatInteger(item.so_luong_nhap)}
//                               </td>
//                               <td className="px-3 py-2 text-right">
//                                 {item.so_phieu_nhap || 0}
//                               </td>
//                               <td className="px-3 py-2 text-right text-green-600 font-medium">
//                                 {formatCurrency(item.gia_tri_nhap)}
//                               </td>
//                             </tr>
//                           ))
//                         ) : (
//                           <tr>
//                             <td
//                               colSpan="4"
//                               className="px-3 py-6 text-center text-gray-500"
//                             >
//                               Chưa có dữ liệu
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>

//                 {/* Export Statistics */}
//                 <div className="bg-white border rounded-lg overflow-hidden">
//                   <div className="px-3 py-2 bg-orange-50 border-b">
//                     <h4 className="font-medium text-orange-900 flex items-center text-sm">
//                       <Upload className="h-4 w-4 mr-1" />
//                       Thống kê xuất
//                     </h4>
//                   </div>
//                   <div className="overflow-x-auto">
//                     <table className="w-full text-xs">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th className="px-3 py-2 text-left font-medium text-gray-500">
//                             Thời gian
//                           </th>
//                           <th className="px-3 py-2 text-right font-medium text-gray-500">
//                             SL xuất
//                           </th>
//                           <th className="px-3 py-2 text-right font-medium text-gray-500">
//                             Phiếu
//                           </th>
//                           <th className="px-3 py-2 text-right font-medium text-gray-500">
//                             Giá trị
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-gray-200">
//                         {statsData.xuat.length > 0 ? (
//                           statsData.xuat.map((item, index) => (
//                             <tr key={index} className="hover:bg-gray-50">
//                               <td className="px-3 py-2 font-medium">
//                                 {formatPeriodLabel(item)}
//                               </td>
//                               <td className="px-3 py-2 text-right text-orange-600 font-medium">
//                                 {formatInteger(item.so_luong_xuat)}
//                               </td>
//                               <td className="px-3 py-2 text-right">
//                                 {item.so_phieu_xuat || 0}
//                               </td>
//                               <td className="px-3 py-2 text-right text-green-600 font-medium">
//                                 {formatCurrency(item.gia_tri_xuat)}
//                               </td>
//                             </tr>
//                           ))
//                         ) : (
//                           <tr>
//                             <td
//                               colSpan="4"
//                               className="px-3 py-6 text-center text-gray-500"
//                             >
//                               Chưa có dữ liệu
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {activeTab === "import-history" && (
//             <div className="bg-white border rounded-lg overflow-hidden">
//               <div className="px-4 py-3 border-b border-gray-200">
//                 <h3 className="text-md font-semibold text-gray-900 flex items-center">
//                   <Download className="h-4 w-4 mr-2 text-blue-600" />
//                   Lịch sử nhập hàng (chỉ phiếu hoàn thành)
//                 </h3>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="w-full text-sm">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Số phiếu
//                       </th>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Ngày nhập
//                       </th>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Nhà cung cấp
//                       </th>
//                       <th className="px-4 py-2 text-right font-medium text-gray-500">
//                         Số lượng
//                       </th>
//                       <th className="px-4 py-2 text-right font-medium text-gray-500">
//                         Đơn giá
//                       </th>
//                       <th className="px-4 py-2 text-center font-medium text-gray-500">
//                         Phẩm chất
//                       </th>
//                       <th className="px-4 py-2 text-right font-medium text-gray-500">
//                         Thành tiền
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {completedImportHistory.map((batch, index) => (
//                       <tr key={index} className="hover:bg-gray-50">
//                         <td className="px-4 py-2 font-medium text-gray-900">
//                           {batch.so_phieu}
//                         </td>
//                         <td className="px-4 py-2">
//                           {formatDate(batch.ngay_nhap)}
//                         </td>
//                         <td className="px-4 py-2">
//                           {batch.ten_ncc || "Chưa có"}
//                         </td>
//                         <td className="px-4 py-2 text-right">
//                           {formatInteger(batch.so_luong)}
//                         </td>
//                         <td className="px-4 py-2 text-right font-medium text-green-600">
//                           {formatCurrency(batch.don_gia)}
//                         </td>
//                         <td className="px-4 py-2 text-center">
//                           <span className={getPhamChatColor(batch.pham_chat)}>
//                             {PHAM_CHAT[batch.pham_chat]?.label ||
//                               batch.pham_chat}
//                           </span>
//                         </td>
//                         <td className="px-4 py-2 text-right font-medium text-gray-900">
//                           {formatCurrency(batch.thanh_tien)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//               {completedImportHistory.length === 0 && (
//                 <div className="text-center py-8">
//                   <p className="text-gray-500">
//                     Chưa có lịch sử nhập hàng hoàn thành
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === "export-history" && (
//             <div className="bg-white border rounded-lg overflow-hidden">
//               <div className="px-4 py-3 border-b border-gray-200">
//                 <h3 className="text-md font-semibold text-gray-900 flex items-center">
//                   <Upload className="h-4 w-4 mr-2 text-orange-600" />
//                   Lịch sử xuất hàng (chỉ phiếu hoàn thành)
//                 </h3>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="w-full text-sm">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Số phiếu
//                       </th>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Ngày xuất
//                       </th>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Đơn vị nhận
//                       </th>
//                       <th className="px-4 py-2 text-right font-medium text-gray-500">
//                         SL yêu cầu
//                       </th>
//                       <th className="px-4 py-2 text-right font-medium text-gray-500">
//                         SL thực xuất
//                       </th>
//                       <th className="px-4 py-2 text-right font-medium text-gray-500">
//                         Đơn giá
//                       </th>
//                       <th className="px-4 py-2 text-center font-medium text-gray-500">
//                         Phẩm chất
//                       </th>
//                       <th className="px-4 py-2 text-right font-medium text-gray-500">
//                         Thành tiền
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {completedExportHistory.map((record, index) => (
//                       <tr key={index} className="hover:bg-gray-50">
//                         <td className="px-4 py-2 font-medium text-gray-900">
//                           {record.so_phieu}
//                         </td>
//                         <td className="px-4 py-2">
//                           {formatDate(record.ngay_xuat)}
//                         </td>
//                         <td className="px-4 py-2">
//                           {record.ten_don_vi || "Chưa có"}
//                         </td>
//                         <td className="px-4 py-2 text-right">
//                           {formatInteger(record.so_luong_yeu_cau)}
//                         </td>
//                         <td className="px-4 py-2 text-right font-medium text-orange-600">
//                           {formatInteger(record.so_luong_thuc_xuat)}
//                         </td>
//                         <td className="px-4 py-2 text-right font-medium text-green-600">
//                           {formatCurrency(record.don_gia)}
//                         </td>
//                         <td className="px-4 py-2 text-center">
//                           <span className={getPhamChatColor(record.pham_chat)}>
//                             {PHAM_CHAT[record.pham_chat]?.label ||
//                               record.pham_chat}
//                           </span>
//                         </td>
//                         <td className="px-4 py-2 text-right font-medium text-gray-900">
//                           {formatCurrency(record.thanh_tien)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//               {completedExportHistory.length === 0 && (
//                 <div className="text-center py-8">
//                   <p className="text-gray-500">
//                     Chưa có lịch sử xuất hàng hoàn thành
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === "price-history" && (
//             <div className="bg-white border rounded-lg overflow-hidden">
//               <div className="px-4 py-3 border-b border-gray-200">
//                 <h3 className="text-md font-semibold text-gray-900">
//                   Lịch sử giá
//                 </h3>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="w-full text-sm">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Ngày áp dụng
//                       </th>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Số phiếu
//                       </th>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Nhà cung cấp
//                       </th>
//                       <th className="px-4 py-2 text-right font-medium text-gray-500">
//                         Đơn giá
//                       </th>
//                       <th className="px-4 py-2 text-center font-medium text-gray-500">
//                         Nguồn giá
//                       </th>
//                       <th className="px-4 py-2 text-center font-medium text-gray-500">
//                         Trạng thái
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {hangHoa.lich_su_gia?.map((price, index) => (
//                       <tr key={index} className="hover:bg-gray-50">
//                         <td className="px-4 py-2">
//                           {formatDate(price.ngay_ap_dung)}
//                         </td>
//                         <td className="px-4 py-2 font-medium text-gray-900">
//                           {price.so_phieu}
//                         </td>
//                         <td className="px-4 py-2">
//                           {price.ten_ncc || "Chưa có"}
//                         </td>
//                         <td className="px-4 py-2 text-right font-medium text-green-600">
//                           {formatCurrency(price.don_gia)}
//                         </td>
//                         <td className="px-4 py-2 text-center">
//                           <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
//                             {price.nguon_gia}
//                           </span>
//                         </td>
//                         <td className="px-4 py-2 text-center">
//                           <span className={getTrangThaiColor(price.trang_thai)}>
//                             {TRANG_THAI_PHIEU[price.trang_thai]?.label ||
//                               price.trang_thai}
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//               {(!hangHoa.lich_su_gia || hangHoa.lich_su_gia.length === 0) && (
//                 <div className="text-center py-8">
//                   <p className="text-gray-500">Chưa có lịch sử giá</p>
//                 </div>
//               )}
//             </div>
//           )}
//           {activeTab === "serial" && hangHoa.co_so_seri && (
//             <div className="bg-white border rounded-lg overflow-hidden">
//               <div className="px-4 py-3 border-b border-gray-200">
//                 <h3 className="text-md font-semibold text-gray-900 flex items-center">
//                   <Tag className="h-4 w-4 mr-2 text-blue-600" />
//                   Danh sách số seri tồn kho
//                 </h3>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="w-full text-sm">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Số seri
//                       </th>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Số phiếu
//                       </th>
//                       <th className="px-4 py-2 text-left font-medium text-gray-500">
//                         Ngày nhập
//                       </th>
//                       <th className="px-4 py-2 text-right font-medium text-gray-500">
//                         Đơn giá
//                       </th>
//                       <th className="px-4 py-2 text-center font-medium text-gray-500">
//                         Phẩm chất
//                       </th>
//                       <th className="px-4 py-2 text-center font-medium text-gray-500">
//                         Trạng thái
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {inventorySerials.map((seri, index) => (
//                       <tr key={index} className="hover:bg-gray-50">
//                         <td className="px-4 py-2 font-medium text-gray-900">
//                           {seri.so_seri}
//                         </td>
//                         <td className="px-4 py-2">{seri.so_phieu}</td>
//                         <td className="px-4 py-2">
//                           {formatDate(seri.ngay_nhap)}
//                         </td>
//                         <td className="px-4 py-2 text-right font-medium text-green-600">
//                           {formatCurrency(seri.don_gia)}
//                         </td>
//                         <td className="px-4 py-2 text-center">
//                           <span className={getPhamChatColor(seri.pham_chat)}>
//                             {PHAM_CHAT[seri.pham_chat]?.label || seri.pham_chat}
//                           </span>
//                         </td>
//                         <td className="px-4 py-2 text-center">
//                           <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
//                             Tồn kho
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//               {inventorySerials.length === 0 && (
//                 <div className="text-center py-8">
//                   <p className="text-gray-500">
//                     Không có số seri nào đang tồn kho
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </Modal>
//   );
// };

// export default HangHoaDetailModal;

import React, { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Building,
  Tag,
  Download,
  Upload,
  History,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { hangHoaService } from "../../services/hangHoaService";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { PHAM_CHAT, TRANG_THAI_PHIEU } from "../../utils/constants";
import Modal from "../common/Modal";
import Loading from "../common/Loading";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// Component con cho inventory breakdown
const InventoryBreakdownModal = ({ hangHoaId, isOpen, onClose }) => {
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && hangHoaId) {
      loadInventoryBreakdown();
    }
  }, [isOpen, hangHoaId]);

  const loadInventoryBreakdown = async () => {
    try {
      setLoading(true);
      const response = await hangHoaService.getInventoryBreakdown(hangHoaId);
      setBreakdown(response.data || []);
    } catch (error) {
      console.error("Error loading inventory breakdown:", error);
      toast.error("Không thể tải chi tiết tồn kho theo phòng ban");
    } finally {
      setLoading(false);
    }
  };

  const getTotalsByLevel = (level) => {
    return breakdown
      .filter((item) => item.cap_bac === level)
      .reduce(
        (acc, item) => ({
          so_luong_ton: acc.so_luong_ton + (item.so_luong_ton || 0),
          gia_tri_ton: acc.gia_tri_ton + (item.gia_tri_ton || 0),
          so_phong_ban: acc.so_phong_ban + 1,
        }),
        { so_luong_ton: 0, gia_tri_ton: 0, so_phong_ban: 0 }
      );
  };

  if (loading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết tồn kho theo phòng ban"
        size="lg"
      >
        <div className="flex items-center justify-center py-12">
          <Loading size="large" />
        </div>
      </Modal>
    );
  }

  const cap2Stats = getTotalsByLevel(2);
  const cap3Stats = getTotalsByLevel(3);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết tồn kho theo phòng ban"
      size="lg"
    >
      <div className="space-y-6">
        {/* Tổng quan */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Phòng ban cấp 2</p>
                <p className="text-lg font-semibold text-gray-900">
                  {cap2Stats.so_phong_ban} phòng ban
                </p>
                <p className="text-xs text-gray-500">
                  Tổng: {cap2Stats.so_luong_ton.toLocaleString()} |{" "}
                  {formatCurrency(cap2Stats.gia_tri_ton)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Phòng ban cấp 3</p>
                <p className="text-lg font-semibold text-gray-900">
                  {cap3Stats.so_phong_ban} phòng ban
                </p>
                <p className="text-xs text-gray-500">
                  Tổng: {cap3Stats.so_luong_ton.toLocaleString()} |{" "}
                  {formatCurrency(cap3Stats.gia_tri_ton)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chi tiết theo từng phòng ban */}
        <div className="space-y-4">
          {breakdown.length > 0 ? (
            breakdown.map((dept) => (
              <div
                key={dept.phong_ban_id}
                className="bg-white border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        dept.cap_bac === 2 ? "bg-blue-100" : "bg-green-100"
                      }`}
                    >
                      {dept.cap_bac === 2 ? (
                        <Building className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Package className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {dept.ten_phong_ban}
                      </h4>
                      <p
                        className={`text-xs ${
                          dept.cap_bac === 2
                            ? "text-blue-600"
                            : "text-green-600"
                        }`}
                      >
                        Cấp {dept.cap_bac}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {(dept.so_luong_ton || 0).toLocaleString()}{" "}
                      {dept.don_vi_tinh || "đơn vị"}
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      {formatCurrency(dept.gia_tri_ton || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ĐG BQ: {formatCurrency(dept.don_gia_binh_quan || 0)}
                    </p>
                  </div>
                </div>

                {/* Thống kê chất lượng */}
                {(dept.sl_tot ||
                  dept.sl_kem_pham_chat ||
                  dept.sl_mat_pham_chat) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Phân loại chất lượng:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dept.sl_tot > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Tốt: {dept.sl_tot.toLocaleString()}
                        </span>
                      )}
                      {dept.sl_kem_pham_chat > 0 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          Kém: {dept.sl_kem_pham_chat.toLocaleString()}
                        </span>
                      )}
                      {dept.sl_mat_pham_chat > 0 && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                          Mất: {dept.sl_mat_pham_chat.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-500">
                Không có dữ liệu tồn kho theo phòng ban
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Component chính
const HangHoaDetailModal = ({ hangHoaId, phongBanId, isOpen, onClose }) => {
  const { user } = useAuth();
  const [hangHoa, setHangHoa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("statistics");
  const [timePeriod, setTimePeriod] = useState("thang");
  const [showInventoryBreakdown, setShowInventoryBreakdown] = useState(false);
  const isAggregatedView = !phongBanId;
  // Aggregated view helpers
  const [deptList, setDeptList] = useState([]); // [{phong_ban_id, ten_phong_ban}]
  const [deptStatsMap, setDeptStatsMap] = useState({}); // id -> {nhap_theo_thang/quy/nam, xuat_*}
  const [deptHierarchy, setDeptHierarchy] = useState({
    cap2ById: {},
    cap3ToCap2: {},
    cap2Order: [],
    cap3ByCap2: {},
    cap3List: [],
  });
  const [periodFilter, setPeriodFilter] = useState({
    mode: "thang", // thang | quy | nam
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: Math.ceil((new Date().getMonth() + 1) / 3),
  });

  useEffect(() => {
    if (isOpen && hangHoaId) {
      loadHangHoaDetail();
    }
  }, [isOpen, hangHoaId, phongBanId]);

  // Load list of departments and per-department stats when viewing All
  useEffect(() => {
    const loadAggregatedDeps = async () => {
      if (!isOpen || !hangHoaId) return;
      try {
        // Load hierarchy for grouping (cap2 -> cap3)
        try {
          const resHierarchy = await api.get("/bao-cao/phong-ban-list");
          const payload = resHierarchy?.data?.data || {};
          const cap2List = payload.cap2 || [];
          const cap3List = payload.cap3 || [];
          const backendHierarchy = payload.hierarchy || {};
          const cap2ById = {};
          const cap2Order = [];
          const cap3ToCap2 = {};
          const cap3ByCap2 = {};
          cap2List.forEach((c2) => {
            cap2ById[c2.id] = c2;
            cap2Order.push(c2.id);
            cap3ByCap2[c2.id] = [];
          });
          // Ưu tiên sử dụng hierarchy từ backend để đảm bảo đầy đủ các cấp 3 dưới mỗi cấp 2
          Object.keys(backendHierarchy).forEach((cap2IdStr) => {
            const cap2Id = parseInt(cap2IdStr);
            const children = backendHierarchy[cap2IdStr] || [];
            cap3ByCap2[cap2Id] = children.map((c3) => ({
              id: c3.id,
              ten_phong_ban: c3.ten_phong_ban,
              cap2_id: cap2Id,
            }));
            cap3ByCap2[cap2Id].forEach((c3) => (cap3ToCap2[c3.id] = cap2Id));
          });
          // Bổ sung bất kỳ cap3 rời rạc nào không có trong hierarchy
          cap3List.forEach((c3) => {
            if (c3.phong_ban_cha_id) {
              cap3ToCap2[c3.id] = c3.phong_ban_cha_id;
              if (!cap3ByCap2[c3.phong_ban_cha_id])
                cap3ByCap2[c3.phong_ban_cha_id] = [];
              if (
                !cap3ByCap2[c3.phong_ban_cha_id].some((x) => x.id === c3.id)
              ) {
                cap3ByCap2[c3.phong_ban_cha_id].push({
                  id: c3.id,
                  ten_phong_ban: c3.ten_phong_ban,
                  cap2_id: c3.phong_ban_cha_id,
                });
              }
            }
          });
          const hierarchyState = {
            cap2ById,
            cap3ToCap2,
            cap2Order,
            cap3ByCap2,
            cap3List,
          };
          setDeptHierarchy(hierarchyState);
        } catch (e) {
          // ignore hierarchy failures
        }

        // Get departments that currently have inventory for this item
        const resp = await hangHoaService.getInventoryBreakdown(hangHoaId);
        const list = (resp?.data || []).map((d) => ({
          id: d.phong_ban_id,
          ten_phong_ban: d.ten_phong_ban,
        }));
        setDeptList(list);

        // Load stats cho TẤT CẢ cấp 3 theo hierarchy mới lấy (không phụ thuộc state setDeptHierarchy)
        const allCap3 =
          cap3List && cap3List.length > 0
            ? cap3List.map((c3) => ({
                id: c3.id,
                ten_phong_ban: c3.ten_phong_ban,
              }))
            : list.map((x) => ({ id: x.id, ten_phong_ban: x.ten_phong_ban }));
        const promises = allCap3.map(async (dept) => {
          try {
            const detail = await hangHoaService.getDetail(hangHoaId, dept.id);
            const tk = detail?.data?.thong_ke || {};
            return [dept.id, tk];
          } catch (e) {
            return [dept.id, {}];
          }
        });
        const entries = await Promise.all(promises);
        const map = {};
        entries.forEach(([id, tk]) => (map[id] = tk));
        setDeptStatsMap(map);
      } catch (e) {
        // ignore
      }
    };
    loadAggregatedDeps();
  }, [isOpen, hangHoaId, user]);

  const loadHangHoaDetail = async () => {
    try {
      setLoading(true);
      let response;
      if (phongBanId) {
        response = await hangHoaService.getDetail(hangHoaId, phongBanId);
      } else {
        // Aggregated view: lấy chi tiết tổng hợp của hàng hóa
        response = await hangHoaService.getById(hangHoaId);
      }
      setHangHoa(response.data);
    } catch (error) {
      console.error("Error loading hang hoa detail:", error);
      toast.error("Không thể tải chi tiết hàng hóa");
    } finally {
      setLoading(false);
    }
  };

  // Cho phép thiếu phongBanId (xem tổng hợp). Chỉ chặn khi thiếu hangHoaId
  if (isOpen && !hangHoaId) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết hàng hóa"
        size="xl"
      >
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
          <p className="text-red-500 mb-2">Thiếu mã hàng hóa</p>
        </div>
      </Modal>
    );
  }

  const getPhamChatColor = (phamChat) => {
    const config = PHAM_CHAT[phamChat] || {};
    const colorMap = {
      green: "bg-green-100 text-green-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      red: "bg-red-100 text-red-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return `inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
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
    return `inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
  };

  const formatInteger = (value) => {
    if (!value) return "0";
    return Math.floor(value).toLocaleString();
  };

  const getInventorySerials = () => {
    if (!hangHoa?.danh_sach_seri) return [];
    return hangHoa.danh_sach_seri
      .filter((seri) => seri.trang_thai === "ton_kho")
      .map((seri) => ({
        so_seri: seri.so_seri,
        ngay_nhap: seri.ngay_nhap,
        don_gia: seri.don_gia,
        pham_chat: seri.pham_chat,
        so_phieu: seri.so_phieu,
      }));
  };

  const getStatsByPeriod = () => {
    if (!hangHoa?.thong_ke) return { nhap: [], xuat: [] };

    switch (timePeriod) {
      case "thang":
        return {
          nhap: hangHoa.thong_ke.nhap_theo_thang || [],
          xuat: hangHoa.thong_ke.xuat_theo_thang || [],
        };
      case "quy":
        return {
          nhap: hangHoa.thong_ke.nhap_theo_quy || [],
          xuat: hangHoa.thong_ke.xuat_theo_quy || [],
        };
      case "nam":
        return {
          nhap: hangHoa.thong_ke.nhap_theo_nam || [],
          xuat: hangHoa.thong_ke.xuat_theo_nam || [],
        };
      default:
        return { nhap: [], xuat: [] };
    }
  };

  const getPeriodTotalsFromArrays = (tk, filter) => {
    if (!tk) return { slNhap: 0, gtNhap: 0, slXuat: 0, gtXuat: 0 };
    const mode = filter.mode;
    const pick = (arr, keyMonth, keyQuarter, keyYear, qtyKey, valKey) => {
      if (!Array.isArray(arr)) return 0;
      if (mode === "thang") {
        const f = arr.find(
          (i) =>
            parseInt(i[keyMonth]) === filter.month &&
            parseInt(i[keyYear]) === filter.year
        );
        return f ? parseFloat(f[valKey]) || 0 : 0;
      }
      if (mode === "quy") {
        const f = arr.find(
          (i) =>
            parseInt(i[keyQuarter]) === filter.quarter &&
            parseInt(i[keyYear]) === filter.year
        );
        return f ? parseFloat(f[valKey]) || 0 : 0;
      }
      const f = arr.find((i) => parseInt(i[keyYear]) === filter.year);
      return f ? parseFloat(f[valKey]) || 0 : 0;
    };

    const slNhap = pick(
      tk.nhap_theo_thang || tk.thong_ke_thang,
      "thang",
      "quy",
      "nam",
      "so_luong_nhap" || "tong_so_luong",
      "so_luong_nhap" || "tong_so_luong"
    );
    const gtNhap = pick(
      tk.nhap_theo_thang || tk.thong_ke_thang,
      "thang",
      "quy",
      "nam",
      "gia_tri_nhap" || "tong_gia_tri",
      "gia_tri_nhap" || "tong_gia_tri"
    );

    const slXuat = pick(
      tk.xuat_theo_thang || tk.thong_ke_xuat_thang,
      "thang",
      "quy",
      "nam",
      "so_luong_xuat" || "tong_so_luong",
      "so_luong_xuat" || "tong_so_luong"
    );
    const gtXuat = pick(
      tk.xuat_theo_thang || tk.thong_ke_xuat_thang,
      "thang",
      "quy",
      "nam",
      "gia_tri_xuat" || "tong_gia_tri",
      "gia_tri_xuat" || "tong_gia_tri"
    );

    return { slNhap, gtNhap, slXuat, gtXuat };
  };

  const getSelectedPeriodLabel = () => {
    if (timePeriod === "thang") {
      return `T${periodFilter.month}/${periodFilter.year}`;
    }
    if (timePeriod === "quy") {
      return `Quý ${periodFilter.quarter}/${periodFilter.year}`;
    }
    return `${periodFilter.year}`;
  };

  const formatPeriodLabel = (item) => {
    switch (timePeriod) {
      case "thang":
        return `${item.thang}/${item.nam}`;
      case "quy":
        return `Q${item.quy}/${item.nam}`;
      case "nam":
        return `${item.nam}`;
      default:
        return "";
    }
  };

  // Lọc chỉ các phiếu đã hoàn thành
  const getCompletedImportHistory = () => {
    if (!hangHoa?.cac_dot_nhap) return [];
    return hangHoa.cac_dot_nhap.filter(
      (batch) => batch.trang_thai === "completed"
    );
  };

  const getCompletedExportHistory = () => {
    if (!hangHoa?.lich_su_xuat) return [];
    return hangHoa.lich_su_xuat.filter(
      (record) => record.trang_thai === "completed"
    );
  };

  const getCompletedPriceHistory = () => {
    if (!hangHoa?.lich_su_gia) return [];
    return hangHoa.lich_su_gia.filter(
      (price) => price.trang_thai === "completed"
    );
  };

  // Handler xem chi tiết tồn kho theo phòng ban (cho admin/manager)
  const handleViewInventoryBreakdown = async () => {
    if (user.role === "user") {
      toast.error("Bạn không có quyền xem chi tiết này");
      return;
    }

    try {
      setShowInventoryBreakdown(true);
      // Load dữ liệu breakdown sẽ được xử lý trong modal con
    } catch (error) {
      console.error("Error viewing inventory breakdown:", error);
      toast.error("Không thể xem chi tiết tồn kho");
    }
  };

  if (loading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết hàng hóa"
        size="xl"
      >
        <div className="flex items-center justify-center py-12">
          <Loading size="large" />
        </div>
      </Modal>
    );
  }

  if (!hangHoa) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết hàng hóa"
        size="xl"
      >
        <div className="text-center py-12">
          <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-500">Không tìm thấy dữ liệu hàng hóa</p>
        </div>
      </Modal>
    );
  }

  const inventorySerials = getInventorySerials();
  const statsData = getStatsByPeriod();
  const completedImportHistory = getCompletedImportHistory();
  const completedExportHistory = getCompletedExportHistory();
  const completedPriceHistory = getCompletedPriceHistory();

  // Helpers: group by department and subtotal
  const groupByDepartment = (rows) => {
    if (!Array.isArray(rows)) return {};
    return rows.reduce((acc, row) => {
      const key = row.ten_phong_ban || "Khác";
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});
  };

  const calcImportSubtotal = (rows) => {
    return {
      so_luong: rows.reduce((s, r) => s + (parseFloat(r.so_luong) || 0), 0),
      gia_tri: rows.reduce((s, r) => s + (parseFloat(r.thanh_tien) || 0), 0),
    };
  };

  const calcExportSubtotal = (rows) => {
    return {
      so_luong: rows.reduce(
        (s, r) =>
          s + (parseFloat(r.so_luong_thuc_xuat || r.so_luong_xuat || 0) || 0),
        0
      ),
      gia_tri: rows.reduce((s, r) => s + (parseFloat(r.thanh_tien) || 0), 0),
    };
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Chi tiết: ${hangHoa.ten_hang_hoa}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {hangHoa.ten_hang_hoa}
                  </h2>
                  <p className="text-gray-600">Mã: {hangHoa.ma_hang_hoa}</p>
                  {/* Scope indicator: where this detail is filtered from */}
                  <div className="mt-1 text-xs text-gray-600">
                    {isAggregatedView ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 border border-green-200 text-green-700">
                          <BarChart3 size={12} className="mr-1" />
                          Tổng hợp tất cả đơn vị
                        </span>
                        <button
                          onClick={() => setShowInventoryBreakdown(true)}
                          className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 border border-blue-200 text-blue-700 hover:bg-blue-200 transition-colors"
                        >
                          <Building size={12} className="mr-1" />
                          Xem chi tiết theo đơn vị
                        </button>
                      </div>
                    ) : (
                      (() => {
                        const cap3 = deptHierarchy.cap3List?.find(
                          (c) => c.id === phongBanId
                        );
                        const cap2 = cap3
                          ? deptHierarchy.cap2ById[cap3.cap2_id]
                          : null;
                        return (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                            <Building size={12} className="mr-1" />
                            Đang xem: {cap2 ? `${cap2.ten_phong_ban} › ` : ""}
                            {cap3
                              ? cap3.ten_phong_ban
                              : hangHoa.ten_phong_ban || "Phòng ban"}
                          </span>
                        );
                      })()
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      {hangHoa.ten_phong_ban}
                    </span>
                    <span className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      {hangHoa.ten_loai || "Chưa phân loại"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bỏ nút xem chi tiết theo phòng ban theo yêu cầu */}
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tồn kho hiện tại</p>
                    <div className="text-2xl font-bold text-green-600">
                      {formatInteger(hangHoa.so_luong_ton || 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {hangHoa.don_vi_tinh}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tổng đã nhập</p>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatInteger(hangHoa.thong_ke?.tong_da_nhap || 0)}
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tổng đã xuất</p>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatInteger(hangHoa.thong_ke?.tong_da_xuat || 0)}
                    </div>
                  </div>
                  <Upload className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Quality breakdown */}
            {hangHoa.so_luong_ton && (
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { key: "sl_tot", label: "Tốt", color: "green" },
                  { key: "sl_kem_pham_chat", label: "Kém", color: "yellow" },
                  { key: "sl_mat_pham_chat", label: "Mất", color: "orange" },
                ].map(({ key, label, color }) => (
                  <div
                    key={key}
                    className={`inline-flex items-center px-3 py-1 rounded-md bg-${color}-50 border border-${color}-200`}
                  >
                    <span className={`text-sm text-${color}-600 mr-1`}>
                      {label}:
                    </span>
                    <span className={`text-sm font-semibold text-${color}-800`}>
                      {formatInteger(hangHoa[key] || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "statistics", label: "Thống kê", icon: BarChart3 },
                ...(isAggregatedView
                  ? [
                      {
                        id: "department-breakdown",
                        label: "Theo đơn vị",
                        icon: Building,
                      },
                    ]
                  : []),
                {
                  id: "import-history",
                  label: `Lịch sử nhập (${completedImportHistory.length})`,
                  icon: Download,
                },
                {
                  id: "export-history",
                  label: `Lịch sử xuất (${completedExportHistory.length})`,
                  icon: Upload,
                },
                {
                  id: "price-history",
                  label: `Lịch sử giá (${completedPriceHistory.length})`,
                  icon: DollarSign,
                },
                ...(hangHoa.co_so_seri
                  ? [
                      {
                        id: "serial",
                        label: `Số seri (${inventorySerials.length})`,
                        icon: Tag,
                      },
                    ]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "statistics" && (
              <div className="space-y-6">
                {/* Time period selector */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    Xem theo:
                  </span>
                  {["thang", "quy", "nam"].map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setTimePeriod(period);
                        setPeriodFilter((p) => ({ ...p, mode: period }));
                      }}
                      className={`px-3 py-1 text-sm rounded-md ${
                        timePeriod === period
                          ? "bg-green-100 text-green-700 font-medium"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {period === "thang"
                        ? "Tháng"
                        : period === "quy"
                        ? "Quý"
                        : "Năm"}
                    </button>
                  ))}
                  {/* Pickers */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={periodFilter.year}
                      onChange={(e) =>
                        setPeriodFilter((p) => ({
                          ...p,
                          year: parseInt(e.target.value),
                        }))
                      }
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {Array.from(
                        { length: 6 },
                        (_, i) => new Date().getFullYear() - 2 + i
                      ).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    {timePeriod === "thang" && (
                      <select
                        value={periodFilter.month}
                        onChange={(e) =>
                          setPeriodFilter((p) => ({
                            ...p,
                            month: parseInt(e.target.value),
                          }))
                        }
                        className="border rounded px-2 py-1 text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (m) => (
                            <option key={m} value={m}>
                              Tháng {m}
                            </option>
                          )
                        )}
                      </select>
                    )}
                    {timePeriod === "quy" && (
                      <select
                        value={periodFilter.quarter}
                        onChange={(e) =>
                          setPeriodFilter((p) => ({
                            ...p,
                            quarter: parseInt(e.target.value),
                          }))
                        }
                        className="border rounded px-2 py-1 text-sm"
                      >
                        {[1, 2, 3, 4].map((q) => (
                          <option key={q} value={q}>
                            Quý {q}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Statistics table - overall */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                      Thống kê nhập xuất theo {timePeriod}
                    </h3>
                  </div>

                  {statsData.nhap.length > 0 || statsData.xuat.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left font-medium text-gray-500">
                              Thời gian
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                              SL nhập
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                              Giá trị nhập
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                              SL xuất
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">
                              Giá trị xuất
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {/* Merge nhập và xuất data */}
                          {(() => {
                            // Chỉ hiển thị đúng một dòng cho kỳ được chọn
                            const label = getSelectedPeriodLabel();
                            const findMatch = (arr) => {
                              if (!Array.isArray(arr)) return {};
                              if (timePeriod === "thang") {
                                return (
                                  arr.find(
                                    (i) =>
                                      parseInt(i.thang) ===
                                        periodFilter.month &&
                                      parseInt(i.nam) === periodFilter.year
                                  ) || {}
                                );
                              }
                              if (timePeriod === "quy") {
                                return (
                                  arr.find(
                                    (i) =>
                                      parseInt(i.quy) ===
                                        periodFilter.quarter &&
                                      parseInt(i.nam) === periodFilter.year
                                  ) || {}
                                );
                              }
                              return (
                                arr.find(
                                  (i) => parseInt(i.nam) === periodFilter.year
                                ) || {}
                              );
                            };

                            const nhapData =
                              timePeriod === "nam"
                                ? statsData.nhap
                                : statsData.nhap;
                            const xuatData =
                              timePeriod === "nam"
                                ? statsData.xuat
                                : statsData.xuat;

                            const n = findMatch(nhapData);
                            const x = findMatch(xuatData);

                            return (
                              <tr key={label}>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                  {label}
                                </td>
                                <td className="px-4 py-4 text-right text-blue-600 font-medium">
                                  {formatInteger(
                                    (n?.so_luong_nhap ?? n?.tong_so_luong) || 0
                                  )}
                                </td>
                                <td className="px-4 py-4 text-right text-blue-600">
                                  {formatCurrency(
                                    (n?.gia_tri_nhap ?? n?.tong_gia_tri) || 0
                                  )}
                                </td>
                                <td className="px-4 py-4 text-right text-orange-600 font-medium">
                                  {formatInteger(
                                    (x?.so_luong_xuat ?? x?.tong_so_luong) || 0
                                  )}
                                </td>
                                <td className="px-4 py-4 text-right text-orange-600">
                                  {formatCurrency(
                                    (x?.gia_tri_xuat ?? x?.tong_gia_tri) || 0
                                  )}
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500">Chưa có dữ liệu thống kê</p>
                    </div>
                  )}
                </div>

                {/* Statistics by department when viewing All */}
                {isAggregatedView && (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Theo đơn vị
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Kỳ: {getSelectedPeriodLabel()}
                      </p>
                    </div>
                    <div className="divide-y">
                      {(() => {
                        const order =
                          deptHierarchy.cap2Order &&
                          deptHierarchy.cap2Order.length > 0
                            ? deptHierarchy.cap2Order
                            : Array.from(
                                new Set(
                                  (deptHierarchy.cap3List || [])
                                    .map((c3) => c3.cap2_id)
                                    .filter(Boolean)
                                )
                              );
                        if (!order || order.length === 0) {
                          return (
                            <div className="p-4 text-center text-gray-500">
                              Không có dữ liệu phòng ban để hiển thị
                            </div>
                          );
                        }
                        return order.map((cap2Id) => {
                          // Lấy toàn bộ cấp 3 thuộc cấp 2 (kể cả không có dữ liệu)
                          const cap3Rows =
                            (deptHierarchy.cap3ByCap2 &&
                              deptHierarchy.cap3ByCap2[cap2Id]) ||
                            [];
                          const cap2 = deptHierarchy.cap2ById[cap2Id];
                          let sumNhap = 0,
                            sumGtNhap = 0,
                            sumXuat = 0,
                            sumGtXuat = 0;
                          const computedRows = cap3Rows.map((dept) => {
                            const tk = deptStatsMap[dept.id] || null;
                            const t = getPeriodTotalsFromArrays(tk, {
                              mode: timePeriod,
                              year: periodFilter.year,
                              month: periodFilter.month,
                              quarter: periodFilter.quarter,
                            });
                            sumNhap += t.slNhap;
                            sumGtNhap += t.gtNhap;
                            sumXuat += t.slXuat;
                            sumGtXuat += t.gtXuat;
                            return { dept, totals: t };
                          });

                          return (
                            <div key={cap2Id} className="p-4">
                              <div className="font-semibold text-gray-900 mb-2">
                                {cap2?.ten_phong_ban || "Cấp 2"}
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                                        Phòng ban (Cấp 3)
                                      </th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                                        Thời gian
                                      </th>
                                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                                        SL nhập
                                      </th>
                                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                                        Giá trị nhập
                                      </th>
                                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                                        SL xuất
                                      </th>
                                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                                        Giá trị xuất
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {computedRows.map(({ dept, totals }) => (
                                      <tr key={dept.id}>
                                        <td className="px-4 py-2">
                                          {dept.ten_phong_ban}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">
                                          {getSelectedPeriodLabel()}
                                        </td>
                                        <td className="px-4 py-2 text-right text-blue-600 font-medium">
                                          {formatInteger(totals.slNhap)}
                                        </td>
                                        <td className="px-4 py-2 text-right text-blue-600">
                                          {formatCurrency(totals.gtNhap)}
                                        </td>
                                        <td className="px-4 py-2 text-right text-orange-600 font-medium">
                                          {formatInteger(totals.slXuat)}
                                        </td>
                                        <td className="px-4 py-2 text-right text-orange-600">
                                          {formatCurrency(totals.gtXuat)}
                                        </td>
                                      </tr>
                                    ))}
                                    {computedRows.length === 0 && (
                                      <tr>
                                        <td
                                          className="px-4 py-3 text-gray-500"
                                          colSpan="6"
                                        >
                                          Không có phòng ban cấp 3 trực thuộc
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-gray-50">
                                      <td className="px-4 py-2 font-medium text-right">
                                        Tổng {cap2?.ten_phong_ban}
                                      </td>
                                      <td className="px-4 py-2"></td>
                                      <td className="px-4 py-2 text-right font-semibold text-blue-700">
                                        {formatInteger(sumNhap)}
                                      </td>
                                      <td className="px-4 py-2 text-right font-semibold text-blue-700">
                                        {formatCurrency(sumGtNhap)}
                                      </td>
                                      <td className="px-4 py-2 text-right font-semibold text-orange-700">
                                        {formatInteger(sumXuat)}
                                      </td>
                                      <td className="px-4 py-2 text-right font-semibold text-orange-700">
                                        {formatCurrency(sumGtXuat)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "department-breakdown" && isAggregatedView && (
              <div className="space-y-6">
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Building className="h-5 w-5 mr-2 text-blue-600" />
                      Phân bổ tồn kho theo đơn vị
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Xem chi tiết hàng hóa này được phân bổ như thế nào trong
                      các đơn vị
                    </p>
                  </div>

                  {deptList.length > 0 ? (
                    <div className="divide-y">
                      {deptList.map((dept) => {
                        const stats = deptStatsMap[dept.id] || {};
                        return (
                          <div key={dept.id} className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <Building className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {dept.ten_phong_ban}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Đơn vị cấp 3
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleViewDetail(hangHoa, dept.id)
                                }
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                              >
                                <Eye size={16} />
                                <span>Xem chi tiết</span>
                              </button>
                            </div>

                            {/* Stats cards cho đơn vị này */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-green-600 font-medium">
                                      Tồn kho hiện tại
                                    </p>
                                    <p className="text-xl font-bold text-green-800">
                                      {formatInteger(stats.tong_con_ton || 0)}
                                    </p>
                                  </div>
                                  <Package className="h-6 w-6 text-green-600" />
                                </div>
                              </div>

                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-blue-600 font-medium">
                                      Tổng đã nhập
                                    </p>
                                    <p className="text-xl font-bold text-blue-800">
                                      {formatInteger(stats.tong_da_nhap || 0)}
                                    </p>
                                  </div>
                                  <Download className="h-6 w-6 text-blue-600" />
                                </div>
                              </div>

                              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-orange-600 font-medium">
                                      Tổng đã xuất
                                    </p>
                                    <p className="text-xl font-bold text-orange-800">
                                      {formatInteger(stats.tong_da_xuat || 0)}
                                    </p>
                                  </div>
                                  <Upload className="h-6 w-6 text-orange-600" />
                                </div>
                              </div>
                            </div>

                            {/* Thống kê theo thời gian cho đơn vị này */}
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                Thống kê theo thời gian (12 tháng gần nhất)
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white border rounded-lg p-4">
                                  <h6 className="text-xs font-medium text-blue-600 mb-2">
                                    Nhập hàng
                                  </h6>
                                  <div className="space-y-1">
                                    {stats.nhap_theo_thang
                                      ?.slice(0, 6)
                                      .map((item, idx) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between text-xs"
                                        >
                                          <span>
                                            {item.thang}/{item.nam}
                                          </span>
                                          <span className="font-medium">
                                            {formatInteger(
                                              item.so_luong_nhap ||
                                                item.tong_so_luong ||
                                                0
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                                <div className="bg-white border rounded-lg p-4">
                                  <h6 className="text-xs font-medium text-orange-600 mb-2">
                                    Xuất hàng
                                  </h6>
                                  <div className="space-y-1">
                                    {stats.xuat_theo_thang
                                      ?.slice(0, 6)
                                      .map((item, idx) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between text-xs"
                                        >
                                          <span>
                                            {item.thang}/{item.nam}
                                          </span>
                                          <span className="font-medium">
                                            {formatInteger(
                                              item.so_luong_xuat ||
                                                item.tong_so_luong ||
                                                0
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Building className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500">
                        Không có dữ liệu phân bổ theo đơn vị
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "import-history" && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Download className="h-5 w-5 mr-2 text-blue-600" />
                    Lịch sử nhập hàng
                  </h3>
                </div>

                {completedImportHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-500">
                            Số phiếu
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Ngày nhập
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            NCC
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Phòng ban
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500">
                            Số lượng
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500">
                            Đơn giá
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-500">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {completedImportHistory.map((batch, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 font-medium text-blue-600">
                              {batch.so_phieu}
                            </td>
                            <td className="px-4 py-4 text-gray-900">
                              {formatDate(batch.ngay_nhap)}
                            </td>
                            <td className="px-4 py-4 text-gray-900">
                              {batch.ten_ncc || "N/A"}
                            </td>
                            <td className="px-4 py-4 text-gray-900">
                              {batch.ten_phong_ban || "-"}
                            </td>
                            <td className="px-4 py-4 text-right font-medium">
                              {formatInteger(batch.so_luong)}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {formatCurrency(batch.don_gia)}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={getTrangThaiColor(batch.trang_thai)}
                              >
                                {TRANG_THAI_PHIEU[batch.trang_thai]?.label ||
                                  batch.trang_thai}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Download className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">Chưa có lịch sử nhập hàng</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "export-history" && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-orange-600" />
                    Lịch sử xuất hàng
                  </h3>
                </div>

                {completedExportHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-500">
                            Số phiếu
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Ngày xuất
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Đơn vị nhận
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Phòng ban
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500">
                            Số lượng xuất
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500">
                            Đơn giá
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-500">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {completedExportHistory.map((record, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 font-medium text-blue-600">
                              {record.so_phieu}
                            </td>
                            <td className="px-4 py-4 text-gray-900">
                              {formatDate(record.ngay_xuat)}
                            </td>
                            <td className="px-4 py-4 text-gray-900">
                              {record.ten_don_vi || "N/A"}
                            </td>
                            <td className="px-4 py-4 text-gray-900">
                              {record.ten_phong_ban || "-"}
                            </td>
                            <td className="px-4 py-4 text-right font-medium">
                              {formatInteger(record.so_luong_xuat)}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {formatCurrency(record.don_gia)}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={getTrangThaiColor(record.trang_thai)}
                              >
                                {TRANG_THAI_PHIEU[record.trang_thai]?.label ||
                                  record.trang_thai}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">Chưa có lịch sử xuất hàng</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "price-history" && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Lịch sử giá
                  </h3>
                </div>

                {completedPriceHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-500">
                            Ngày áp dụng
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500">
                            Đơn giá
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-500">
                            Nguồn giá
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-500">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {completedPriceHistory.map((price, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-gray-900">
                              {formatDate(price.ngay_ap_dung)}
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-green-600">
                              {formatCurrency(price.don_gia)}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {price.nguon_gia || "Nhập kho"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={getTrangThaiColor(price.trang_thai)}
                              >
                                {TRANG_THAI_PHIEU[price.trang_thai]?.label ||
                                  price.trang_thai}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">Chưa có lịch sử giá</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "serial" && hangHoa.co_so_seri && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Tag className="h-5 w-5 mr-2 text-blue-600" />
                    Danh sách số seri tồn kho
                  </h3>
                </div>

                {inventorySerials.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-500">
                            Số seri
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Số phiếu
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500">
                            Ngày nhập
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-gray-500">
                            Đơn giá
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-500">
                            Phẩm chất
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {inventorySerials.map((seri, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {seri.so_seri}
                            </td>
                            <td className="px-4 py-4 text-blue-600">
                              {seri.so_phieu}
                            </td>
                            <td className="px-4 py-4 text-gray-900">
                              {formatDate(seri.ngay_nhap)}
                            </td>
                            <td className="px-4 py-4 text-right font-medium">
                              {formatCurrency(seri.don_gia)}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={getPhamChatColor(seri.pham_chat)}
                              >
                                {PHAM_CHAT[seri.pham_chat]?.label ||
                                  seri.pham_chat}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Tag className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">
                      Chưa có số seri nào trong kho
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal con cho inventory breakdown */}
      {showInventoryBreakdown && (
        <InventoryBreakdownModal
          hangHoaId={hangHoaId}
          isOpen={showInventoryBreakdown}
          onClose={() => setShowInventoryBreakdown(false)}
        />
      )}
    </>
  );
};

export default HangHoaDetailModal;
