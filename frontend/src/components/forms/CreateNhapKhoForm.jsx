// import React, { useState, useEffect } from "react";
// import { useForm, useFieldArray } from "react-hook-form";
// import {
//   Plus,
//   Trash2,
//   Search,
//   Building,
//   Package,
//   AlertCircle,
// } from "lucide-react";
// import { searchService } from "../../services/searchService";
// import { nhapKhoService } from "../../services/nhapKhoService";
// import { formatCurrency } from "../../utils/helpers";
// import { LOAI_PHIEU_NHAP, PHAM_CHAT } from "../../utils/constants";
// import AutoComplete from "../common/AutoComplete";
// import toast from "react-hot-toast";
// import { useAuth } from "../../context/AuthContext";

// const CreateNhapKhoForm = ({ onSuccess, onCancel }) => {
//   const { user } = useAuth(); // ✅ SỬ DỤNG AUTHCONTEXT
//   const [loading, setLoading] = useState(false);

//   // ✅ STATE CHO DROPDOWN 2 CẤP
//   const [selectedCap2, setSelectedCap2] = useState(null);
//   const [selectedCap3, setSelectedCap3] = useState(null);
//   const [phongBanCap2List, setPhongBanCap2List] = useState([]);
//   const [phongBanCap3List, setPhongBanCap3List] = useState([]);

//   const {
//     register,
//     control,
//     handleSubmit,
//     watch,
//     setValue,
//     formState: { errors },
//   } = useForm({
//     defaultValues: {
//       ngay_nhap: new Date().toISOString().split("T")[0],
//       loai_phieu: "tu_mua",
//       nguoi_nhap_hang: user?.ho_ten || "",
//       so_quyet_dinh: "",
//       so_hoa_don: "",
//       dia_chi_nhap: "",
//       ly_do_nhap: "",
//       ghi_chu: "",
//       nha_cung_cap_id: null,
//       nha_cung_cap: null,
//       phong_ban_cap2_id: null,
//       phong_ban_cung_cap_id: null,
//       chi_tiet: [
//         {
//           hang_hoa_id: null,
//           hang_hoa: null,
//           so_luong: 1,
//           don_gia: 0,
//           pham_chat: "tot",
//           so_seri_list: "",
//           la_tai_san_co_dinh: false,
//         },
//       ],
//     },
//   });

//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: "chi_tiet",
//   });

//   const chiTietItems = watch("chi_tiet");
//   const nhaCungCapData = watch("nha_cung_cap");
//   const loaiPhieu = watch("loai_phieu");

//   // Calculate total amount
//   const tongTien = chiTietItems.reduce((sum, item) => {
//     return sum + parseFloat(item.so_luong || 0) * parseFloat(item.don_gia || 0);
//   }, 0);

//   // ✅ LOAD DANH SÁCH PHÒNG BAN CẤP 2 KHI CHỌN ĐIỀU CHUYỂN
//   // ✅ THAY THẾ useEffect load phòng ban cấp 2
//   useEffect(() => {
//     const loadPhongBanCap2 = async () => {
//       if (loaiPhieu !== "dieu_chuyen") return;

//       try {
//         console.log("🔍 Loading phong ban cap 2 for user:", user);

//         // ✅ SỬ DỤNG API CHUYÊN BIỆT ĐÃ TẠO
//         const response = await nhapKhoService.getPhongBanCap2List();
//         console.log("🔍 Phong ban cap 2 response:", response);

//         if (response.success) {
//           setPhongBanCap2List(response.data);
//           console.log("🔍 Cap 2 departments loaded:", response.data.length);
//         }
//       } catch (error) {
//         console.error("❌ Error loading phong ban cap 2:", error);
//         toast.error("Không thể tải danh sách phòng ban cấp 2");
//       }
//     };

//     loadPhongBanCap2();
//   }, [loaiPhieu, user]);

//   // ✅ THAY THẾ useEffect load phòng ban cấp 3
//   useEffect(() => {
//     const loadPhongBanCap3 = async () => {
//       if (!selectedCap2 || loaiPhieu !== "dieu_chuyen") {
//         setPhongBanCap3List([]);
//         return;
//       }

//       try {
//         console.log("🔍 Loading cap 3 for cap 2:", selectedCap2);

//         // ✅ SỬ DỤNG API CHUYÊN BIỆT ĐÃ TẠO
//         const response = await nhapKhoService.getPhongBanCap3ByParent(
//           selectedCap2
//         );
//         console.log("🔍 Phong ban cap 3 response:", response);

//         if (response.success) {
//           setPhongBanCap3List(response.data);
//           console.log(
//             "🔍 Cap 3 departments for cap 2 " + selectedCap2 + ":",
//             response.data.length
//           );
//         }
//       } catch (error) {
//         console.error("❌ Error loading phong ban cap 3:", error);
//         toast.error("Không thể tải danh sách kho cấp 3");
//         setPhongBanCap3List([]);
//       }
//     };

//     loadPhongBanCap3();
//   }, [selectedCap2, loaiPhieu, user]);

//   useEffect(() => {
//     // Watch changes in hang_hoa selections và reset đơn giá nếu cần
//     fields.forEach((field, index) => {
//       const currentHangHoa = watch(`chi_tiet.${index}.hang_hoa`);
//       const currentDonGia = watch(`chi_tiet.${index}.don_gia`);

//       // Nếu không có hàng hóa được chọn mà vẫn có đơn giá, reset về 0
//       if (!currentHangHoa && currentDonGia && currentDonGia > 0) {
//         setValue(`chi_tiet.${index}.don_gia`, 0);
//         console.log(
//           `🧹 Reset don_gia to 0 for row ${index} (no hang_hoa selected)`
//         );
//       }
//     });
//   }, [watch("chi_tiet"), setValue, fields]);

//   // ✅ RESET KHI THAY ĐỔI LOẠI PHIẾU
//   useEffect(() => {
//     setSelectedCap2(null);
//     setSelectedCap3(null);
//     setPhongBanCap2List([]);
//     setPhongBanCap3List([]);
//     setValue("phong_ban_cap2_id", null);
//     setValue("phong_ban_cung_cap_id", null);
//     setValue("nha_cung_cap_id", null);
//     setValue("nha_cung_cap", null);
//   }, [loaiPhieu, setValue]);

//   // ✅ TỰ ĐỘNG SET TÀI SẢN CỐ ĐỊNH KHI ĐƠN GIÁ >= 10 TRIỆU
//   useEffect(() => {
//     fields.forEach((field, index) => {
//       const currentDonGia = watch(`chi_tiet.${index}.don_gia`);
//       const currentTSCD = watch(`chi_tiet.${index}.la_tai_san_co_dinh`);

//       if (parseFloat(currentDonGia) >= 10000000 && !currentTSCD) {
//         setValue(`chi_tiet.${index}.la_tai_san_co_dinh`, true);
//       } else if (parseFloat(currentDonGia) < 10000000 && currentTSCD) {
//         setValue(`chi_tiet.${index}.la_tai_san_co_dinh`, false);
//       }
//     });
//   }, [watch("chi_tiet"), setValue, fields]);

