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
// } from "lucide-react";
// import { hangHoaService } from "../services/hangHoaService";
// import { formatCurrency, formatDate } from "../utils/helpers";
// import { PHAM_CHAT, TRANG_THAI_PHIEU } from "../utils/constants";
// import Modal from "./common/Modal";
// import Loading from "./common/Loading";
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
//               { key: "sl_hong", label: "Hỏng", color: "red" },
//               { key: "sl_can_thanh_ly", label: "Thanh lý", color: "gray" },
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
//                 label: `Lịch sử nhập (${
//                   hangHoa.thong_ke?.tong_so_lan_nhap || 0
//                 })`,
//               },
//               {
//                 id: "price-history",
//                 label: `Lịch sử giá (${hangHoa.lich_su_gia?.length || 0})`,
//               },
//               ...(hangHoa.co_so_seri
//                 ? [
//                     {
//                       id: "serial",
//                       label: `Số seri (${inventorySerials.length})`,
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
//                   Thống kê nhập xuất
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

//               {/* Inventory by batch */}
//               {hangHoa.cac_dot_nhap && hangHoa.cac_dot_nhap.length > 0 && (
//                 <div className="bg-white border rounded-lg">
//                   <div className="px-4 py-3 border-b border-gray-200">
//                     <h3 className="text-md font-semibold text-gray-900 flex items-center">
//                       <Package className="h-4 w-4 mr-2 text-green-600" />
//                       Tồn kho theo đợt nhập ({hangHoa.cac_dot_nhap.length})
//                     </h3>
//                   </div>
//                   <div className="overflow-x-auto">
//                     <table className="w-full text-sm">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th className="px-4 py-2 text-left font-medium text-gray-500">
//                             Số phiếu
//                           </th>
//                           <th className="px-4 py-2 text-left font-medium text-gray-500">
//                             Ngày nhập
//                           </th>
//                           <th className="px-4 py-2 text-right font-medium text-gray-500">
//                             Đơn giá
//                           </th>
//                           <th className="px-4 py-2 text-right font-medium text-gray-500">
//                             SL nhập
//                           </th>
//                           <th className="px-4 py-2 text-right font-medium text-gray-500">
//                             SL tồn
//                           </th>
//                           <th className="px-4 py-2 text-center font-medium text-gray-500">
//                             Phẩm chất
//                           </th>
//                           <th className="px-4 py-2 text-left font-medium text-gray-500">
//                             Số seri
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-gray-200">
//                         {hangHoa.cac_dot_nhap.map((batch, index) => (
//                           <tr key={index} className="hover:bg-gray-50">
//                             <td className="px-4 py-2">
//                               <div className="font-medium text-gray-900">
//                                 {batch.so_phieu}
//                               </div>
//                               <div className="text-xs text-gray-500">
//                                 {batch.ten_ncc || "N/A"}
//                               </div>
//                             </td>
//                             <td className="px-4 py-2">
//                               {formatDate(batch.ngay_nhap)}
//                             </td>
//                             <td className="px-4 py-2 text-right font-medium text-green-600">
//                               {formatCurrency(batch.don_gia)}
//                             </td>
//                             <td className="px-4 py-2 text-right">
//                               {formatInteger(batch.so_luong)}
//                             </td>
//                             <td className="px-4 py-2 text-right font-medium text-blue-600">
//                               {formatInteger(batch.so_luong_ton_hien_tai || 0)}
//                               {batch.so_luong_ton_hien_tai === 0 && (
//                                 <div className="text-xs text-red-500">
//                                   Đã hết
//                                 </div>
//                               )}
//                             </td>
//                             <td className="px-4 py-2 text-center">
//                               <span
//                                 className={getPhamChatColor(batch.pham_chat)}
//                               >
//                                 {PHAM_CHAT[batch.pham_chat]?.label ||
//                                   batch.pham_chat}
//                               </span>
//                             </td>
//                             <td className="px-4 py-2">
//                               {batch.so_seri_list &&
//                               batch.so_seri_list.length > 0 ? (
//                                 <div className="max-w-xs">
//                                   <div className="text-gray-900 truncate">
//                                     {batch.so_seri_list.slice(0, 2).join(", ")}
//                                     {batch.so_seri_list.length > 2 && (
//                                       <span className="text-gray-500">
//                                         ... (+{batch.so_seri_list.length - 2})
//                                       </span>
//                                     )}
//                                   </div>
//                                   {batch.so_seri_list.length > 2 && (
//                                     <div
//                                       className="text-xs text-blue-600 cursor-help"
//                                       title={batch.so_seri_list.join(", ")}
//                                     >
//                                       Xem tất cả ({batch.so_seri_list.length})
//                                     </div>
//                                   )}
//                                 </div>
//                               ) : (
//                                 <span className="text-xs text-gray-400">
//                                   {hangHoa.co_so_seri
//                                     ? "Không có seri tồn"
//                                     : "Không theo dõi seri"}
//                                 </span>
//                               )}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                   <div className="px-4 py-2 bg-gray-50 border-t">
//                     <div className="flex justify-between text-sm">
//                       <span className="font-medium text-gray-700">
//                         Tổng tồn kho:
//                       </span>
//                       <span className="font-bold text-blue-600">
//                         {formatInteger(
//                           hangHoa.cac_dot_nhap.reduce(
//                             (sum, batch) =>
//                               sum + (batch.so_luong_ton_hien_tai || 0),
//                             0
//                           )
//                         )}{" "}
//                         {hangHoa.don_vi_tinh}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === "import-history" && (
//             <div className="bg-white border rounded-lg overflow-hidden">
//               <div className="px-4 py-3 border-b border-gray-200">
//                 <h3 className="text-md font-semibold text-gray-900">
//                   Lịch sử nhập hàng
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
//                       <th className="px-4 py-2 text-center font-medium text-gray-500">
//                         Trạng thái
//                       </th>
//                       <th className="px-4 py-2 text-right font-medium text-gray-500">
//                         Thành tiền
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {hangHoa.cac_dot_nhap?.map((batch, index) => (
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
//                         <td className="px-4 py-2 text-center">
//                           <span className={getTrangThaiColor(batch.trang_thai)}>
//                             {TRANG_THAI_PHIEU[batch.trang_thai]?.label ||
//                               batch.trang_thai}
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
//               {(!hangHoa.cac_dot_nhap || hangHoa.cac_dot_nhap.length === 0) && (
//                 <div className="text-center py-8">
//                   <p className="text-gray-500">Chưa có lịch sử nhập hàng</p>
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
//                 <h3 className="text-md font-semibold text-gray-900">
//                   Danh sách số seri chi tiết
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
//                     {hangHoa.danh_sach_seri?.map((seri, index) => (
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
//                           <span
//                             className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
//                               seri.trang_thai === "ton_kho"
//                                 ? "bg-green-100 text-green-800"
//                                 : "bg-gray-100 text-gray-800"
//                             }`}
//                           >
//                             {seri.trang_thai === "ton_kho"
//                               ? "Tồn kho"
//                               : "Đã xuất"}
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//               {(!hangHoa.danh_sach_seri ||
//                 hangHoa.danh_sach_seri.length === 0) && (
//                 <div className="text-center py-8">
//                   <p className="text-gray-500">Chưa có số seri nào</p>
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
} from "lucide-react";
import { hangHoaService } from "../../services/hangHoaService";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { PHAM_CHAT, TRANG_THAI_PHIEU } from "../../utils/constants";
import Modal from "../common/Modal";
import Loading from "../common/Loading";
import toast from "react-hot-toast";

const HangHoaDetailModal = ({ hangHoaId, isOpen, onClose }) => {
  const [hangHoa, setHangHoa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("statistics");
  const [timePeriod, setTimePeriod] = useState("thang");

  useEffect(() => {
    if (isOpen && hangHoaId) {
      loadHangHoaDetail();
    }
  }, [isOpen, hangHoaId]);

  const loadHangHoaDetail = async () => {
    try {
      setLoading(true);
      const response = await hangHoaService.getDetail(hangHoaId);
      setHangHoa(response.data);
    } catch (error) {
      console.error("Error loading hang hoa detail:", error);
      toast.error("Không thể tải chi tiết hàng hóa");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết: ${hangHoa.ten_hang_hoa}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {hangHoa.ten_hang_hoa}
                </h2>
                <p className="text-gray-600">Mã: {hangHoa.ma_hang_hoa}</p>
                <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Building className="h-3 w-3 mr-1" />
                    {hangHoa.ten_phong_ban}
                  </span>
                  <span className="flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    {hangHoa.ten_loai}
                  </span>
                  <span>Đơn vị: {hangHoa.don_vi_tinh}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Giá nhập gần nhất</div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(hangHoa.gia_nhap_gan_nhat || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-green-600 font-medium">
                  Tồn kho
                </div>
                <div className="text-lg font-bold text-green-800">
                  {formatInteger(hangHoa.thong_ke?.tong_con_ton || 0)}
                </div>
              </div>
              <Package className="h-5 w-5 text-green-600" />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-600 font-medium">Đã nhập</div>
                <div className="text-lg font-bold text-blue-800">
                  {formatInteger(hangHoa.thong_ke?.tong_da_nhap || 0)}
                </div>
              </div>
              <Download className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-orange-600 font-medium">
                  Đã xuất
                </div>
                <div className="text-lg font-bold text-orange-800">
                  {formatInteger(hangHoa.thong_ke?.tong_da_xuat || 0)}
                </div>
              </div>
              <Upload className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Quality breakdown */}
        {hangHoa.so_luong_ton && (
          <div className="flex flex-wrap gap-2">
            {[
              { key: "sl_tot", label: "Tốt", color: "green" },
              { key: "sl_kem_pham_chat", label: "Kém", color: "yellow" },
              { key: "sl_mat_pham_chat", label: "Mất", color: "orange" },
              //{ key: "sl_hong", label: "Hỏng", color: "red" },
              //{ key: "sl_can_thanh_ly", label: "Thanh lý", color: "gray" },
            ].map(({ key, label, color }) => (
              <div
                key={key}
                className={`inline-flex items-center px-2 py-1 rounded-md bg-${color}-50 border border-${color}-200`}
              >
                <span className={`text-xs text-${color}-600 mr-1`}>
                  {label}:
                </span>
                <span className={`text-xs font-semibold text-${color}-800`}>
                  {formatInteger(hangHoa[key])}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            {[
              { id: "statistics", label: "Thống kê", icon: BarChart3 },
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
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon && <tab.icon className="h-4 w-4 mr-1" />}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "statistics" && (
            <div className="space-y-4">
              {/* Time Period Selector */}
              <div className="flex justify-between items-center">
                <h3 className="text-md font-semibold text-gray-900">
                  Thống kê nhập xuất (chỉ phiếu hoàn thành)
                </h3>
                <div className="flex space-x-1">
                  {[
                    { value: "thang", label: "Tháng" },
                    { value: "quy", label: "Quý" },
                    { value: "nam", label: "Năm" },
                  ].map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setTimePeriod(period.value)}
                      className={`px-3 py-1 text-xs rounded-md ${
                        timePeriod === period.value
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statistics Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Import Statistics */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-blue-50 border-b">
                    <h4 className="font-medium text-blue-900 flex items-center text-sm">
                      <Download className="h-4 w-4 mr-1" />
                      Thống kê nhập
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">
                            Thời gian
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            SL nhập
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            Phiếu
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            Giá trị
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {statsData.nhap.length > 0 ? (
                          statsData.nhap.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium">
                                {formatPeriodLabel(item)}
                              </td>
                              <td className="px-3 py-2 text-right text-blue-600 font-medium">
                                {formatInteger(item.so_luong_nhap)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.so_phieu_nhap || 0}
                              </td>
                              <td className="px-3 py-2 text-right text-green-600 font-medium">
                                {formatCurrency(item.gia_tri_nhap)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-3 py-6 text-center text-gray-500"
                            >
                              Chưa có dữ liệu
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Export Statistics */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-orange-50 border-b">
                    <h4 className="font-medium text-orange-900 flex items-center text-sm">
                      <Upload className="h-4 w-4 mr-1" />
                      Thống kê xuất
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">
                            Thời gian
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            SL xuất
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            Phiếu
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            Giá trị
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {statsData.xuat.length > 0 ? (
                          statsData.xuat.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium">
                                {formatPeriodLabel(item)}
                              </td>
                              <td className="px-3 py-2 text-right text-orange-600 font-medium">
                                {formatInteger(item.so_luong_xuat)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.so_phieu_xuat || 0}
                              </td>
                              <td className="px-3 py-2 text-right text-green-600 font-medium">
                                {formatCurrency(item.gia_tri_xuat)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-3 py-6 text-center text-gray-500"
                            >
                              Chưa có dữ liệu
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "import-history" && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 flex items-center">
                  <Download className="h-4 w-4 mr-2 text-blue-600" />
                  Lịch sử nhập hàng (chỉ phiếu hoàn thành)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Số phiếu
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Ngày nhập
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Nhà cung cấp
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Số lượng
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Đơn giá
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        Phẩm chất
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {completedImportHistory.map((batch, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {batch.so_phieu}
                        </td>
                        <td className="px-4 py-2">
                          {formatDate(batch.ngay_nhap)}
                        </td>
                        <td className="px-4 py-2">
                          {batch.ten_ncc || "Chưa có"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatInteger(batch.so_luong)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">
                          {formatCurrency(batch.don_gia)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={getPhamChatColor(batch.pham_chat)}>
                            {PHAM_CHAT[batch.pham_chat]?.label ||
                              batch.pham_chat}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          {formatCurrency(batch.thanh_tien)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {completedImportHistory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Chưa có lịch sử nhập hàng hoàn thành
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "export-history" && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 flex items-center">
                  <Upload className="h-4 w-4 mr-2 text-orange-600" />
                  Lịch sử xuất hàng (chỉ phiếu hoàn thành)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Số phiếu
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Ngày xuất
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Đơn vị nhận
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        SL yêu cầu
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        SL thực xuất
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Đơn giá
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        Phẩm chất
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {completedExportHistory.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {record.so_phieu}
                        </td>
                        <td className="px-4 py-2">
                          {formatDate(record.ngay_xuat)}
                        </td>
                        <td className="px-4 py-2">
                          {record.ten_don_vi || "Chưa có"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatInteger(record.so_luong_yeu_cau)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-orange-600">
                          {formatInteger(record.so_luong_thuc_xuat)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">
                          {formatCurrency(record.don_gia)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={getPhamChatColor(record.pham_chat)}>
                            {PHAM_CHAT[record.pham_chat]?.label ||
                              record.pham_chat}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          {formatCurrency(record.thanh_tien)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {completedExportHistory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Chưa có lịch sử xuất hàng hoàn thành
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "price-history" && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-900">
                  Lịch sử giá
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Ngày áp dụng
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Số phiếu
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Nhà cung cấp
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Đơn giá
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        Nguồn giá
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {hangHoa.lich_su_gia?.map((price, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {formatDate(price.ngay_ap_dung)}
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {price.so_phieu}
                        </td>
                        <td className="px-4 py-2">
                          {price.ten_ncc || "Chưa có"}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">
                          {formatCurrency(price.don_gia)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            {price.nguon_gia}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={getTrangThaiColor(price.trang_thai)}>
                            {TRANG_THAI_PHIEU[price.trang_thai]?.label ||
                              price.trang_thai}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(!hangHoa.lich_su_gia || hangHoa.lich_su_gia.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Chưa có lịch sử giá</p>
                </div>
              )}
            </div>
          )}
          {activeTab === "serial" && hangHoa.co_so_seri && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-blue-600" />
                  Danh sách số seri tồn kho
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Số seri
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Số phiếu
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Ngày nhập
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Đơn giá
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        Phẩm chất
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventorySerials.map((seri, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {seri.so_seri}
                        </td>
                        <td className="px-4 py-2">{seri.so_phieu}</td>
                        <td className="px-4 py-2">
                          {formatDate(seri.ngay_nhap)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">
                          {formatCurrency(seri.don_gia)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={getPhamChatColor(seri.pham_chat)}>
                            {PHAM_CHAT[seri.pham_chat]?.label || seri.pham_chat}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                            Tồn kho
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {inventorySerials.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Không có số seri nào đang tồn kho
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default HangHoaDetailModal;
