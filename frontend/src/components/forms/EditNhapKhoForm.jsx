// import React, { useState, useEffect } from "react";
// import { useForm, useFieldArray } from "react-hook-form";
// import { Plus, Trash2 } from "lucide-react";
// import { searchService } from "../../services/searchService";
// import { nhapKhoService } from "../../services/nhapKhoService";
// import { formatCurrency } from "../../utils/helpers";
// import { LOAI_PHIEU_NHAP, PHAM_CHAT } from "../../utils/constants";
// import AutoComplete from "../common/AutoComplete";
// import toast from "react-hot-toast";

// const EditNhapKhoForm = ({ phieuId, onSuccess, onCancel, mode = "edit" }) => {
//   const [loading, setLoading] = useState(false);
//   const [isLoadingData, setIsLoadingData] = useState(true);
//   const [dataLoaded, setDataLoaded] = useState(false);
//   const [formReady, setFormReady] = useState(false);
//   const [phieuStatus, setPhieuStatus] = useState(null);

//   const isEditActualMode = mode === "edit-actual";
//   const canEdit =
//     !isEditActualMode && ["draft", "revision_required"].includes(phieuStatus);
//   const canEditActual = isEditActualMode && phieuStatus === "approved";

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
//   const loaiPhieu = watch("loai_phieu");
//   const nhaCungCapData = watch("nha_cung_cap");
//   const phongBanCungCapData = watch("phong_ban_cung_cap");

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
//         // Xử lý theo loại phiếu
//         nha_cung_cap_id:
//           phieu.loai_phieu === "tu_mua" ? phieu.nha_cung_cap?.id || null : null,
//         nha_cung_cap:
//           phieu.loai_phieu === "tu_mua" ? phieu.nha_cung_cap || null : null,
//         phong_ban_cung_cap_id: ["tren_cap", "cap_duoi"].includes(
//           phieu.loai_phieu
//         )
//           ? phieu.phong_ban_cung_cap?.id || null
//           : null,
//         phong_ban_cung_cap: ["tren_cap", "cap_duoi"].includes(phieu.loai_phieu)
//           ? phieu.phong_ban_cung_cap || null
//           : null,
//       };

//       reset(formData, { keepDefaultValues: false });

//       const chiTietData = phieu.chi_tiet.map((item) => ({
//         hang_hoa_id: item.hang_hoa.id,
//         hang_hoa: item.hang_hoa,
//         so_luong_ke_hoach:
//           parseFloat(item.so_luong_ke_hoach) || parseFloat(item.so_luong) || 1,
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

//   const handlePhongBanCungCapSelect = (phongBan) => {
//     setValue("phong_ban_cung_cap_id", phongBan.id || null);
//     setValue("phong_ban_cung_cap", phongBan);
//     toast.success(`Đã chọn phòng ban cung cấp: ${phongBan.ten_phong_ban}`);
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
//       so_luong_ke_hoach: 1,
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

//     // Validation theo loại phiếu
//     if (data.loai_phieu === "tu_mua" && !data.nha_cung_cap) {
//       toast.error("Vui lòng chọn nhà cung cấp cho phiếu tự mua");
//       return;
//     }

//     if (
//       ["tren_cap", "cap_duoi"].includes(data.loai_phieu) &&
//       !data.phong_ban_cung_cap
//     ) {
//       toast.error("Vui lòng chọn phòng ban cung cấp");
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

//       if (isEditActualMode) {
//         const updateData = {
//           chi_tiet_cap_nhat: data.chi_tiet.map((item) => ({
//             hang_hoa_id: item.hang_hoa.id,
//             so_luong: parseFloat(item.so_luong),
//           })),
//         };

//         await nhapKhoService.updateActualQuantity(phieuId, updateData);
//         toast.dismiss("processing");
//         toast.success("🎉 Cập nhật số lượng thực tế thành công!");
//       } else {
//         let finalNhaCungCap = null;
//         let finalPhongBanCungCap = null;

//         // Xử lý theo loại phiếu
//         if (
//           data.loai_phieu === "tu_mua" &&
//           canEdit &&
//           data.nha_cung_cap?.isNewItem
//         ) {
//           finalNhaCungCap = await createNhaCungCapIfNeeded(data.nha_cung_cap);
//           toast.success(`✓ Đã tạo nhà cung cấp: ${finalNhaCungCap.ten_ncc}`);
//         } else if (data.loai_phieu === "tu_mua") {
//           finalNhaCungCap = data.nha_cung_cap;
//         }

