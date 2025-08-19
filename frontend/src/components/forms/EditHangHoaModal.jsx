// import React, { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { X, AlertTriangle, Package, Info } from "lucide-react";
// import { hangHoaService } from "../../services/hangHoaService";
// import toast from "react-hot-toast";

// const EditHangHoaModal = ({ isOpen, onClose, hangHoaId, onSuccess }) => {
//   const [loading, setLoading] = useState(false);
//   const [isLoadingData, setIsLoadingData] = useState(true);
//   const [dataLoaded, setDataLoaded] = useState(false);
//   const [formReady, setFormReady] = useState(false);
//   const [loaiHangHoaList, setLoaiHangHoaList] = useState([]);
//   const [hasTransactions, setHasTransactions] = useState(false);
//   const [currentInventory, setCurrentInventory] = useState(0);

//   const {
//     register,
//     handleSubmit,

//     reset,
//     formState: { errors },
//   } = useForm({
//     mode: "onChange",
//     shouldUnregister: false,
//   });

//   // Load initial data
//   useEffect(() => {
//     if (isOpen && hangHoaId) {
//       reset({});
//       setDataLoaded(false);
//       setFormReady(false);
//       setHasTransactions(false);
//       setCurrentInventory(0);
//       setLoaiHangHoaList([]);
//       loadInitialData();
//     }
//   }, [isOpen, hangHoaId, reset]);

//   const loadInitialData = async () => {
//     try {
//       setIsLoadingData(true);

//       // Load all required data in parallel
//       const [loaiHangHoaRes, hangHoaRes] = await Promise.all([
//         hangHoaService.getLoaiHangHoa(),
//         hangHoaService.getDetail(hangHoaId),
//       ]);

//       // Process loai hang hoa with extensive fallback
//       const processedLoaiHangHoa =
//         loaiHangHoaRes?.data?.data ||
//         loaiHangHoaRes?.data?.items ||
//         loaiHangHoaRes?.data ||
//         [];

//       // Ensure arrays before setting state
//       setLoaiHangHoaList(
//         Array.isArray(processedLoaiHangHoa) ? processedLoaiHangHoa : []
//       );

//       const hangHoa = hangHoaRes?.data || {};

//       // Set form data
//       const formData = {
//         ma_hang_hoa: hangHoa.ma_hang_hoa || "",
//         ten_hang_hoa: hangHoa.ten_hang_hoa || "",
//         loai_hang_hoa_id: hangHoa.loai_hang_hoa_id || "",
//         don_vi_tinh: hangHoa.don_vi_tinh || "",
//         mo_ta_ky_thuat: hangHoa.mo_ta_ky_thuat || "",
//         co_so_seri: hangHoa.co_so_seri || false,
//         theo_doi_pham_chat: hangHoa.theo_doi_pham_chat !== false,
//       };

//       reset(formData, { keepDefaultValues: false });

//       // Check if has transactions
//       const hasTransactionsCount =
//         (hangHoa.thong_ke?.tong_da_nhap || 0) +
//         (hangHoa.thong_ke?.tong_da_xuat || 0);

//       setHasTransactions(hasTransactionsCount > 0);
//       setCurrentInventory(hangHoa.so_luong_ton || 0);

//       setTimeout(() => setDataLoaded(true), 150);
//       setTimeout(() => setFormReady(true), 300);
//     } catch (error) {
//       console.error("Error loading hang hoa data:", error);

//       // Set safe fallback values on error
//       setLoaiHangHoaList([]);

//       toast.error("Không thể tải dữ liệu hàng hóa");
//     } finally {
//       setIsLoadingData(false);
//     }
//   };

//   const onSubmit = async (data) => {
//     setLoading(true);
//     try {
//       toast.loading("Đang cập nhật hàng hóa...", { id: "processing" });