//   useEffect(() => {
//     // Watch tất cả các hàng hóa được chọn
//     const subscription = watch((value, { name }) => {
//       // Chỉ xử lý khi có thay đổi trong chi_tiet
//       if (name && name.startsWith("chi_tiet.") && name.includes(".hang_hoa")) {
//         // Extract index từ field name: chi_tiet.0.hang_hoa -> 0
//         const matches = name.match(/chi_tiet\.(\d+)\.hang_hoa/);
//         if (matches) {
//           const index = parseInt(matches[1]);
//           const currentHangHoa = value.chi_tiet[index]?.hang_hoa;
//           const currentDonGia = value.chi_tiet[index]?.don_gia;

//           console.log(`🔍 Hang hoa changed at index ${index}:`, currentHangHoa);

//           // Nếu không có hàng hóa (đã xóa) và vẫn còn đơn giá
//           if (!currentHangHoa && currentDonGia && currentDonGia > 0) {
//             console.log(`🧹 Resetting don_gia to 0 for index ${index}`);
//             setValue(`chi_tiet.${index}.don_gia`, 0);
//           }

//           // Nếu có hàng hóa mới và có giá nhập gần nhất
//           if (currentHangHoa && currentHangHoa.gia_nhap_gan_nhat > 0) {
//             console.log(
//               `💰 Setting don_gia to ${currentHangHoa.gia_nhap_gan_nhat} for index ${index}`
//             );
//             setValue(
//               `chi_tiet.${index}.don_gia`,
//               currentHangHoa.gia_nhap_gan_nhat
//             );
//           }
//         }
//       }
//     });

//     // Cleanup subscription
//     return () => subscription.unsubscribe();
//   }, [watch, setValue]);

//   // ✅ ALTERNATIVE: Nếu useEffect trên không work, dùng cách này
//   // Thêm useEffect đơn giản hơn
//   useEffect(() => {
//     fields.forEach((field, index) => {
//       const currentHangHoa = watch(`chi_tiet.${index}.hang_hoa`);
//       const currentDonGia = watch(`chi_tiet.${index}.don_gia`);

//       // Nếu không có hàng hóa nhưng có đơn giá > 0, reset về 0
//       if (!currentHangHoa && currentDonGia > 0) {
//         setValue(`chi_tiet.${index}.don_gia`, 0);
//         console.log(`🧹 Auto-reset don_gia to 0 for row ${index}`);
//       }
//     });
//   }, [chiTietItems, setValue, fields]);

//   // ✅ HELPER FUNCTIONS
//   const createHangHoaIfNeeded = async (hangHoaData) => {
//     if (!hangHoaData.isNewItem) {
//       return hangHoaData;
//     }

//     try {
//       console.log("🔍 Creating new hang hoa:", hangHoaData);
//       const response = await searchService.createHangHoaAuto({
//         ten_hang_hoa: hangHoaData.ten_hang_hoa,
//         don_vi_tinh: hangHoaData.don_vi_tinh || "Cái",
//         mo_ta: hangHoaData.mo_ta || "",
//       });

//       if (response.success) {
//         console.log("✅ Created hang hoa:", response.data);
//         return response.data;
//       } else {
//         throw new Error(response.message || "Không thể tạo hàng hóa");
//       }
//     } catch (error) {
//       console.error("❌ Error creating hang hoa:", error);
//       throw error;
//     }
//   };

//   const createNhaCungCapIfNeeded = async (nhaCungCapData) => {
//     if (!nhaCungCapData.isNewItem) {
//       return nhaCungCapData;
//     }

//     try {
//       console.log("🔍 Creating new nha cung cap:", nhaCungCapData);
//       const response = await searchService.createNhaCungCapAuto({
//         ten_ncc: nhaCungCapData.ten_ncc,
//         dia_chi: nhaCungCapData.dia_chi || "",
//         phone: nhaCungCapData.phone || "",
//         email: nhaCungCapData.email || "",
//       });

//       if (response.success) {
//         console.log("✅ Created nha cung cap:", response.data);
//         return response.data;
//       } else {
//         throw new Error(response.message || "Không thể tạo nhà cung cấp");
//       }
//     } catch (error) {
//       console.error("❌ Error creating nha cung cap:", error);
//       throw error;
//     }
//   };

//   // ✅ MAIN SUBMIT FUNCTION
//   // const onSubmit = async (data) => {
//   //   if (data.chi_tiet.length === 0) {
//   //     toast.error("Vui lòng thêm ít nhất một hàng hóa");
//   //     return;
//   //   }

//   //   // Validate details
//   //   for (let i = 0; i < data.chi_tiet.length; i++) {
//   //     const item = data.chi_tiet[i];
//   //     if (!item.hang_hoa) {
//   //       toast.error(`Dòng ${i + 1}: Vui lòng chọn hàng hóa`);
//   //       return;
//   //     }
//   //     if (!item.so_luong || item.so_luong <= 0) {
//   //       toast.error(`Dòng ${i + 1}: Số lượng phải lớn hơn 0`);
//   //       return;
//   //     }
//   //     if (item.don_gia === undefined || item.don_gia < 0) {
//   //       toast.error(`Dòng ${i + 1}: Đơn giá không hợp lệ`);
//   //       return;
//   //     }
//   //   }

//   //   // ✅ VALIDATE THEO LOẠI PHIẾU
//   //   if (
//   //     (data.loai_phieu === "tu_mua" || data.loai_phieu === "tren_cap") &&
//   //     !data.nha_cung_cap
//   //   ) {
//   //     toast.error("Vui lòng chọn nhà cung cấp");
//   //     return;
//   //   }

//   //   if (data.loai_phieu === "dieu_chuyen" && !data.phong_ban_cung_cap_id) {
//   //     toast.error("Vui lòng chọn kho cung cấp hàng");
//   //     return;
//   //   }

//   //   setLoading(true);

//   //   try {
//   //     toast.loading("Đang xử lý phiếu nhập...", { id: "processing" });

//   //     // Step 1: Create supplier if needed
//   //     let finalNhaCungCap = null;

//   //     if (data.nha_cung_cap && data.nha_cung_cap.ten_ncc) {
//   //       finalNhaCungCap = await createNhaCungCapIfNeeded(data.nha_cung_cap);
//   //       if (finalNhaCungCap && data.nha_cung_cap.isNewItem) {
//   //         toast.success(`✔ Đã tạo nhà cung cấp: ${finalNhaCungCap.ten_ncc}`);
//   //       }
//   //     }

//   //     console.log("🔍 NHA CUNG CAP DEBUG:");
//   //     console.log("- Original data.nha_cung_cap:", data.nha_cung_cap);
//   //     console.log("- Final NCC after processing:", finalNhaCungCap);

//   //     // Step 2: Create products if needed and collect final data
//   //     const finalChiTiet = [];
//   //     for (const item of data.chi_tiet) {
//   //       if (item.hang_hoa) {
//   //         const finalHangHoa = await createHangHoaIfNeeded(item.hang_hoa);
//   //         if (finalHangHoa && item.hang_hoa.isNewItem) {
//   //           toast.success(`✔ Đã tạo hàng hóa: ${finalHangHoa.ten_hang_hoa}`);
//   //         }