//         if (["tren_cap", "cap_duoi"].includes(data.loai_phieu)) {
//           finalPhongBanCungCap = data.phong_ban_cung_cap;
//         }

//         const finalChiTiet = [];
//         for (let item of data.chi_tiet) {
//           let finalHangHoa = item.hang_hoa;
//           if (canEdit && item.hang_hoa?.isNewItem) {
//             finalHangHoa = await createHangHoaIfNeeded(item.hang_hoa);
//             toast.success(`✓ Đã tạo hàng hóa: ${finalHangHoa.ten_hang_hoa}`);
//           }
//           finalChiTiet.push({
//             hang_hoa_id: finalHangHoa.id,
//             so_luong_ke_hoach: parseFloat(item.so_luong_ke_hoach),
//             so_luong: parseFloat(item.so_luong),
//             don_gia: parseFloat(item.don_gia),
//             pham_chat: item.pham_chat,
//             so_seri_list: item.danh_diem
//               ? item.danh_diem
//                   .split(/[,\n]/)
//                   .map((s) => s.trim())
//                   .filter(Boolean)
//               : [],
//           });
//         }

//         const submitData = {
//           ngay_nhap: data.ngay_nhap,
//           loai_phieu: data.loai_phieu,
//           nguoi_nhap_hang: data.nguoi_nhap_hang || "",
//           so_quyet_dinh: data.so_quyet_dinh || "",
//           so_hoa_don: data.so_hoa_don || "",
//           dia_chi_nhap: data.dia_chi_nhap || "",
//           phuong_thuc_van_chuyen:
//             data.phuong_thuc_van_chuyen || "Đơn vị tự vận chuyển",
//           ly_do_nhap: data.ly_do_nhap || "",
//           ghi_chu: data.ghi_chu || "",
//           nha_cung_cap_id: finalNhaCungCap?.id || null,
//           phong_ban_cung_cap_id: finalPhongBanCungCap?.id || null,
//           chi_tiet: finalChiTiet,
//         };

//         await nhapKhoService.update(phieuId, submitData);
//         toast.dismiss("processing");
//         toast.success("🎉 Cập nhật phiếu nhập thành công!");
//       }

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
//     <div className="p-4 space-y-2">
//       {isEditActualMode && (
//         <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
//           Chế độ chỉnh sửa số lượng thực tế. Chỉ có thể sửa cột "SL thực nhập".
//         </div>
//       )}

//       {!canEdit && !isEditActualMode && (
//         <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
//           Phiếu này không còn ở trạng thái nháp nên không thể tạo mới nhà cung
//           cấp hoặc hàng hóa. Bạn chỉ có thể chỉnh sửa các thông tin hiện có.
//         </div>
//       )}

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <div className="bg-white border rounded-lg p-4">
//           <h3 className="text-lg font-medium text-gray-900 mb-4">
//             {isEditActualMode
//               ? "Chỉnh sửa số lượng thực tế"
//               : "Thông tin phiếu nhập"}
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
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
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
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
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
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
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
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
//                 placeholder="Tên người nhập hàng"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {loaiPhieu === "tu_mua"
//                   ? "Nhà cung cấp"
//                   : ["tren_cap", "cap_duoi"].includes(loaiPhieu)
//                   ? "Phòng ban cung cấp"
//                   : "Nguồn cung cấp"}
//               </label>
//               {loaiPhieu === "tu_mua" ? (
//                 <AutoComplete
//                   key={`supplier-${
//                     formReady ? nhaCungCapData?.id || "loaded" : "loading"
//                   }`}
//                   searchFunction={searchService.searchNhaCungCap}
//                   onSelect={handleNhaCungCapSelect}
//                   placeholder="Nhập tên nhà cung cấp..."
//                   displayField="ten_ncc"
//                   createLabel="Sẽ tạo nhà cung cấp mới"
//                   className="w-full"
//                   initialValue={nhaCungCapData?.ten_ncc || ""}
//                   allowCreate={canEdit}
//                   disabled={isEditActualMode}
//                 />
//               ) : ["tren_cap", "cap_duoi"].includes(loaiPhieu) ? (
//                 <AutoComplete
//                   key={`dept-${
//                     formReady ? phongBanCungCapData?.id || "loaded" : "loading"
//                   }`}
//                   searchFunction={(query) =>
//                     searchService.searchPhongBanCungCap(query, loaiPhieu)
//                   }
//                   onSelect={handlePhongBanCungCapSelect}
//                   placeholder="Nhập tên phòng ban cung cấp..."
//                   displayField="ten_phong_ban"
//                   className="w-full"
//                   initialValue={phongBanCungCapData?.ten_phong_ban || ""}
//                   allowCreate={false}
//                   disabled={isEditActualMode}
//                 />
//               ) : (
//                 <input
//                   type="text"
//                   disabled
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm"
//                   placeholder="Không áp dụng"
//                 />
//               )}

