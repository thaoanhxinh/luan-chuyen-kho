// import React, { useState } from "react";
// import { useForm, useFieldArray } from "react-hook-form";
// import { Plus, Trash2, AlertTriangle, Info } from "lucide-react";
// import { searchService } from "../../services/searchService";
// import { xuatKhoService } from "../../services/xuatKhoService";
// import { formatCurrency } from "../../utils/helpers";
// import { LOAI_PHIEU_XUAT } from "../../utils/constants";
// import AutoComplete from "../common/AutoComplete";
// import toast from "react-hot-toast";

// const CreateXuatKhoForm = ({ onSuccess, onCancel }) => {
//   const [loading, setLoading] = useState(false);
//   const [tonKhoInfo, setTonKhoInfo] = useState({});

//   const {
//     register,
//     control,
//     handleSubmit,
//     watch,
//     setValue,
//     formState: { errors },
//   } = useForm({
//     defaultValues: {
//       ngay_xuat: new Date().toISOString().split("T")[0],
//       loai_xuat: "don_vi_nhan",
//       nguoi_nhan: "",
//       ly_do_xuat: "",
//       ghi_chu: "",
//       don_vi_nhan_id: null,
//       don_vi_nhan: null,
//       chi_tiet: [
//         {
//           hang_hoa_id: null,
//           hang_hoa: null,
//           so_luong_yeu_cau: 1,
//           so_luong_thuc_xuat: null, // Để trống, sẽ điền sau
//           don_gia: 0,
//         },
//       ],
//     },
//   });

//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: "chi_tiet",
//   });

//   const chiTietItems = watch("chi_tiet");
//   const donViNhanData = watch("don_vi_nhan");

//   // Tính tổng tiền dựa trên số lượng yêu cầu (để dự tính)
//   // Sau này sẽ tính lại dựa trên số lượng thực xuất
//   const tongTienDuTinh = chiTietItems.reduce((sum, item) => {
//     return (
//       sum +
//       parseFloat(item.so_luong_yeu_cau || 0) * parseFloat(item.don_gia || 0)
//     );
//   }, 0);

//   // Tính tổng tiền thực tế (nếu đã điền số lượng thực xuất)
//   const tongTienThucTe = chiTietItems.reduce((sum, item) => {
//     const soLuongThucXuat = item.so_luong_thuc_xuat || 0;
//     return sum + parseFloat(soLuongThucXuat) * parseFloat(item.don_gia || 0);
//   }, 0);

//   const handleDonViNhanSelect = (donViNhan) => {
//     setValue("don_vi_nhan_id", donViNhan.id || null);
//     setValue("don_vi_nhan", donViNhan);

//     if (donViNhan.isNewItem) {
//       toast(`💡 Sẽ tạo đơn vị nhận mới: ${donViNhan.ten_don_vi}`, {
//         duration: 3000,
//         style: {
//           background: "#EBF8FF",
//           color: "#2B6CB0",
//           border: "1px solid #BEE3F8",
//         },
//       });
//     } else {
//       toast.success(`Đã chọn đơn vị nhận: ${donViNhan.ten_don_vi}`);
//     }
//   };

//   // const handleHangHoaSelect = async (hangHoa, index) => {
//   //   setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id || null);
//   //   setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);

//   //   // Kiểm tra tồn kho
//   //   try {
//   //     const response = await xuatKhoService.checkTonKho({
//   //       chi_tiet: [{ hang_hoa_id: hangHoa.id, so_luong_yeu_cau: 1 }],
//   //     });

//   //     const tonKhoItem = response.data.ton_kho[0];
//   //     if (tonKhoItem) {
//   //       setTonKhoInfo((prev) => ({
//   //         ...prev,
//   //         [index]: tonKhoItem,
//   //       }));

//   //       // Tự động điền đơn giá từ tồn kho
//   //       if (tonKhoItem.don_gia_binh_quan > 0) {
//   //         setValue(`chi_tiet.${index}.don_gia`, tonKhoItem.don_gia_binh_quan);
//   //       }

//   //       if (tonKhoItem.so_luong_ton > 0) {
//   //         toast.success(
//   //           `Đã chọn ${hangHoa.ten_hang_hoa}. Tồn kho: ${
//   //             tonKhoItem.so_luong_ton
//   //           } ${hangHoa.don_vi_tinh}. Đơn giá: ${formatCurrency(
//   //             tonKhoItem.don_gia_binh_quan
//   //           )}`
//   //         );
//   //       } else {
//   //         toast.warning(`${hangHoa.ten_hang_hoa} không có tồn kho!`);
//   //       }
//   //     }
//   //   } catch (error) {
//   //     console.error("Error checking ton kho:", error);
//   //     toast.error("Không thể kiểm tra tồn kho");
//   //   }
//   // };

