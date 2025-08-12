// import React, { useState, useEffect } from "react";
// import { useForm, useFieldArray } from "react-hook-form";
// import { Plus, Trash2 } from "lucide-react";
// import { searchService } from "../../services/searchService";
// import { nhapKhoService } from "../../services/nhapKhoService";
// import { formatCurrency } from "../../utils/helpers";
// import { LOAI_PHIEU_NHAP, PHAM_CHAT } from "../../utils/constants";
// import AutoComplete from "../common/AutoComplete";
// import toast from "react-hot-toast";

// const EditNhapKhoForm = ({ phieuId, onSuccess, onCancel }) => {
//   const [loading, setLoading] = useState(false);
//   const [isLoadingData, setIsLoadingData] = useState(true);
//   const [dataLoaded, setDataLoaded] = useState(false);
//   const [formReady, setFormReady] = useState(false);
//   const [phieuStatus, setPhieuStatus] = useState(null);

//   const {
//     register,
//     control,
//     handleSubmit,
//     watch,
//     setValue,
//     reset,
//     formState: { errors },
//   } = useForm({
//     mode: "onChange",
//     shouldUnregister: false,
//   });

//   const { fields, append, remove, replace } = useFieldArray({
//     control,
//     name: "chi_tiet",
//   });

//   const chiTietItems = watch("chi_tiet") || [];
//   const nhaCungCapData = watch("nha_cung_cap");
//   const isDraft = phieuStatus === "draft";

//   useEffect(() => {
//     if (phieuId) {
//       reset({});
//       setDataLoaded(false);
//       setFormReady(false);
//       setPhieuStatus(null);
//       loadPhieuData();
//     }
//   }, [phieuId, reset]);

//   const loadPhieuData = async () => {
//     try {
//       setIsLoadingData(true);
//       setDataLoaded(false);
//       setFormReady(false);

//       const response = await nhapKhoService.getDetail(phieuId);
//       const phieu = response.data;

//       setPhieuStatus(phieu.trang_thai);

//       const formattedDate = phieu.ngay_nhap
//         ? new Date(phieu.ngay_nhap).toISOString().split("T")[0]
//         : new Date().toISOString().split("T")[0];

//       const formData = {
//         ngay_nhap: formattedDate,
//         loai_phieu: phieu.loai_phieu || "tu_mua",
//         nguoi_nhap_hang: phieu.nguoi_nhap_hang || "",
//         so_quyet_dinh: phieu.so_quyet_dinh || "",
//         so_hoa_don: phieu.so_hoa_don || "",
//         dia_chi_nhap: phieu.dia_chi_nhap || "",
//         phuong_thuc_van_chuyen:
//           phieu.phuong_thuc_van_chuyen || "Đơn vị tự vận chuyển",
//         ly_do_nhap: phieu.ly_do_nhap || "",
//         ghi_chu: phieu.ghi_chu || "",
//         nha_cung_cap_id: phieu.nha_cung_cap?.id || null,
//         nha_cung_cap: phieu.nha_cung_cap || null,
//       };

//       reset(formData, { keepDefaultValues: false });

//       const chiTietData = phieu.chi_tiet.map((item) => ({
//         hang_hoa_id: item.hang_hoa.id,
//         hang_hoa: item.hang_hoa,
//         so_luong: parseFloat(item.so_luong) || 1,
//         don_gia: parseFloat(item.don_gia) || 0,
//         pham_chat: item.pham_chat || "tot",
//         danh_diem: item.so_seri_list ? item.so_seri_list.join(", ") : "",
//       }));

//       replace(chiTietData);

//       setTimeout(() => setDataLoaded(true), 150);
//       setTimeout(() => setFormReady(true), 300);
//     } catch (error) {
//       console.error("Error loading phieu data:", error);
//       toast.error("Không thể tải dữ liệu phiếu nhập");
//     } finally {
//       setIsLoadingData(false);
//     }
//   };

//   const tongTien = chiTietItems.reduce((sum, item) => {
//     const soLuong = parseFloat(item.so_luong || 0);
//     const donGia = parseFloat(item.don_gia || 0);
//     return sum + soLuong * donGia;
//   }, 0);