//               {/* Hiển thị thông tin đã chọn */}
//               {loaiPhieu === "tu_mua" &&
//                 nhaCungCapData?.isNewItem &&
//                 canEdit && (
//                   <div className="mt-1 text-xs text-blue-600">
//                     💡 Nhà cung cấp mới sẽ được tạo khi lưu phiếu nhập
//                   </div>
//                 )}
//               {loaiPhieu === "tu_mua" &&
//                 nhaCungCapData &&
//                 !nhaCungCapData.isNewItem && (
//                   <div className="mt-1 text-xs text-green-600">
//                     ✓ {nhaCungCapData.ma_ncc} - {nhaCungCapData.loai_ncc}
//                   </div>
//                 )}
//               {["tren_cap", "cap_duoi"].includes(loaiPhieu) &&
//                 phongBanCungCapData && (
//                   <div className="mt-1 text-xs text-green-600">
//                     ✓ {phongBanCungCapData.ma_phong_ban} - Cấp{" "}
//                     {phongBanCungCapData.cap_bac}
//                   </div>
//                 )}
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Số hóa đơn
//               </label>
//               <input
//                 type="text"
//                 {...register("so_hoa_don")}
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
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
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
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
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
//                 placeholder="Nhập lý do nhập kho"
//               />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white border rounded-lg overflow-hidden">
//           <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
//             <h4 className="font-semibold text-gray-900">
//               Chi tiết hàng hóa ({fields.length} mặt hàng)
//             </h4>

//             {!isEditActualMode && (
//               <button
//                 type="button"
//                 onClick={addNewRow}
//                 className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-all"
//                 title="Thêm dòng"
//               >
//                 <Plus size={16} />
//               </button>
//             )}
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase w-[4%]">
//                     STT
//                   </th>
//                   <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase w-[25%]">
//                     Hàng hóa *
//                   </th>
//                   <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[12%]">
//                     SL kế hoạch *
//                   </th>
//                   <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[12%]">
//                     SL thực nhập *
//                   </th>
//                   <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[15%]">
//                     Đơn giá *
//                   </th>
//                   <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[12%]">
//                     Phẩm chất
//                   </th>
//                   <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[15%]">
//                     Danh điểm
//                   </th>
//                   <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[15%]">
//                     Thành tiền
//                   </th>
//                   {!isEditActualMode && (
//                     <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[6%]">
//                       Thao tác
//                     </th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {fields.map((field, index) => {
//                   const currentItem = chiTietItems[index] || {};
//                   const thanhTien =
//                     (currentItem.so_luong || 0) * (currentItem.don_gia || 0);