//   //         finalChiTiet.push({
//   //           hang_hoa_id: finalHangHoa.id,
//   //           so_luong_ke_hoach: parseFloat(item.so_luong), // ✅ User input là kế hoạch
//   //           so_luong: parseFloat(item.so_luong), // ✅ Ban đầu = kế hoạch
//   //           don_gia: parseFloat(item.don_gia) || 0,
//   //           pham_chat: item.pham_chat || "tot",
//   //           so_seri_list: item.so_seri_list || "",
//   //           la_tai_san_co_dinh: item.la_tai_san_co_dinh || false,
//   //         });
//   //       }
//   //     }

//   //     // Step 3: Create phieu nhap
//   //     const phieuData = {
//   //       ngay_nhap: data.ngay_nhap,
//   //       loai_phieu: data.loai_phieu,
//   //       nguoi_nhap_hang: data.nguoi_nhap_hang || "",
//   //       so_quyet_dinh: data.so_quyet_dinh || "",
//   //       so_hoa_don: data.so_hoa_don || "",
//   //       dia_chi_nhap: data.dia_chi_nhap || "",
//   //       ly_do_nhap: data.ly_do_nhap || "",
//   //       ghi_chu: data.ghi_chu || "",
//   //       // ✅ FIX: Đảm bảo truyền đúng ID
//   //       nha_cung_cap_id: finalNhaCungCap?.id || null,
//   //       phong_ban_cung_cap_id: data.phong_ban_cung_cap_id || null,
//   //       chi_tiet: finalChiTiet,
//   //     };

//   //     console.log("🔍 Final phieu data being sent:", phieuData);

//   //     const response = await nhapKhoService.create(phieuData);
//   //     toast.dismiss("processing");
//   //     toast.success(
//   //       `✅ Tạo phiếu nhập thành công! Mã phiếu: ${
//   //         response.data?.so_phieu || ""
//   //       }`
//   //     );
//   //     onSuccess?.();
//   //   } catch (error) {
//   //     console.error("❌ Error creating phieu:", error);
//   //     toast.dismiss("processing");

//   //     const errorMessage =
//   //       error.response?.data?.message || error.message || "Có lỗi xảy ra";
//   //     toast.error(`Lỗi tạo phiếu: ${errorMessage}`);

//   //     console.error("Full error details:", {
//   //       error: error,
//   //       response: error.response?.data,
//   //       request: error.request,
//   //     });
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

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
//       toast.loading("Đang xử lý phiếu nhập...", { id: "processing" });

//       // Step 1: Create supplier if needed
//       let finalNhaCungCap = null;

//       if (data.nha_cung_cap && data.nha_cung_cap.ten_ncc) {
//         finalNhaCungCap = await createNhaCungCapIfNeeded(data.nha_cung_cap);
//         if (finalNhaCungCap && data.nha_cung_cap.isNewItem) {
//           toast.success(`✓ Đã tạo nhà cung cấp: ${finalNhaCungCap.ten_ncc}`);
//         }
//       }

//       console.log("🔍 NHA CUNG CAP DEBUG:");
//       console.log("- Original data.nha_cung_cap:", data.nha_cung_cap);
//       console.log("- Final NCC after processing:", finalNhaCungCap);

//       // Step 2: Create goods if needed
//       const processedChiTiet = [];
//       for (const item of data.chi_tiet) {
//         if (item.hang_hoa) {
//           const finalHangHoa = await createHangHoaIfNeeded(item.hang_hoa);
//           processedChiTiet.push({
//             hang_hoa_id: finalHangHoa.id,
//             so_luong_ke_hoach: parseFloat(item.so_luong),
//             so_luong: parseFloat(item.so_luong),
//             don_gia: parseFloat(item.don_gia),
//             thanh_tien: parseFloat(item.so_luong) * parseFloat(item.don_gia),
//             pham_chat: item.pham_chat || "tot",
//             so_seri_list: item.so_seri_list || "",
//             la_tai_san_co_dinh: item.la_tai_san_co_dinh || false,
//           });
//         }
//       }

//       // ✅ FIXED: Validation logic TRƯỚC KHI GỬI LÊN SERVER
//       // Xác định nha_cung_cap_id cuối cùng
//       let finalNhaCungCapId = null;

//       if (data.loai_phieu === "tu_mua" || data.loai_phieu === "tren_cap") {
//         if (finalNhaCungCap?.id) {
//           finalNhaCungCapId = finalNhaCungCap.id;
//         } else if (data.nha_cung_cap?.id && !data.nha_cung_cap?.isNewItem) {
//           finalNhaCungCapId = data.nha_cung_cap.id;
//         } else {
//           // ❌ Trường hợp không có NCC hợp lệ
//           toast.error("Lỗi xử lý nhà cung cấp. Vui lòng thử lại.");
//           return;
//         }
//       }

//       // ✅ FIXED: Validation logic CUỐI CÙNG
//       if (
//         (data.loai_phieu === "tu_mua" || data.loai_phieu === "tren_cap") &&
//         !finalNhaCungCapId
//       ) {
//         toast.error("Vui lòng chọn nhà cung cấp");
//         return;
//       }

//       if (data.loai_phieu === "dieu_chuyen" && !data.phong_ban_cung_cap_id) {
//         toast.error("Vui lòng chọn kho cung cấp hàng");
//         return;
//       }

//       // Step 3: Build final phieu data
//       const phieuData = {
//         ngay_nhap: data.ngay_nhap,
//         loai_phieu: data.loai_phieu,
//         ly_do_nhap: data.ly_do_nhap || "",
//         so_quyet_dinh: data.so_quyet_dinh || "",
//         so_hoa_don: data.so_hoa_don || "",
//         dia_chi_nhap: data.dia_chi_nhap || "",
//         nguoi_nhap_hang: data.nguoi_nhap_hang || "",
//         ghi_chu: data.ghi_chu || "",

//         // ✅ FIXED: Sử dụng finalNhaCungCapId đã được xử lý
//         nha_cung_cap_id: finalNhaCungCapId,

//         // Cho loại phiếu điều chuyển
//         phong_ban_cung_cap_id:
//           data.loai_phieu === "dieu_chuyen" ? data.phong_ban_cung_cap_id : null,

//         // Chi tiết hàng hóa
//         chi_tiet: processedChiTiet,
//       };

//       console.log("📦 FINAL PHIEU DATA SENDING TO SERVER:", phieuData);
//       console.log("🔍 FINAL NHA CUNG CAP ID:", finalNhaCungCapId);

//       // Step 4: Create phieu
//       const response = await nhapKhoService.create(phieuData);

//       toast.dismiss("processing");
//       toast.success(
//         `✅ Tạo phiếu nhập thành công!\nMã phiếu: ${
//           response.data?.so_phieu || ""
//         }`
//       );
//       onSuccess?.();
//     } catch (error) {
//       console.error("❌ Error creating phieu:", error);
//       toast.dismiss("processing");