//   const handleHangHoaSelect = async (hangHoa, index) => {
//     setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id || null);
//     setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);

//     // Sử dụng API mới để kiểm tra tồn kho thực tế
//     try {
//       const response = await xuatKhoService.checkTonKhoThucTe({
//         chi_tiet: [{ hang_hoa_id: hangHoa.id, so_luong_yeu_cau: 1 }],
//       });

//       const tonKhoItem = response.data.ton_kho[0];
//       if (tonKhoItem) {
//         setTonKhoInfo((prev) => ({
//           ...prev,
//           [index]: tonKhoItem,
//         }));

//         // Hiển thị thông tin chi tiết hơn
//         if (tonKhoItem.so_luong_co_the_xuat > 0) {
//           toast.success(
//             `Đã chọn ${hangHoa.ten_hang_hoa}. ` +
//               `Tồn kho: ${tonKhoItem.so_luong_ton_thuc_te} ` +
//               `${
//                 tonKhoItem.so_luong_dang_cho_xuat > 0
//                   ? `(Đang chờ xuất: ${tonKhoItem.so_luong_dang_cho_xuat}) `
//                   : ""
//               }` +
//               `Có thể xuất: ${tonKhoItem.so_luong_co_the_xuat} ${hangHoa.don_vi_tinh}`
//           );
//         } else {
//           toast.warning(
//             `${hangHoa.ten_hang_hoa} không đủ để xuất! ` +
//               `${tonKhoItem.canh_bao || ""}`
//           );
//         }
//       }
//     } catch (error) {
//       console.error("Error checking ton kho thuc te:", error);
//       toast.error("Không thể kiểm tra tồn kho thực tế");
//     }
//   };
//   const addNewRow = () => {
//     append({
//       hang_hoa_id: null,
//       hang_hoa: null,
//       so_luong_yeu_cau: 1,
//       so_luong_thuc_xuat: null, // Để trống
//       don_gia: 0,
//     });
//   };

//   // Create đơn vị nhận if needed
//   const createDonViNhanIfNeeded = async (donViNhan) => {
//     if (!donViNhan?.isNewItem) {
//       return donViNhan;
//     }

//     try {
//       const timeoutPromise = new Promise((_, reject) =>
//         setTimeout(() => reject(new Error("Timeout")), 15000)
//       );

//       const createPromise = searchService.createDonViNhanAuto({
//         ten_don_vi: donViNhan.ten_don_vi,
//       });

//       const response = await Promise.race([createPromise, timeoutPromise]);

//       if (response.success) {
//         return response.data;
//       } else {
//         throw new Error(response.message || "Failed to create don vi nhan");
//       }
//     } catch (error) {
//       let errorMessage = `Không thể tạo đơn vị nhận "${donViNhan.ten_don_vi}"`;
//       if (error.message === "Timeout") {
//         errorMessage += ": Kết nối quá chậm, vui lòng thử lại";
//       }
//       throw new Error(errorMessage);
//     }
//   };

//   const onSubmit = async (data) => {
//     if (data.chi_tiet.length === 0) {
//       toast.error("Vui lòng thêm ít nhất một hàng hóa");
//       return;
//     }

//     // Validate details
//     for (let i = 0; i < data.chi_tiet.length; i++) {
//       const item = data.chi_tiet[i];
//       if (!item.hang_hoa) {
//         toast.error(`Dòng ${i + 1}: Vui lòng chọn hàng hóa`);
//         return;
//       }
//       if (!item.so_luong_yeu_cau || item.so_luong_yeu_cau <= 0) {
//         toast.error(`Dòng ${i + 1}: Số lượng yêu cầu phải lớn hơn 0`);
//         return;
//       }
//       // Không validate số lượng thực xuất - có thể để trống khi tạo phiếu
//       if (item.don_gia === undefined || item.don_gia <= 0) {
//         toast.error(`Dòng ${i + 1}: Đơn giá không hợp lệ`);
//         return;
//       }