//                   return (
//                     <React.Fragment key={field.id}>
//                       <tr className="hover:bg-gray-50">
//                         <td className="px-3 py-2 text-center text-gray-900 font-medium">
//                           {index + 1}
//                         </td>
//                         <td className="px-3 py-2">
//                           <AutoComplete
//                             key={`product-${index}-${
//                               formReady
//                                 ? currentItem.hang_hoa?.id || "loaded"
//                                 : "loading"
//                             }`}
//                             searchFunction={searchService.searchHangHoa}
//                             onSelect={(hangHoa) =>
//                               handleHangHoaSelect(hangHoa, index)
//                             }
//                             placeholder="Nhập tên hàng hóa..."
//                             displayField="ten_hang_hoa"
//                             createLabel="Sẽ tạo hàng hóa mới"
//                             className="min-w-[250px]"
//                             initialValue={
//                               currentItem.hang_hoa?.ten_hang_hoa || ""
//                             }
//                             allowCreate={canEdit}
//                             disabled={isEditActualMode}
//                           />
//                         </td>
//                         <td className="px-3 py-2">
//                           <input
//                             type="number"
//                             min="0"
//                             step="1"
//                             {...register(
//                               `chi_tiet.${index}.so_luong_ke_hoach`,
//                               {
//                                 required: "Vui lòng nhập số lượng kế hoạch",
//                                 min: {
//                                   value: 1,
//                                   message: "Số lượng phải lớn hơn 0",
//                                 },
//                               }
//                             )}
//                             disabled={isEditActualMode || !canEdit}
//                             onChange={(e) => {
//                               if (!isEditActualMode) {
//                                 setValue(
//                                   `chi_tiet.${index}.so_luong`,
//                                   e.target.value
//                                 );
//                               }
//                             }}
//                             className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center disabled:bg-gray-100"
//                           />
//                         </td>
//                         <td className="px-3 py-2">
//                           <input
//                             type="number"
//                             min="0"
//                             step="1"
//                             {...register(`chi_tiet.${index}.so_luong`, {
//                               required: "Vui lòng nhập số lượng thực nhập",
//                               min: {
//                                 value: 1,
//                                 message: "Số lượng phải lớn hơn 0",
//                               },
//                             })}
//                             disabled={!canEdit && !canEditActual}
//                             className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center disabled:bg-gray-100"
//                           />
//                         </td>
//                         <td className="px-3 py-2">
//                           <input
//                             type="number"
//                             min="0"
//                             step="1000"
//                             {...register(`chi_tiet.${index}.don_gia`, {
//                               required: "Vui lòng nhập đơn giá",
//                               min: {
//                                 value: 0,
//                                 message: "Đơn giá không được âm",
//                               },
//                             })}
//                             disabled={isEditActualMode || !canEdit}
//                             className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right disabled:bg-gray-100"
//                           />
//                         </td>
//                         <td className="px-3 py-2">
//                           <select
//                             {...register(`chi_tiet.${index}.pham_chat`)}
//                             disabled={isEditActualMode || !canEdit}
//                             className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
//                           >
//                             {Object.entries(PHAM_CHAT).map(([key, value]) => (
//                               <option key={key} value={key}>
//                                 {value.label}
//                               </option>
//                             ))}
//                           </select>
//                         </td>
//                         <td className="px-3 py-2">
//                           <input
//                             type="text"
//                             {...register(`chi_tiet.${index}.danh_diem`)}
//                             disabled={isEditActualMode || !canEdit}
//                             className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center disabled:bg-gray-100"
//                             placeholder="Số seri"
//                           />
//                         </td>
//                         <td className="px-3 py-2 text-right font-medium">
//                           {formatCurrency(thanhTien)}
//                         </td>
//                         {!isEditActualMode && (
//                           <td className="px-3 py-2 text-center">
//                             <button
//                               type="button"
//                               onClick={() => remove(index)}
//                               disabled={fields.length === 1 || !canEdit}
//                               className="text-red-600 hover:text-red-800 disabled:text-gray-400"
//                               title={
//                                 fields.length === 1
//                                   ? "Không thể xóa dòng cuối cùng"
//                                   : "Xóa dòng"
//                               }
//                             >
//                               <Trash2 size={14} />
//                             </button>
//                           </td>
//                         )}
//                       </tr>
//                       {(currentItem.hang_hoa &&
//                         !currentItem.hang_hoa.isNewItem) ||
//                       (currentItem.hang_hoa?.isNewItem && canEdit) ? (
//                         <tr>
//                           <td></td>
//                           <td
//                             colSpan={isEditActualMode ? "7" : "8"}
//                             className="px-3 py-1 text-xs text-gray-500"
//                           >
//                             {currentItem.hang_hoa &&
//                               !currentItem.hang_hoa.isNewItem && (
//                                 <span className="text-green-600">
//                                   ✓ {currentItem.hang_hoa.ma_hang_hoa} -{" "}
//                                   {currentItem.hang_hoa.don_vi_tinh}
//                                 </span>
//                               )}
//                             {currentItem.hang_hoa?.isNewItem && canEdit && (
//                               <span className="text-blue-600">
//                                 💡 Hàng hóa mới sẽ được tạo
//                               </span>
//                             )}
//                           </td>
//                         </tr>
//                       ) : null}
//                     </React.Fragment>
//                   );
//                 })}
//                 {fields.length > 0 && (
//                   <tr className="bg-green-50 font-bold">
//                     <td
//                       colSpan={isEditActualMode ? "7" : "8"}
//                       className="px-3 py-3 text-right text-gray-900"
//                     >
//                       TỔNG CỘNG:
//                     </td>
//                     <td className="px-3 py-3 text-right text-green-600 text-lg">
//                       {formatCurrency(tongTien)}
//                     </td>
//                     {!isEditActualMode && <td></td>}
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

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
import {
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Package,
  Building,
} from "lucide-react";
import { searchService } from "../../services/searchService";
import { nhapKhoService } from "../../services/nhapKhoService";
import { hangHoaService } from "../../services/hangHoaService";
import { formatCurrency } from "../../utils/helpers";
import { LOAI_PHIEU_NHAP, PHAM_CHAT } from "../../utils/constants";
import AutoComplete from "../common/AutoComplete";
import toast from "react-hot-toast";

