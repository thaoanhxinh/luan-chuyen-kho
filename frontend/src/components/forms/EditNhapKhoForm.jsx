// import React, { useState, useEffect } from "react";
// import { useForm, useFieldArray } from "react-hook-form";
// import {
//   Plus,
//   Trash2,
//   AlertTriangle,
//   Info,
//   Package,
//   Building,
//   User,
//   Calendar,
//   FileText,
//   RefreshCw,
//   Link2,
//   CheckCircle,
// } from "lucide-react";
// import { searchService } from "../../services/searchService";
// import { nhapKhoService } from "../../services/nhapKhoService";
// import { hangHoaService } from "../../services/hangHoaService";
// import { formatCurrency } from "../../utils/helpers";
// import { LOAI_PHIEU_NHAP, PHAM_CHAT } from "../../utils/constants";
// import AutoComplete from "../common/AutoComplete";
// import toast from "react-hot-toast";

// const EditNhapKhoForm = ({ phieuId, onSuccess, onCancel, mode = "edit" }) => {
//   // States
//   const [loading, setLoading] = useState(false);
//   const [isLoadingData, setIsLoadingData] = useState(true);
//   const [dataLoaded, setDataLoaded] = useState(false);
//   const [formReady, setFormReady] = useState(false);
//   const [phieuStatus, setPhieuStatus] = useState(null);
//   const [originalData, setOriginalData] = useState(null);
//   const [phongBanCungCap, setPhongBanCungCap] = useState([]);
//   const [setHangHoaCoTheNhap] = useState([]);

//   const isEditActualMode = mode === "edit-actual";
//   const canEdit =
//     !isEditActualMode && ["draft", "revision_required"].includes(phieuStatus);
//   const canEditActual = isEditActualMode && phieuStatus === "approved";

//   // Form hooks
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

//   // Watch form values
//   const chiTietItems = watch("chi_tiet") || [];
//   const loaiPhieu = watch("loai_phieu");
//   const nhaCungCapData = watch("nha_cung_cap");
//   const phongBanCungCapData = watch("phong_ban_cung_cap");

//   // Calculate total
//   const tongTien = chiTietItems.reduce(
//     (sum, item) => sum + (parseFloat(item?.thanh_tien) || 0),
//     0
//   );

//   // Load data when component mounts
//   useEffect(() => {
//     if (phieuId) {
//       reset({});
//       setDataLoaded(false);
//       setFormReady(false);
//       setPhieuStatus(null);
//       setOriginalData(null);
//       loadPhieuData();
//     }
//   }, [phieuId, reset]);

//   // Load phòng ban cung cấp when loại phiếu changes
//   useEffect(() => {
//     if (
//       loaiPhieu &&
//       ["tren_cap", "dieu_chuyen"].includes(loaiPhieu) &&
//       canEdit
//     ) {
//       loadPhongBanCungCap();
//     }
//   }, [loaiPhieu, canEdit]);

//   // Load available goods when source changes
//   useEffect(() => {
//     if (canEdit && (nhaCungCapData?.id || phongBanCungCapData?.id)) {
//       loadHangHoaCoTheNhap();
//     }
//   }, [nhaCungCapData?.id, phongBanCungCapData?.id, canEdit]);

//   // ✅ LOAD PHIEU DATA - ĐÁNH GIÁ CHI TIẾT PHIẾU LIÊN KẾT
//   // const loadPhieuData = async () => {
//   //   try {
//   //     setIsLoadingData(true);
//   //     setDataLoaded(false);
//   //     setFormReady(false);

//   //     console.log("🔄 Loading phieu data for ID:", phieuId);
//   //     const response = await nhapKhoService.getDetail(phieuId);
//   //     const phieu = response.data;

//   //     console.log("📄 Loaded phieu:", phieu);

//   //     setPhieuStatus(phieu.trang_thai);
//   //     setOriginalData(phieu);

//   //     // Format date for input
//   //     const formattedDate = phieu.ngay_nhap
//   //       ? new Date(phieu.ngay_nhap).toISOString().split("T")[0]
//   //       : new Date().toISOString().split("T")[0];

//   //     // Reset form with loaded data
//   //     const formData = {
//   //       so_phieu: phieu.so_phieu || "",
//   //       ngay_nhap: formattedDate,
//   //       loai_phieu: phieu.loai_phieu || "tu_mua",
//   //       ly_do_nhap: phieu.ly_do_nhap || "",
//   //       so_quyet_dinh: phieu.so_quyet_dinh || "",
//   //       nguoi_nhap_hang: phieu.nguoi_nhap_hang || "",
//   //       nguoi_giao_hang: phieu.nguoi_giao_hang || "",
//   //       ghi_chu: phieu.ghi_chu || "",
//   //       phuong_thuc_van_chuyen:
//   //         phieu.phuong_thuc_van_chuyen || "Đơn vị tự vận chuyển",
//   //       dia_chi_nhap: phieu.dia_chi_nhap || "",
//   //       so_hoa_don: phieu.so_hoa_don || "",
//   //       nha_cung_cap: phieu.nha_cung_cap || null,
//   //       phong_ban_cung_cap: phieu.phong_ban_cung_cap || null,
//   //       chi_tiet: phieu.chi_tiet || [],
//   //     };

//   //     console.log("🔧 Form data prepared:", formData);
//   //     reset(formData);
//   //     setDataLoaded(true);

//   //     // Delay để đảm bảo form được reset hoàn toàn
//   //     setTimeout(() => {
//   //       setFormReady(true);
//   //     }, 100);
//   //   } catch (error) {
//   //     console.error("❌ Error loading phieu data:", error);
//   //     toast.error("Không thể tải thông tin phiếu");
//   //     setDataLoaded(false);
//   //     setFormReady(false);
//   //   } finally {
//   //     setIsLoadingData(false);
//   //   }
//   // };

//   const loadPhieuData = async () => {
//     try {
//       setIsLoadingData(true);
//       console.log("🔄 Loading phieu data for ID:", phieuId);

//       const response = await nhapKhoService.getDetail(phieuId);
//       const phieuData = response.data;

//       console.log("📋 Loaded phieu data:", phieuData);

//       setOriginalData(phieuData);
//       setPhieuStatus(phieuData.trang_thai);

//       // ✅ FIX: Xử lý nhà cung cấp đúng cách
//       let nhaCungCapData = null;
//       if (phieuData.nha_cung_cap_id && phieuData.ten_nha_cung_cap) {
//         nhaCungCapData = {
//           id: phieuData.nha_cung_cap_id,
//           ten_nha_cung_cap: phieuData.ten_nha_cung_cap,
//         };
//       }

//       // ✅ FIX: Xử lý phòng ban cung cấp đúng cách
//       let phongBanCungCapData = null;
//       if (phieuData.phong_ban_cung_cap_id && phieuData.ten_phong_ban_cung_cap) {
//         phongBanCungCapData = {
//           id: phieuData.phong_ban_cung_cap_id,
//           ten_phong_ban: phieuData.ten_phong_ban_cung_cap,
//         };
//       }

//       // ✅ FIX: Populate form data với đầy đủ thông tin
//       const formData = {
//         ngay_nhap: phieuData.ngay_nhap,
//         loai_phieu: phieuData.loai_phieu,
//         so_quyet_dinh: phieuData.so_quyet_dinh || "",
//         nguoi_nhap_hang: phieuData.nguoi_nhap_hang || "",
//         nguoi_giao_hang: phieuData.nguoi_giao_hang || "",
//         so_hoa_don: phieuData.so_hoa_don || "",
//         dia_chi_nhap: phieuData.dia_chi_nhap || "",
//         ly_do_nhap: phieuData.ly_do_nhap || "",
//         ghi_chu: phieuData.ghi_chu || "",
//         phuong_thuc_van_chuyen:
//           phieuData.phuong_thuc_van_chuyen || "Đơn vị tự vận chuyển",

