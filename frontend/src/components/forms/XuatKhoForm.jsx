// import React, { useState, useEffect } from "react";
// import { useForm, useFieldArray } from "react-hook-form";
// import { Plus, Trash2, X } from "lucide-react";
// import { hangHoaService } from "../../services/hangHoaService";
// import { xuatKhoService } from "../../services/xuatKhoService";
// import { formatCurrency } from "../../utils/helpers";
// import { LOAI_PHIEU_XUAT, PHAM_CHAT } from "../../utils/constants";
// import toast from "react-hot-toast";

// const XuatKhoForm = ({ onSuccess, onCancel }) => {
//   const [allHangHoa, setAllHangHoa] = useState([]);
//   const [donViNhanList, setDonViNhanList] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const { register, control, handleSubmit, watch, setValue } = useForm({
//     defaultValues: {
//       ngay_xuat: new Date().toISOString().split("T")[0],
//       loai_xuat: "cap_phat",
//       don_vi_nhan_id: "",
//       nguoi_nhan: "",
//       ly_do_xuat: "",
//       ghi_chu: "",
//       chi_tiet: [
//         {
//           hang_hoa_id: "",
//           so_luong_yeu_cau: 1,
//           so_luong_thuc_xuat: 1,
//           don_gia: 0,
//           pham_chat: "tot",
//           so_seri_xuat: [],
//         },
//       ],
//     },
//   });

//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: "chi_tiet",
//   });

//   const chiTietItems = watch("chi_tiet");

//   // Load dữ liệu ban đầu
//   useEffect(() => {
//     loadAllHangHoa();
//     loadDonViNhan();
//   }, []);

//   const loadAllHangHoa = async () => {
//     try {
//       console.log("Loading all hang hoa for xuat kho...");
//       const response = await hangHoaService.getList({ limit: 1000 });
//       console.log("Hang hoa response:", response);

//       const hangHoaList = response.data?.items || response.data || [];
//       setAllHangHoa(hangHoaList);
//       console.log("Loaded hang hoa:", hangHoaList);
//     } catch (error) {
//       console.error("Error loading hang hoa:", error);
//       toast.error("Không thể tải danh sách hàng hóa");
//     }
//   };

//   const loadDonViNhan = async () => {
//     try {
//       // Mock data cho demo - trong thực tế sẽ có API donViNhanService
//       setDonViNhanList([
//         { id: 1, ten_don_vi: "Đội xe PTM", loai_don_vi: "doi_xe" },
//         { id: 2, ten_don_vi: "PKT HĐ11", loai_don_vi: "phong_ban" },
//         { id: 3, ten_don_vi: "Đội xe HĐ102", loai_don_vi: "doi_xe" },
//         { id: 4, ten_don_vi: "Ban TMKH", loai_don_vi: "phong_ban" },
//         { id: 5, ten_don_vi: "Ban hành chính", loai_don_vi: "phong_ban" },
//       ]);
//     } catch (error) {
//       console.error("Error loading don vi nhan:", error);
//     }
//   };

//   // Tính tổng tiền
//   const tongTien = chiTietItems.reduce((sum, item) => {
//     const soLuong = parseFloat(
//       item.so_luong_thuc_xuat || item.so_luong_yeu_cau || 0
//     );
//     const donGia = parseFloat(item.don_gia || 0);
//     return sum + soLuong * donGia;
//   }, 0);

//   const addNewRow = () => {
//     append({
//       hang_hoa_id: "",
//       so_luong_yeu_cau: 1,
//       so_luong_thuc_xuat: 1,
//       don_gia: 0,
//       pham_chat: "tot",
//       so_seri_xuat: [],
//       co_so_seri: false,
//     });
//   };

//   const handleSeriInput = (index, seriString) => {
//     const seriList = seriString
//       .split(/[,\n]/)
//       .map((s) => s.trim())
//       .filter((s) => s);
//     setValue(`chi_tiet.${index}.so_seri_xuat`, seriList);

//     // Tự động cập nhật số lượng thực xuất = số seri
//     if (seriList.length > 0) {
//       setValue(`chi_tiet.${index}.so_luong_thuc_xuat`, seriList.length);
//     }
//   };

//   const validateForm = () => {
//     const errors = [];

//     if (chiTietItems.length === 0) {
//       errors.push("Vui lòng thêm ít nhất một hàng hóa");
//     }