const EditNhapKhoForm = ({ phieuId, onSuccess, onCancel, mode = "edit" }) => {
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [phieuStatus, setPhieuStatus] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [phongBanCungCap, setPhongBanCungCap] = useState([]);
  const [hangHoaCoTheNhap, setHangHoaCoTheNhap] = useState([]);

  const isEditActualMode = mode === "edit-actual";
  const canEdit =
    !isEditActualMode && ["draft", "revision_required"].includes(phieuStatus);
  const canEditActual = isEditActualMode && phieuStatus === "approved";

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
  const loaiPhieu = watch("loai_phieu");
  const nhaCungCapData = watch("nha_cung_cap");
  const phongBanCungCapData = watch("phong_ban_cung_cap");

  useEffect(() => {
    if (phieuId) {
      reset({});
      setDataLoaded(false);
      setFormReady(false);
      setPhieuStatus(null);
      setOriginalData(null);
      loadPhieuData();
    }
  }, [phieuId, reset]);

  // Load phòng ban cung cấp khi thay đổi loại phiếu
  useEffect(() => {
    if (
      dataLoaded &&
      (loaiPhieu === "tren_cap" || loaiPhieu === "dieu_chuyen")
    ) {
      loadPhongBanCungCap();
    } else {
      setPhongBanCungCap([]);
      setHangHoaCoTheNhap([]);
    }
  }, [loaiPhieu, dataLoaded]);

  // Load hàng hóa có thể nhập khi chọn phòng ban cung cấp
  useEffect(() => {
    if (
      phongBanCungCapData?.id &&
      (loaiPhieu === "tren_cap" || loaiPhieu === "dieu_chuyen")
    ) {
      loadHangHoaCoTheNhap(phongBanCungCapData.id);
    } else {
      setHangHoaCoTheNhap([]);
    }
  }, [phongBanCungCapData, loaiPhieu]);

  const loadPhieuData = async () => {
    try {
      setIsLoadingData(true);
      setDataLoaded(false);
      setFormReady(false);

      const response = await nhapKhoService.getDetail(phieuId);
      const phieu = response.data;

      setPhieuStatus(phieu.trang_thai);
      setOriginalData(phieu);

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
        // Xử lý theo loại phiếu
        nha_cung_cap_id:
          phieu.loai_phieu === "tu_mua" ? phieu.nha_cung_cap?.id || null : null,
        nha_cung_cap:
          phieu.loai_phieu === "tu_mua" ? phieu.nha_cung_cap || null : null,
        phong_ban_cung_cap_id: ["tren_cap", "dieu_chuyen"].includes(
          phieu.loai_phieu
        )
          ? phieu.phong_ban_cung_cap?.id || null
          : null,
        phong_ban_cung_cap: ["tren_cap", "dieu_chuyen"].includes(
          phieu.loai_phieu
        )
          ? phieu.phong_ban_cung_cap || null
          : null,
      };

      reset(formData, { keepDefaultValues: false });

      const chiTietData = phieu.chi_tiet.map((item) => ({
        hang_hoa_id: item.hang_hoa.id,
        hang_hoa: item.hang_hoa,
        so_luong_ke_hoach:
          parseFloat(item.so_luong_ke_hoach) || parseFloat(item.so_luong) || 1,
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

  const loadPhongBanCungCap = async () => {
    try {
      const response = await hangHoaService.getPhongBanCungCap(loaiPhieu);
      setPhongBanCungCap(response.data || []);
    } catch (error) {
      console.error("Error loading phong ban cung cap:", error);
      setPhongBanCungCap([]);
    }
  };

  const loadHangHoaCoTheNhap = async (phongBanCungCapId) => {
    try {
      const response = await nhapKhoService.getHangHoaCoTheNhap(
        phongBanCungCapId
      );
      setHangHoaCoTheNhap(response.data || []);
    } catch (error) {
      console.error("Error loading hang hoa co the nhap:", error);
      setHangHoaCoTheNhap([]);
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

  const handlePhongBanCungCapSelect = (phongBan) => {
    setValue("phong_ban_cung_cap_id", phongBan.id || null);
    setValue("phong_ban_cung_cap", phongBan);
    toast.success(`Đã chọn phòng ban cung cấp: ${phongBan.ten_phong_ban}`);
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

      // Hiển thị thông tin tồn kho nguồn nếu có
      if (hangHoa.so_luong_ton_nguon !== undefined) {
        toast.info(
          `📦 Tồn kho nguồn: ${hangHoa.so_luong_ton_nguon} ${hangHoa.don_vi_tinh}`,
          { duration: 3000 }
        );
      }
    }
  };

  const addNewRow = () => {
    append({
      hang_hoa_id: null,
      hang_hoa: null,
      so_luong_ke_hoach: 1,
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

    // Validation theo loại phiếu
    if (data.loai_phieu === "tu_mua" && !data.nha_cung_cap) {
      toast.error("Vui lòng chọn nhà cung cấp cho phiếu tự mua");
      return;
    }

    if (
      ["tren_cap", "dieu_chuyen"].includes(data.loai_phieu) &&
      !data.phong_ban_cung_cap
    ) {
      toast.error("Vui lòng chọn phòng ban cung cấp");
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

      // Kiểm tra tồn kho nguồn cho phiếu từ cấp trên
      if (
        ["tren_cap", "dieu_chuyen"].includes(data.loai_phieu) &&
        item.hang_hoa.so_luong_ton_nguon !== undefined &&
        (isEditActualMode ? item.so_luong : item.so_luong_ke_hoach) >
          item.hang_hoa.so_luong_ton_nguon
      ) {
        const field = isEditActualMode ? "thực nhập" : "kế hoạch";
        toast.error(
          `Dòng ${i + 1}: Số lượng ${field} vượt quá tồn kho nguồn (${
            item.hang_hoa.so_luong_ton_nguon
          })`
        );
        return;
      }
    }

    setLoading(true);
    try {
      toast.loading("Đang cập nhật phiếu nhập...", { id: "processing" });

      if (isEditActualMode) {
        const updateData = {
          chi_tiet_cap_nhat: data.chi_tiet.map((item) => ({
            hang_hoa_id: item.hang_hoa.id,
            so_luong: parseFloat(item.so_luong),
          })),
        };

        await nhapKhoService.updateActualQuantity(phieuId, updateData);
        toast.dismiss("processing");
        toast.success("🎉 Cập nhật số lượng thực tế thành công!");
      } else {
        let finalNhaCungCap = null;
        let finalPhongBanCungCap = null;

        // Xử lý theo loại phiếu
        if (
          data.loai_phieu === "tu_mua" &&
          canEdit &&
          data.nha_cung_cap?.isNewItem
        ) {
          finalNhaCungCap = await createNhaCungCapIfNeeded(data.nha_cung_cap);
          toast.success(`✓ Đã tạo nhà cung cấp: ${finalNhaCungCap.ten_ncc}`);
        } else if (data.loai_phieu === "tu_mua") {
          finalNhaCungCap = data.nha_cung_cap;
        }

        if (["tren_cap", "dieu_chuyen"].includes(data.loai_phieu)) {
          finalPhongBanCungCap = data.phong_ban_cung_cap;
        }

        const finalChiTiet = [];
        for (let item of data.chi_tiet) {
          let finalHangHoa = item.hang_hoa;
          if (canEdit && item.hang_hoa?.isNewItem) {
            finalHangHoa = await createHangHoaIfNeeded(item.hang_hoa);
            toast.success(`✓ Đã tạo hàng hóa: ${finalHangHoa.ten_hang_hoa}`);
          }
          finalChiTiet.push({
            hang_hoa_id: finalHangHoa.id,
            so_luong_ke_hoach: parseFloat(item.so_luong_ke_hoach),
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
          phong_ban_cung_cap_id: finalPhongBanCungCap?.id || null,
          chi_tiet: finalChiTiet,
        };

        await nhapKhoService.update(phieuId, submitData);
        toast.dismiss("processing");
        toast.success("🎉 Cập nhật phiếu nhập thành công!");
      }

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

  // Component hiển thị thông báo liên kết phiếu
  const LinkedDocumentInfo = () => {
    if (!originalData?.phieu_xuat_lien_ket_id) return null;

    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2 text-sm">
        <Package size={16} className="mt-0.5 flex-shrink-0 text-green-600" />
        <div>
          <p className="font-medium text-green-800">Phiếu liên kết</p>
          <p className="text-green-700">
            Phiếu này đã được tạo tự động từ phiếu xuất của phòng ban cung cấp.
            Việc cập nhật sẽ ảnh hưởng đến hệ thống workflow 3 cấp.
          </p>
        </div>
      </div>
    );
  };

  // Component hiển thị phòng ban cung cấp
  const PhongBanCungCapField = () => {
    if (loaiPhieu !== "tren_cap" && loaiPhieu !== "dieu_chuyen") {
      return null;
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Building className="inline h-4 w-4 mr-1" />
          Phòng ban cung cấp *
        </label>
        {phongBanCungCap.length > 0 ? (
          <select
            onChange={(e) => {
              const selectedId = parseInt(e.target.value);
              const selectedPhongBan = phongBanCungCap.find(
                (pb) => pb.id === selectedId
              );
              if (selectedPhongBan) {
                handlePhongBanCungCapSelect(selectedPhongBan);
              }
            }}
            value={phongBanCungCapData?.id || ""}
            disabled={isEditActualMode || !canEdit}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
          >
            <option value="">-- Chọn phòng ban cung cấp --</option>
            {phongBanCungCap.map((pb) => (
              <option key={pb.id} value={pb.id}>
                {pb.ten_phong_ban} (Cấp {pb.cap_bac})
              </option>
            ))}
          </select>
        ) : (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50 text-sm text-yellow-600 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Đang tải danh sách phòng ban...
          </div>
        )}
      </div>
    );
  };

  // Component tìm kiếm hàng hóa thông minh
  const getHangHoaSearchFunction = () => {
    if (loaiPhieu === "tren_cap" || loaiPhieu === "dieu_chuyen") {
      // Chỉ cho phép chọn hàng hóa từ danh sách có thể nhập
      return (query) => {
        const filtered = hangHoaCoTheNhap.filter(
          (item) =>
            item.ten_hang_hoa.toLowerCase().includes(query.toLowerCase()) ||
            item.ma_hang_hoa.toLowerCase().includes(query.toLowerCase())
        );
        return Promise.resolve({ data: filtered });
      };
    } else {
      // Tìm kiếm tự do cho phiếu tự mua
      return searchService.searchHangHoa;
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
      {isEditActualMode && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
          Chế độ chỉnh sửa số lượng thực tế. Chỉ có thể sửa cột "SL thực nhập".
        </div>
      )}

      {!canEdit && !isEditActualMode && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
          Phiếu này không còn ở trạng thái nháp nên không thể tạo mới nhà cung
          cấp hoặc hàng hóa. Bạn chỉ có thể chỉnh sửa các thông tin hiện có.
        </div>
      )}

      <LinkedDocumentInfo />

      {/* Thông báo workflow 3 cấp */}
      {(loaiPhieu === "tren_cap" || loaiPhieu === "dieu_chuyen") && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
          <div className="flex">
            <Info size={16} className="mt-0.5 flex-shrink-0 mr-2" />
            <div>
              <p className="font-medium">Workflow 3 cấp</p>
              <p>
                Phiếu này thuộc quy trình 3 cấp. Việc cập nhật có thể ảnh hưởng
                đến phiếu xuất liên kết và tồn kho của phòng ban cung cấp.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isEditActualMode
              ? "Chỉnh sửa số lượng thực tế"
              : "Thông tin phiếu nhập"}
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
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
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
                disabled={isEditActualMode || !canEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
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
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
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
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
                placeholder="Tên người nhập hàng"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {loaiPhieu === "tu_mua"
                  ? "Nhà cung cấp"
                  : ["tren_cap", "dieu_chuyen"].includes(loaiPhieu)
                  ? "Phòng ban cung cấp"
                  : "Nguồn cung cấp"}
              </label>
              {loaiPhieu === "tu_mua" ? (
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
                  allowCreate={canEdit}
                  disabled={isEditActualMode}
                />
              ) : ["tren_cap", "dieu_chuyen"].includes(loaiPhieu) ? (
                <PhongBanCungCapField />
              ) : (
                <input
                  type="text"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm"
                  placeholder="Không áp dụng"
                />
              )}

              {/* Hiển thị thông tin đã chọn */}
              {loaiPhieu === "tu_mua" &&
                nhaCungCapData?.isNewItem &&
                canEdit && (
                  <div className="mt-1 text-xs text-blue-600">
                    💡 Nhà cung cấp mới sẽ được tạo khi lưu phiếu nhập
                  </div>
                )}
              {loaiPhieu === "tu_mua" &&
                nhaCungCapData &&
                !nhaCungCapData.isNewItem && (
                  <div className="mt-1 text-xs text-green-600">
                    ✓ {nhaCungCapData.ma_ncc} - {nhaCungCapData.loai_ncc}
                  </div>
                )}
              {["tren_cap", "dieu_chuyen"].includes(loaiPhieu) &&
                phongBanCungCapData && (
                  <div className="mt-1 text-xs text-green-600">
                    ✓ {phongBanCungCapData.ma_phong_ban} - Cấp{" "}
                    {phongBanCungCapData.cap_bac}
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
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
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
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
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
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
                placeholder="Nhập lý do nhập kho"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              Chi tiết hàng hóa ({fields.length} mặt hàng)
            </h4>

            {!isEditActualMode && canEdit && (
              <button
                type="button"
                onClick={addNewRow}
                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-all"
                title="Thêm dòng"
              >
                <Plus size={16} />
              </button>
            )}
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
                    SL kế hoạch *
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[12%]">
                    SL thực nhập *
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
                  {!isEditActualMode && (
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[6%]">
                      Thao tác
                    </th>
                  )}
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
                            searchFunction={getHangHoaSearchFunction(index)}
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
                            allowCreate={canEdit && loaiPhieu === "tu_mua"}
                            disabled={isEditActualMode}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            {...register(
                              `chi_tiet.${index}.so_luong_ke_hoach`,
                              {
                                required: "Vui lòng nhập số lượng kế hoạch",
                                min: {
                                  value: 1,
                                  message: "Số lượng phải lớn hơn 0",
                                },
                              }
                            )}
                            disabled={isEditActualMode || !canEdit}
                            onChange={(e) => {
                              if (!isEditActualMode) {
                                setValue(
                                  `chi_tiet.${index}.so_luong`,
                                  e.target.value
                                );
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            {...register(`chi_tiet.${index}.so_luong`, {
                              required: "Vui lòng nhập số lượng thực nhập",
                              min: {
                                value: 1,
                                message: "Số lượng phải lớn hơn 0",
                              },
                            })}
                            disabled={!canEdit && !canEditActual}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center disabled:bg-gray-100"
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
                            disabled={isEditActualMode || !canEdit}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            {...register(`chi_tiet.${index}.pham_chat`)}
                            disabled={isEditActualMode || !canEdit}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
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
                            disabled={isEditActualMode || !canEdit}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center disabled:bg-gray-100"
                            placeholder="Số seri"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatCurrency(thanhTien)}
                        </td>
                        {!isEditActualMode && (
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1 || !canEdit}
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
                        )}
                      </tr>
                      {/* Hiển thị thông tin bổ sung */}
                      {currentItem.hang_hoa && (
                        <tr>
                          <td></td>
                          <td
                            colSpan={isEditActualMode ? "7" : "8"}
                            className="px-3 py-1 text-xs text-gray-500"
                          >
                            {!currentItem.hang_hoa.isNewItem && (
                              <div className="flex items-center space-x-4">
                                <span className="text-green-600">
                                  ✓ {currentItem.hang_hoa.ma_hang_hoa} -{" "}
                                  {currentItem.hang_hoa.don_vi_tinh}
                                </span>
                                {currentItem.hang_hoa.so_luong_ton_nguon !==
                                  undefined && (
                                  <span className="text-blue-600">
                                    📦 Tồn nguồn:{" "}
                                    {currentItem.hang_hoa.so_luong_ton_nguon}
                                  </span>
                                )}
                              </div>
                            )}
                            {currentItem.hang_hoa.isNewItem && canEdit && (
                              <span className="text-blue-600">
                                💡 Hàng hóa mới sẽ được tạo
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {fields.length > 0 && (
                  <tr className="bg-green-50 font-bold">
                    <td
                      colSpan={isEditActualMode ? "7" : "8"}
                      className="px-3 py-3 text-right text-gray-900"
                    >
                      TỔNG CỘNG:
                    </td>
                    <td className="px-3 py-3 text-right text-green-600 text-lg">
                      {formatCurrency(tongTien)}
                    </td>
                    {!isEditActualMode && <td></td>}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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