//         // ✅ FIX: Set đúng NCC và phòng ban
//         nha_cung_cap: nhaCungCapData,
//         phong_ban_cung_cap: phongBanCungCapData,

//         // ✅ FIX: Chi tiết với đầy đủ thông tin hàng hóa
//         chi_tiet:
//           phieuData.chi_tiet?.map((item) => ({
//             id: item.id,
//             hang_hoa_id: item.hang_hoa_id,
//             // ✅ FIX: Thêm thông tin hàng hóa để hiển thị
//             hang_hoa: {
//               id: item.hang_hoa_id,
//               ten_hang_hoa: item.ten_hang_hoa,
//               ma_hang_hoa: item.ma_hang_hoa,
//               don_vi_tinh: item.don_vi_tinh,
//               gia_nhap_gan_nhat: item.don_gia,
//             },
//             so_luong_ke_hoach: item.so_luong_ke_hoach,
//             so_luong: isEditActualMode ? item.so_luong : item.so_luong_ke_hoach,
//             don_gia: item.don_gia,
//             thanh_tien: item.thanh_tien,
//             pham_chat: item.pham_chat || "tot",
//             han_su_dung: item.han_su_dung || null,
//             vi_tri_kho: item.vi_tri_kho || "",
//             ghi_chu: item.ghi_chu || "",
//             // ✅ FIX: Xử lý so_seri_list đúng cách
//             so_seri_list: Array.isArray(item.so_seri_list)
//               ? item.so_seri_list
//               : [],
//             la_tai_san_co_dinh: item.la_tai_san_co_dinh || false,
//           })) || [],
//       };

//       console.log("🔄 Setting form data:", formData);

//       // ✅ Reset form với data đầy đủ
//       reset(formData);

//       // ✅ Cập nhật field array
//       replace(formData.chi_tiet);

//       // ✅ Set trạng thái cho phòng ban nếu là điều chuyển
//       if (phieuData.loai_phieu === "dieu_chuyen" && phongBanCungCapData) {
//         // Load cấp 2, 3 nếu cần...
//         // Tạm thời set trực tiếp
//         setSelectedCap3(phongBanCungCapData.id);
//       }

//       setDataLoaded(true);
//       setFormReady(true);
//     } catch (error) {
//       console.error("❌ Error loading phieu data:", error);
//       toast.error("Không thể tải dữ liệu phiếu nhập");
//     } finally {
//       setIsLoadingData(false);
//     }
//   };

//   // Load phòng ban cung cấp
//   const loadPhongBanCungCap = async () => {
//     try {
//       const response = await nhapKhoService.getPhongBanCungCap();
//       setPhongBanCungCap(response.data || []);
//     } catch (error) {
//       console.error("Error loading phong ban cung cap:", error);
//       setPhongBanCungCap([]);
//     }
//   };

//   // Load hàng hóa có thể nhập
//   const loadHangHoaCoTheNhap = async () => {
//     try {
//       let params = {};

//       if (loaiPhieu === "tu_mua" && nhaCungCapData?.id) {
//         params.nha_cung_cap_id = nhaCungCapData.id;
//       } else if (
//         ["tren_cap", "dieu_chuyen"].includes(loaiPhieu) &&
//         phongBanCungCapData?.id
//       ) {
//         params.phong_ban_id = phongBanCungCapData.id;
//       }

//       if (Object.keys(params).length > 0) {
//         const response = await hangHoaService.getAvailable(params);
//         setHangHoaCoTheNhap(response.data || []);
//       }
//     } catch (error) {
//       console.error("Error loading available hang hoa:", error);
//       setHangHoaCoTheNhap([]);
//     }
//   };

//   // Handle nhà cung cấp select
//   const handleNhaCungCapSelect = (supplier) => {
//     setValue("nha_cung_cap", supplier);
//     // Clear phòng ban cung cấp khi chọn nhà cung cấp
//     setValue("phong_ban_cung_cap", null);
//     // Reset chi tiết khi thay đổi nguồn cung cấp
//     replace([]);
//   };

//   // Handle phòng ban cung cấp select
//   const handlePhongBanCungCapSelect = (phongBan) => {
//     setValue("phong_ban_cung_cap", phongBan);
//     // Clear nhà cung cấp khi chọn phòng ban
//     setValue("nha_cung_cap", null);
//     // Reset chi tiết khi thay đổi nguồn cung cấp
//     replace([]);
//   };

//   // Handle hàng hóa select
//   const handleHangHoaSelect = (hangHoa, index) => {
//     if (!hangHoa) return;

//     console.log("🎯 Selected hang hoa:", hangHoa, "for index:", index);

//     // Update fields for selected item
//     const updates = {
//       [`chi_tiet.${index}.hang_hoa_id`]: hangHoa.id,
//       [`chi_tiet.${index}.hang_hoa`]: hangHoa,
//       [`chi_tiet.${index}.don_gia`]: hangHoa.don_gia_nhap || 0,
//     };

//     Object.entries(updates).forEach(([field, value]) => {
//       setValue(field, value);
//     });

//     // Trigger recalculation
//     setTimeout(() => {
//       const currentItems = watch("chi_tiet");
//       if (currentItems[index]) {
//         updateThanhTien(index);
//       }
//     }, 100);
//   };

//   // Update thành tiền
//   const updateThanhTien = (index) => {
//     const items = watch("chi_tiet");
//     const item = items[index];
//     if (item) {
//       const soLuong = parseFloat(item.so_luong) || 0;
//       const donGia = parseFloat(item.don_gia) || 0;
//       const thanhTien = soLuong * donGia;
//       setValue(`chi_tiet.${index}.thanh_tien`, thanhTien);
//     }
//   };

//   // Add new item
//   const handleAddItem = () => {
//     append({
//       hang_hoa: null,
//       hang_hoa_id: null,
//       so_luong: 0,
//       so_luong_ke_hoach: 0,
//       don_gia: 0,
//       thanh_tien: 0,
//       pham_chat: "tot",
//       han_su_dung: "",
//       vi_tri_kho: "",
//       ghi_chu: "",
//     });
//   };

//   // Remove item
//   const handleRemoveItem = (index) => {
//     if (fields.length <= 1) {
//       toast.error("Không thể xóa dòng cuối cùng");
//       return;
//     }
//     remove(index);
//   };

//   // ✅ SUBMIT FORM - XỬ LÝ CẢ 2 MODE EDIT VÀ EDIT-ACTUAL
//   const onSubmit = async (data) => {
//     setLoading(true);
//     toast.loading("Đang xử lý...", { id: "processing" });

//     try {
//       console.log("📤 Submitting form data:", data);

//       // Validate chi tiết
//       if (!data.chi_tiet || data.chi_tiet.length === 0) {
//         throw new Error("Vui lòng thêm ít nhất một mặt hàng");
//       }

//       // Validate each chi tiết item
//       for (let i = 0; i < data.chi_tiet.length; i++) {
//         const item = data.chi_tiet[i];
//         if (!item.hang_hoa_id) {
//           throw new Error(`Dòng ${i + 1}: Chưa chọn hàng hóa`);
//         }
//         if (!item.so_luong || parseFloat(item.so_luong) <= 0) {
//           throw new Error(`Dòng ${i + 1}: Số lượng phải lớn hơn 0`);
//         }
//         if (!item.don_gia || parseFloat(item.don_gia) < 0) {
//           throw new Error(`Dòng ${i + 1}: Đơn giá không hợp lệ`);
//         }
//       }

