// import React from "react";
// import {
//   FileText,
//   Building,
//   Package,
//   CreditCard,
//   Calendar,
//   User,
//   Truck,
//   CheckCircle,
//   Send,
//   AlertCircle,
// } from "lucide-react";
// import { formatCurrency, formatDate } from "../../utils/helpers";
// import {
//   TRANG_THAI_PHIEU,
//   LOAI_PHIEU_XUAT,
//   PHAM_CHAT,
// } from "../../utils/constants";

// const PhieuXuatDetail = ({ phieu }) => {
//   const getTrangThaiColor = (trangThai) => {
//     const config = TRANG_THAI_PHIEU[trangThai] || {};
//     const colorMap = {
//       green: "bg-green-100 text-green-800",
//       blue: "bg-blue-100 text-blue-800",
//       yellow: "bg-yellow-100 text-yellow-800",
//       orange: "bg-orange-100 text-orange-800",
//       red: "bg-red-100 text-red-800",
//       gray: "bg-gray-100 text-gray-800",
//       purple: "bg-purple-100 text-purple-800",
//       emerald: "bg-emerald-100 text-emerald-800",
//     };
//     return `inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
//       colorMap[config.color] || colorMap.gray
//     }`;
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
//     return `inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
//       colorMap[config.color] || colorMap.gray
//     }`;
//   };

//   // Debug log phieu data
//   console.log("📋 PhieuXuatDetail received phieu:", phieu);

//   return (
//     <div className="p-4 space-y-4">
//       {/* Thông tin tổng quan dạng bảng 4 cột */}
//       <div className="bg-white border rounded-lg overflow-hidden">
//         <div className="bg-gray-50 px-4 py-2 border-b">
//           <h4 className="font-semibold text-gray-900 flex items-center">
//             <FileText className="mr-2 h-4 w-4" />
//             Thông tin phiếu xuất
//           </h4>
//         </div>
//         <div className="p-4">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//             {/* Cột 1: Thông tin phiếu */}
//             <div className="space-y-3">
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Số phiếu:</span>
//                 <span className="font-bold">{phieu.so_phieu}</span>
//               </div>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Ngày xuất:</span>
//                 <span className="font-medium text-xs">
//                   {formatDate(phieu.ngay_xuat)}
//                 </span>
//               </div>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Số QĐ:</span>
//                 <span className="font-medium">
//                   {phieu.so_quyet_dinh || "Chưa có"}
//                 </span>
//               </div>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Loại phiếu:</span>
//                 <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
//                   {LOAI_PHIEU_XUAT[phieu.loai_xuat] || "Cấp phát"}
//                 </span>
//               </div>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Trạng thái:</span>
//                 <span className={getTrangThaiColor(phieu.trang_thai)}>
//                   {TRANG_THAI_PHIEU[phieu.trang_thai]?.label}
//                 </span>
//               </div>
//             </div>

//             {/* Cột 2: Thông tin đơn vị nhận */}
//             <div className="space-y-3">
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Đơn vị nhận:</span>
//                 <span className="font-medium">
//                   {phieu.don_vi_nhan?.ten_don_vi ||
//                     phieu.phong_ban_nhan?.ten_phong_ban ||
//                     "Chưa có"}
//                 </span>
//               </div>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Mã đơn vị:</span>
//                 <span className="font-medium">
//                   {phieu.don_vi_nhan?.ma_don_vi ||
//                     phieu.phong_ban_nhan?.ma_phong_ban ||
//                     "Chưa có"}
//                 </span>
//               </div>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Người nhận:</span>
//                 <span className="font-medium">
//                   {phieu.nguoi_nhan || "Chưa có"}
//                 </span>
//               </div>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Tổng tiền:</span>
//                 <span className="font-bold text-red-600">
//                   {formatCurrency(phieu.tong_tien)}
//                 </span>
//               </div>
//             </div>