//   const createNhaCungCapIfNeeded = async (nhaCungCap) => {
//     if (!nhaCungCap?.isNewItem) return nhaCungCap;
//     try {
//       const response = await searchService.createNhaCungCapAuto({
//         ten_ncc: nhaCungCap.ten_ncc,
//       });
//       if (response.success) return response.data;
//       throw new Error(response.message || "Failed to create supplier");
//     } catch (error) {
//       throw new Error(
//         `Không thể tạo nhà cung cấp "${nhaCungCap.ten_ncc}": ${error.message}`
//       );
//     }
//   };

//   const createHangHoaIfNeeded = async (hangHoa) => {
//     if (!hangHoa?.isNewItem) return hangHoa;
//     try {
//       const response = await searchService.createHangHoaAuto({
//         ten_hang_hoa: hangHoa.ten_hang_hoa,
//         don_vi_tinh: "Cái",
//       });
//       if (response.success) return response.data;
//       throw new Error(response.message || "Failed to create product");
//     } catch (error) {
//       throw new Error(
//         `Không thể tạo hàng hóa "${hangHoa.ten_hang_hoa}": ${error.message}`
//       );
//     }
//   };

//   const handleNhaCungCapSelect = (nhaCungCap) => {
//     setValue("nha_cung_cap_id", nhaCungCap.id || null);
//     setValue("nha_cung_cap", nhaCungCap);
//     if (nhaCungCap.isNewItem) {
//       toast(`💡 Sẽ tạo nhà cung cấp mới: ${nhaCungCap.ten_ncc}`);
//     } else {
//       toast.success(`Đã chọn nhà cung cấp: ${nhaCungCap.ten_ncc}`);
//     }
//   };

//   const handleHangHoaSelect = (hangHoa, index) => {
//     setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id || null);
//     setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);
//     if (hangHoa.isNewItem) {
//       toast(`💡 Sẽ tạo hàng hóa mới: ${hangHoa.ten_hang_hoa}`);
//     } else {
//       if (hangHoa.gia_nhap_gan_nhat > 0) {
//         setValue(`chi_tiet.${index}.don_gia`, hangHoa.gia_nhap_gan_nhat);
//         toast.success(`Đã chọn ${hangHoa.ten_hang_hoa} và tự động điền giá.`);
//       } else {
//         toast.success(`Đã chọn ${hangHoa.ten_hang_hoa}. Vui lòng nhập giá.`);
//       }
//     }
//   };

//   const addNewRow = () => {
//     append({
//       hang_hoa_id: null,
//       hang_hoa: null,
//       so_luong: 1,
//       don_gia: 0,
//       pham_chat: "tot",
//       danh_diem: "",
//     });
//   };

//   const onSubmit = async (data) => {
//     if (data.chi_tiet.length === 0) {
//       toast.error("Vui lòng thêm ít nhất một hàng hóa");
//       return;
//     }
//     for (let i = 0; i < data.chi_tiet.length; i++) {
//       const item = data.chi_tiet[i];
//       if (!item.hang_hoa) {
//         toast.error(`Dòng ${i + 1}: Vui lòng chọn hàng hóa`);
//         return;
//       }
//       if (!item.so_luong || item.so_luong <= 0) {
//         toast.error(`Dòng ${i + 1}: Số lượng phải lớn hơn 0`);
//         return;
//       }
//       if (item.don_gia === undefined || item.don_gia < 0) {
//         toast.error(`Dòng ${i + 1}: Đơn giá không hợp lệ`);
//         return;
//       }
//     }

//     setLoading(true);
//     try {
//       toast.loading("Đang cập nhật phiếu nhập...", { id: "processing" });

//       let finalNhaCungCap = data.nha_cung_cap;
//       if (isDraft && data.nha_cung_cap?.isNewItem) {
//         finalNhaCungCap = await createNhaCungCapIfNeeded(data.nha_cung_cap);
//         toast.success(`✓ Đã tạo nhà cung cấp: ${finalNhaCungCap.ten_ncc}`);
//       }