//     // Validate chi tiết
//     for (let i = 0; i < chiTietItems.length; i++) {
//       const item = chiTietItems[i];
//       if (!item.hang_hoa_id) {
//         errors.push(`Vui lòng chọn hàng hóa cho dòng ${i + 1}`);
//       }
//       if (!item.so_luong_yeu_cau || item.so_luong_yeu_cau <= 0) {
//         errors.push(`Số lượng yêu cầu dòng ${i + 1} phải lớn hơn 0`);
//       }
//       if (!item.so_luong_thuc_xuat || item.so_luong_thuc_xuat <= 0) {
//         errors.push(`Số lượng thực xuất dòng ${i + 1} phải lớn hơn 0`);
//       }
//       if (item.so_luong_thuc_xuat > item.so_luong_yeu_cau) {
//         errors.push(
//           `Số lượng thực xuất dòng ${i + 1} không được lớn hơn số lượng yêu cầu`
//         );
//       }
//       if (!item.don_gia || item.don_gia < 0) {
//         errors.push(`Đơn giá dòng ${i + 1} không hợp lệ`);
//       }
//     }

//     return errors;
//   };

//   const onSubmit = async (data) => {
//     console.log("Form data:", data);

//     const errors = validateForm();
//     if (errors.length > 0) {
//       toast.error(errors[0]);
//       return;
//     }

//     setLoading(true);
//     try {
//       // Tính toán thành tiền cho từng chi tiết
//       const chiTietWithThanhTien = data.chi_tiet.map((item) => ({
//         ...item,
//         so_luong_yeu_cau: parseFloat(item.so_luong_yeu_cau),
//         so_luong_thuc_xuat: parseFloat(item.so_luong_thuc_xuat),
//         don_gia: parseFloat(item.don_gia),
//         thanh_tien:
//           parseFloat(item.so_luong_thuc_xuat) * parseFloat(item.don_gia),
//       }));

//       const submitData = {
//         ...data,
//         tong_tien: tongTien,
//         chi_tiet: chiTietWithThanhTien,
//       };

//       const response = await xuatKhoService.create(submitData);
//       console.log("Create response:", response);
//       toast.success("Tạo phiếu xuất thành công");
//       onSuccess?.();
//     } catch (error) {
//       console.error("Create xuat kho error:", error);
//       toast.error(
//         error.response?.data?.message || "Có lỗi xảy ra khi tạo phiếu xuất"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//       {/* Header thông tin phiếu */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Ngày xuất <span className="text-red-500">*</span>
//           </label>
//           <input
//             type="date"
//             {...register("ngay_xuat", { required: true })}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Loại phiếu <span className="text-red-500">*</span>
//           </label>
//           <select
//             {...register("loai_xuat", { required: true })}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
//           >
//             {Object.entries(LOAI_PHIEU_XUAT).map(([key, label]) => (
//               <option key={key} value={key}>
//                 {label}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Đơn vị nhận
//           </label>
//           <select
//             {...register("don_vi_nhan_id")}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
//           >
//             <option value="">Chọn đơn vị nhận</option>
//             {donViNhanList.map((donVi) => (
//               <option key={donVi.id} value={donVi.id}>
//                 {donVi.ten_don_vi}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Người nhận
//           </label>
//           <input
//             type="text"
//             {...register("nguoi_nhan")}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
//             placeholder="Nhập tên người nhận"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Lý do xuất
//           </label>
//           <input
//             type="text"
//             {...register("ly_do_xuat")}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
//             placeholder="Nhập lý do xuất kho"
//           />
//         </div>
//       </div>