//       const submitData = {
//         ma_hang_hoa: data.ma_hang_hoa.trim(),
//         ten_hang_hoa: data.ten_hang_hoa.trim(),
//         loai_hang_hoa_id: data.loai_hang_hoa_id || null,
//         don_vi_tinh: data.don_vi_tinh.trim(),
//         mo_ta_ky_thuat: data.mo_ta_ky_thuat?.trim() || "",
//         co_so_seri: data.co_so_seri || false,
//         theo_doi_pham_chat: data.theo_doi_pham_chat !== false,
//       };

//       await hangHoaService.update(hangHoaId, submitData);

//       toast.dismiss("processing");
//       toast.success("🎉 Cập nhật hàng hóa thành công!");
//       onSuccess?.();
//       onClose();
//     } catch (error) {
//       toast.dismiss("processing");

//       let errorMessage = "Có lỗi xảy ra khi cập nhật hàng hóa";
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

//   const handleClose = () => {
//     if (!loading) {
//       reset();
//       onClose();
//     }
//   };

//   if (!isOpen) return null;

//   if (isLoadingData || !dataLoaded || !formReady) {
//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//             <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-gray-200">
//           <div className="flex items-center space-x-3">
//             <Package className="h-6 w-6 text-blue-600" />
//             <h2 className="text-xl font-semibold text-gray-900">
//               Chỉnh sửa hàng hóa
//             </h2>
//           </div>
//           <button
//             onClick={handleClose}
//             disabled={loading}
//             className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
//           >
//             <X size={24} />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
//           <div className="p-6 space-y-4">
//             {/* Warnings */}
//             {(hasTransactions || currentInventory > 0) && (
//               <div className="space-y-3">
//                 {hasTransactions && (
//                   <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg flex items-start space-x-2 text-sm">
//                     <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
//                     <div>
//                       <p className="font-medium">Hàng hóa đã có giao dịch</p>
//                       <p>
//                         Một số thông tin như cấu hình số seri không thể thay đổi
//                         vì hàng hóa đã có lịch sử nhập/xuất kho.
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {currentInventory > 0 && (
//                   <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-start space-x-2 text-sm">
//                     <Info size={16} className="mt-0.5 flex-shrink-0" />
//                     <div>
//                       <p className="font-medium">
//                         Hiện tại còn tồn kho: {currentInventory}
//                       </p>
//                       <p>
//                         Hãy cân nhắc kỹ khi thay đổi thông tin vì có thể ảnh
//                         hưởng đến các báo cáo và thống kê hiện tại.
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//               {/* Basic Information */}
//               <div className="bg-white border rounded-lg p-6">
//                 <h3 className="text-lg font-medium text-gray-900 mb-4">
//                   Thông tin cơ bản
//                 </h3>
//                 <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Mã hàng hóa *
//                     </label>
//                     <input
//                       type="text"
//                       {...register("ma_hang_hoa", {
//                         required: "Vui lòng nhập mã hàng hóa",
//                         pattern: {
//                           value: /^[A-Z0-9_-]+$/,
//                           message:
//                             "Mã chỉ được chứa chữ hoa, số, dấu gạch dưới và gạch ngang",
//                         },
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                       placeholder="VD: HH001"
//                     />
//                     {errors.ma_hang_hoa && (
//                       <p className="mt-1 text-sm text-red-600">
//                         {errors.ma_hang_hoa.message}
//                       </p>
//                     )}
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Tên hàng hóa *
//                     </label>
//                     <input
//                       type="text"
//                       {...register("ten_hang_hoa", {
//                         required: "Vui lòng nhập tên hàng hóa",
//                         minLength: {
//                           value: 3,
//                           message: "Tên hàng hóa phải có ít nhất 3 ký tự",
//                         },
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                       placeholder="Nhập tên hàng hóa"
//                     />
//                     {errors.ten_hang_hoa && (
//                       <p className="mt-1 text-sm text-red-600">
//                         {errors.ten_hang_hoa.message}
//                       </p>
//                     )}
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Loại hàng hóa
//                     </label>
//                     <select
//                       {...register("loai_hang_hoa_id")}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                     >
//                       <option value="">-- Chọn loại hàng hóa --</option>
//                       {Array.isArray(loaiHangHoaList) &&
//                       loaiHangHoaList.length > 0 ? (
//                         loaiHangHoaList.map((loai) => (
//                           <option key={loai.id} value={loai.id}>
//                             {loai.ten_loai}
//                           </option>
//                         ))
//                       ) : (
//                         <option disabled>Không có dữ liệu loại hàng hóa</option>
//                       )}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Đơn vị tính *
//                     </label>
//                     <input
//                       type="text"
//                       {...register("don_vi_tinh", {
//                         required: "Vui lòng nhập đơn vị tính",
//                       })}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
//                       placeholder="VD: cái, kg, lít..."
//                     />
//                     {errors.don_vi_tinh && (
//                       <p className="mt-1 text-sm text-red-600">
//                         {errors.don_vi_tinh.message}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Mô tả kỹ thuật
//                     </label>
//                     <input
//                       type="text"
//                       {...register("mo_ta_ky_thuat")}
//                       rows={3}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
//                       placeholder="Mô tả chi tiết về hàng hóa, thông số kỹ thuật..."
//                     />
//                   </div>
//                 </div>
//               </div>
//             </form>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
//           <button
//             type="button"
//             onClick={handleClose}
//             disabled={loading}
//             className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
//           >
//             Hủy
//           </button>
//           <button
//             type="submit"
//             disabled={loading}
//             onClick={handleSubmit(onSubmit)}
//             className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
//           >
//             {loading && (
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//             )}
//             <span>{loading ? "Đang xử lý..." : "Cập nhật"}</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditHangHoaModal;

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, AlertTriangle, Package, Info, Building } from "lucide-react";
import { hangHoaService } from "../../services/hangHoaService";
import toast from "react-hot-toast";

const EditHangHoaModal = ({ isOpen, onClose, hangHoaId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [loaiHangHoaList, setLoaiHangHoaList] = useState([]);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [currentInventory, setCurrentInventory] = useState(0);
  const [inventoryByLevel, setInventoryByLevel] = useState([]);
  const [permissionInfo, setPermissionInfo] = useState({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    shouldUnregister: false,
  });

  // Load initial data
  useEffect(() => {
    if (isOpen && hangHoaId) {
      reset({});
      setDataLoaded(false);
      setFormReady(false);
      setHasTransactions(false);
      setCurrentInventory(0);
      setLoaiHangHoaList([]);
      setInventoryByLevel([]);
      setPermissionInfo({});
      loadInitialData();
    }
  }, [isOpen, hangHoaId, reset]);

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true);

      // Load all required data in parallel
      const [loaiHangHoaRes, hangHoaRes, inventoryRes, permissionRes] =
        await Promise.all([
          hangHoaService.getLoaiHangHoa(),
          hangHoaService.getDetail(hangHoaId),
          hangHoaService
            .getInventoryByLevel(hangHoaId)
            .catch(() => ({ data: [] })),
          hangHoaService
            .checkHangHoaPermission(hangHoaId, "update")
            .catch(() => ({ data: { can_edit: false } })),
        ]);

      // Process loai hang hoa with extensive fallback
      const processedLoaiHangHoa =
        loaiHangHoaRes?.data?.data ||
        loaiHangHoaRes?.data?.items ||
        loaiHangHoaRes?.data ||
        [];

      // Ensure arrays before setting state
      setLoaiHangHoaList(
        Array.isArray(processedLoaiHangHoa) ? processedLoaiHangHoa : []
      );

      const hangHoa = hangHoaRes?.data || {};

      // Set form data
      const formData = {
        ma_hang_hoa: hangHoa.ma_hang_hoa || "",
        ten_hang_hoa: hangHoa.ten_hang_hoa || "",
        loai_hang_hoa_id: hangHoa.loai_hang_hoa_id || "",
        don_vi_tinh: hangHoa.don_vi_tinh || "",
        mo_ta_ky_thuat: hangHoa.mo_ta_ky_thuat || "",
        co_so_seri: hangHoa.co_so_seri || false,
        theo_doi_pham_chat: hangHoa.theo_doi_pham_chat !== false,
        la_tai_san_co_dinh: hangHoa.la_tai_san_co_dinh || false,
      };

      reset(formData, { keepDefaultValues: false });

      // Check if has transactions
      const hasTransactionsCount =
        (hangHoa.thong_ke?.tong_da_nhap || 0) +
        (hangHoa.thong_ke?.tong_da_xuat || 0);

      setHasTransactions(hasTransactionsCount > 0);
      setCurrentInventory(hangHoa.so_luong_ton || 0);

      // Set inventory by level and permission info
      setInventoryByLevel(inventoryRes?.data || []);
      setPermissionInfo(permissionRes?.data || {});

      setTimeout(() => setDataLoaded(true), 150);
      setTimeout(() => setFormReady(true), 300);
    } catch (error) {
      console.error("Error loading hang hoa data:", error);

      // Set safe fallback values on error
      setLoaiHangHoaList([]);

      toast.error("Không thể tải dữ liệu hàng hóa");
    } finally {
      setIsLoadingData(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      toast.loading("Đang cập nhật hàng hóa...", { id: "processing" });

      const submitData = {
        ma_hang_hoa: data.ma_hang_hoa.trim(),
        ten_hang_hoa: data.ten_hang_hoa.trim(),
        loai_hang_hoa_id: data.loai_hang_hoa_id || null,
        don_vi_tinh: data.don_vi_tinh.trim(),
        mo_ta_ky_thuat: data.mo_ta_ky_thuat?.trim() || "",
        co_so_seri: data.co_so_seri || false,
        theo_doi_pham_chat: data.theo_doi_pham_chat !== false,
        la_tai_san_co_dinh: data.la_tai_san_co_dinh || false,
      };

      await hangHoaService.update(hangHoaId, submitData);

      toast.dismiss("processing");
      toast.success("🎉 Cập nhật hàng hóa thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.dismiss("processing");

      let errorMessage = "Có lỗi xảy ra khi cập nhật hàng hóa";
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

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  if (isLoadingData || !dataLoaded || !formReady) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Chỉnh sửa hàng hóa
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-4">
            {/* Permission Warning */}
            {!permissionInfo.can_edit && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start space-x-2 text-sm">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Không có quyền chỉnh sửa</p>
                  <p>
                    Bạn không có quyền chỉnh sửa hàng hóa này. Có thể do hàng
                    hóa thuộc phòng ban khác hoặc bạn không có quyền quản lý.
                  </p>
                </div>
              </div>
            )}

            {/* Warnings */}
            {(hasTransactions || currentInventory > 0) && (
              <div className="space-y-3">
                {hasTransactions && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg flex items-start space-x-2 text-sm">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Hàng hóa đã có giao dịch</p>
                      <p>
                        Một số thông tin như cấu hình số seri không thể thay đổi
                        vì hàng hóa đã có lịch sử nhập/xuất kho.
                      </p>
                    </div>
                  </div>
                )}

                {currentInventory > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-start space-x-2 text-sm">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">
                        Hiện tại còn tồn kho: {currentInventory}
                      </p>
                      <p>
                        Hãy cân nhắc kỹ khi thay đổi thông tin vì có thể ảnh
                        hưởng đến các báo cáo và thống kê hiện tại.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Inventory by Level */}
            {inventoryByLevel.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2 text-sm">
                  <Building
                    size={16}
                    className="mt-0.5 flex-shrink-0 text-green-600"
                  />
                  <div>
                    <p className="font-medium text-green-800 mb-2">
                      Phân bố tồn kho theo đơn vị:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {inventoryByLevel.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white p-2 rounded border border-green-200"
                        >
                          <div className="text-xs text-green-700">
                            <div className="font-medium">
                              {item.ten_phong_ban}
                            </div>
                            <div className="text-green-600">
                              Cấp {item.cap_bac} • Tồn:{" "}
                              <span className="font-semibold">
                                {item.so_luong_ton}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      💡 Hàng hóa này đã được phân phối đến nhiều đơn vị trong
                      hệ thống 3 cấp
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Basic Information */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã hàng hóa *
                    </label>
                    <input
                      type="text"
                      {...register("ma_hang_hoa", {
                        required: "Vui lòng nhập mã hàng hóa",
                        pattern: {
                          value: /^[A-Z0-9_-]+$/,
                          message:
                            "Mã chỉ được chứa chữ hoa, số, dấu gạch dưới và gạch ngang",
                        },
                      })}
                      disabled={!permissionInfo.can_edit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"
                      placeholder="VD: HH001"
                    />
                    {errors.ma_hang_hoa && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.ma_hang_hoa.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên hàng hóa *
                    </label>
                    <input
                      type="text"
                      {...register("ten_hang_hoa", {
                        required: "Vui lòng nhập tên hàng hóa",
                        minLength: {
                          value: 3,
                          message: "Tên hàng hóa phải có ít nhất 3 ký tự",
                        },
                      })}
                      disabled={!permissionInfo.can_edit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"
                      placeholder="Nhập tên hàng hóa"
                    />
                    {errors.ten_hang_hoa && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.ten_hang_hoa.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại hàng hóa
                    </label>
                    <select
                      {...register("loai_hang_hoa_id")}
                      disabled={!permissionInfo.can_edit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"
                    >
                      <option value="">-- Chọn loại hàng hóa --</option>
                      {Array.isArray(loaiHangHoaList) &&
                      loaiHangHoaList.length > 0 ? (
                        loaiHangHoaList.map((loai) => (
                          <option key={loai.id} value={loai.id}>
                            {loai.ten_loai}
                          </option>
                        ))
                      ) : (
                        <option disabled>Không có dữ liệu loại hàng hóa</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đơn vị tính *
                    </label>
                    <input
                      type="text"
                      {...register("don_vi_tinh", {
                        required: "Vui lòng nhập đơn vị tính",
                      })}
                      disabled={!permissionInfo.can_edit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"
                      placeholder="VD: cái, kg, lít..."
                    />
                    {errors.don_vi_tinh && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.don_vi_tinh.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả kỹ thuật
                    </label>
                    <input
                      type="text"
                      {...register("mo_ta_ky_thuat")}
                      disabled={!permissionInfo.can_edit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100"
                      placeholder="Mô tả chi tiết về hàng hóa, thông số kỹ thuật..."
                    />
                  </div>
                </div>

                {/* Configuration Options */}
                <div className="mt-6 space-y-4">
                  <h4 className="text-md font-medium text-gray-900">
                    Cấu hình nâng cao
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <input
                        id="co_so_seri"
                        type="checkbox"
                        {...register("co_so_seri")}
                        disabled={!permissionInfo.can_edit || hasTransactions}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <label
                        htmlFor="co_so_seri"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        Có số seri
                        {hasTransactions && (
                          <span className="text-xs text-gray-500 block">
                            (Không thể thay đổi - đã có giao dịch)
                          </span>
                        )}
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="theo_doi_pham_chat"
                        type="checkbox"
                        {...register("theo_doi_pham_chat")}
                        disabled={!permissionInfo.can_edit}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <label
                        htmlFor="theo_doi_pham_chat"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        Theo dõi phẩm chất
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="la_tai_san_co_dinh"
                        type="checkbox"
                        {...register("la_tai_san_co_dinh")}
                        disabled={!permissionInfo.can_edit}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <label
                        htmlFor="la_tai_san_co_dinh"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        Là tài sản cố định
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          {permissionInfo.can_edit && (
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit(onSubmit)}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{loading ? "Đang xử lý..." : "Cập nhật"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditHangHoaModal;