//       const errorMessage =
//         error.response?.data?.message || error.message || "Có lỗi xảy ra";
//       toast.error(`Lỗi tạo phiếu: ${errorMessage}`);

//       console.error("Full error details:", {
//         error: error,
//         response: error.response?.data,
//         request: error.request,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const addHangHoaRow = () => {
//     append({
//       hang_hoa_id: null,
//       hang_hoa: null,
//       so_luong: 1,
//       don_gia: 0,
//       pham_chat: "tot",
//       so_seri_list: "",
//       la_tai_san_co_dinh: false,
//     });
//   };

//   const removeHangHoaRow = (index) => {
//     if (fields.length > 1) {
//       remove(index);
//     } else {
//       toast.error("Phải có ít nhất một hàng hóa");
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//         <div className="border-b border-gray-200 px-6 py-4">
//           <h2 className="text-xl font-semibold text-gray-900 flex items-center">
//             <Package className="mr-2 h-5 w-5 text-green-600" />
//             Tạo phiếu nhập kho mới
//           </h2>
//           <p className="text-sm text-gray-600 mt-1">
//             Điền thông tin để tạo phiếu nhập kho mới
//           </p>
//         </div>

//         <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
//           {/* Thông tin cơ bản */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Ngày nhập *
//               </label>
//               <input
//                 type="date"
//                 {...register("ngay_nhap", {
//                   required: "Vui lòng chọn ngày nhập",
//                 })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//               />
//               {errors.ngay_nhap && (
//                 <p className="mt-1 text-sm text-red-600">
//                   {errors.ngay_nhap.message}
//                 </p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Loại phiếu *
//               </label>
//               <select
//                 {...register("loai_phieu")}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//               >
//                 {Object.entries(LOAI_PHIEU_NHAP).map(([key, label]) => (
//                   <option key={key} value={key}>
//                     {label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Người nhập hàng
//               </label>
//               <input
//                 type="text"
//                 {...register("nguoi_nhap_hang")}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                 placeholder="Tên người nhập hàng"
//               />
//             </div>
//           </div>

//           {/* Nhà cung cấp - CHỈ CHO TỰ MUA VÀ TRÊN CẤP */}
//           {(loaiPhieu === "tu_mua" || loaiPhieu === "tren_cap") && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Nhà cung cấp *
//               </label>
//               <AutoComplete
//                 searchFunction={async (query) => {
//                   console.log(
//                     "🔍 Searching NCC with query:",
//                     query,
//                     "loai_phieu:",
//                     loaiPhieu
//                   );

//                   try {
//                     const results = await searchService.searchNhaCungCapByType(
//                       query,
//                       loaiPhieu
//                     );
//                     console.log("🔍 NCC Search results:", results);
//                     return results;
//                   } catch (error) {
//                     console.error("❌ NCC Search error:", error);
//                     return [];
//                   }
//                 }}
//                 onSelect={(selectedNcc) => {
//                   console.log("🔍 Selected NCC:", selectedNcc);
//                   setValue("nha_cung_cap", selectedNcc);
//                   setValue("nha_cung_cap_id", selectedNcc?.id || null);
//                 }}
//                 placeholder="Tìm kiếm nhà cung cấp..."
//                 displayField="ten_ncc"
//                 initialValue={nhaCungCapData}
//                 renderItem={(ncc) => (
//                   <div>
//                     <div className="font-medium text-gray-900">
//                       {ncc.ten_ncc}
//                     </div>
//                     {ncc.ma_ncc && (
//                       <div className="text-sm text-gray-500">
//                         Mã: {ncc.ma_ncc}
//                       </div>
//                     )}
//                     {ncc.dia_chi && (
//                       <div className="text-xs text-gray-400 truncate">
//                         {ncc.dia_chi}
//                       </div>
//                     )}
//                     {ncc.isNewItem && (
//                       <div className="text-xs text-blue-600 mt-1">
//                         💡 Tạo mới
//                       </div>
//                     )}
//                   </div>
//                 )}
//                 required={true}
//               />
//             </div>
//           )}

//           {/* DROPDOWN 2 CẤP CHO ĐIỀU CHUYỂN */}
//           {loaiPhieu === "dieu_chuyen" && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Phòng ban cấp 2 *
//                 </label>
//                 <select
//                   value={selectedCap2 || ""}
//                   onChange={(e) => {
//                     const cap2Id = e.target.value;
//                     setSelectedCap2(cap2Id);
//                     setSelectedCap3(null);
//                     setValue("phong_ban_cap2_id", cap2Id || null);
//                     setValue("phong_ban_cung_cap_id", null);
//                   }}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   required
//                 >
//                   <option value="">-- Chọn phòng ban cấp 2 --</option>
//                   {phongBanCap2List.map((pb) => (
//                     <option key={pb.id} value={pb.id}>
//                       {pb.ten_phong_ban}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Kho cấp 3 cung cấp hàng *
//                 </label>
//                 <select
//                   value={selectedCap3 || ""}
//                   onChange={(e) => {
//                     const cap3Id = e.target.value;
//                     setSelectedCap3(cap3Id);
//                     setValue("phong_ban_cung_cap_id", cap3Id || null);
//                   }}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   required
//                   disabled={!selectedCap2}
//                 >
//                   <option value="">-- Chọn kho cấp 3 --</option>
//                   {phongBanCap3List.map((pb) => (
//                     <option key={pb.id} value={pb.id}>
//                       {pb.ten_phong_ban}
//                     </option>
//                   ))}
//                 </select>
//                 {!selectedCap2 && (
//                   <p className="mt-1 text-xs text-gray-500">
//                     Vui lòng chọn phòng ban cấp 2 trước
//                   </p>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Thông tin bổ sung */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Số quyết định
//               </label>
//               <input
//                 type="text"
//                 {...register("so_quyet_dinh")}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                 placeholder="Số quyết định"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Số hóa đơn
//               </label>
//               <input
//                 type="text"
//                 {...register("so_hoa_don")}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                 placeholder="Số hóa đơn"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Địa chỉ nhập
//               </label>
//               <input
//                 type="text"
//                 {...register("dia_chi_nhap")}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                 placeholder="Địa chỉ nhập hàng"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Lý do nhập
//               </label>
//               <input
//                 type="text"
//                 {...register("ly_do_nhap")}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                 placeholder="Lý do nhập hàng"
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Ghi chú
//             </label>
//             <textarea
//               {...register("ghi_chu")}
//               rows={3}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//               placeholder="Ghi chú thêm..."
//             />
//           </div>

//           {/* Chi tiết hàng hóa */}
//           <div>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-lg font-medium text-gray-900">
//                 Chi tiết hàng hóa
//               </h3>
//               <button
//                 type="button"
//                 onClick={addHangHoaRow}
//                 className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
//               >
//                 <Plus size={16} className="mr-1" />
//                 Thêm hàng hóa
//               </button>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8">
//                       STT
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Hàng hóa *
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
//                       SL *
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
//                       Đơn giá *
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
//                       Phẩm chất
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                       Danh điểm
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">
//                       TSCĐ
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
//                       Thành tiền
//                     </th>
//                     <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">
//                       Xóa
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 bg-white">
//                   {fields.map((field, index) => {
//                     const item = chiTietItems[index] || {};
//                     const thanhTien =
//                       (parseFloat(item.so_luong) || 0) *
//                       (parseFloat(item.don_gia) || 0);