//             {/* Cột 3: Thông tin thời gian & người xử lý */}
//             <div className="space-y-3">
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Người tạo:</span>
//                 <span className="font-medium">
//                   {phieu.user_tao?.ho_ten || "N/A"}
//                 </span>
//               </div>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Ngày tạo:</span>
//                 <span className="font-medium text-xs">
//                   {formatDate(phieu.created_at)}
//                 </span>
//               </div>
//               {phieu.user_duyet && (
//                 <div className="grid grid-cols-2 gap-2 text-sm">
//                   <span className="text-gray-600">Người duyệt:</span>
//                   <span className="font-medium">{phieu.user_duyet.ho_ten}</span>
//                 </div>
//               )}
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Cập nhật:</span>
//                 <span className="font-medium text-xs">
//                   {formatDate(phieu.updated_at)}
//                 </span>
//               </div>
//             </div>

//             {/* Cột 4: Thông tin khác */}
//             <div className="space-y-3">
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Loại đơn vị:</span>
//                 <span className="font-medium text-xs">
//                   {phieu.don_vi_nhan?.loai_don_vi || "Chưa có"}
//                 </span>
//               </div>
//               <div className="grid grid-cols-2 gap-2 text-sm">
//                 <span className="text-gray-600">Lý do xuất:</span>
//                 <span className="font-medium text-xs">
//                   {phieu.ly_do_xuat || "Không có"}
//                 </span>
//               </div>
//               {phieu.decision_pdf_url && (
//                 <div className="grid grid-cols-2 gap-2 text-sm">
//                   <span className="text-gray-600">Quyết định:</span>
//                   <a
//                     href={`http://localhost:5000${phieu.decision_pdf_url}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
//                   >
//                     Xem PDF
//                   </a>
//                 </div>
//               )}
//               {phieu.ghi_chu && (
//                 <div className="col-span-2 text-sm">
//                   <span className="text-gray-600">Ghi chú:</span>
//                   <p className="text-xs text-gray-700 mt-1 p-2 bg-gray-50 rounded">
//                     {phieu.ghi_chu}
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Chi tiết hàng hóa */}
//       <div className="bg-white border rounded-lg overflow-hidden">
//         <div className="bg-gray-50 px-4 py-2 border-b">
//           <h4 className="font-semibold text-gray-900 flex items-center">
//             <Package className="mr-2 h-4 w-4" />
//             Chi tiết hàng hóa xuất
//           </h4>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   STT
//                 </th>
//                 <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Hàng hóa
//                 </th>
//                 <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   SL yêu cầu
//                 </th>
//                 <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   SL thực xuất
//                 </th>
//                 <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Đơn giá
//                 </th>
//                 <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Phẩm chất
//                 </th>
//                 <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Thành tiền
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {phieu.chi_tiet && phieu.chi_tiet.length > 0 ? (
//                 phieu.chi_tiet.map((item, index) => (
//                   <tr key={index} className="hover:bg-gray-50">
//                     <td className="px-4 py-2 text-sm text-center text-gray-900">
//                       {index + 1}
//                     </td>
//                     <td className="px-4 py-2">
//                       <div>
//                         <div className="text-sm font-medium text-gray-900">
//                           {item.hang_hoa?.ten_hang_hoa || "N/A"}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {item.hang_hoa?.ma_hang_hoa || "N/A"} -{" "}
//                           {item.hang_hoa?.don_vi_tinh || "N/A"}
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-4 py-2 text-sm text-center text-gray-900">
//                       {parseFloat(item.so_luong_yeu_cau || 0).toLocaleString()}
//                     </td>
//                     <td className="px-4 py-2 text-sm text-center text-gray-900 font-medium">
//                       {parseFloat(
//                         item.so_luong_thuc_xuat || item.so_luong || 0
//                       ).toLocaleString()}
//                     </td>
//                     <td className="px-4 py-2 text-sm text-right text-gray-900">
//                       {formatCurrency(item.don_gia)}
//                     </td>
//                     <td className="px-4 py-2 text-center">
//                       <span className={getPhamChatColor(item.pham_chat)}>
//                         {PHAM_CHAT[item.pham_chat] || "Tốt"}
//                       </span>
//                     </td>
//                     <td className="px-4 py-2 text-sm text-right text-gray-900 font-medium">
//                       {formatCurrency(
//                         parseFloat(
//                           item.so_luong_thuc_xuat || item.so_luong || 0
//                         ) * parseFloat(item.don_gia || 0)
//                       )}
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td
//                     colSpan="7"
//                     className="px-4 py-8 text-center text-gray-500"
//                   >
//                     Chưa có chi tiết hàng hóa
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Thông tin ghi chú phản hồi - nếu có */}
//       {phieu.ghi_chu_phan_hoi && (
//         <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
//           <div className="flex items-start">
//             <div className="flex-shrink-0">
//               <AlertCircle className="h-5 w-5 text-orange-400" />
//             </div>
//             <div className="ml-3">
//               <h3 className="text-sm font-medium text-orange-800">
//                 Yêu cầu chỉnh sửa
//               </h3>
//               <div className="mt-1 text-sm text-orange-700">
//                 {phieu.ghi_chu_phan_hoi}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Timeline trạng thái */}
//       <div className="bg-white border rounded-lg overflow-hidden">
//         <div className="bg-gray-50 px-4 py-2 border-b">
//           <h4 className="font-semibold text-gray-900 flex items-center">
//             <Calendar className="mr-2 h-4 w-4" />
//             Lịch sử phiếu
//           </h4>
//         </div>
//         <div className="p-4">
//           <div className="flow-root">
//             <ul className="-mb-8">
//               {/* Người tạo phiếu */}
//               <li>
//                 <div className="relative pb-8">
//                   {(phieu.ngay_gui_duyet ||
//                     phieu.ngay_duyet ||
//                     phieu.ngay_hoan_thanh) && (
//                     <div className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"></div>
//                   )}
//                   <div className="relative flex items-start space-x-3">
//                     <div className="relative">
//                       <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
//                         <User className="h-4 w-4 text-white" />
//                       </div>
//                     </div>
//                     <div className="min-w-0 flex-1 py-1.5">
//                       <div className="text-sm text-gray-500">
//                         <span className="font-medium text-gray-900">
//                           {phieu.user_tao?.ho_ten || "N/A"}
//                         </span>{" "}
//                         tạo phiếu
//                       </div>
//                       <div className="mt-1 text-xs text-gray-400">
//                         {formatDate(phieu.created_at)}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </li>

//               {/* Gửi duyệt */}
//               {phieu.ngay_gui_duyet && (
//                 <li>
//                   <div className="relative pb-8">
//                     {(phieu.ngay_duyet || phieu.ngay_hoan_thanh) && (
//                       <div className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"></div>
//                     )}
//                     <div className="relative flex items-start space-x-3">
//                       <div className="relative">
//                         <div className="h-8 w-8 rounded-full bg-blue-400 flex items-center justify-center ring-8 ring-white">
//                           <Send className="h-4 w-4 text-white" />
//                         </div>
//                       </div>
//                       <div className="min-w-0 flex-1 py-1.5">
//                         <div className="text-sm text-gray-500">
//                           Phiếu được gửi duyệt
//                         </div>
//                         <div className="mt-1 text-xs text-gray-400">
//                           {formatDate(phieu.ngay_gui_duyet)}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </li>
//               )}

//               {/* Duyệt phiếu */}
//               {phieu.ngay_duyet && (
//                 <li>
//                   <div className="relative pb-8">
//                     {phieu.ngay_hoan_thanh && (
//                       <div className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"></div>
//                     )}
//                     <div className="relative flex items-start space-x-3">
//                       <div className="relative">
//                         <div className="h-8 w-8 rounded-full bg-green-400 flex items-center justify-center ring-8 ring-white">
//                           <CheckCircle className="h-4 w-4 text-white" />
//                         </div>
//                       </div>
//                       <div className="min-w-0 flex-1 py-1.5">
//                         <div className="text-sm text-gray-500">
//                           <span className="font-medium text-gray-900">
//                             {phieu.user_duyet?.ho_ten || "N/A"}
//                           </span>{" "}
//                           duyệt phiếu
//                         </div>
//                         <div className="mt-1 text-xs text-gray-400">
//                           {formatDate(phieu.ngay_duyet)}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </li>
//               )}

//               {/* Hoàn thành */}
//               {phieu.ngay_hoan_thanh && (
//                 <li>
//                   <div className="relative">
//                     <div className="relative flex items-start space-x-3">
//                       <div className="relative">
//                         <div className="h-8 w-8 rounded-full bg-emerald-400 flex items-center justify-center ring-8 ring-white">
//                           <Truck className="h-4 w-4 text-white" />
//                         </div>
//                       </div>
//                       <div className="min-w-0 flex-1 py-1.5">
//                         <div className="text-sm text-gray-500">
//                           Hoàn thành xuất kho
//                         </div>
//                         <div className="mt-1 text-xs text-gray-400">
//                           {formatDate(phieu.ngay_hoan_thanh)}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </li>
//               )}
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PhieuXuatDetail;

// PhieuXuatDetail.jsx - UPDATED VERSION
import React from "react";
import {
  FileText,
  Building,
  Package,
  CreditCard,
  Calendar,
  User,
  Truck,
  CheckCircle,
  Send,
  AlertCircle,
  Link2,
  MapPin,
  Hash,
  Users,
  Globe,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import {
  TRANG_THAI_PHIEU,
  LOAI_PHIEU_XUAT,
  PHAM_CHAT,
} from "../../utils/constants";

const PhieuXuatDetail = ({ phieu }) => {
  const getTrangThaiColor = (trangThai) => {
    const config = TRANG_THAI_PHIEU[trangThai] || {};
    const colorMap = {
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      red: "bg-red-100 text-red-800",
      gray: "bg-gray-100 text-gray-800",
      purple: "bg-purple-100 text-purple-800",
      emerald: "bg-emerald-100 text-emerald-800",
    };
    return `inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
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
    return `inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
  };

  // ✅ Helper function để render đơn vị nhận
  const renderDonViNhan = () => {
    if (phieu.loai_xuat === "don_vi_su_dung") {
      return (
        <div className="flex items-center space-x-2">
          <Building className="h-4 w-4 text-gray-500" />
          <div>
            <div className="font-medium text-gray-900">Sử dụng nội bộ</div>
            <div className="text-sm text-gray-500">Không xuất ra ngoài</div>
          </div>
        </div>
      );
    } else if (phieu.loai_xuat === "don_vi_nhan") {
      // ✅ Xuất đơn vị - check phòng ban nhận hoặc đơn vị ngoài
      if (phieu.phong_ban_nhan_id && phieu.ten_phong_ban_nhan) {
        // Phòng ban nội bộ
        return (
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">
                {phieu.ten_phong_ban_nhan}
              </div>
              <div className="text-sm text-gray-500">
                {phieu.ma_phong_ban_nhan && `${phieu.ma_phong_ban_nhan} - `}
                Cấp {phieu.cap_bac_nhan} - Phòng ban nội bộ
              </div>
            </div>
          </div>
        );
      } else if (phieu.don_vi_nhan_id && phieu.ten_don_vi_nhan) {
        // Đơn vị ngoài
        return (
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">
                {phieu.ten_don_vi_nhan}
              </div>
              <div className="text-sm text-gray-500">
                {phieu.ma_don_vi_nhan && `${phieu.ma_don_vi_nhan} - `}
                Đơn vị bên ngoài
                {phieu.don_vi_nhan_dia_chi && (
                  <div className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {phieu.don_vi_nhan_dia_chi}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-600">Chưa xác định đơn vị nhận</span>
          </div>
        );
      }
    }

    return (
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-4 w-4 text-gray-500" />
        <span className="text-gray-500">Không xác định</span>
      </div>
    );
  };

  // Debug log phieu data
  console.log("📋 PhieuXuatDetail received phieu:", phieu);

  return (
    <div className="p-4 space-y-4">
      {/* Thông tin tổng quan dạng bảng 4 cột */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Thông tin phiếu xuất
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 text-sm">
          {/* Row 1 */}
          <div className="px-4 py-3 border-b border-r">
            <div className="text-gray-500 text-xs uppercase mb-1">Số phiếu</div>
            <div className="font-medium flex items-center">
              <Hash className="h-4 w-4 mr-1 text-gray-400" />
              {phieu.so_phieu}
            </div>
          </div>

          <div className="px-4 py-3 border-b border-r">
            <div className="text-gray-500 text-xs uppercase mb-1">
              Ngày xuất
            </div>
            <div className="font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
              {formatDate(phieu.ngay_xuat)}
            </div>
          </div>

          <div className="px-4 py-3 border-b border-r">
            <div className="text-gray-500 text-xs uppercase mb-1">
              Loại phiếu
            </div>
            <div className="font-medium">
              {LOAI_PHIEU_XUAT[phieu.loai_xuat]?.label ||
                LOAI_PHIEU_XUAT[phieu.loai_xuat] ||
                phieu.loai_xuat}
            </div>
          </div>

          <div className="px-4 py-3 border-b">
            <div className="text-gray-500 text-xs uppercase mb-1">
              Trạng thái
            </div>
            <div className={getTrangThaiColor(phieu.trang_thai)}>
              {TRANG_THAI_PHIEU[phieu.trang_thai]?.label || phieu.trang_thai}
            </div>
          </div>

          {/* Row 2 */}
          <div className="px-4 py-3 border-b border-r">
            <div className="text-gray-500 text-xs uppercase mb-1">
              Người tạo
            </div>
            <div className="font-medium flex items-center">
              <User className="h-4 w-4 mr-1 text-gray-400" />
              {phieu.nguoi_tao_ten || "N/A"}
            </div>
          </div>

          <div className="px-4 py-3 border-b border-r">
            <div className="text-gray-500 text-xs uppercase mb-1">Ngày tạo</div>
            <div className="font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
              {formatDate(phieu.created_at)}
            </div>
          </div>

          <div className="px-4 py-3 border-b border-r">
            <div className="text-gray-500 text-xs uppercase mb-1">
              Người duyệt
            </div>
            <div className="font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-gray-400" />
              {phieu.nguoi_duyet_cap1_ten || "Chưa duyệt"}
            </div>
          </div>

          <div className="px-4 py-3 border-b">
            <div className="text-gray-500 text-xs uppercase mb-1">
              Tổng tiền
            </div>
            <div className="font-bold text-red-600 flex items-center">
              <CreditCard className="h-4 w-4 mr-1" />
              {formatCurrency(phieu.tong_tien)}
            </div>
          </div>

          {/* Row 3 */}
          <div className="px-4 py-3 border-r">
            <div className="text-gray-500 text-xs uppercase mb-1">
              Số quyết định
            </div>
            <div className="font-medium">
              {phieu.so_quyet_dinh || "Không có"}
            </div>
          </div>

          <div className="px-4 py-3 border-r">
            <div className="text-gray-500 text-xs uppercase mb-1">
              Người nhận
            </div>
            <div className="font-medium flex items-center">
              <User className="h-4 w-4 mr-1 text-gray-400" />
              {phieu.nguoi_nhan || "N/A"}
            </div>
          </div>

          <div className="px-4 py-3 border-r">
            <div className="text-gray-500 text-xs uppercase mb-1">
              Lý do xuất
            </div>
            <div className="font-medium">{phieu.ly_do_xuat || "Không có"}</div>
          </div>

          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs uppercase mb-1">Ghi chú</div>
            <div className="font-medium">{phieu.ghi_chu || "Không có"}</div>
          </div>
        </div>
      </div>

      {/* ✅ Thông tin đơn vị nhận - CẬP NHẬT */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Building className="mr-2 h-4 w-4" />
            Thông tin đơn vị nhận
          </h4>
        </div>
        <div className="p-4">{renderDonViNhan()}</div>
      </div>

      {/* ✅ Thông tin phiếu liên kết - MỚI */}
      {phieu.phieu_nhap_lien_ket && (
        <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
          <div className="bg-green-100 px-4 py-2 border-b border-green-200">
            <h4 className="font-semibold text-green-900 flex items-center">
              <Link2 className="mr-2 h-4 w-4" />
              Phiếu nhập liên kết (Điều chuyển tự động)
            </h4>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-green-600 text-xs uppercase mb-1">
                  Số phiếu nhập
                </div>
                <div className="font-medium text-green-900">
                  {phieu.phieu_nhap_lien_ket.so_phieu}
                </div>
              </div>
              <div>
                <div className="text-green-600 text-xs uppercase mb-1">
                  Ngày nhập
                </div>
                <div className="font-medium text-green-900">
                  {formatDate(phieu.phieu_nhap_lien_ket.ngay_nhap)}
                </div>
              </div>
              <div>
                <div className="text-green-600 text-xs uppercase mb-1">
                  Loại phiếu nhập
                </div>
                <div className="font-medium text-green-900">
                  {phieu.phieu_nhap_lien_ket.loai_phieu === "dieu_chuyen"
                    ? "Điều chuyển"
                    : phieu.phieu_nhap_lien_ket.loai_phieu}
                </div>
              </div>
            </div>
            <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
              <AlertCircle className="inline h-3 w-3 mr-1" />
              Phiếu xuất này được tạo tự động từ phiếu nhập điều chuyển
            </div>
          </div>
        </div>
      )}

      {/* Chi tiết hàng hóa */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Chi tiết hàng hóa xuất kho
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Hàng hóa
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SL yêu cầu
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SL thực xuất
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn giá
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phẩm chất
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành tiền
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(phieu.chi_tiet || []).map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center font-medium text-gray-900">
                    {index + 1}
                  </td>

                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        {item.hang_hoa?.ten_hang_hoa ||
                          item.ten_hang_hoa ||
                          "Không xác định"}
                      </div>
                      <div className="text-xs text-gray-500 space-x-4">
                        <span>
                          Mã:{" "}
                          {item.hang_hoa?.ma_hang_hoa ||
                            item.ma_hang_hoa ||
                            "N/A"}
                        </span>
                        <span>
                          ĐVT:{" "}
                          {item.hang_hoa?.don_vi_tinh ||
                            item.don_vi_tinh ||
                            "N/A"}
                        </span>
                      </div>
                      {item.so_seri_xuat && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Serial: {item.so_seri_xuat}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center font-medium">
                    {parseFloat(item.so_luong_yeu_cau || 0).toLocaleString(
                      "vi-VN"
                    )}
                  </td>

                  <td className="px-4 py-3 text-center font-bold text-blue-600">
                    {parseFloat(item.so_luong_thuc_xuat || 0).toLocaleString(
                      "vi-VN"
                    )}
                  </td>

                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(item.don_gia)}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className={getPhamChatColor(item.pham_chat)}>
                      {PHAM_CHAT[item.pham_chat]?.label ||
                        PHAM_CHAT[item.pham_chat] ||
                        item.pham_chat}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    {formatCurrency(
                      item.thanh_tien || item.so_luong_thuc_xuat * item.don_gia
                    )}
                  </td>

                  <td className="px-4 py-3 text-center text-gray-600">
                    {item.ghi_chu || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total row */}
        <div className="bg-gray-50 px-4 py-3 border-t">
          <div className="flex justify-end items-center space-x-4">
            <div className="text-sm text-gray-600">
              Tổng cộng:{" "}
              <span className="font-medium">
                {(phieu.chi_tiet || []).length}
              </span>{" "}
              mặt hàng
            </div>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(phieu.tong_tien)}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Workflow & Revision Info - MỚI */}
      {(phieu.ghi_chu_phan_hoi || phieu.workflow_type || phieu.is_tu_dong) && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Thông tin quy trình
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {phieu.workflow_type && (
              <div>
                <span className="text-sm text-gray-600">Loại quy trình: </span>
                <span className="font-medium">
                  {phieu.workflow_type === "level3_exchange"
                    ? "Điều chuyển cấp 3"
                    : phieu.workflow_type === "standard"
                    ? "Quy trình thường"
                    : phieu.workflow_type}
                </span>
              </div>
            )}

            {phieu.is_tu_dong && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  Phiếu được tạo tự động từ hệ thống
                </span>
              </div>
            )}

            {phieu.ghi_chu_phan_hoi && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                <div className="font-medium text-orange-900 mb-1">
                  Phản hồi từ cấp trên:
                </div>
                <div className="text-orange-800">{phieu.ghi_chu_phan_hoi}</div>
                {phieu.nguoi_phan_hoi_ten && (
                  <div className="text-xs text-orange-600 mt-1">
                    - Người phản hồi: {phieu.nguoi_phan_hoi_ten}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhieuXuatDetail;