//       {/* Bảng chi tiết hàng hóa */}
//       <div>
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-medium text-gray-900">
//             Chi tiết hàng hóa
//           </h3>
//           <button
//             type="button"
//             onClick={addNewRow}
//             className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors"
//           >
//             <Plus size={16} />
//             <span>Thêm dòng</span>
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full border border-gray-200 rounded-lg">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   STT
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[300px]">
//                   Hàng hóa <span className="text-red-500">*</span>
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   SL yêu cầu <span className="text-red-500">*</span>
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   SL thực xuất <span className="text-red-500">*</span>
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Đơn giá <span className="text-red-500">*</span>
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Phẩm chất
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Số seri
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Thành tiền
//                 </th>
//                 <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
//                   Thao tác
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {fields.map((field, index) => {
//                 const currentItem = chiTietItems[index] || {};
//                 const thanhTien =
//                   (currentItem.so_luong_thuc_xuat || 0) *
//                   (currentItem.don_gia || 0);

//                 return (
//                   <tr key={field.id}>
//                     <td className="px-4 py-3 text-sm text-gray-900">
//                       {index + 1}
//                     </td>

//                     <td className="px-4 py-3">
//                       <select
//                         value={currentItem.hang_hoa_id || ""}
//                         onChange={(e) => {
//                           const selectedId = e.target.value;
//                           const selectedHangHoa = allHangHoa.find(
//                             (h) => h.id.toString() === selectedId
//                           );

//                           if (selectedHangHoa) {
//                             setValue(
//                               `chi_tiet.${index}.hang_hoa_id`,
//                               selectedHangHoa.id
//                             );
//                             setValue(
//                               `chi_tiet.${index}.hang_hoa`,
//                               selectedHangHoa
//                             );
//                             setValue(
//                               `chi_tiet.${index}.don_gia`,
//                               selectedHangHoa.gia_nhap_gan_nhat || 0
//                             );

//                             if (selectedHangHoa.co_so_seri) {
//                               setValue(`chi_tiet.${index}.co_so_seri`, true);
//                             }
//                           }
//                         }}
//                         className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-[280px]"
//                       >
//                         <option value="">Chọn hàng hóa</option>
//                         {allHangHoa.map((hangHoa) => (
//                           <option key={hangHoa.id} value={hangHoa.id}>
//                             {hangHoa.ma_hang_hoa} - {hangHoa.ten_hang_hoa}
//                           </option>
//                         ))}
//                       </select>
//                       {/* <div className="text-xs text-gray-500 mt-1">
//                         {allHangHoa.length} hàng hóa có sẵn
//                       </div> */}
//                     </td>

//                     <td className="px-4 py-3">
//                       <input
//                         type="number"
//                         step="1"
//                         min="0"
//                         {...register(`chi_tiet.${index}.so_luong_yeu_cau`, {
//                           required: true,
//                           min: 0.01,
//                         })}
//                         className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
//                         placeholder="0"
//                       />
//                     </td>

//                     <td className="px-4 py-3">
//                       <input
//                         type="number"
//                         step="1"
//                         min="0"
//                         {...register(`chi_tiet.${index}.so_luong_thuc_xuat`, {
//                           required: true,
//                           min: 0.01,
//                         })}
//                         className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
//                         placeholder="0"
//                       />
//                     </td>

//                     <td className="px-4 py-3">
//                       <input
//                         type="number"
//                         step="1000"
//                         min="0"
//                         {...register(`chi_tiet.${index}.don_gia`, {
//                           required: true,
//                           min: 0,
//                         })}
//                         className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
//                         placeholder="0"
//                       />
//                     </td>

//                     <td className="px-4 py-3">
//                       <select
//                         {...register(`chi_tiet.${index}.pham_chat`)}
//                         className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
//                       >
//                         {Object.entries(PHAM_CHAT).map(([key, config]) => (
//                           <option key={key} value={key}>
//                             {config.label}
//                           </option>
//                         ))}
//                       </select>
//                     </td>

//                     <td className="px-4 py-3">
//                       {currentItem.co_so_seri ? (
//                         <textarea
//                           rows={2}
//                           className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
//                           placeholder="Nhập số seri xuất, mỗi dòng một số"
//                           onChange={(e) =>
//                             handleSeriInput(index, e.target.value)
//                           }
//                         />
//                       ) : (
//                         <span className="text-gray-400 text-sm">Không có</span>
//                       )}
//                     </td>

//                     <td className="px-4 py-3 text-sm font-medium text-gray-900">
//                       {formatCurrency(thanhTien)}
//                     </td>

//                     <td className="px-4 py-3 text-center">
//                       <button
//                         type="button"
//                         onClick={() => remove(index)}
//                         className="text-red-600 hover:text-red-800 transition-colors"
//                         disabled={fields.length === 1}
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//             <tfoot className="bg-gray-50">
//               <tr>
//                 <td
//                   colSpan={7}
//                   className="px-4 py-3 text-right font-medium text-gray-900"
//                 >
//                   Tổng tiền:
//                 </td>
//                 <td className="px-4 py-3 font-bold text-lg text-red-600">
//                   {formatCurrency(tongTien)}
//                 </td>
//                 <td></td>
//               </tr>
//             </tfoot>
//           </table>
//         </div>
//       </div>

//       {/* Ghi chú */}
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Ghi chú
//         </label>
//         <textarea
//           {...register("ghi_chu")}
//           rows={3}
//           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm resize-none"
//           placeholder="Ghi chú thêm (không bắt buộc)"
//         />
//       </div>

//       {/* Form actions */}
//       <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//         <button
//           type="button"
//           onClick={onCancel}
//           className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm flex items-center space-x-2"
//           disabled={loading}
//         >
//           <X size={14} />
//           <span>Hủy</span>
//         </button>
//         <button
//           type="submit"
//           className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center space-x-2"
//           disabled={loading || fields.length === 0}
//         >
//           {loading ? (
//             <>
//               <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//               <span>Đang xử lý...</span>
//             </>
//           ) : (
//             <>
//               <Plus size={14} />
//               <span>Tạo phiếu xuất</span>
//             </>
//           )}
//         </button>
//       </div>
//     </form>
//   );
// };

// export default XuatKhoForm;

import React from "react";
import CreateXuatKhoForm from "./CreateXuatKhoForm";
import EditXuatKhoForm from "./EditXuatKhoForm";

const XuatKhoForm = ({ mode = "create", phieuId, onSuccess, onCancel }) => {
  if (mode === "edit") {
    return (
      <EditXuatKhoForm
        phieuId={phieuId}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );
  }

  return <CreateXuatKhoForm onSuccess={onSuccess} onCancel={onCancel} />;
};

export default XuatKhoForm;