//       const finalChiTiet = [];
//       for (let item of data.chi_tiet) {
//         let finalHangHoa = item.hang_hoa;
//         if (isDraft && item.hang_hoa?.isNewItem) {
//           finalHangHoa = await createHangHoaIfNeeded(item.hang_hoa);
//           toast.success(`✓ Đã tạo hàng hóa: ${finalHangHoa.ten_hang_hoa}`);
//         }
//         finalChiTiet.push({
//           hang_hoa_id: finalHangHoa.id,
//           so_luong: parseFloat(item.so_luong),
//           don_gia: parseFloat(item.don_gia),
//           pham_chat: item.pham_chat,
//           so_seri_list: item.danh_diem
//             ? item.danh_diem
//                 .split(/[,\n]/)
//                 .map((s) => s.trim())
//                 .filter(Boolean)
//             : [],
//         });
//       }

//       const submitData = {
//         ngay_nhap: data.ngay_nhap,
//         loai_phieu: data.loai_phieu,
//         nguoi_nhap_hang: data.nguoi_nhap_hang || "",
//         so_quyet_dinh: data.so_quyet_dinh || "",
//         so_hoa_don: data.so_hoa_don || "",
//         dia_chi_nhap: data.dia_chi_nhap || "",
//         phuong_thuc_van_chuyen:
//           data.phuong_thuc_van_chuyen || "Đơn vị tự vận chuyển",
//         ly_do_nhap: data.ly_do_nhap || "",
//         ghi_chu: data.ghi_chu || "",
//         nha_cung_cap_id: finalNhaCungCap?.id || null,
//         chi_tiet: finalChiTiet,
//       };

//       await nhapKhoService.update(phieuId, submitData);

//       toast.dismiss("processing");
//       toast.success("🎉 Cập nhật phiếu nhập thành công!");
//       onSuccess?.();
//     } catch (error) {
//       toast.dismiss("processing");

//       let errorMessage = "Có lỗi xảy ra khi cập nhật phiếu nhập";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       } else if (error.response?.data?.errors) {
//         const validationErrors = Object.values(
//           error.response.data.errors
//         ).flat();
//         errorMessage = validationErrors.join(", ");
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (isLoadingData || !dataLoaded || !formReady) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
//         <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 space-y-4">
//       {!isDraft && (
//         <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
//           Phiếu này không còn ở trạng thái nháp nên không thể tạo mới nhà cung
//           cấp hoặc hàng hóa. Bạn chỉ có thể chỉnh sửa các thông tin hiện có.
//         </div>
//       )}

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
//         {/* Basic Information */}
//         <div className="bg-white border rounded-lg p-4">
//           <h3 className="text-lg font-medium text-gray-900 mb-4">
//             Thông tin phiếu nhập
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Ngày nhập *
//               </label>
//               <input
//                 type="date"
//                 {...register("ngay_nhap", {
//                   required: "Vui lòng chọn ngày nhập",
//                 })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
//               />
//               {errors.ngay_nhap && (
//                 <p className="mt-1 text-sm text-red-600">
//                   {errors.ngay_nhap.message}
//                 </p>
//               )}
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Loại phiếu *
//               </label>
//               <select
//                 {...register("loai_phieu", {
//                   required: "Vui lòng chọn loại phiếu",
//                 })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
//               >
//                 {Object.entries(LOAI_PHIEU_NHAP).map(([key, value]) => (
//                   <option key={key} value={key}>
//                     {typeof value === "object" ? value.label : value}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Số quyết định
//               </label>
//               <input
//                 type="text"
//                 {...register("so_quyet_dinh")}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
//                 placeholder="Số quyết định nhập hàng"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Người nhập hàng
//               </label>
//               <input
//                 type="text"
//                 {...register("nguoi_nhap_hang")}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
//                 placeholder="Tên người nhập hàng"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Nhà cung cấp
//               </label>
//               <AutoComplete
//                 key={`supplier-${
//                   formReady ? nhaCungCapData?.id || "loaded" : "loading"
//                 }`}
//                 searchFunction={searchService.searchNhaCungCap}
//                 onSelect={handleNhaCungCapSelect}
//                 placeholder="Nhập tên nhà cung cấp..."
//                 displayField="ten_ncc"
//                 createLabel="Sẽ tạo nhà cung cấp mới"
//                 className="w-full"
//                 initialValue={nhaCungCapData?.ten_ncc || ""}
//                 allowCreate={isDraft}
//               />
//               {nhaCungCapData?.isNewItem && isDraft && (
//                 <div className="mt-1 text-xs text-blue-600">
//                   💡 Nhà cung cấp mới sẽ được tạo khi lưu phiếu nhập
//                 </div>
//               )}
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Số hóa đơn
//               </label>
//               <input
//                 type="text"
//                 {...register("so_hoa_don")}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
//                 placeholder="Nhập số hóa đơn"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Địa chỉ nhập
//               </label>
//               <input
//                 type="text"
//                 {...register("dia_chi_nhap")}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
//                 placeholder="Địa chỉ nhập hàng"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Lý do nhập
//               </label>
//               <input
//                 type="text"
//                 {...register("ly_do_nhap")}
//                 rows={3}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm resize-none"
//                 placeholder="Nhập lý do nhập kho"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Product Details */}
//         <div className="bg-white border rounded-lg overflow-hidden">
//           <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
//             <h4 className="font-semibold text-gray-900">
//               Chi tiết hàng hóa ({fields.length} mặt hàng)
//             </h4>