//                     return (
//                       <tr key={field.id} className="hover:bg-gray-50">
//                         <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
//                           {index + 1}
//                         </td>
//                         <td className="px-4 py-3">
//                           <AutoComplete
//                             searchFunction={async (query) => {
//                               try {
//                                 console.log(
//                                   "🔍 Searching hang hoa with query:",
//                                   query
//                                 );

//                                 if (!query || query.length < 2) {
//                                   console.log(
//                                     "❌ Query too short for hang hoa search"
//                                   );
//                                   return [];
//                                 }

//                                 const results =
//                                   await searchService.searchHangHoa(query);
//                                 console.log(
//                                   "✅ Hang hoa search results:",
//                                   results
//                                 );
//                                 return results;
//                               } catch (error) {
//                                 console.error(
//                                   "❌ Hang hoa search error:",
//                                   error
//                                 );
//                                 return [];
//                               }
//                             }}
//                             onSelect={(selectedHangHoa) => {
//                               console.log(
//                                 "✅ Selected hang hoa:",
//                                 selectedHangHoa
//                               );
//                               setValue(
//                                 `chi_tiet.${index}.hang_hoa`,
//                                 selectedHangHoa
//                               );
//                               setValue(
//                                 `chi_tiet.${index}.hang_hoa_id`,
//                                 selectedHangHoa?.id || null
//                               );

//                               // Auto-set giá nhập gần nhất nếu có
//                               if (
//                                 selectedHangHoa?.gia_nhap_gan_nhat &&
//                                 selectedHangHoa.gia_nhap_gan_nhat > 0
//                               ) {
//                                 setValue(
//                                   `chi_tiet.${index}.don_gia`,
//                                   selectedHangHoa.gia_nhap_gan_nhat
//                                 );
//                               }
//                             }}
//                             // ✅ THÊM onClear để reset đơn giá khi xóa hàng hóa
//                             onClear={() => {
//                               console.log(
//                                 "🧹 Clearing hang hoa and price for index:",
//                                 index
//                               );
//                               setValue(`chi_tiet.${index}.hang_hoa`, null);
//                               setValue(`chi_tiet.${index}.hang_hoa_id`, null);
//                               // ✅ QUAN TRỌNG: Reset đơn giá về 0
//                               setValue(`chi_tiet.${index}.don_gia`, 0);
//                             }}
//                             // ✅ THÊM onChange để xử lý khi user type
//                             onChange={(value) => {
//                               // Nếu user xóa hết text, reset các giá trị
//                               if (!value || value.trim() === "") {
//                                 console.log(
//                                   "🧹 Input cleared, resetting hang hoa and price"
//                                 );
//                                 setValue(`chi_tiet.${index}.hang_hoa`, null);
//                                 setValue(`chi_tiet.${index}.hang_hoa_id`, null);
//                                 setValue(`chi_tiet.${index}.don_gia`, 0);
//                               }
//                             }}
//                             placeholder="Tìm kiếm hàng hóa..."
//                             displayField="ten_hang_hoa"
//                             initialValue={item.hang_hoa}
//                             // Các thuộc tính create new
//                             createOnNotFound={true}
//                             onNewOption={async (inputValue) => {
//                               console.log(
//                                 "🆕 Creating new hang hoa:",
//                                 inputValue
//                               );

//                               try {
//                                 const newHangHoaData = {
//                                   id: `new_${Date.now()}`,
//                                   ten_hang_hoa: inputValue.trim(),
//                                   ma_hang_hoa: `NEW_${Date.now()}`,
//                                   don_vi_tinh: "Cái",
//                                   co_so_seri: false,
//                                   gia_nhap_gan_nhat: 0,
//                                   isNewItem: true,
//                                 };

//                                 console.log(
//                                   "🎯 Returning new hang hoa option:",
//                                   newHangHoaData
//                                 );
//                                 return newHangHoaData;
//                               } catch (error) {
//                                 console.error(
//                                   "❌ Error creating new hang hoa option:",
//                                   error
//                                 );
//                                 return null;
//                               }
//                             }}
//                             createText="+ Tạo hàng hóa mới"
//                             noOptionsText="Không tìm thấy hàng hóa. Nhấn Enter để tạo mới."
//                             loadingText="Đang tìm kiếm..."
//                             minSearchLength={2}
//                             searchDelay={300}
//                             allowCreateOption={true}
//                             showCreateOption={true}
//                             // ✅ THÊM clearable để có nút X xóa
//                             clearable={true}
//                             clearText="Xóa hàng hóa"
//                           />
//                         </td>
//                         <td className="px-4 py-3">
//                           <input
//                             type="number"
//                             min="1"
//                             step="1"
//                             {...register(`chi_tiet.${index}.so_luong`, {
//                               required: "Bắt buộc",
//                               min: { value: 1, message: "Tối thiểu 1" },
//                             })}
//                             className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
//                             placeholder="1"
//                           />
//                         </td>
//                         <td className="px-4 py-3">
//                           <input
//                             type="number"
//                             min="0"
//                             step="1000"
//                             {...register(`chi_tiet.${index}.don_gia`, {
//                               required: "Bắt buộc",
//                               min: { value: 0, message: "Tối thiểu 0" },
//                             })}
//                             className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
//                             placeholder="0"
//                           />
//                         </td>
//                         <td className="px-4 py-3">
//                           <select
//                             {...register(`chi_tiet.${index}.pham_chat`)}
//                             className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
//                           >
//                             {Object.entries(PHAM_CHAT).map(
//                               ([key, { label }]) => (
//                                 <option key={key} value={key}>
//                                   {label}
//                                 </option>
//                               )
//                             )}
//                           </select>
//                         </td>
//                         <td className="px-4 py-3">
//                           <input
//                             type="text"
//                             {...register(`chi_tiet.${index}.so_seri_list`)}
//                             className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
//                             placeholder="Danh điểm"
//                           />
//                         </td>
//                         <td className="px-4 py-3 text-center">
//                           <input
//                             type="checkbox"
//                             {...register(
//                               `chi_tiet.${index}.la_tai_san_co_dinh`
//                             )}
//                             className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
//                             title={
//                               parseFloat(item.don_gia) >= 10000000
//                                 ? "Tự động check vì đơn giá >= 10 triệu"
//                                 : ""
//                             }
//                           />
//                         </td>
//                         <td className="px-4 py-3 text-right font-medium text-green-600">
//                           {formatCurrency(thanhTien)}
//                         </td>
//                         <td className="px-4 py-3 text-center">
//                           <button
//                             type="button"
//                             onClick={() => removeHangHoaRow(index)}
//                             disabled={fields.length === 1}
//                             className={`p-1 rounded-full ${
//                               fields.length === 1
//                                 ? "text-gray-400 cursor-not-allowed"
//                                 : "text-red-600 hover:text-red-800 hover:bg-red-50"
//                             }`}
//                             title={
//                               fields.length === 1
//                                 ? "Không thể xóa hàng cuối"
//                                 : "Xóa hàng"
//                             }
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//                 <tfoot className="bg-gray-50">
//                   <tr>
//                     <td
//                       colSpan="7"
//                       className="px-4 py-3 text-right font-medium text-gray-900"
//                     >
//                       Tổng cộng:
//                     </td>
//                     <td className="px-4 py-3 text-right font-bold text-green-600 text-lg">
//                       {formatCurrency(tongTien)}
//                     </td>
//                     <td></td>
//                   </tr>
//                 </tfoot>
//               </table>
//             </div>
//           </div>