//       // Kiểm tra tồn kho chỉ với số lượng yêu cầu
//       const tonKhoItem = tonKhoInfo[i];
//       if (
//         tonKhoItem &&
//         tonKhoItem.so_luong_ton < parseInt(item.so_luong_yeu_cau)
//       ) {
//         toast.error(
//           `Dòng ${i + 1}: Không đủ tồn kho. Tồn kho: ${
//             tonKhoItem.so_luong_ton
//           }, yêu cầu: ${item.so_luong_yeu_cau}`
//         );
//         return;
//       }
//     }

//     setLoading(true);

//     try {
//       toast.loading("Đang tạo phiếu xuất...", { id: "processing" });

//       // Step 1: Create đơn vị nhận if needed
//       let finalDonViNhan = null;
//       if (data.don_vi_nhan) {
//         finalDonViNhan = await createDonViNhanIfNeeded(data.don_vi_nhan);
//         if (finalDonViNhan && data.don_vi_nhan.isNewItem) {
//           toast.success(`✓ Đã tạo đơn vị nhận: ${finalDonViNhan.ten_don_vi}`);
//         }
//       }

//       // Step 2: Prepare chi tiết data
//       const finalChiTiet = data.chi_tiet.map((item) => ({
//         hang_hoa_id: item.hang_hoa.id,
//         so_luong_yeu_cau: parseFloat(item.so_luong_yeu_cau),
//         // Nếu chưa điền số lượng thực xuất, mặc định = số lượng yêu cầu
//         so_luong_thuc_xuat: item.so_luong_thuc_xuat
//           ? parseFloat(item.so_luong_thuc_xuat)
//           : parseFloat(item.so_luong_yeu_cau),
//         don_gia: parseFloat(item.don_gia),
//         ghi_chu: item.ghi_chu || null,
//       }));

//       // Step 3: Create export receipt
//       const submitData = {
//         ngay_xuat: data.ngay_xuat,
//         loai_xuat: data.loai_xuat,
//         nguoi_nhan: data.nguoi_nhan || "",
//         ly_do_xuat: data.ly_do_xuat || "",
//         ghi_chu: data.ghi_chu || "",
//         don_vi_nhan_id: finalDonViNhan?.id || null,
//         chi_tiet: finalChiTiet,
//       };

//       const response = await xuatKhoService.create(submitData);

//       toast.dismiss("processing");
//       toast.success(
//         `🎉 Tạo phiếu xuất thành công! Mã phiếu: ${
//           response.data?.so_phieu || ""
//         }`
//       );
//       onSuccess?.();
//     } catch (error) {
//       console.error("Submit error:", error);
//       toast.dismiss("processing");

//       let errorMessage = "Có lỗi xảy ra khi tạo phiếu xuất";

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

//   return (
//     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//       {/* Basic Information */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Ngày xuất *
//           </label>
//           <input
//             type="date"
//             {...register("ngay_xuat", { required: "Vui lòng chọn ngày xuất" })}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
//           />
//           {errors.ngay_xuat && (
//             <p className="mt-1 text-sm text-red-600">
//               {errors.ngay_xuat.message}
//             </p>
//           )}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Loại xuất *
//           </label>
//           <select
//             {...register("loai_xuat", {
//               required: "Vui lòng chọn loại xuất",
//             })}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
//           >
//             {Object.entries(LOAI_PHIEU_XUAT).map(([key, value]) => (
//               <option key={key} value={key}>
//                 {typeof value === "object" ? value.label : value}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Người nhận
//           </label>
//           <input
//             type="text"
//             {...register("nguoi_nhan")}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
//             placeholder="Tên người nhận hàng"
//           />
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Đơn vị nhận
//           </label>
//           <AutoComplete
//             searchFunction={searchService.searchDonViNhan}
//             onSelect={handleDonViNhanSelect}
//             placeholder="Nhập tên đơn vị nhận..."
//             displayField="ten_don_vi"
//             createLabel="Sẽ tạo đơn vị nhận mới"
//             className="w-full"
//             allowCreate={true}
//           />
//           {donViNhanData?.isNewItem && (
//             <div className="mt-1 text-xs text-blue-600">
//               💡 Đơn vị nhận mới sẽ được tạo khi lưu phiếu xuất
//             </div>
//           )}
//           {donViNhanData && !donViNhanData.isNewItem && (
//             <div className="mt-1 text-xs text-green-600">
//               ✓ {donViNhanData.ma_don_vi} - {donViNhanData.loai_don_vi}
//             </div>
//           )}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Lý do xuất
//           </label>
//           <textarea
//             {...register("ly_do_xuat")}
//             rows={3}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-none"
//             placeholder="Nhập lý do xuất kho"
//           />
//         </div>
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Ghi chú
//         </label>
//         <textarea
//           {...register("ghi_chu")}
//           rows={3}
//           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm resize-none"
//           placeholder="Ghi chú thêm"
//         />
//       </div>