//             <button
//               type="button"
//               onClick={addNewRow}
//               className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-all"
//               title="Thêm dòng"
//             >
//               <Plus size={16} />
//             </button>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase w-12">
//                     STT
//                   </th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase w-50">
//                     Hàng hóa *
//                   </th>
//                   <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-20">
//                     Số lượng *
//                   </th>
//                   <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-24">
//                     Đơn giá *
//                   </th>
//                   <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-20">
//                     Phẩm chất
//                   </th>
//                   <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-24">
//                     Danh điểm
//                   </th>
//                   <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-24">
//                     Thành tiền
//                   </th>
//                   <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-16">
//                     Thao tác
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {fields.map((field, index) => {
//                   const currentItem = chiTietItems[index] || {};
//                   const thanhTien =
//                     (currentItem.so_luong || 0) * (currentItem.don_gia || 0);

//                   return (
//                     <tr key={field.id} className="hover:bg-gray-50">
//                       <td className="px-3 py-2 text-center text-gray-900 font-medium">
//                         {index + 1}
//                       </td>
//                       <td className="px-3 py-2">
//                         <AutoComplete
//                           key={`product-${index}-${
//                             formReady
//                               ? currentItem.hang_hoa?.id || "loaded"
//                               : "loading"
//                           }`}
//                           searchFunction={searchService.searchHangHoa}
//                           onSelect={(hangHoa) =>
//                             handleHangHoaSelect(hangHoa, index)
//                           }
//                           placeholder="Nhập tên hàng hóa..."
//                           displayField="ten_hang_hoa"
//                           createLabel="Sẽ tạo hàng hóa mới"
//                           className="min-w-[250px]"
//                           initialValue={
//                             currentItem.hang_hoa?.ten_hang_hoa || ""
//                           }
//                           allowCreate={isDraft}
//                         />
//                         <div className="text-xs text-gray-500 mt-1">
//                           {currentItem.hang_hoa &&
//                             !currentItem.hang_hoa.isNewItem && (
//                               <span className="text-green-600">
//                                 ✓ {currentItem.hang_hoa.ma_hang_hoa} -{" "}
//                                 {currentItem.hang_hoa.don_vi_tinh}
//                               </span>
//                             )}
//                           {currentItem.hang_hoa?.isNewItem && isDraft && (
//                             <span className="text-blue-600">
//                               💡 Hàng hóa mới sẽ được tạo
//                             </span>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-3 py-2">
//                         <input
//                           type="number"
//                           min="0"
//                           step="1"
//                           {...register(`chi_tiet.${index}.so_luong`, {
//                             required: "Vui lòng nhập số lượng",
//                             min: {
//                               value: 1,
//                               message: "Số lượng phải lớn hơn 0",
//                             },
//                           })}
//                           className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
//                         />
//                       </td>
//                       <td className="px-3 py-2">
//                         <input
//                           type="number"
//                           min="0"
//                           step="1000"
//                           {...register(`chi_tiet.${index}.don_gia`, {
//                             required: "Vui lòng nhập đơn giá",
//                             min: { value: 0, message: "Đơn giá không được âm" },
//                           })}
//                           className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
//                         />
//                       </td>
//                       <td className="px-3 py-2">
//                         <select
//                           {...register(`chi_tiet.${index}.pham_chat`)}
//                           className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
//                         >
//                           {Object.entries(PHAM_CHAT).map(([key, value]) => (
//                             <option key={key} value={key}>
//                               {value.label}
//                             </option>
//                           ))}
//                         </select>
//                       </td>
//                       <td className="px-3 py-2">
//                         <input
//                           type="text"
//                           {...register(`chi_tiet.${index}.danh_diem`)}
//                           rows={2}
//                           className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
//                           placeholder="Số seri"
//                         />
//                       </td>
//                       <td className="px-3 py-2 text-right font-medium">
//                         {formatCurrency(thanhTien)}
//                       </td>
//                       <td className="px-3 py-2 text-center">
//                         <button
//                           type="button"
//                           onClick={() => remove(index)}
//                           disabled={fields.length === 1}
//                           className="text-red-600 hover:text-red-800 disabled:text-gray-400"
//                           title={
//                             fields.length === 1
//                               ? "Không thể xóa dòng cuối cùng"
//                               : "Xóa dòng"
//                           }
//                         >
//                           <Trash2 size={14} />
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//                 {fields.length > 0 && (
//                   <tr className="bg-green-50 font-bold">
//                     <td
//                       colSpan="6"
//                       className="px-3 py-3 text-right text-gray-900"
//                     >
//                       TỔNG CỘNG:
//                     </td>
//                     <td className="px-3 py-3 text-right text-green-600 text-lg">
//                       {formatCurrency(tongTien)}
//                     </td>
//                     <td></td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex items-center justify-end space-x-3 pt-4">
//           <button
//             type="button"
//             onClick={onCancel}
//             disabled={loading}
//             className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
//           >
//             Hủy
//           </button>
//           <button
//             type="submit"
//             disabled={loading}
//             className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
//           >
//             {loading && (
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//             )}
//             <span>{loading ? "Đang xử lý..." : "Cập nhật phiếu"}</span>
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default EditNhapKhoForm;

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { searchService } from "../../services/searchService";
import { nhapKhoService } from "../../services/nhapKhoService";
import { formatCurrency } from "../../utils/helpers";
import { LOAI_PHIEU_NHAP, PHAM_CHAT } from "../../utils/constants";
import AutoComplete from "../common/AutoComplete";
import toast from "react-hot-toast";

const EditNhapKhoForm = ({ phieuId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [phieuStatus, setPhieuStatus] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    shouldUnregister: false,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "chi_tiet",
  });

  const chiTietItems = watch("chi_tiet") || [];
  const nhaCungCapData = watch("nha_cung_cap");
  const isDraft = phieuStatus === "draft";

  useEffect(() => {
    if (phieuId) {
      reset({});
      setDataLoaded(false);
      setFormReady(false);
      setPhieuStatus(null);
      loadPhieuData();
    }
  }, [phieuId, reset]);

  const loadPhieuData = async () => {
    try {
      setIsLoadingData(true);
      setDataLoaded(false);
      setFormReady(false);

      const response = await nhapKhoService.getDetail(phieuId);
      const phieu = response.data;

      setPhieuStatus(phieu.trang_thai);

      const formattedDate = phieu.ngay_nhap
        ? new Date(phieu.ngay_nhap).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const formData = {
        ngay_nhap: formattedDate,
        loai_phieu: phieu.loai_phieu || "tu_mua",
        nguoi_nhap_hang: phieu.nguoi_nhap_hang || "",
        so_quyet_dinh: phieu.so_quyet_dinh || "",
        so_hoa_don: phieu.so_hoa_don || "",
        dia_chi_nhap: phieu.dia_chi_nhap || "",
        phuong_thuc_van_chuyen:
          phieu.phuong_thuc_van_chuyen || "Đơn vị tự vận chuyển",
        ly_do_nhap: phieu.ly_do_nhap || "",
        ghi_chu: phieu.ghi_chu || "",
        nha_cung_cap_id: phieu.nha_cung_cap?.id || null,
        nha_cung_cap: phieu.nha_cung_cap || null,
      };

      reset(formData, { keepDefaultValues: false });

      const chiTietData = phieu.chi_tiet.map((item) => ({
        hang_hoa_id: item.hang_hoa.id,
        hang_hoa: item.hang_hoa,
        so_luong: parseFloat(item.so_luong) || 1,
        don_gia: parseFloat(item.don_gia) || 0,
        pham_chat: item.pham_chat || "tot",
        danh_diem: item.so_seri_list ? item.so_seri_list.join(", ") : "",
      }));

      replace(chiTietData);

      setTimeout(() => setDataLoaded(true), 150);
      setTimeout(() => setFormReady(true), 300);
    } catch (error) {
      console.error("Error loading phieu data:", error);
      toast.error("Không thể tải dữ liệu phiếu nhập");
    } finally {
      setIsLoadingData(false);
    }
  };

  const tongTien = chiTietItems.reduce((sum, item) => {
    const soLuong = parseFloat(item.so_luong || 0);
    const donGia = parseFloat(item.don_gia || 0);
    return sum + soLuong * donGia;
  }, 0);

  const createNhaCungCapIfNeeded = async (nhaCungCap) => {
    if (!nhaCungCap?.isNewItem) return nhaCungCap;
    try {
      const response = await searchService.createNhaCungCapAuto({
        ten_ncc: nhaCungCap.ten_ncc,
      });
      if (response.success) return response.data;
      throw new Error(response.message || "Failed to create supplier");
    } catch (error) {
      throw new Error(
        `Không thể tạo nhà cung cấp "${nhaCungCap.ten_ncc}": ${error.message}`
      );
    }
  };

  const createHangHoaIfNeeded = async (hangHoa) => {
    if (!hangHoa?.isNewItem) return hangHoa;
    try {
      const response = await searchService.createHangHoaAuto({
        ten_hang_hoa: hangHoa.ten_hang_hoa,
        don_vi_tinh: "Cái",
      });
      if (response.success) return response.data;
      throw new Error(response.message || "Failed to create product");
    } catch (error) {
      throw new Error(
        `Không thể tạo hàng hóa "${hangHoa.ten_hang_hoa}": ${error.message}`
      );
    }
  };

  const handleNhaCungCapSelect = (nhaCungCap) => {
    setValue("nha_cung_cap_id", nhaCungCap.id || null);
    setValue("nha_cung_cap", nhaCungCap);
    if (nhaCungCap.isNewItem) {
      toast(`💡 Sẽ tạo nhà cung cấp mới: ${nhaCungCap.ten_ncc}`);
    } else {
      toast.success(`Đã chọn nhà cung cấp: ${nhaCungCap.ten_ncc}`);
    }
  };

  const handleHangHoaSelect = (hangHoa, index) => {
    setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id || null);
    setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);
    if (hangHoa.isNewItem) {
      toast(`💡 Sẽ tạo hàng hóa mới: ${hangHoa.ten_hang_hoa}`);
    } else {
      if (hangHoa.gia_nhap_gan_nhat > 0) {
        setValue(`chi_tiet.${index}.don_gia`, hangHoa.gia_nhap_gan_nhat);
        toast.success(`Đã chọn ${hangHoa.ten_hang_hoa} và tự động điền giá.`);
      } else {
        toast.success(`Đã chọn ${hangHoa.ten_hang_hoa}. Vui lòng nhập giá.`);
      }
    }
  };

  const addNewRow = () => {
    append({
      hang_hoa_id: null,
      hang_hoa: null,
      so_luong: 1,
      don_gia: 0,
      pham_chat: "tot",
      danh_diem: "",
    });
  };

  const onSubmit = async (data) => {
    if (data.chi_tiet.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hàng hóa");
      return;
    }
    for (let i = 0; i < data.chi_tiet.length; i++) {
      const item = data.chi_tiet[i];
      if (!item.hang_hoa) {
        toast.error(`Dòng ${i + 1}: Vui lòng chọn hàng hóa`);
        return;
      }
      if (!item.so_luong || item.so_luong <= 0) {
        toast.error(`Dòng ${i + 1}: Số lượng phải lớn hơn 0`);
        return;
      }
      if (item.don_gia === undefined || item.don_gia < 0) {
        toast.error(`Dòng ${i + 1}: Đơn giá không hợp lệ`);
        return;
      }
    }

    setLoading(true);
    try {
      toast.loading("Đang cập nhật phiếu nhập...", { id: "processing" });

      let finalNhaCungCap = data.nha_cung_cap;
      if (isDraft && data.nha_cung_cap?.isNewItem) {
        finalNhaCungCap = await createNhaCungCapIfNeeded(data.nha_cung_cap);
        toast.success(`✓ Đã tạo nhà cung cấp: ${finalNhaCungCap.ten_ncc}`);
      }

      const finalChiTiet = [];
      for (let item of data.chi_tiet) {
        let finalHangHoa = item.hang_hoa;
        if (isDraft && item.hang_hoa?.isNewItem) {
          finalHangHoa = await createHangHoaIfNeeded(item.hang_hoa);
          toast.success(`✓ Đã tạo hàng hóa: ${finalHangHoa.ten_hang_hoa}`);
        }
        finalChiTiet.push({
          hang_hoa_id: finalHangHoa.id,
          so_luong: parseFloat(item.so_luong),
          don_gia: parseFloat(item.don_gia),
          pham_chat: item.pham_chat,
          so_seri_list: item.danh_diem
            ? item.danh_diem
                .split(/[,\n]/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        });
      }

      const submitData = {
        ngay_nhap: data.ngay_nhap,
        loai_phieu: data.loai_phieu,
        nguoi_nhap_hang: data.nguoi_nhap_hang || "",
        so_quyet_dinh: data.so_quyet_dinh || "",
        so_hoa_don: data.so_hoa_don || "",
        dia_chi_nhap: data.dia_chi_nhap || "",
        phuong_thuc_van_chuyen:
          data.phuong_thuc_van_chuyen || "Đơn vị tự vận chuyển",
        ly_do_nhap: data.ly_do_nhap || "",
        ghi_chu: data.ghi_chu || "",
        nha_cung_cap_id: finalNhaCungCap?.id || null,
        chi_tiet: finalChiTiet,
      };

      await nhapKhoService.update(phieuId, submitData);

      toast.dismiss("processing");
      toast.success("🎉 Cập nhật phiếu nhập thành công!");
      onSuccess?.();
    } catch (error) {
      toast.dismiss("processing");

      let errorMessage = "Có lỗi xảy ra khi cập nhật phiếu nhập";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const validationErrors = Object.values(
          error.response.data.errors
        ).flat();
        errorMessage = validationErrors.join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingData || !dataLoaded || !formReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {!isDraft && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
          Phiếu này không còn ở trạng thái nháp nên không thể tạo mới nhà cung
          cấp hoặc hàng hóa. Bạn chỉ có thể chỉnh sửa các thông tin hiện có.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Thông tin phiếu nhập
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày nhập *
              </label>
              <input
                type="date"
                {...register("ngay_nhap", {
                  required: "Vui lòng chọn ngày nhập",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
              />
              {errors.ngay_nhap && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.ngay_nhap.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại phiếu *
              </label>
              <select
                {...register("loai_phieu", {
                  required: "Vui lòng chọn loại phiếu",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
              >
                {Object.entries(LOAI_PHIEU_NHAP).map(([key, value]) => (
                  <option key={key} value={key}>
                    {typeof value === "object" ? value.label : value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số quyết định
              </label>
              <input
                type="text"
                {...register("so_quyet_dinh")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Số quyết định nhập hàng"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người nhập hàng
              </label>
              <input
                type="text"
                {...register("nguoi_nhap_hang")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Tên người nhập hàng"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhà cung cấp
              </label>
              <AutoComplete
                key={`supplier-${
                  formReady ? nhaCungCapData?.id || "loaded" : "loading"
                }`}
                searchFunction={searchService.searchNhaCungCap}
                onSelect={handleNhaCungCapSelect}
                placeholder="Nhập tên nhà cung cấp..."
                displayField="ten_ncc"
                createLabel="Sẽ tạo nhà cung cấp mới"
                className="w-full"
                initialValue={nhaCungCapData?.ten_ncc || ""}
                allowCreate={isDraft}
              />
              {nhaCungCapData?.isNewItem && isDraft && (
                <div className="mt-1 text-xs text-blue-600">
                  💡 Nhà cung cấp mới sẽ được tạo khi lưu phiếu nhập
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số hóa đơn
              </label>
              <input
                type="text"
                {...register("so_hoa_don")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Nhập số hóa đơn"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ nhập
              </label>
              <input
                type="text"
                {...register("dia_chi_nhap")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Địa chỉ nhập hàng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do nhập
              </label>
              <input
                type="text"
                {...register("ly_do_nhap")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Nhập lý do nhập kho"
              />
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              Chi tiết hàng hóa ({fields.length} mặt hàng)
            </h4>

            <button
              type="button"
              onClick={addNewRow}
              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-all"
              title="Thêm dòng"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase w-[4%]">
                    STT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase w-[25%]">
                    Hàng hóa *
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[12%]">
                    Số lượng *
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[15%]">
                    Đơn giá *
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[12%]">
                    Phẩm chất
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[15%]">
                    Danh điểm
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[15%]">
                    Thành tiền
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[6%]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fields.map((field, index) => {
                  const currentItem = chiTietItems[index] || {};
                  const thanhTien =
                    (currentItem.so_luong || 0) * (currentItem.don_gia || 0);

                  return (
                    <React.Fragment key={field.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-center text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2">
                          <AutoComplete
                            key={`product-${index}-${
                              formReady
                                ? currentItem.hang_hoa?.id || "loaded"
                                : "loading"
                            }`}
                            searchFunction={searchService.searchHangHoa}
                            onSelect={(hangHoa) =>
                              handleHangHoaSelect(hangHoa, index)
                            }
                            placeholder="Nhập tên hàng hóa..."
                            displayField="ten_hang_hoa"
                            createLabel="Sẽ tạo hàng hóa mới"
                            className="min-w-[250px]"
                            initialValue={
                              currentItem.hang_hoa?.ten_hang_hoa || ""
                            }
                            allowCreate={isDraft}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            {...register(`chi_tiet.${index}.so_luong`, {
                              required: "Vui lòng nhập số lượng",
                              min: {
                                value: 1,
                                message: "Số lượng phải lớn hơn 0",
                              },
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            {...register(`chi_tiet.${index}.don_gia`, {
                              required: "Vui lòng nhập đơn giá",
                              min: {
                                value: 0,
                                message: "Đơn giá không được âm",
                              },
                            })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            {...register(`chi_tiet.${index}.pham_chat`)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {Object.entries(PHAM_CHAT).map(([key, value]) => (
                              <option key={key} value={key}>
                                {value.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            {...register(`chi_tiet.${index}.danh_diem`)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                            placeholder="Số seri"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatCurrency(thanhTien)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                            className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                            title={
                              fields.length === 1
                                ? "Không thể xóa dòng cuối cùng"
                                : "Xóa dòng"
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                      {(currentItem.hang_hoa &&
                        !currentItem.hang_hoa.isNewItem) ||
                      (currentItem.hang_hoa?.isNewItem && isDraft) ? (
                        <tr>
                          <td></td>
                          <td
                            colSpan="7"
                            className="px-3 py-1 text-xs text-gray-500"
                          >
                            {currentItem.hang_hoa &&
                              !currentItem.hang_hoa.isNewItem && (
                                <span className="text-green-600">
                                  ✓ {currentItem.hang_hoa.ma_hang_hoa} -{" "}
                                  {currentItem.hang_hoa.don_vi_tinh}
                                </span>
                              )}
                            {currentItem.hang_hoa?.isNewItem && isDraft && (
                              <span className="text-blue-600">
                                💡 Hàng hóa mới sẽ được tạo
                              </span>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
                {fields.length > 0 && (
                  <tr className="bg-green-50 font-bold">
                    <td
                      colSpan="7"
                      className="px-3 py-3 text-right text-gray-900"
                    >
                      TỔNG CỘNG:
                    </td>
                    <td className="px-3 py-3 text-right text-green-600 text-lg">
                      {formatCurrency(tongTien)}
                    </td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{loading ? "Đang xử lý..." : "Cập nhật phiếu"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditNhapKhoForm;