//           {/* Buttons */}
//           <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//             <button
//               type="button"
//               onClick={onCancel}
//               disabled={loading}
//               className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
//             >
//               Hủy
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? "Đang tạo..." : "Tạo phiếu nhập"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CreateNhapKhoForm;

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Plus,
  Trash2,
  Package,
  Building,
  User,
  Calendar,
  FileText,
  AlertCircle,
  X,
} from "lucide-react";
import { searchService } from "../../services/searchService";
import { nhapKhoService } from "../../services/nhapKhoService";
import { hangHoaService } from "../../services/hangHoaService";
import { formatCurrency } from "../../utils/helpers";
import { LOAI_PHIEU_NHAP, PHAM_CHAT } from "../../utils/constants";
import AutoComplete from "../common/AutoComplete";
import toast from "react-hot-toast";

// ✅ COMPONENT NHẬP SERIAL NUMBER/DANH ĐIỂM
const SerialNumberInput = ({
  value = [],
  onChange,
  disabled = false,
  placeholder = "Nhập serial/danh điểm",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [serialList, setSerialList] = useState(value || []);

  useEffect(() => {
    setSerialList(Array.isArray(value) ? value : []);
  }, [value]);

  const handleAddSerial = () => {
    if (inputValue.trim()) {
      const newList = [...serialList, inputValue.trim()];
      setSerialList(newList);
      onChange(newList);
      setInputValue("");
    }
  };

  const handleRemoveSerial = (index) => {
    const newList = serialList.filter((_, i) => i !== index);
    setSerialList(newList);
    onChange(newList);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSerial();
    }
  };

  const handleBulkInput = (e) => {
    const text = e.target.value;
    if (text.includes("\n") || text.includes(",")) {
      e.preventDefault();
      const items = text
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (items.length > 0) {
        const newList = [...serialList, ...items];
        setSerialList(newList);
        onChange(newList);
        setInputValue("");
      }
    } else {
      setInputValue(text);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleBulkInput}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
        />
        <button
          type="button"
          onClick={handleAddSerial}
          disabled={disabled || !inputValue.trim()}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
        >
          Thêm
        </button>
      </div>

      {/* Hiển thị danh sách serial */}
      {serialList.length > 0 && (
        <div className="max-h-20 overflow-y-auto">
          <div className="flex flex-wrap gap-1">
            {serialList.map((serial, index) => (
              <div
                key={index}
                className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
              >
                <span className="max-w-20 truncate" title={serial}>
                  {serial}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSerial(index)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {serialList.length} mục. Có thể paste nhiều dòng cùng lúc.
          </div>
        </div>
      )}
    </div>
  );
};

const CreateNhapKhoForm = ({ onSuccess, onCancel }) => {
  // States
  const [loading, setLoading] = useState(false);
  const [phongBanCap2List, setPhongBanCap2List] = useState([]);
  const [phongBanCap3List, setPhongBanCap3List] = useState([]);
  const [selectedCap2, setSelectedCap2] = useState(null);
  const [selectedCap3, setSelectedCap3] = useState(null);

  // Form hooks
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,

    formState: { errors },
  } = useForm({
    defaultValues: {
      ngay_nhap: new Date().toISOString().split("T")[0],
      loai_phieu: "tu_mua",
      phuong_thuc_van_chuyen: "Đơn vị tự vận chuyển",
      chi_tiet: [
        {
          hang_hoa: null,
          hang_hoa_id: null,
          so_luong: 1,
          don_gia: 0,
          pham_chat: "tot",
          so_seri_list: [],
          la_tai_san_co_dinh: false,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "chi_tiet",
  });

  // Watch form values
  const chiTietItems = watch("chi_tiet") || [];
  const loaiPhieu = watch("loai_phieu");
  const selectedNhaCungCap = watch("nha_cung_cap");

  // Calculate total
  const tongTien = chiTietItems.reduce((sum, item) => {
    if (item && item.so_luong && item.don_gia) {
      return sum + parseFloat(item.so_luong) * parseFloat(item.don_gia);
    }
    return sum;
  }, 0);

  // Load phòng ban cấp 2 khi component mount
  useEffect(() => {
    if (loaiPhieu === "dieu_chuyen") {
      loadPhongBanCap2();
    }
  }, [loaiPhieu]);

  const loadPhongBanCap2 = async () => {
    try {
      const response = await searchService.getPhongBanCap2();
      setPhongBanCap2List(response.data || []);
    } catch (error) {
      console.error("Error loading phong ban cap 2:", error);
      toast.error("Không thể tải danh sách phòng ban cấp 2");
    }
  };

  const loadPhongBanCap3 = async (cap2Id) => {
    try {
      const response = await searchService.getPhongBanCap3ByParent(cap2Id);
      setPhongBanCap3List(response.data || []);
    } catch (error) {
      console.error("Error loading phong ban cap 3:", error);
      toast.error("Không thể tải danh sách phòng ban cấp 3");
    }
  };

  // Handle hàng hóa selection
  const handleHangHoaSelect = async (hangHoa, index) => {
    if (!hangHoa) {
      setValue(`chi_tiet.${index}.hang_hoa`, null);
      setValue(`chi_tiet.${index}.hang_hoa_id`, null);
      setValue(`chi_tiet.${index}.don_gia`, 0);
      return;
    }

    // Nếu là tạo mới hàng hóa
    if (hangHoa.isNewItem) {
      try {
        console.log("🔄 Creating new hang hoa:", hangHoa);
        const response = await hangHoaService.createAuto(hangHoa);
        const newHangHoa = response.data;

        setValue(`chi_tiet.${index}.hang_hoa`, newHangHoa);
        setValue(`chi_tiet.${index}.hang_hoa_id`, newHangHoa.id);
        setValue(
          `chi_tiet.${index}.don_gia`,
          newHangHoa.gia_nhap_gan_nhat || 0
        );

        toast.success(`✅ Đã tạo hàng hóa mới: ${newHangHoa.ten_hang_hoa}`);
      } catch (error) {
        console.error("❌ Error creating hang hoa:", error);
        toast.error("Lỗi khi tạo hàng hóa mới");
      }
    } else {
      // Hàng hóa đã có sẵn
      setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);
      setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id);
      setValue(`chi_tiet.${index}.don_gia`, hangHoa.gia_nhap_gan_nhat || 0);
    }
  };

  // Handle NCC selection
  const handleNhaCungCapSelect = async (ncc) => {
    if (!ncc) {
      setValue("nha_cung_cap", null);
      return;
    }

    if (ncc.isNewItem) {
      try {
        console.log("🔄 Creating new NCC:", ncc);
        const response = await searchService.createNhaCungCapAuto(ncc);
        const newNCC = response.data;

        setValue("nha_cung_cap", newNCC);
        toast.success(`✅ Đã tạo nhà cung cấp mới: ${newNCC.ten_nha_cung_cap}`);
      } catch (error) {
        console.error("❌ Error creating NCC:", error);
        toast.error("Lỗi khi tạo nhà cung cấp mới");
      }
    } else {
      setValue("nha_cung_cap", ncc);
    }
  };

  // Calculate thanh tien for each item
  const calculateThanhTien = (index) => {
    const item = chiTietItems[index];
    if (item && item.so_luong && item.don_gia) {
      const thanhTien = parseFloat(item.so_luong) * parseFloat(item.don_gia);
      setValue(`chi_tiet.${index}.thanh_tien`, thanhTien);
      return thanhTien;
    }
    return 0;
  };

  // Submit form
  const onSubmit = async (data) => {
    setLoading(true);
    toast.loading("Đang xử lý...", { id: "processing" });

    try {
      console.log("📤 Form data being processed:", data);

      // Validate
      if (!data.chi_tiet || data.chi_tiet.length === 0) {
        throw new Error("Vui lòng thêm ít nhất một mặt hàng");
      }

      // Validate từng item
      for (let i = 0; i < data.chi_tiet.length; i++) {
        const item = data.chi_tiet[i];
        if (!item.hang_hoa_id) {
          throw new Error(`Dòng ${i + 1}: Chưa chọn hàng hóa`);
        }
        if (!item.so_luong || parseFloat(item.so_luong) <= 0) {
          throw new Error(`Dòng ${i + 1}: Số lượng phải lớn hơn 0`);
        }
        if (item.don_gia === undefined || parseFloat(item.don_gia) < 0) {
          throw new Error(`Dòng ${i + 1}: Đơn giá không hợp lệ`);
        }
      }

      // Prepare data for API
      const phieuData = {
        ngay_nhap: data.ngay_nhap,
        loai_phieu: data.loai_phieu,
        ly_do_nhap: data.ly_do_nhap || "",
        so_quyet_dinh: data.so_quyet_dinh || "",
        so_hoa_don: data.so_hoa_don || "",
        dia_chi_nhap: data.dia_chi_nhap || "",
        nguoi_nhap_hang: data.nguoi_nhap_hang || "",
        nguoi_giao_hang: data.nguoi_giao_hang || "",
        ghi_chu: data.ghi_chu || "",
        phuong_thuc_van_chuyen:
          data.phuong_thuc_van_chuyen || "Đơn vị tự vận chuyển",

        // ✅ Handle NCC/Phòng ban theo loại phiếu
        nha_cung_cap_id:
          data.loai_phieu === "tu_mua" || data.loai_phieu === "tren_cap"
            ? data.nha_cung_cap?.id || null
            : null,
        phong_ban_cung_cap_id:
          data.loai_phieu === "dieu_chuyen" ? selectedCap3 || null : null,

        // ✅ Chi tiết với xử lý so_seri_list đúng cách
        chi_tiet: data.chi_tiet.map((item) => ({
          hang_hoa_id: item.hang_hoa_id,
          so_luong_ke_hoach: parseFloat(item.so_luong),
          so_luong: parseFloat(item.so_luong),
          don_gia: parseFloat(item.don_gia),
          thanh_tien: parseFloat(item.so_luong) * parseFloat(item.don_gia),
          pham_chat: item.pham_chat || "tot",
          han_su_dung: item.han_su_dung || null,
          vi_tri_kho: item.vi_tri_kho || "",
          ghi_chu: item.ghi_chu || "",
          // ✅ FIX: Đảm bảo so_seri_list là array hoặc null
          so_seri_list:
            Array.isArray(item.so_seri_list) && item.so_seri_list.length > 0
              ? item.so_seri_list
              : null,
          la_tai_san_co_dinh: item.la_tai_san_co_dinh || false,
        })),
      };

      console.log("🚀 Final data being sent to API:", phieuData);

      const response = await nhapKhoService.create(phieuData);

      toast.dismiss("processing");
      toast.success(
        `✅ Tạo phiếu nhập thành công! Mã phiếu: ${
          response.data?.so_phieu || ""
        }`
      );

      onSuccess?.();
    } catch (error) {
      console.error("❌ Error creating phieu:", error);
      toast.dismiss("processing");

      const errorMessage =
        error.response?.data?.message || error.message || "Có lỗi xảy ra";
      toast.error(`Lỗi tạo phiếu: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const addHangHoaRow = () => {
    append({
      hang_hoa: null,
      hang_hoa_id: null,
      so_luong: 1,
      don_gia: 0,
      pham_chat: "tot",
      so_seri_list: [],
      la_tai_san_co_dinh: false,
    });
  };

  const removeHangHoaRow = (index) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("Phải có ít nhất một hàng hóa");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Package className="mr-2 h-5 w-5 text-green-600" />
            Tạo phiếu nhập kho mới
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Điền thông tin để tạo phiếu nhập kho mới
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ngày nhập */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Ngày nhập *
              </label>
              <input
                type="date"
                {...register("ngay_nhap", {
                  required: "Vui lòng chọn ngày nhập",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.ngay_nhap && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.ngay_nhap.message}
                </p>
              )}
            </div>

            {/* Loại phiếu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Loại phiếu *
              </label>
              <select
                {...register("loai_phieu", {
                  required: "Vui lòng chọn loại phiếu",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                onChange={(e) => {
                  setValue("loai_phieu", e.target.value);
                  // Reset khi đổi loại phiếu
                  setValue("nha_cung_cap", null);
                  setSelectedCap2(null);
                  setSelectedCap3(null);
                  setValue("phong_ban_cung_cap_id", null);
                }}
              >
                {Object.entries(LOAI_PHIEU_NHAP).map(([key, value]) => (
                  <option key={key} value={key}>
                    {typeof value === "object" ? value.label : value}
                  </option>
                ))}
              </select>
              {errors.loai_phieu && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.loai_phieu.message}
                </p>
              )}
            </div>

            {/* Người nhận hàng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Người nhận hàng
              </label>
              <input
                type="text"
                {...register("nguoi_nhap_hang")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Tên người nhận hàng"
              />
            </div>
          </div>

          {/* Nguồn cung cấp */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Nguồn cung cấp
            </h3>

            {/* Nhà cung cấp - cho tu_mua và tren_cap */}
            {(loaiPhieu === "tu_mua" || loaiPhieu === "tren_cap") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="inline h-4 w-4 mr-1" />
                  Nhà cung cấp *
                </label>
                <AutoComplete
                  searchFunction={searchService.searchNhaCungCap}
                  value={selectedNhaCungCap}
                  onChange={handleNhaCungCapSelect}
                  placeholder="Tìm kiếm nhà cung cấp..."
                  displayField="ten_nha_cung_cap"
                  searchField="ten_nha_cung_cap"
                  createNewLabel="Tạo nhà cung cấp mới"
                  noResultsText="Không tìm thấy nhà cung cấp"
                  loadingText="Đang tìm kiếm..."
                  minSearchLength={2}
                  searchDelay={300}
                  allowCreateOption={true}
                  showCreateOption={true}
                  clearable={true}
                  clearText="Xóa nhà cung cấp"
                />
              </div>
            )}

            {/* Phòng ban cung cấp - cho dieu_chuyen */}
            {loaiPhieu === "dieu_chuyen" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phòng ban cấp 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phòng ban cấp 2 *
                  </label>
                  <select
                    value={selectedCap2 || ""}
                    onChange={(e) => {
                      const cap2Id = e.target.value
                        ? parseInt(e.target.value)
                        : null;
                      setSelectedCap2(cap2Id);
                      setSelectedCap3(null);
                      setPhongBanCap3List([]);
                      setValue("phong_ban_cung_cap_id", null);
                      if (cap2Id) {
                        loadPhongBanCap3(cap2Id);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">-- Chọn phòng ban cấp 2 --</option>
                    {phongBanCap2List.map((pb) => (
                      <option key={pb.id} value={pb.id}>
                        {pb.ten_phong_ban}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phòng ban cấp 3 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kho cấp 3 *
                  </label>
                  <select
                    value={selectedCap3 || ""}
                    onChange={(e) => {
                      const cap3Id = e.target.value
                        ? parseInt(e.target.value)
                        : null;
                      setSelectedCap3(cap3Id);
                      setValue("phong_ban_cung_cap_id", cap3Id || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!selectedCap2}
                  >
                    <option value="">-- Chọn kho cấp 3 --</option>
                    {phongBanCap3List.map((pb) => (
                      <option key={pb.id} value={pb.id}>
                        {pb.ten_phong_ban}
                      </option>
                    ))}
                  </select>
                  {!selectedCap2 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Vui lòng chọn phòng ban cấp 2 trước
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Thông tin bổ sung */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số quyết định
              </label>
              <input
                type="text"
                {...register("so_quyet_dinh")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Số quyết định"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số hóa đơn
              </label>
              <input
                type="text"
                {...register("so_hoa_don")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Số hóa đơn"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ nhập
              </label>
              <input
                type="text"
                {...register("dia_chi_nhap")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Địa chỉ nhập hàng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do nhập
              </label>
              <input
                type="text"
                {...register("ly_do_nhap")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Lý do nhập hàng"
              />
            </div>
          </div>

          {/* Chi tiết hàng hóa */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Chi tiết hàng hóa
              </h3>
              <button
                type="button"
                onClick={addHangHoaRow}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Thêm hàng hóa</span>
              </button>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      STT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-64">
                      Hàng hóa *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đơn giá *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phẩm chất
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                      Serial/Danh điểm
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thành tiền
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fields.map((field, index) => {
                    const item = chiTietItems[index] || {};
                    const thanhTien =
                      item.so_luong && item.don_gia
                        ? parseFloat(item.so_luong) * parseFloat(item.don_gia)
                        : 0;

                    return (
                      <tr key={field.id} className="hover:bg-gray-50">
                        {/* STT */}
                        <td className="px-4 py-3 text-sm text-gray-900 text-center">
                          {index + 1}
                        </td>

                        {/* Hàng hóa */}
                        <td className="px-4 py-3">
                          <AutoComplete
                            searchFunction={searchService.searchHangHoa}
                            value={item.hang_hoa}
                            onChange={(hangHoa) =>
                              handleHangHoaSelect(hangHoa, index)
                            }
                            placeholder="Tìm kiếm hàng hóa..."
                            displayField="ten_hang_hoa"
                            searchField="ten_hang_hoa"
                            createNewLabel="Tạo hàng hóa mới"
                            noResultsText="Không tìm thấy hàng hóa. Nhấn Enter để tạo mới."
                            loadingText="Đang tìm kiếm..."
                            minSearchLength={2}
                            searchDelay={300}
                            allowCreateOption={true}
                            showCreateOption={true}
                            clearable={true}
                            clearText="Xóa hàng hóa"
                          />
                        </td>

                        {/* Số lượng */}
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            {...register(`chi_tiet.${index}.so_luong`, {
                              required: "Bắt buộc",
                              min: { value: 1, message: "Tối thiểu 1" },
                            })}
                            onChange={(e) => {
                              setValue(
                                `chi_tiet.${index}.so_luong`,
                                e.target.value
                              );
                              calculateThanhTien(index);
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            placeholder="1"
                          />
                          {errors.chi_tiet?.[index]?.so_luong && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.chi_tiet[index].so_luong.message}
                            </p>
                          )}
                        </td>

                        {/* Đơn giá */}
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            {...register(`chi_tiet.${index}.don_gia`, {
                              required: "Bắt buộc",
                              min: { value: 0, message: "Tối thiểu 0" },
                            })}
                            onChange={(e) => {
                              setValue(
                                `chi_tiet.${index}.don_gia`,
                                e.target.value
                              );
                              calculateThanhTien(index);
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            placeholder="0"
                          />
                          {errors.chi_tiet?.[index]?.don_gia && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.chi_tiet[index].don_gia.message}
                            </p>
                          )}
                        </td>

                        {/* Phẩm chất */}
                        <td className="px-4 py-3">
                          <select
                            {...register(`chi_tiet.${index}.pham_chat`)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          >
                            {Object.entries(PHAM_CHAT).map(
                              ([key, { label }]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                        </td>

                        {/* Serial/Danh điểm */}
                        <td className="px-4 py-3">
                          <Controller
                            name={`chi_tiet.${index}.so_seri_list`}
                            control={control}
                            defaultValue={[]}
                            render={({ field }) => (
                              <SerialNumberInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Nhập serial/danh điểm"
                              />
                            )}
                          />
                        </td>

                        {/* Thành tiền */}
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(thanhTien)}
                          </div>
                        </td>

                        {/* Thao tác */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removeHangHoaRow(index)}
                            disabled={fields.length <= 1}
                            className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                            title="Xóa hàng hóa"
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

            {/* Tổng tiền */}
            <div className="flex justify-end">
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">
                  Tổng tiền: {formatCurrency(tongTien)}
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin bổ sung khác */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Thông tin bổ sung
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Người giao hàng
                </label>
                <input
                  type="text"
                  {...register("nguoi_giao_hang")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Tên người giao hàng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phương thức vận chuyển
                </label>
                <input
                  type="text"
                  {...register("phuong_thuc_van_chuyen")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Phương thức vận chuyển"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                {...register("ghi_chu")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ghi chú thêm về phiếu nhập..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || chiTietItems.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Package size={16} />
                  <span>Tạo phiếu nhập</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNhapKhoForm;