//       {/* Product Details Table */}
//       <div>
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-medium text-gray-900">
//             Chi tiết hàng hóa
//           </h3>
//           <button
//             type="button"
//             onClick={addNewRow}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors"
//           >
//             <Plus size={16} />
//             <span>Thêm dòng</span>
//           </button>
//         </div>

//         <div className="bg-blue-50 p-3 rounded-lg mb-4 flex items-start space-x-2">
//           <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
//           <div className="text-sm text-blue-800">
//             <strong>Lưu ý:</strong> Bạn có thể để trống "Số lượng thực xuất" khi
//             tạo phiếu. Sau đó có thể chỉnh sửa để điền số lượng thực tế đã xuất
//             hoặc in phiếu để điền tay.
//           </div>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full border border-gray-200 rounded-lg">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   STT
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[350px]">
//                   Hàng hóa *
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Tồn kho
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   SL yêu cầu *
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   SL thực xuất
//                   <div className="font-normal text-gray-400 text-xs">
//                     (có thể để trống)
//                   </div>
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Đơn giá
//                 </th>
//                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Thành tiền
//                   <div className="font-normal text-gray-400 text-xs">
//                     (dự tính)
//                   </div>
//                 </th>
//                 <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
//                   Thao tác
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {fields.map((field, index) => {
//                 const currentItem = chiTietItems[index] || {};
//                 const thanhTienDuTinh =
//                   (currentItem.so_luong_yeu_cau || 0) *
//                   (currentItem.don_gia || 0);
//                 const thanhTienThucTe =
//                   (currentItem.so_luong_thuc_xuat || 0) *
//                   (currentItem.don_gia || 0);
//                 const tonKhoItem = tonKhoInfo[index];

//                 return (
//                   <tr key={field.id}>
//                     <td className="px-4 py-3 text-sm text-gray-900">
//                       {index + 1}
//                     </td>
//                     <td className="px-4 py-3">
//                       <AutoComplete
//                         searchFunction={searchService.searchHangHoa}
//                         onSelect={(hangHoa) =>
//                           handleHangHoaSelect(hangHoa, index)
//                         }
//                         placeholder="Nhập tên hàng hóa..."
//                         displayField="ten_hang_hoa"
//                         className="min-w-[320px]"
//                         allowCreate={false}
//                       />
//                       <div className="text-xs text-gray-500 mt-1">
//                         {currentItem.hang_hoa && (
//                           <span className="text-green-600">
//                             ✓ {currentItem.hang_hoa.ma_hang_hoa} -{" "}
//                             {currentItem.hang_hoa.don_vi_tinh}
//                           </span>
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="text-sm">
//                         {tonKhoItem ? (
//                           <span
//                             className={`font-medium ${
//                               tonKhoItem.so_luong_ton > 0
//                                 ? "text-green-600"
//                                 : "text-red-600"
//                             }`}
//                           >
//                             {tonKhoItem.so_luong_ton}
//                           </span>
//                         ) : (
//                           <span className="text-gray-400">-</span>
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       <input
//                         type="number"
//                         min="0"
//                         step="1"
//                         {...register(`chi_tiet.${index}.so_luong_yeu_cau`, {
//                           required: "Vui lòng nhập số lượng",
//                           min: {
//                             value: 1,
//                             message: "Số lượng phải lớn hơn 0",
//                           },
//                         })}
//                         className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         placeholder="0"
//                       />
//                       {tonKhoItem &&
//                         currentItem.so_luong_yeu_cau &&
//                         parseInt(currentItem.so_luong_yeu_cau) >
//                           tonKhoItem.so_luong_ton && (
//                           <div className="flex items-center mt-1 text-xs text-red-600">
//                             <AlertTriangle size={12} className="mr-1" />
//                             Vượt tồn kho (có {tonKhoItem.so_luong_ton})
//                           </div>
//                         )}
//                     </td>
//                     <td className="px-4 py-3">
//                       <input
//                         type="number"
//                         min="0"
//                         step="1"
//                         {...register(`chi_tiet.${index}.so_luong_thuc_xuat`)}
//                         className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         placeholder="Để trống"
//                       />
//                       <div className="text-xs text-gray-400 mt-1">
//                         Điền sau khi xuất thực tế
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded border">
//                         {formatCurrency(currentItem.don_gia || 0)}
//                       </div>
//                       <div className="text-xs text-gray-500 mt-1">
//                         {tonKhoItem && "Giá bình quân"}
//                       </div>
//                       <input
//                         type="hidden"
//                         {...register(`chi_tiet.${index}.don_gia`, {
//                           required: "Đơn giá không hợp lệ",
//                           min: {
//                             value: 0.01,
//                             message: "Đơn giá phải lớn hơn 0",
//                           },
//                         })}
//                       />
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="text-sm font-medium text-gray-900">
//                         {formatCurrency(thanhTienDuTinh)}
//                       </div>
//                       {currentItem.so_luong_thuc_xuat &&
//                         currentItem.so_luong_thuc_xuat !=
//                           currentItem.so_luong_yeu_cau && (
//                           <div className="text-xs text-blue-600 mt-1">
//                             Thực tế: {formatCurrency(thanhTienThucTe)}
//                           </div>
//                         )}
//                     </td>
//                     <td className="px-4 py-3 text-center">
//                       <button
//                         type="button"
//                         onClick={() => {
//                           remove(index);
//                           setTonKhoInfo((prev) => {
//                             const newInfo = { ...prev };
//                             delete newInfo[index];
//                             return newInfo;
//                           });
//                         }}
//                         disabled={fields.length === 1}
//                         className="text-red-600 hover:text-red-800 disabled:text-gray-400 transition-colors"
//                         title={
//                           fields.length === 1
//                             ? "Không thể xóa dòng cuối cùng"
//                             : "Xóa dòng"
//                         }
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Total Amount */}
//         <div className="mt-4 flex justify-end space-x-4">
//           <div className="bg-gray-50 p-4 rounded-lg">
//             <div className="text-lg font-semibold text-gray-900">
//               Tổng tiền dự tính: {formatCurrency(tongTienDuTinh)}
//             </div>
//             {tongTienThucTe > 0 && tongTienThucTe !== tongTienDuTinh && (
//               <div className="text-sm text-blue-600 mt-1">
//                 Tổng tiền thực tế: {formatCurrency(tongTienThucTe)}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Action Buttons */}
//       <div className="flex items-center justify-end space-x-3 pt-6 border-t">
//         <button
//           type="button"
//           onClick={onCancel}
//           disabled={loading}
//           className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//         >
//           Hủy
//         </button>

//         <button
//           type="submit"
//           disabled={loading}
//           className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
//         >
//           {loading && (
//             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//           )}
//           <span>Tạo phiếu xuất</span>
//         </button>
//       </div>
//     </form>
//   );
// };

// export default CreateXuatKhoForm;

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, AlertTriangle, Info } from "lucide-react";
import { searchService } from "../../services/searchService";
import { xuatKhoService } from "../../services/xuatKhoService";
import { formatCurrency } from "../../utils/helpers";
import { LOAI_PHIEU_XUAT } from "../../utils/constants";
import AutoComplete from "../common/AutoComplete";
import toast from "react-hot-toast";

const CreateXuatKhoForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [tonKhoInfo, setTonKhoInfo] = useState({});

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ngay_xuat: new Date().toISOString().split("T")[0],
      loai_xuat: "don_vi_nhan",
      so_quyet_dinh: "",
      nguoi_nhan: "",
      ly_do_xuat: "",
      ghi_chu: "",
      don_vi_nhan_id: null,
      don_vi_nhan: null,
      chi_tiet: [
        {
          hang_hoa_id: null,
          hang_hoa: null,
          so_luong_yeu_cau: 1,
          so_luong_thuc_xuat: null,
          don_gia: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "chi_tiet",
  });

  const chiTietItems = watch("chi_tiet");
  const donViNhanData = watch("don_vi_nhan");

  // Calculate total amount based on requested quantity (for estimation)
  const tongTienDuTinh = chiTietItems.reduce((sum, item) => {
    return (
      sum +
      parseFloat(item.so_luong_yeu_cau || 0) * parseFloat(item.don_gia || 0)
    );
  }, 0);

  // Calculate actual total amount (if actual quantity is filled)
  const tongTienThucTe = chiTietItems.reduce((sum, item) => {
    const soLuongThucXuat = item.so_luong_thuc_xuat || 0;
    return sum + parseFloat(soLuongThucXuat) * parseFloat(item.don_gia || 0);
  }, 0);

  const handleDonViNhanSelect = (donViNhan) => {
    setValue("don_vi_nhan_id", donViNhan.id || null);
    setValue("don_vi_nhan", donViNhan);

    if (donViNhan.isNewItem) {
      toast(`💡 Sẽ tạo đơn vị nhận mới: ${donViNhan.ten_don_vi}`, {
        duration: 3000,
        style: {
          background: "#EBF8FF",
          color: "#2B6CB0",
          border: "1px solid #BEE3F8",
        },
      });
    } else {
      toast.success(`Đã chọn đơn vị nhận: ${donViNhan.ten_don_vi}`);
    }
  };

  const handleHangHoaSelect = async (hangHoa, index) => {
    setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id || null);
    setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);

    // Use improved API to check actual inventory
    try {
      const response = await xuatKhoService.checkTonKhoThucTe({
        chi_tiet: [{ hang_hoa_id: hangHoa.id, so_luong_yeu_cau: 1 }],
      });

      const tonKhoItem = response.data.ton_kho[0];
      if (tonKhoItem) {
        setTonKhoInfo((prev) => ({
          ...prev,
          [index]: tonKhoItem,
        }));

        // Auto-fill price from inventory average cost
        if (tonKhoItem.don_gia_binh_quan > 0) {
          setValue(`chi_tiet.${index}.don_gia`, tonKhoItem.don_gia_binh_quan);
        }

        // Show detailed information
        if (tonKhoItem.so_luong_co_the_xuat > 0) {
          toast.success(
            `Đã chọn ${hangHoa.ten_hang_hoa}. ` +
              `Tồn kho: ${tonKhoItem.so_luong_ton_thuc_te} ` +
              `${
                tonKhoItem.so_luong_dang_cho_xuat > 0
                  ? `(Đang chờ xuất: ${tonKhoItem.so_luong_dang_cho_xuat}) `
                  : ""
              }` +
              `Có thể xuất: ${tonKhoItem.so_luong_co_the_xuat} ${hangHoa.don_vi_tinh}. ` +
              `Đơn giá: ${formatCurrency(tonKhoItem.don_gia_binh_quan)}`
          );
        } else {
          toast.warning(
            `${hangHoa.ten_hang_hoa} không đủ để xuất! ` +
              `${tonKhoItem.canh_bao || ""}`
          );
        }
      }
    } catch (error) {
      console.error("Error checking ton kho thuc te:", error);
      toast.error("Không thể kiểm tra tồn kho thực tế");
    }
  };

  const addNewRow = () => {
    append({
      hang_hoa_id: null,
      hang_hoa: null,
      so_luong_yeu_cau: 1,
      so_luong_thuc_xuat: null,
      don_gia: 0,
    });
  };

  // Create đơn vị nhận if needed
  const createDonViNhanIfNeeded = async (donViNhan) => {
    if (!donViNhan?.isNewItem) {
      return donViNhan;
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 15000)
      );

      const createPromise = searchService.createDonViNhanAuto({
        ten_don_vi: donViNhan.ten_don_vi,
      });

      const response = await Promise.race([createPromise, timeoutPromise]);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Failed to create don vi nhan");
      }
    } catch (error) {
      let errorMessage = `Không thể tạo đơn vị nhận "${donViNhan.ten_don_vi}"`;
      if (error.message === "Timeout") {
        errorMessage += ": Kết nối quá chậm, vui lòng thử lại";
      }
      throw new Error(errorMessage);
    }
  };

  const onSubmit = async (data) => {
    if (data.chi_tiet.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hàng hóa");
      return;
    }

    // Validate details
    for (let i = 0; i < data.chi_tiet.length; i++) {
      const item = data.chi_tiet[i];
      if (!item.hang_hoa) {
        toast.error(`Dòng ${i + 1}: Vui lòng chọn hàng hóa`);
        return;
      }
      if (!item.so_luong_yeu_cau || item.so_luong_yeu_cau <= 0) {
        toast.error(`Dòng ${i + 1}: Số lượng yêu cầu phải lớn hơn 0`);
        return;
      }
      if (item.don_gia === undefined || item.don_gia <= 0) {
        toast.error(`Dòng ${i + 1}: Đơn giá không hợp lệ`);
        return;
      }

      // Check inventory with requested quantity only
      const tonKhoItem = tonKhoInfo[i];
      if (
        tonKhoItem &&
        tonKhoItem.so_luong_co_the_xuat < parseInt(item.so_luong_yeu_cau)
      ) {
        toast.error(
          `Dòng ${i + 1}: Không đủ hàng có thể xuất. Có thể xuất: ${
            tonKhoItem.so_luong_co_the_xuat
          }, yêu cầu: ${item.so_luong_yeu_cau}`
        );
        return;
      }
    }

    setLoading(true);

    try {
      toast.loading("Đang tạo phiếu xuất...", { id: "processing" });

      // Step 1: Create đơn vị nhận if needed
      let finalDonViNhan = null;
      if (data.don_vi_nhan) {
        finalDonViNhan = await createDonViNhanIfNeeded(data.don_vi_nhan);
        if (finalDonViNhan && data.don_vi_nhan.isNewItem) {
          toast.success(`✓ Đã tạo đơn vị nhận: ${finalDonViNhan.ten_don_vi}`);
        }
      }

      // Step 2: Prepare chi tiết data
      const finalChiTiet = data.chi_tiet.map((item) => ({
        hang_hoa_id: item.hang_hoa.id,
        so_luong_yeu_cau: parseFloat(item.so_luong_yeu_cau),
        // If actual quantity not filled, default to requested quantity
        so_luong_thuc_xuat: item.so_luong_thuc_xuat
          ? parseFloat(item.so_luong_thuc_xuat)
          : parseFloat(item.so_luong_yeu_cau),
        don_gia: parseFloat(item.don_gia),
        ghi_chu: item.ghi_chu || null,
      }));

      // Step 3: Create export receipt
      const submitData = {
        ngay_xuat: data.ngay_xuat,
        loai_xuat: data.loai_xuat,
        so_quyet_dinh: data.so_quyet_dinh || "",
        nguoi_nhan: data.nguoi_nhan || "",
        ly_do_xuat: data.ly_do_xuat || "",
        ghi_chu: data.ghi_chu || "",
        don_vi_nhan_id: finalDonViNhan?.id || null,
        chi_tiet: finalChiTiet,
      };

      const response = await xuatKhoService.create(submitData);

      toast.dismiss("processing");
      toast.success(
        `🎉 Tạo phiếu xuất thành công! Mã phiếu: ${
          response.data?.so_phieu || ""
        }`
      );
      onSuccess?.();
    } catch (error) {
      console.error("Submit error:", error);
      toast.dismiss("processing");

      let errorMessage = "Có lỗi xảy ra khi tạo phiếu xuất";

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Basic Information - Compact layout like NhapKho */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày xuất *
          </label>
          <input
            type="date"
            {...register("ngay_xuat", { required: "Vui lòng chọn ngày xuất" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
          />
          {errors.ngay_xuat && (
            <p className="mt-1 text-sm text-red-600">
              {errors.ngay_xuat.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại phiếu *
          </label>
          <select
            {...register("loai_xuat", {
              required: "Vui lòng chọn loại phiếu",
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
          >
            {Object.entries(LOAI_PHIEU_XUAT).map(([key, value]) => (
              <option key={key} value={key}>
                {typeof value === "object" ? value.label : value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đơn vị nhận
          </label>
          <AutoComplete
            searchFunction={searchService.searchDonViNhan}
            onSelect={handleDonViNhanSelect}
            placeholder="Nhập tên đơn vị nhận..."
            displayField="ten_don_vi"
            createLabel="Sẽ tạo đơn vị nhận mới"
            className="w-full"
            allowCreate={true}
          />
          {donViNhanData?.isNewItem && (
            <div className="mt-1 text-xs text-blue-600">
              💡 Đơn vị nhận mới sẽ được tạo khi lưu phiếu xuất
            </div>
          )}
          {donViNhanData && !donViNhanData.isNewItem && (
            <div className="mt-1 text-xs text-green-600">
              ✓ {donViNhanData.ma_don_vi} - {donViNhanData.loai_don_vi}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Người nhận
          </label>
          <input
            type="text"
            {...register("nguoi_nhan")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
            placeholder="Tên người nhận hàng"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số quyết định
          </label>
          <input
            type="text"
            {...register("so_quyet_dinh")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
            placeholder="Số quyết định"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lý do xuất
          </label>
          <input
            type="text"
            {...register("ly_do_xuat")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
            placeholder="Lý do xuất kho"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <input
            type="text"
            {...register("ghi_chu")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
            placeholder="Ghi chú thêm"
          />
        </div>
      </div>

      {/* Product Details Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">
            Chi tiết hàng hóa
          </h3>
          <button
            type="button"
            onClick={addNewRow}
            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
            title="Thêm dòng"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  STT
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[300px]">
                  Hàng hóa *
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Tồn kho
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  SL yêu cầu *
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  SL thực xuất
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Đơn giá *
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Thành tiền
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                  Xóa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fields.map((field, index) => {
                const currentItem = chiTietItems[index] || {};
                const thanhTienDuTinh =
                  (currentItem.so_luong_yeu_cau || 0) *
                  (currentItem.don_gia || 0);
                const thanhTienThucTe =
                  (currentItem.so_luong_thuc_xuat || 0) *
                  (currentItem.don_gia || 0);
                const tonKhoItem = tonKhoInfo[index];

                return (
                  <tr key={field.id}>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2">
                      <AutoComplete
                        searchFunction={searchService.searchHangHoa}
                        onSelect={(hangHoa) =>
                          handleHangHoaSelect(hangHoa, index)
                        }
                        placeholder="Nhập tên hàng hóa..."
                        displayField="ten_hang_hoa"
                        className="min-w-[280px]"
                        allowCreate={false}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {currentItem.hang_hoa && (
                          <span className="text-green-600">
                            ✓ {currentItem.hang_hoa.ma_hang_hoa} -{" "}
                            {currentItem.hang_hoa.don_vi_tinh}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm">
                        {tonKhoItem ? (
                          <span
                            className={`font-medium ${
                              tonKhoItem.so_luong_co_the_xuat > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {tonKhoItem.so_luong_co_the_xuat}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                      {tonKhoItem && tonKhoItem.so_luong_dang_cho_xuat > 0 && (
                        <div className="text-xs text-orange-600">
                          Chờ xuất: {tonKhoItem.so_luong_dang_cho_xuat}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        {...register(`chi_tiet.${index}.so_luong_yeu_cau`, {
                          required: "Vui lòng nhập số lượng",
                          min: {
                            value: 1,
                            message: "Số lượng phải lớn hơn 0",
                          },
                        })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="0"
                      />
                      {tonKhoItem &&
                        currentItem.so_luong_yeu_cau &&
                        parseInt(currentItem.so_luong_yeu_cau) >
                          tonKhoItem.so_luong_co_the_xuat && (
                          <div className="flex items-center mt-1 text-xs text-red-600">
                            <AlertTriangle size={12} className="mr-1" />
                            Vượt khả năng xuất (
                            {tonKhoItem.so_luong_co_the_xuat})
                          </div>
                        )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        {...register(`chi_tiet.${index}.so_luong_thuc_xuat`)}
                        className="w-20 px-1 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Để trống"
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
                            value: 0.01,
                            message: "Đơn giá phải lớn hơn 0",
                          },
                        })}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(thanhTienDuTinh)}
                      </div>
                      {currentItem.so_luong_thuc_xuat &&
                        currentItem.so_luong_thuc_xuat !=
                          currentItem.so_luong_yeu_cau && (
                          <div className="text-xs text-blue-600 mt-1">
                            Thực tế: {formatCurrency(thanhTienThucTe)}
                          </div>
                        )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          remove(index);
                          setTonKhoInfo((prev) => {
                            const newInfo = { ...prev };
                            delete newInfo[index];
                            return newInfo;
                          });
                        }}
                        disabled={fields.length === 1}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400 transition-colors"
                        title={
                          fields.length === 1
                            ? "Không thể xóa dòng cuối cùng"
                            : "Xóa dòng"
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total Amount */}
        <div className="mt-3 flex justify-end">
          <div className="bg-gray-50 px-4 py-2 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              Tổng tiền dự tính: {formatCurrency(tongTienDuTinh)}
            </div>
            {tongTienThucTe > 0 && tongTienThucTe !== tongTienDuTinh && (
              <div className="text-sm text-blue-600 mt-1">
                Tổng tiền thực tế: {formatCurrency(tongTienThucTe)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Hủy
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <span>Tạo phiếu xuất</span>
        </button>
      </div>
    </form>
  );
};

export default CreateXuatKhoForm;