//       // Prepare request data
//       const requestData = {
//         ...data,
//         nha_cung_cap_id: data.nha_cung_cap?.id || null,
//         phong_ban_cung_cap_id: data.phong_ban_cung_cap?.id || null,
//         tong_tien: tongTien,
//         chi_tiet: data.chi_tiet.map((item) => ({
//           hang_hoa_id: item.hang_hoa_id,
//           so_luong: isEditActualMode
//             ? parseFloat(item.so_luong)
//             : parseFloat(item.so_luong_ke_hoach || item.so_luong),
//           so_luong_ke_hoach: parseFloat(
//             item.so_luong_ke_hoach || item.so_luong
//           ),
//           so_luong_thuc_te: isEditActualMode
//             ? parseFloat(item.so_luong)
//             : parseFloat(item.so_luong),
//           don_gia: parseFloat(item.don_gia),
//           thanh_tien: parseFloat(item.thanh_tien),
//           pham_chat: item.pham_chat,
//           han_su_dung: item.han_su_dung || null,
//           vi_tri_kho: item.vi_tri_kho || "",
//           ghi_chu: item.ghi_chu || "",
//           so_seri_list: item.so_seri_list || [],
//         })),
//       };

//       // Call appropriate service method
//       let response;
//       if (isEditActualMode) {
//         response = await nhapKhoService.updateActualQuantity(
//           phieuId,
//           requestData
//         );
//       } else {
//         response = await nhapKhoService.update(phieuId, requestData);
//       }

//       toast.dismiss("processing");

//       // ✅ THÔNG BÁO THÀNH CÔNG VỚI THÔNG TIN PHIẾU LIÊN KẾT
//       if (originalData?.phieu_xuat_lien_ket_id && originalData?.is_tu_dong) {
//         toast.success(
//           "Cập nhật phiếu nhập thành công! Phiếu xuất liên kết cũng đã được tự động cập nhật.",
//           { duration: 5000, icon: "🔗" }
//         );
//       } else {
//         toast.success(
//           isEditActualMode
//             ? "Cập nhật số lượng thực tế thành công"
//             : "Cập nhật phiếu nhập thành công"
//         );
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

//   // ✅ COMPONENT HIỂN THỊ THÔNG BÁO LIÊN KẾT PHIẾU
//   const LinkedDocumentInfo = () => {
//     if (!originalData?.phieu_xuat_lien_ket_id) return null;

//     return (
//       <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
//         <div className="flex items-start space-x-3">
//           <Link2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
//           <div className="flex-1">
//             <h4 className="font-medium text-blue-900 mb-1">Phiếu liên kết</h4>
//             <p className="text-sm text-blue-800 mb-2">
//               Phiếu này đã được tạo tự động từ phiếu xuất của phòng ban cung
//               cấp. Việc cập nhật sẽ ảnh hưởng đến hệ thống workflow 3 cấp.
//             </p>
//             {originalData.phieu_xuat_lien_ket && (
//               <div className="bg-white p-3 rounded border">
//                 <div className="grid grid-cols-2 gap-4 text-xs">
//                   <div>
//                     <span className="font-medium">Phiếu xuất liên kết:</span>
//                     <div className="text-gray-600 mt-1">
//                       {originalData.phieu_xuat_lien_ket.so_phieu}
//                     </div>
//                   </div>
//                   <div>
//                     <span className="font-medium">Phòng ban cung cấp:</span>
//                     <div className="text-gray-600 mt-1">
//                       {originalData.phieu_xuat_lien_ket.phong_ban
//                         ?.ten_phong_ban || "N/A"}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // ✅ COMPONENT HIỂN THỊ TRẠNG THÁI VÀ LỜI NHẮN REVISION
//   const StatusInfo = () => {
//     const statusDisplay = {
//       draft: { label: "Nháp", color: "text-gray-600", bgColor: "bg-gray-100" },
//       revision_required: {
//         label: "Cần chỉnh sửa",
//         color: "text-orange-600",
//         bgColor: "bg-orange-100",
//       },
//       approved: {
//         label: "Đã duyệt",
//         color: "text-green-600",
//         bgColor: "bg-green-100",
//       },
//     };

//     const status = statusDisplay[phieuStatus] || statusDisplay.draft;

//     return (
//       <div className="bg-gray-50 p-4 rounded-lg mb-4">
//         <div className="flex items-center justify-between mb-2">
//           <h3 className="text-lg font-medium text-gray-900">
//             {isEditActualMode
//               ? "Chỉnh sửa số lượng thực tế"
//               : "Chỉnh sửa phiếu nhập"}
//             : {originalData?.so_phieu}
//           </h3>
//           <span
//             className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}
//           >
//             {status.label}
//           </span>
//         </div>

//         {/* Hiển thị thông tin revision nếu có */}
//         {phieuStatus === "revision_required" &&
//           originalData?.ghi_chu_phan_hoi && (
//             <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
//               <div className="flex items-start space-x-2">
//                 <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
//                 <div>
//                   <p className="text-sm font-medium text-orange-800">
//                     Yêu cầu chỉnh sửa:
//                   </p>
//                   <p className="text-sm text-orange-700 mt-1">
//                     {originalData.ghi_chu_phan_hoi}
//                   </p>
//                   {originalData.nguoi_phan_hoi_ten && (
//                     <p className="text-xs text-orange-600 mt-1">
//                       - Người yêu cầu: {originalData.nguoi_phan_hoi_ten}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//         {/* Hiển thị mode info */}
//         {isEditActualMode && (
//           <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
//             <div className="flex items-center space-x-2">
//               <Info className="h-4 w-4 text-blue-600" />
//               <span className="text-sm text-blue-800">
//                 Bạn chỉ có thể chỉnh sửa số lượng thực tế nhập vào kho.
//               </span>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   // ✅ PHÒNG BAN CUNG CẤP FIELD
//   const PhongBanCungCapField = () => {
//     if (loaiPhieu !== "tren_cap" && loaiPhieu !== "dieu_chuyen") {
//       return null;
//     }

//     return (
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           <Building className="inline h-4 w-4 mr-1" />
//           Phòng ban cung cấp *
//         </label>
//         {phongBanCungCap.length > 0 ? (
//           <select
//             {...register("phong_ban_cung_cap.id", {
//               required: "Vui lòng chọn phòng ban cung cấp",
//             })}
//             disabled={isEditActualMode}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
//             onChange={(e) => {
//               const selectedId = parseInt(e.target.value);
//               const selected = phongBanCungCap.find(
//                 (pb) => pb.id === selectedId
//               );
//               if (selected) {
//                 handlePhongBanCungCapSelect(selected);
//               }
//             }}
//           >
//             <option value="">-- Chọn phòng ban --</option>
//             {phongBanCungCap.map((pb) => (
//               <option key={pb.id} value={pb.id}>
//                 {pb.ten_phong_ban}
//               </option>
//             ))}
//           </select>
//         ) : (
//           <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 text-sm">
//             Đang tải danh sách phòng ban...
//           </div>
//         )}
//         {errors.phong_ban_cung_cap?.id && (
//           <p className="mt-1 text-sm text-red-600">
//             {errors.phong_ban_cung_cap.id.message}
//           </p>
//         )}
//       </div>
//     );
//   };

//   // ✅ CHI TIẾT HÀNG HÓA TABLE
//   const ChiTietTable = () => (
//     <div className="bg-white border rounded-lg">
//       <div className="p-4 border-b bg-gray-50">
//         <div className="flex items-center justify-between">
//           <h3 className="text-lg font-medium text-gray-900">
//             Chi tiết hàng hóa nhập kho
//           </h3>
//           {canEdit && !isEditActualMode && (
//             <button
//               type="button"
//               onClick={handleAddItem}
//               className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1"
//             >
//               <Plus size={16} />
//               <span>Thêm hàng hóa</span>
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 STT
//               </th>
//               <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Hàng hóa
//               </th>
//               <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 ĐVT
//               </th>
//               {!isEditActualMode && (
//                 <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   SL kế hoạch
//                 </th>
//               )}
//               <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 {isEditActualMode ? "SL thực tế" : "Số lượng"}
//               </th>
//               <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Đơn giá
//               </th>
//               <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Thành tiền
//               </th>
//               <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Phẩm chất
//               </th>
//               {canEdit && !isEditActualMode && (
//                 <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Thao tác
//                 </th>
//               )}
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {fields.map((field, index) => {
//               const item = chiTietItems[index] || {};
//               return (
//                 <tr key={field.id} className="hover:bg-gray-50">
//                   {/* STT */}
//                   <td className="px-3 py-3 text-center text-sm text-gray-900">
//                     {index + 1}
//                   </td>

//                   {/* Hàng hóa */}
//                   <td className="px-3 py-3">
//                     {canEdit && !isEditActualMode ? (
//                       <AutoComplete
//                         key={`hanghoa-${field.id}`}
//                         searchFunction={searchService.searchHangHoa}
//                         onSelect={(hangHoa) =>
//                           handleHangHoaSelect(hangHoa, index)
//                         }
//                         placeholder="Tìm hàng hóa..."
//                         displayField="ten_hang_hoa"
//                         createLabel="Sẽ tạo hàng hóa mới"
//                         className="w-full"
//                         initialValue={item.hang_hoa?.ten_hang_hoa || ""}
//                         allowCreate={canEdit}
//                         disabled={isEditActualMode}
//                       />
//                     ) : (
//                       <div className="text-sm">
//                         <div className="font-medium text-gray-900">
//                           {item.hang_hoa?.ten_hang_hoa || "N/A"}
//                         </div>
//                         <div className="text-gray-500 text-xs">
//                           Mã: {item.hang_hoa?.ma_hang_hoa || "N/A"}
//                         </div>
//                       </div>
//                     )}
//                   </td>

//                   {/* Đơn vị tính */}
//                   <td className="px-3 py-3 text-center text-sm text-gray-900">
//                     {item.hang_hoa?.don_vi_tinh || "N/A"}
//                   </td>

//                   {/* Số lượng kế hoạch */}
//                   {!isEditActualMode && (
//                     <td className="px-3 py-3">
//                       <input
//                         type="number"
//                         step="0.01"
//                         {...register(`chi_tiet.${index}.so_luong_ke_hoach`, {
//                           required: "Bắt buộc",
//                           min: { value: 0.01, message: "Phải lớn hơn 0" },
//                         })}
//                         disabled={!canEdit}
//                         className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center disabled:bg-gray-100"
//                         onChange={() =>
//                           setTimeout(() => updateThanhTien(index), 100)
//                         }
//                       />
//                     </td>
//                   )}

//                   {/* Số lượng thực tế */}
//                   <td className="px-3 py-3">
//                     <input
//                       type="number"
//                       step="0.01"
//                       {...register(`chi_tiet.${index}.so_luong`, {
//                         required: "Bắt buộc",
//                         min: { value: 0.01, message: "Phải lớn hơn 0" },
//                       })}
//                       disabled={!canEdit && !canEditActual}
//                       className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center disabled:bg-gray-100"
//                       onChange={() =>
//                         setTimeout(() => updateThanhTien(index), 100)
//                       }
//                     />
//                   </td>

//                   {/* Đơn giá */}
//                   <td className="px-3 py-3">
//                     <input
//                       type="number"
//                       step="0.01"
//                       {...register(`chi_tiet.${index}.don_gia`, {
//                         required: "Bắt buộc",
//                         min: { value: 0, message: "Phải >= 0" },
//                       })}
//                       disabled={isEditActualMode}
//                       className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right disabled:bg-gray-100"
//                       onChange={() =>
//                         setTimeout(() => updateThanhTien(index), 100)
//                       }
//                     />
//                   </td>

//                   {/* Thành tiền */}
//                   <td className="px-3 py-3 text-right text-sm text-gray-900 font-medium">
//                     {formatCurrency(item.thanh_tien || 0)}
//                   </td>

//                   {/* Phẩm chất */}
//                   <td className="px-3 py-3">
//                     <select
//                       {...register(`chi_tiet.${index}.pham_chat`)}
//                       disabled={isEditActualMode}
//                       className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
//                     >
//                       {Object.entries(PHAM_CHAT).map(([key, value]) => (
//                         <option key={key} value={key}>
//                           {typeof value === "object" ? value.label : value}
//                         </option>
//                       ))}
//                     </select>
//                   </td>

//                   {/* Thao tác */}
//                   {canEdit && !isEditActualMode && (
//                     <td className="px-3 py-3 text-center">
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveItem(index)}
//                         disabled={fields.length <= 1}
//                         className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
//                         title={
//                           fields.length <= 1
//                             ? "Không thể xóa dòng cuối cùng"
//                             : "Xóa dòng"
//                         }
//                       >
//                         <Trash2 size={14} />
//                       </button>
//                     </td>
//                   )}
//                 </tr>
//               );
//             })}

//             {/* Tổng cộng */}
//             {fields.length > 0 && (
//               <tr className="bg-green-50 font-bold">
//                 <td
//                   colSpan={
//                     canEdit && !isEditActualMode
//                       ? isEditActualMode
//                         ? 7
//                         : 8
//                       : isEditActualMode
//                       ? 6
//                       : 7
//                   }
//                   className="px-3 py-3 text-right text-gray-900"
//                 >
//                   TỔNG CỘNG:
//                 </td>
//                 <td className="px-3 py-3 text-right text-green-600 text-lg">
//                   {formatCurrency(tongTien)}
//                 </td>
//                 {canEdit && !isEditActualMode && <td></td>}
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );

//   // Loading state
//   if (isLoadingData || !dataLoaded) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="text-center">
//           <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-2" />
//           <p className="text-gray-600">Đang tải thông tin phiếu...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-7xl mx-auto p-6 space-y-6">
//       {/* Status và linked info */}
//       <StatusInfo />
//       <LinkedDocumentInfo />

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//         {/* Thông tin cơ bản */}
//         <div className="bg-white border rounded-lg p-4">
//           <h3 className="text-lg font-medium text-gray-900 mb-4">
//             {isEditActualMode
//               ? "Thông tin phiếu (chỉ đọc)"
//               : "Thông tin phiếu nhập"}
//           </h3>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             {/* Ngày nhập */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <Calendar className="inline h-4 w-4 mr-1" />
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

//             {/* Loại phiếu */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <Package className="inline h-4 w-4 mr-1" />
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
//               {errors.loai_phieu && (
//                 <p className="mt-1 text-sm text-red-600">
//                   {errors.loai_phieu.message}
//                 </p>
//               )}
//             </div>

//             {/* Số quyết định */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <FileText className="inline h-4 w-4 mr-1" />
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

//             {/* Người nhập hàng */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <User className="inline h-4 w-4 mr-1" />
//                 Người nhận hàng
//               </label>
//               <input
//                 type="text"
//                 {...register("nguoi_nhap_hang")}
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
//                 placeholder="Tên người nhận hàng"
//               />
//             </div>
//           </div>

//           {/* Dòng 2 */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
//             {/* Nguồn cung cấp */}
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {loaiPhieu === "tu_mua"
//                   ? "Nhà cung cấp"
//                   : ["tren_cap", "dieu_chuyen"].includes(loaiPhieu)
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
//               ) : (
//                 <PhongBanCungCapField />
//               )}
//             </div>

//             {/* Người giao hàng */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <User className="inline h-4 w-4 mr-1" />
//                 Người giao hàng
//               </label>
//               <input
//                 type="text"
//                 {...register("nguoi_giao_hang")}
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
//                 placeholder="Tên người giao hàng"
//               />
//             </div>

//             {/* Số hóa đơn */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <FileText className="inline h-4 w-4 mr-1" />
//                 Số hóa đơn
//               </label>
//               <input
//                 type="text"
//                 {...register("so_hoa_don")}
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
//                 placeholder="Số hóa đơn VAT"
//               />
//             </div>
//           </div>

//           {/* Dòng 3 */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//             {/* Lý do nhập */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 <FileText className="inline h-4 w-4 mr-1" />
//                 Lý do nhập kho *
//               </label>
//               <textarea
//                 {...register("ly_do_nhap", {
//                   required: "Vui lòng nhập lý do nhập kho",
//                 })}
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
//                 rows={3}
//                 placeholder="Nhập lý do nhập kho..."
//               />
//               {errors.ly_do_nhap && (
//                 <p className="mt-1 text-sm text-red-600">
//                   {errors.ly_do_nhap.message}
//                 </p>
//               )}
//             </div>

//             {/* Ghi chú */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Ghi chú
//               </label>
//               <textarea
//                 {...register("ghi_chu")}
//                 disabled={isEditActualMode}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
//                 rows={3}
//                 placeholder="Ghi chú thêm..."
//               />
//             </div>
//           </div>
//         </div>

//         {/* Chi tiết hàng hóa */}
//         <ChiTietTable />

//         {/* Action buttons */}
//         <div className="flex items-center justify-end space-x-3 pt-6">
//           <button
//             type="button"
//             onClick={onCancel}
//             disabled={loading}
//             className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
//           >
//             {canEdit || canEditActual ? "Hủy" : "Đóng"}
//           </button>

//           {(canEdit || canEditActual) && (
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
//             >
//               {loading && (
//                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//               )}
//               <span>
//                 {loading
//                   ? "Đang xử lý..."
//                   : isEditActualMode
//                   ? "Cập nhật số lượng thực tế"
//                   : "Cập nhật phiếu"}
//               </span>
//             </button>
//           )}
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
  User,
  Calendar,
  FileText,
  RefreshCw,
  Link2,
  CheckCircle,
} from "lucide-react";
import { searchService } from "../../services/searchService";
import { nhapKhoService } from "../../services/nhapKhoService";
import { hangHoaService } from "../../services/hangHoaService";
import { formatCurrency } from "../../utils/helpers";
import { LOAI_PHIEU_NHAP, PHAM_CHAT } from "../../utils/constants";
import AutoComplete from "../common/AutoComplete";
import toast from "react-hot-toast";

const EditNhapKhoForm = ({ phieuId, onSuccess, onCancel, mode = "edit" }) => {
  // States
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [phieuStatus, setPhieuStatus] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [phongBanCungCap, setPhongBanCungCap] = useState([]);
  const [hangHoaCoTheNhap, setHangHoaCoTheNhap] = useState([]);
  const [selectedCap2, setSelectedCap2] = useState(null);
  const [selectedCap3, setSelectedCap3] = useState(null);

  // Determine edit modes - ✅ FIX: revision_required ĐƯỢC PHÉP SỬA MỌI THỨ
  const isEditActualMode = mode === "edit-actual";
  const canEdit =
    !isEditActualMode && ["draft", "revision_required"].includes(phieuStatus);
  const canEditActual = isEditActualMode && phieuStatus === "approved";

  // Form hooks
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

  // Watch form values
  const chiTietItems = watch("chi_tiet") || [];
  const loaiPhieu = watch("loai_phieu");
  const nhaCungCapData = watch("nha_cung_cap");
  const phongBanCungCapData = watch("phong_ban_cung_cap");

  // Calculate total
  const tongTien = chiTietItems.reduce(
    (sum, item) => sum + (parseFloat(item?.thanh_tien) || 0),
    0
  );

  // Load data when component mounts
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

  // Load phòng ban cung cấp when loại phiếu changes
  useEffect(() => {
    if (
      loaiPhieu &&
      ["tren_cap", "dieu_chuyen"].includes(loaiPhieu) &&
      canEdit
    ) {
      loadPhongBanCungCap();
    }
  }, [loaiPhieu, canEdit]);

  // Load available goods when source changes
  useEffect(() => {
    if (canEdit && (nhaCungCapData?.id || phongBanCungCapData?.id)) {
      loadHangHoaCoTheNhap();
    }
  }, [nhaCungCapData?.id, phongBanCungCapData?.id, canEdit]);

  // ✅ LOAD PHIEU DATA - FIX: Mapping đúng field names
  const loadPhieuData = async () => {
    try {
      setIsLoadingData(true);
      console.log("🔄 Loading phieu data for ID:", phieuId);

      const response = await nhapKhoService.getDetail(phieuId);
      const phieuData = response.data;

      console.log("📋 Loaded phieu data:", phieuData);

      setOriginalData(phieuData);
      setPhieuStatus(phieuData.trang_thai);

      // ✅ FIX: Xử lý nhà cung cấp đúng cách - THEO QUY TRÌNH DATABASE
      let nhaCungCapData = null;
      if (phieuData.nha_cung_cap_id) {
        // API response structure: { nha_cung_cap_id, ten_ncc, ma_ncc }
        nhaCungCapData = {
          id: phieuData.nha_cung_cap_id,
          ten_ncc: phieuData.ten_ncc, // ✅ Dùng ten_ncc từ API response
          ma_ncc: phieuData.ma_ncc,
          is_noi_bo: phieuData.ncc_is_noi_bo || false,
        };
      }

      // ✅ FIX: Xử lý phòng ban cung cấp đúng cách
      let phongBanCungCapData = null;
      if (phieuData.phong_ban_cung_cap_id && phieuData.ten_phong_ban_cung_cap) {
        phongBanCungCapData = {
          id: phieuData.phong_ban_cung_cap_id,
          ten_phong_ban: phieuData.ten_phong_ban_cung_cap,
        };
      }

      // ✅ FIX: Populate form data với đầy đủ thông tin
      const formData = {
        ngay_nhap: phieuData.ngay_nhap
          ? new Date(phieuData.ngay_nhap).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        loai_phieu: phieuData.loai_phieu,
        so_quyet_dinh: phieuData.so_quyet_dinh || "",
        nguoi_nhap_hang: phieuData.nguoi_nhap_hang || "",
        nguoi_giao_hang: phieuData.nguoi_giao_hang || "",
        so_hoa_don: phieuData.so_hoa_don || "",
        dia_chi_nhap: phieuData.dia_chi_nhap || "",
        ly_do_nhap: phieuData.ly_do_nhap || "",
        ghi_chu: phieuData.ghi_chu || "",
        phuong_thuc_van_chuyen:
          phieuData.phuong_thuc_van_chuyen || "Đơn vị tự vận chuyển",

        // ✅ FIX: Set đúng NCC và phòng ban
        nha_cung_cap: nhaCungCapData,
        phong_ban_cung_cap: phongBanCungCapData,

        // ✅ FIX: Chi tiết với đầy đủ thông tin hàng hóa và số đúng định dạng
        chi_tiet:
          phieuData.chi_tiet?.map((item) => ({
            id: item.id,
            hang_hoa_id: item.hang_hoa_id,
            // ✅ FIX: Thêm thông tin hàng hóa để hiển thị - THEO API RESPONSE
            hang_hoa: {
              id: item.hang_hoa_id,
              ten_hang_hoa: item.ten_hang_hoa, // ✅ API response có sẵn field này
              ma_hang_hoa: item.ma_hang_hoa, // ✅ API response có sẵn field này
              don_vi_tinh: item.don_vi_tinh, // ✅ API response có sẵn field này
              gia_nhap_gan_nhat: parseFloat(item.don_gia) || 0,
            },
            so_luong_ke_hoach: parseFloat(item.so_luong_ke_hoach) || 0,
            so_luong:
              parseFloat(
                isEditActualMode ? item.so_luong : item.so_luong_ke_hoach
              ) || 0, // ✅ FIX: Parse number
            don_gia: parseFloat(item.don_gia) || 0, // ✅ FIX: Parse number
            thanh_tien: parseFloat(item.thanh_tien) || 0, // ✅ FIX: Parse number
            pham_chat: item.pham_chat || "tot",
            han_su_dung: item.han_su_dung || null,
            vi_tri_kho: item.vi_tri_kho || "",
            ghi_chu: item.ghi_chu || "",
            so_seri_list: Array.isArray(item.so_seri_list)
              ? item.so_seri_list
              : [],
            la_tai_san_co_dinh: item.la_tai_san_co_dinh || false,
          })) || [],
      };

      console.log("🔄 Setting form data:", formData);

      // ✅ Reset form với data đầy đủ
      reset(formData);

      // ✅ Cập nhật field array
      replace(formData.chi_tiet);

      // ✅ Set trạng thái cho phòng ban nếu là điều chuyển
      if (phieuData.loai_phieu === "dieu_chuyen" && phongBanCungCapData) {
        setSelectedCap3(phongBanCungCapData.id);
      }

      setDataLoaded(true);
      setFormReady(true);
    } catch (error) {
      console.error("❌ Error loading phieu data:", error);
      toast.error("Không thể tải dữ liệu phiếu nhập");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load phòng ban cung cấp
  const loadPhongBanCungCap = async () => {
    try {
      const response = await nhapKhoService.getPhongBanCungCap();
      setPhongBanCungCap(response.data || []);
    } catch (error) {
      console.error("Error loading phong ban cung cap:", error);
      setPhongBanCungCap([]);
    }
  };

  // Load hàng hóa có thể nhập
  const loadHangHoaCoTheNhap = async () => {
    try {
      let params = {};

      if (loaiPhieu === "tu_mua" && nhaCungCapData?.id) {
        params.nha_cung_cap_id = nhaCungCapData.id;
      } else if (
        ["tren_cap", "dieu_chuyen"].includes(loaiPhieu) &&
        phongBanCungCapData?.id
      ) {
        params.phong_ban_id = phongBanCungCapData.id;
      }

      if (Object.keys(params).length > 0) {
        const response = await hangHoaService.getAvailable(params);
        setHangHoaCoTheNhap(response.data || []);
      }
    } catch (error) {
      console.error("Error loading available hang hoa:", error);
      setHangHoaCoTheNhap([]);
    }
  };

  // ✅ FIX: Handle nhà cung cấp select với auto-create
  const handleNhaCungCapSelect = async (supplier) => {
    console.log("🏢 Selected supplier:", supplier);

    // Nếu là tạo mới
    if (supplier?.isNewItem) {
      try {
        console.log("🆕 Creating new NCC:", supplier);
        const newNCC = await searchService.createNhaCungCapAuto({
          ten_ncc: supplier.ten_ncc,
          loai_nha_cung_cap: loaiPhieu, // ✅ GÁN ĐÚNG LOẠI THEO PHIẾU
          dia_chi: supplier.dia_chi || "",
          phone: supplier.phone || "",
          email: supplier.email || "",
          is_noi_bo: loaiPhieu !== "tu_mua", // tu_mua = false, tren_cap = true
        });

        if (newNCC.success) {
          setValue("nha_cung_cap", newNCC.data);
          toast.success(`Đã tạo nhà cung cấp mới: ${newNCC.data.ten_ncc}`);
        }
      } catch (error) {
        console.error("❌ Error creating NCC:", error);
        toast.error("Không thể tạo nhà cung cấp mới");
      }
    } else {
      setValue("nha_cung_cap", supplier);
    }

    // Clear phòng ban cung cấp (chỉ dành cho điều chuyển)
    setValue("phong_ban_cung_cap", null);

    // ✅ FIX: KHÔNG XÓA chi tiết khi thay đổi NCC trong chế độ edit
    // Chỉ xóa khi tạo mới hoặc khi cần thiết
    // if (canEdit) {
    //   replace([]);
    // }
  };

  // Handle phòng ban cung cấp select (CHỈ CHO ĐIỀU CHUYỂN)
  const handlePhongBanCungCapSelect = (phongBan) => {
    setValue("phong_ban_cung_cap", phongBan);
    // Clear nhà cung cấp khi chọn phòng ban (chỉ dành cho điều chuyển)
    setValue("nha_cung_cap", null);
    // ✅ FIX: KHÔNG XÓA chi tiết khi thay đổi phòng ban trong chế độ edit
    // if (canEdit) {
    //   replace([]);
    // }
  };

  // ✅ FIX: Handle hàng hóa select với auto-create
  const handleHangHoaSelect = async (hangHoa, index) => {
    if (!hangHoa) return;

    console.log("🎯 Selected hang hoa:", hangHoa, "for index:", index);

    // Nếu là tạo mới
    if (hangHoa?.isNewItem) {
      try {
        console.log("🆕 Creating new hang hoa:", hangHoa);
        const newHangHoa = await searchService.createHangHoaAuto({
          ten_hang_hoa: hangHoa.ten_hang_hoa,
          don_vi_tinh: hangHoa.don_vi_tinh || "Cái",
          co_so_seri: hangHoa.co_so_seri || false,
          la_tai_san_co_dinh: false,
        });

        if (newHangHoa.success) {
          setValue(`chi_tiet.${index}.hang_hoa_id`, newHangHoa.data.id);
          setValue(`chi_tiet.${index}.hang_hoa`, newHangHoa.data);
          toast.success(`Đã tạo hàng hóa mới: ${newHangHoa.data.ten_hang_hoa}`);
        }
      } catch (error) {
        console.error("❌ Error creating hang hoa:", error);
        toast.error("Không thể tạo hàng hóa mới");
      }
    } else {
      // Update hang_hoa_id và hang_hoa object
      setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id);
      setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);
    }

    // Set giá mặc định
    if (hangHoa.gia_nhap_gan_nhat && canEdit) {
      setValue(
        `chi_tiet.${index}.don_gia`,
        parseFloat(hangHoa.gia_nhap_gan_nhat)
      );
    }

    // Tính lại thành tiền
    const currentSoLuong = watch(`chi_tiet.${index}.so_luong`) || 1;
    const donGia = parseFloat(hangHoa.gia_nhap_gan_nhat || 0);
    const thanhTien = currentSoLuong * donGia;
    setValue(`chi_tiet.${index}.thanh_tien`, thanhTien);

    // Auto set TSCĐ nếu giá >= 10 triệu
    if (donGia >= 10000000) {
      setValue(`chi_tiet.${index}.la_tai_san_co_dinh`, true);
    }
  };

  // Handle quantity change - tính lại thành tiền
  const handleQuantityChange = (index, quantity) => {
    const donGia = watch(`chi_tiet.${index}.don_gia`) || 0;
    const newQuantity = parseFloat(quantity) || 0;
    const thanhTien = newQuantity * parseFloat(donGia);

    console.log("🔢 Quantity changed:", {
      index,
      quantity: newQuantity,
      donGia,
      thanhTien,
    });

    setValue(`chi_tiet.${index}.thanh_tien`, thanhTien);
  };

  // Handle price change - tính lại thành tiền
  const handlePriceChange = (index, price) => {
    const soLuong = watch(`chi_tiet.${index}.so_luong`) || 1;
    const newPrice = parseFloat(price) || 0;
    const thanhTien = parseFloat(soLuong) * newPrice;

    console.log("💰 Price changed:", {
      index,
      price: newPrice,
      soLuong,
      thanhTien,
    });

    setValue(`chi_tiet.${index}.thanh_tien`, thanhTien);

    // Auto set TSCĐ nếu giá >= 10 triệu
    if (newPrice >= 10000000) {
      setValue(`chi_tiet.${index}.la_tai_san_co_dinh`, true);
    } else {
      setValue(`chi_tiet.${index}.la_tai_san_co_dinh`, false);
    }
  };

  // Add new item
  const addNewItem = () => {
    append({
      hang_hoa_id: null,
      hang_hoa: null,
      so_luong_ke_hoach: 1,
      so_luong: 1,
      don_gia: 0,
      thanh_tien: 0,
      pham_chat: "tot",
      han_su_dung: null,
      vi_tri_kho: "",
      ghi_chu: "",
      so_seri_list: [],
      la_tai_san_co_dinh: false,
    });
  };

  // Handle form submit
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      console.log("📤 Submitting form data:", data);

      // Validate chi tiết
      if (!data.chi_tiet || data.chi_tiet.length === 0) {
        toast.error("Vui lòng thêm ít nhất một mặt hàng");
        return;
      }

      // Validate each chi tiết item
      for (let i = 0; i < data.chi_tiet.length; i++) {
        const item = data.chi_tiet[i];
        if (!item.hang_hoa_id) {
          toast.error(`Vui lòng chọn hàng hóa cho dòng ${i + 1}`);
          return;
        }
        if (!item.so_luong || parseFloat(item.so_luong) <= 0) {
          toast.error(`Vui lòng nhập số lượng hợp lệ cho dòng ${i + 1}`);
          return;
        }
        if (
          !canEditActual &&
          (!item.don_gia || parseFloat(item.don_gia) <= 0)
        ) {
          toast.error(`Vui lòng nhập đơn giá hợp lệ cho dòng ${i + 1}`);
          return;
        }
      }

      // Build update data
      const updateData = {
        ngay_nhap: data.ngay_nhap,
        loai_phieu: data.loai_phieu,
        so_quyet_dinh: data.so_quyet_dinh || "",
        nguoi_nhap_hang: data.nguoi_nhap_hang || "",
        nguoi_giao_hang: data.nguoi_giao_hang || "",
        so_hoa_don: data.so_hoa_don || "",
        dia_chi_nhap: data.dia_chi_nhap || "",
        ly_do_nhap: data.ly_do_nhap || "",
        ghi_chu: data.ghi_chu || "",
        phuong_thuc_van_chuyen:
          data.phuong_thuc_van_chuyen || "Đơn vị tự vận chuyển",

        // Source - ✅ ĐÚNG THEO DATABASE SCHEMA
        nha_cung_cap_id: data.nha_cung_cap?.id || null, // tu_mua, tren_cap dùng NCC
        phong_ban_cung_cap_id: data.phong_ban_cung_cap?.id || null, // chỉ dieu_chuyen dùng phòng ban

        // Chi tiết
        chi_tiet: data.chi_tiet.map((item) => ({
          id: item.id || null,
          hang_hoa_id: item.hang_hoa_id,
          so_luong_ke_hoach: isEditActualMode
            ? item.so_luong_ke_hoach
            : parseFloat(item.so_luong),
          so_luong: parseFloat(item.so_luong),
          don_gia: parseFloat(item.don_gia || 0),
          thanh_tien: parseFloat(item.thanh_tien || 0),
          pham_chat: item.pham_chat || "tot",
          han_su_dung: item.han_su_dung || null,
          vi_tri_kho: item.vi_tri_kho || "",
          ghi_chu: item.ghi_chu || "",
          so_seri_list: Array.isArray(item.so_seri_list)
            ? item.so_seri_list
            : [],
          la_tai_san_co_dinh: item.la_tai_san_co_dinh || false,
        })),
      };

      console.log("📤 Final update data:", updateData);

      // Call API
      await nhapKhoService.update(phieuId, updateData);

      toast.success(
        isEditActualMode
          ? "Cập nhật số lượng thực tế thành công!"
          : "Cập nhật phiếu nhập thành công!"
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("❌ Error updating phieu:", error);
      toast.error("Không thể cập nhật phiếu nhập");
    } finally {
      setLoading(false);
    }
  };

  // PhongBanCungCapField component
  const PhongBanCungCapField = () => (
    <select
      {...register("phong_ban_cung_cap_id")}
      disabled={isEditActualMode}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
    >
      <option value="">Chọn phòng ban cung cấp...</option>
      {phongBanCungCap.map((pb) => (
        <option key={pb.id} value={pb.id}>
          {pb.ten_phong_ban}
        </option>
      ))}
    </select>
  );

  // Status indicator component
  const StatusInfo = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center space-x-2">
        <Info className="h-5 w-5 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-blue-800">
            Trạng thái phiếu: <span className="font-bold">{phieuStatus}</span>
          </p>
          {isEditActualMode ? (
            <p className="text-xs text-blue-600 mt-1">
              Chế độ cập nhật số lượng thực tế - Chỉ có thể thay đổi số lượng
            </p>
          ) : canEdit ? (
            <p className="text-xs text-blue-600 mt-1">
              Phiếu có thể chỉnh sửa - Có thể thay đổi tất cả thông tin
            </p>
          ) : (
            <p className="text-xs text-blue-600 mt-1">
              Phiếu chỉ có thể xem - Không thể chỉnh sửa
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Linked document info
  const LinkedDocumentInfo = () => {
    if (!originalData?.phieu_xuat_lien_ket_id) return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Link2 className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Phiếu nhập này được tạo từ phiếu xuất liên kết
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              ID phiếu xuất: {originalData.phieu_xuat_lien_ket_id}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Chi tiết hàng hóa table
  const ChiTietTable = () => (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Chi tiết hàng hóa ({fields.length} mặt hàng)
        </h3>
        {canEdit && !isEditActualMode && (
          <button
            type="button"
            onClick={addNewItem}
            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <Plus size={16} />
            <span>Thêm hàng</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                STT
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hàng hóa *
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Số lượng *
              </th>
              {!isEditActualMode && (
                <>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn giá *
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phẩm chất
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh điểm
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TSCĐ
                  </th>
                </>
              )}
              <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thành tiền
              </th>
              {canEdit && (
                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {fields.map((item, index) => {
              const hangHoa = watch(`chi_tiet.${index}.hang_hoa`);
              const soLuong = watch(`chi_tiet.${index}.so_luong`) || 0;
              const donGia = watch(`chi_tiet.${index}.don_gia`) || 0;
              const thanhTien = soLuong * donGia;

              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                    {index + 1}
                  </td>

                  {/* Hàng hóa - ✅ FIX: CHO PHÉP SỬA THOẢI MÁI */}
                  <td className="border border-gray-300 px-3 py-2">
                    {canEdit ? (
                      <AutoComplete
                        key={`product-${index}-${
                          formReady ? hangHoa?.id || "loaded" : "loading"
                        }`}
                        searchFunction={async (query) => {
                          // ✅ FIX: SỬ DỤNG searchHangHoa với khả năng tạo mới
                          console.log(
                            "🔍 Searching hang hoa with query:",
                            query
                          );
                          try {
                            const results = await searchService.searchHangHoa(
                              query
                            );
                            console.log("🔍 Hang hoa search results:", results);
                            return results;
                          } catch (error) {
                            console.error("❌ Hang hoa search error:", error);
                            return [];
                          }
                        }}
                        onSelect={(hangHoa) =>
                          handleHangHoaSelect(hangHoa, index)
                        }
                        placeholder="Nhập tên hàng hóa..."
                        displayField="ten_hang_hoa"
                        createLabel="Sẽ tạo hàng hóa mới"
                        className="w-full"
                        initialValue={hangHoa}
                        allowCreate={true} // ✅ LUÔN CHO PHÉP TẠO MỚI
                        disabled={false}
                      />
                    ) : (
                      <div className="text-sm">
                        <div className="font-medium">
                          {hangHoa?.ten_hang_hoa || "Không xác định"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {hangHoa?.ma_hang_hoa}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Số lượng */}
                  <td className="border border-gray-300 px-3 py-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      {...register(`chi_tiet.${index}.so_luong`, {
                        required: "Số lượng là bắt buộc",
                        min: {
                          value: 1,
                          message: "Số lượng phải lớn hơn 0",
                        },
                        valueAsNumber: true, // ✅ FIX: Parse thành number
                      })}
                      onChange={(e) => {
                        const newQuantity = parseFloat(e.target.value) || 0;
                        setValue(`chi_tiet.${index}.so_luong`, newQuantity);
                        handleQuantityChange(index, newQuantity);
                      }}
                      disabled={!canEdit && !canEditActual}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
                      placeholder="0.00"
                    />
                  </td>

                  {!isEditActualMode && (
                    <>
                      {/* Đơn giá */}
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          {...register(`chi_tiet.${index}.don_gia`, {
                            required: "Đơn giá là bắt buộc",
                            min: { value: 0, message: "Đơn giá không được âm" },
                            valueAsNumber: true, // ✅ FIX: Parse thành number
                          })}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            setValue(`chi_tiet.${index}.don_gia`, newPrice);
                            handlePriceChange(index, newPrice);
                          }}
                          disabled={!canEdit}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
                          placeholder="0"
                        />
                      </td>

                      {/* Phẩm chất */}
                      <td className="border border-gray-300 px-3 py-2">
                        <select
                          {...register(`chi_tiet.${index}.pham_chat`)}
                          disabled={!canEdit}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
                        >
                          {Object.entries(PHAM_CHAT).map(([value, config]) => (
                            <option key={value} value={value}>
                              {config.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Danh điểm */}
                      <td className="border border-gray-300 px-3 py-2">
                        <input
                          type="text"
                          {...register(`chi_tiet.${index}.so_seri_list`)}
                          disabled={!canEdit}
                          placeholder="Số seri"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 disabled:bg-gray-100"
                        />
                      </td>

                      {/* TSCĐ */}
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          {...register(`chi_tiet.${index}.la_tai_san_co_dinh`)}
                          disabled={!canEdit}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
                        />
                      </td>
                    </>
                  )}

                  {/* Thành tiền */}
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    <span className="font-medium text-green-600">
                      {formatCurrency(thanhTien)}
                    </span>
                  </td>

                  {/* Thao tác */}
                  {canEdit && (
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          fields.length <= 1
                            ? "Không thể xóa dòng cuối cùng"
                            : "Xóa dòng"
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {/* Tổng cộng */}
            {fields.length > 0 && (
              <tr className="bg-green-50 font-bold">
                <td
                  colSpan={
                    canEdit && !isEditActualMode
                      ? isEditActualMode
                        ? 7
                        : 8
                      : isEditActualMode
                      ? 6
                      : 7
                  }
                  className="border border-gray-300 px-3 py-3 text-right text-gray-900"
                >
                  TỔNG CỘNG:
                </td>
                <td className="border border-gray-300 px-3 py-3 text-right text-green-600 text-lg">
                  {formatCurrency(tongTien)}
                </td>
                {canEdit && !isEditActualMode && (
                  <td className="border border-gray-300"></td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Loading state
  if (isLoadingData || !dataLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-2" />
          <p className="text-gray-600">Đang tải thông tin phiếu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Status và linked info */}
      <StatusInfo />
      <LinkedDocumentInfo />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isEditActualMode
              ? "Cập nhật số lượng thực tế"
              : "Thông tin phiếu nhập"}
          </h3>

          {/* Dòng 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Ngày nhập */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Ngày nhập *
              </label>
              <input
                type="date"
                {...register("ngay_nhap", {
                  required: "Ngày nhập là bắt buộc",
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

            {/* Loại phiếu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                Loại phiếu *
              </label>
              <select
                {...register("loai_phieu", {
                  required: "Loại phiếu là bắt buộc",
                })}
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
              >
                {Object.entries(LOAI_PHIEU_NHAP).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.loai_phieu && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.loai_phieu.message}
                </p>
              )}
            </div>

            {/* Số quyết định */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
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

            {/* Người nhận hàng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline h-4 w-4 mr-1" />
                Người nhận hàng
              </label>
              <input
                type="text"
                {...register("nguoi_nhap_hang")}
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
                placeholder="Tên người nhận hàng"
              />
            </div>
          </div>

          {/* Dòng 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {/* Nguồn cung cấp */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhà cung cấp
              </label>

              {/* ✅ FIX: CHỈ ĐIỀU CHUYỂN MỚI DÙNG PHÒNG BAN, CÒN LẠI ĐỀU DÙNG NCC */}
              {loaiPhieu === "dieu_chuyen" ? (
                <PhongBanCungCapField />
              ) : (
                <AutoComplete
                  key={`supplier-${
                    formReady ? nhaCungCapData?.id || "loaded" : "loading"
                  }`}
                  searchFunction={async (query) => {
                    // ✅ FIX: SỬ DỤNG searchNhaCungCapByType THEO LOẠI PHIẾU
                    console.log(
                      "🔍 Searching NCC with query:",
                      query,
                      "loai_phieu:",
                      loaiPhieu
                    );
                    try {
                      const results =
                        await searchService.searchNhaCungCapByType(
                          query,
                          loaiPhieu
                        );
                      console.log("🔍 NCC Search results:", results);
                      return results;
                    } catch (error) {
                      console.error("❌ NCC Search error:", error);
                      return [];
                    }
                  }}
                  onSelect={handleNhaCungCapSelect}
                  placeholder="Nhập tên nhà cung cấp..."
                  displayField="ten_ncc"
                  createLabel="Sẽ tạo nhà cung cấp mới"
                  className="w-full"
                  initialValue={nhaCungCapData}
                  allowCreate={canEdit} // ✅ revision_required ĐƯỢC TẠO MỚI
                  disabled={isEditActualMode}
                />
              )}
            </div>

            {/* Người giao hàng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline h-4 w-4 mr-1" />
                Người giao hàng
              </label>
              <input
                type="text"
                {...register("nguoi_giao_hang")}
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
                placeholder="Tên người giao hàng"
              />
            </div>

            {/* Số hóa đơn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                Số hóa đơn
              </label>
              <input
                type="text"
                {...register("so_hoa_don")}
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
                placeholder="Số hóa đơn"
              />
            </div>
          </div>

          {/* Dòng 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Địa chí nhập */}
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

            {/* Lý do nhập */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do nhập
              </label>
              <input
                type="text"
                {...register("ly_do_nhap")}
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
                placeholder="Lý do nhập hàng"
              />
            </div>

            {/* Phương thức vận chuyển */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phương thức vận chuyển
              </label>
              <input
                type="text"
                {...register("phuong_thuc_van_chuyen")}
                disabled={isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
                placeholder="Phương thức vận chuyển"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              {...register("ghi_chu")}
              rows={3}
              disabled={isEditActualMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm disabled:bg-gray-100"
              placeholder="Ghi chú thêm về phiếu nhập..."
            />
          </div>
        </div>

        {/* Chi tiết hàng hóa */}
        <ChiTietTable />

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {onCancel ? "Hủy" : "Đóng"}
          </button>

          {(canEdit || canEditActual) && (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>
                {loading
                  ? "Đang xử lý..."
                  : isEditActualMode
                  ? "Cập nhật số lượng thực tế"
                  : "Cập nhật phiếu"}
              </span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditNhapKhoForm;
