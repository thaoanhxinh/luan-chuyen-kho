import React, { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Building, AlertCircle } from "lucide-react";
import { searchService } from "../../services/searchService";
import { nhapKhoService } from "../../services/nhapKhoService";
import { formatCurrency } from "../../utils/helpers";
import { LOAI_PHIEU_NHAP, PHAM_CHAT } from "../../utils/constants";
import AutoComplete from "../common/AutoComplete";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const CreateNhapKhoForm = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [phongBanCungCap, setPhongBanCungCap] = useState([]);
  const [loadingPhongBan, setLoadingPhongBan] = useState(false);

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
      nguoi_nhap_hang: "",
      so_quyet_dinh: "",
      so_hoa_don: "",
      dia_chi_nhap: "",
      phuong_thuc_van_chuyen: "Đơn vị tự vận chuyển",
      ly_do_nhap: "",
      ghi_chu: "",
      nha_cung_cap_id: null,
      nha_cung_cap: null,
      phong_ban_cung_cap_id: null,
      phong_ban_cung_cap: null,
      chi_tiet: [
        {
          hang_hoa_id: null,
          hang_hoa: null,
          so_luong_ke_hoach: 1,
          so_luong: 1,
          don_gia: 0,
          pham_chat: "tot",
          danh_diem: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "chi_tiet",
  });

  const chiTietItems = watch("chi_tiet");
  const loaiPhieu = watch("loai_phieu");

  const loadPhongBanCungCap = useCallback(async () => {
    try {
      setLoadingPhongBan(true);
      const response = await nhapKhoService.getPhongBanCungCap(loaiPhieu);
      setPhongBanCungCap(response.data || []);
    } catch (error) {
      console.error("Error loading phong ban cung cap:", error);
      toast.error("Không thể tải danh sách phòng ban cung cấp");
      setPhongBanCungCap([]);
    } finally {
      setLoadingPhongBan(false);
    }
  }, [loaiPhieu]);

  useEffect(() => {
    if (loaiPhieu === "dieu_chuyen") {
      loadPhongBanCungCap();
    } else {
      setPhongBanCungCap([]);
      setValue("phong_ban_cung_cap_id", null);
      setValue("phong_ban_cung_cap", null);
    }
  }, [loaiPhieu, setValue, loadPhongBanCungCap]);

  const tongTien = chiTietItems.reduce((sum, item) => {
    return (
      sum +
      parseFloat(item.so_luong_ke_hoach || 0) * parseFloat(item.don_gia || 0)
    );
  }, 0);

  const handleNhaCungCapSelect = (nhaCungCap) => {
    console.log("🔍 handleNhaCungCapSelect called with:", nhaCungCap);

    if (!nhaCungCap) {
      console.log("❌ No NCC provided, clearing values");
      setValue("nha_cung_cap", null);
      setValue("nha_cung_cap_id", null);
      return;
    }

    setValue("nha_cung_cap_id", nhaCungCap.id || null);
    setValue("nha_cung_cap", nhaCungCap);

    if (nhaCungCap.isNewItem) {
      toast(`💡 Sẽ tạo nhà cung cấp mới: ${nhaCungCap.ten_ncc}`, {
        duration: 3000,
        style: {
          background: "#EBF8FF",
          color: "#2B6CB0",
          border: "1px solid #BEE3F8",
        },
      });
    } else {
      toast.success(`Đã chọn nhà cung cấp: ${nhaCungCap.ten_ncc}`);
    }
  };

  const handlePhongBanCungCapSelect = (phongBan) => {
    setValue("phong_ban_cung_cap_id", phongBan.id);
    setValue("phong_ban_cung_cap", phongBan);
    toast.success(`Đã chọn đơn vị cung cấp: ${phongBan.ten_phong_ban}`);
  };

  const handleHangHoaSelect = (hangHoa, index) => {
    setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id || null);
    setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);

    if (hangHoa.isNewItem) {
      toast(`💡 Sẽ tạo hàng hóa mới: ${hangHoa.ten_hang_hoa}`, {
        duration: 3000,
        style: {
          background: "#EBF8FF",
          color: "#2B6CB0",
          border: "1px solid #BEE3F8",
        },
      });
    } else {
      if (hangHoa.gia_nhap_gan_nhat && hangHoa.gia_nhap_gan_nhat > 0) {
        setValue(`chi_tiet.${index}.don_gia`, hangHoa.gia_nhap_gan_nhat);
        toast.success(
          `Đã chọn ${
            hangHoa.ten_hang_hoa
          } và tự động điền giá: ${formatCurrency(hangHoa.gia_nhap_gan_nhat)}`
        );
      } else {
        toast.success(`Đã chọn ${hangHoa.ten_hang_hoa}. Vui lòng nhập giá.`);
      }
    }
  };

  // Auto-sync số lượng thực tế với số lượng kế hoạch
  const handleSoLuongKeHoachChange = (value, index) => {
    setValue(`chi_tiet.${index}.so_luong_ke_hoach`, value);
    setValue(`chi_tiet.${index}.so_luong`, value); // Tự động set số lượng thực tế = số lượng kế hoạch
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

  const createNhaCungCapIfNeeded = async (nhaCungCap) => {
    if (!nhaCungCap?.isNewItem) {
      return nhaCungCap;
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 15000)
      );
      const createPromise = searchService.createNhaCungCapAuto({
        ten_ncc: nhaCungCap.ten_ncc,
        loai_nha_cung_cap: loaiPhieu,
      });
      const response = await Promise.race([createPromise, timeoutPromise]);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Failed to create supplier");
      }
    } catch (error) {
      let errorMessage = `Không thể tạo nhà cung cấp "${nhaCungCap.ten_ncc}"`;
      if (error.message === "Timeout") {
        errorMessage += ": Kết nối quá chậm, vui lòng thử lại";
      }
      throw new Error(errorMessage);
    }
  };

  const createHangHoaIfNeeded = async (hangHoa) => {
    if (!hangHoa?.isNewItem) {
      return hangHoa;
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 15000)
      );
      const createPromise = searchService.createHangHoaAuto({
        ten_hang_hoa: hangHoa.ten_hang_hoa,
        don_vi_tinh: "Cái",
      });
      const response = await Promise.race([createPromise, timeoutPromise]);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || "Failed to create product");
      }
    } catch (error) {
      let errorMessage = `Không thể tạo hàng hóa "${hangHoa.ten_hang_hoa}"`;
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

    if (data.loai_phieu === "dieu_chuyen" && !data.phong_ban_cung_cap) {
      toast.error("Vui lòng chọn đơn vị cung cấp");
      return;
    }

    if (
      (data.loai_phieu === "tu_mua" || data.loai_phieu === "tren_cap") &&
      !data.nha_cung_cap
    ) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return;
    }

    for (let i = 0; i < data.chi_tiet.length; i++) {
      const item = data.chi_tiet[i];
      if (!item.hang_hoa) {
        toast.error(`Dòng ${i + 1}: Vui lòng chọn hàng hóa`);
        return;
      }
      if (!item.so_luong_ke_hoach || item.so_luong_ke_hoach <= 0) {
        toast.error(`Dòng ${i + 1}: Số lượng kế hoạch phải lớn hơn 0`);
        return;
      }
      if (!item.so_luong || item.so_luong <= 0) {
        toast.error(`Dòng ${i + 1}: Số lượng thực nhập phải lớn hơn 0`);
        return;
      }
      if (item.don_gia === undefined || item.don_gia < 0) {
        toast.error(`Dòng ${i + 1}: Đơn giá không hợp lệ`);
        return;
      }
    }

    setLoading(true);

    try {
      toast.loading("Đang xử lý phiếu nhập...", { id: "processing" });

      let finalNhaCungCap = null;
      let finalPhongBanCungCap = null;

      if (
        (data.loai_phieu === "tu_mua" || data.loai_phieu === "tren_cap") &&
        data.nha_cung_cap
      ) {
        finalNhaCungCap = await createNhaCungCapIfNeeded(data.nha_cung_cap);
        if (finalNhaCungCap && data.nha_cung_cap.isNewItem) {
          toast.success(`✓ Đã tạo nhà cung cấp: ${finalNhaCungCap.ten_ncc}`);
        }
      } else if (data.loai_phieu === "dieu_chuyen" && data.phong_ban_cung_cap) {
        finalPhongBanCungCap = data.phong_ban_cung_cap;
        toast.success(`✓ Sẽ nhập từ: ${finalPhongBanCungCap.ten_phong_ban}`);
      }

      const finalChiTiet = [];
      for (let i = 0; i < data.chi_tiet.length; i++) {
        const item = data.chi_tiet[i];
        const finalHangHoa = await createHangHoaIfNeeded(item.hang_hoa);
        if (finalHangHoa && item.hang_hoa.isNewItem) {
          toast.success(`✓ Đã tạo hàng hóa: ${finalHangHoa.ten_hang_hoa}`);
        }

        finalChiTiet.push({
          hang_hoa_id: finalHangHoa.id,
          so_luong_ke_hoach: parseFloat(item.so_luong_ke_hoach),
          so_luong: parseFloat(item.so_luong_ke_hoach), // Số lượng thực tế = số lượng kế hoạch
          don_gia: parseFloat(item.don_gia),
          pham_chat: item.pham_chat,
          so_seri_list: item.danh_diem
            ? item.danh_diem
                .split(/[,\n]/)
                .map((s) => s.trim())
                .filter((s) => s)
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
        phong_ban_id: user?.phong_ban_id || null,
        chi_tiet: finalChiTiet,
      };

      const response = await nhapKhoService.create(submitData);
      toast.dismiss("processing");
      toast.success(
        `🎉 Tạo phiếu nhập thành công! Mã phiếu: ${
          response.data?.so_phieu || ""
        }`
      );

      if (data.loai_phieu === "dieu_chuyen") {
        setTimeout(() => {
          toast.info(
            `📦 Tồn kho của ${finalPhongBanCungCap?.ten_phong_ban} sẽ được tự động cập nhật`,
            { duration: 4000 }
          );
        }, 1000);
      }

      onSuccess?.();
    } catch (error) {
      console.error("Submit error:", error);
      toast.dismiss("processing");
      let errorMessage = "Có lỗi xảy ra khi tạo phiếu nhập";
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

  const PhongBanCungCapField = () => {
    if (loaiPhieu !== "tren_cap" && loaiPhieu !== "dieu_chuyen") {
      return null;
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Building className="inline h-4 w-4 mr-1" />
          Đơn vị cung cấp *
        </label>
        {loadingPhongBan ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm">
            Đang tải danh sách...
          </div>
        ) : phongBanCungCap.length > 0 ? (
          <select
            {...register("phong_ban_cung_cap_id", {
              required: "Vui lòng chọn đơn vị cung cấp",
            })}
            onChange={(e) => {
              const selectedId = parseInt(e.target.value);
              const selectedPhongBan = phongBanCungCap.find(
                (pb) => pb.id === selectedId
              );
              if (selectedPhongBan) {
                handlePhongBanCungCapSelect(selectedPhongBan);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Chọn đơn vị cung cấp</option>
            {phongBanCungCap.map((phongBan) => (
              <option key={phongBan.id} value={phongBan.id}>
                {phongBan.ten_phong_ban}
              </option>
            ))}
          </select>
        ) : (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
            Không có đơn vị cung cấp
          </div>
        )}
        {errors.phong_ban_cung_cap_id && (
          <p className="mt-1 text-sm text-red-600">
            {errors.phong_ban_cung_cap_id.message}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* THÔNG TIN CHUNG */}
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
                    {value}
                  </option>
                ))}
              </select>
              {errors.loai_phieu && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.loai_phieu.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số quyết định
              </label>
              <input
                type="text"
                {...register("so_quyet_dinh")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Nhập số quyết định"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <input
                type="text"
                {...register("ghi_chu")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Nhập ghi chú (nếu có)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do nhập *
              </label>
              <input
                type="text"
                {...register("ly_do_nhap", {
                  required: "Vui lòng nhập lý do nhập",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Nhập lý do nhập hàng"
              />
              {errors.ly_do_nhap && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.ly_do_nhap.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người nhập hàng
              </label>
              <input
                type="text"
                {...register("nguoi_nhap_hang")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Nhập tên người nhập hàng"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                placeholder="Nhập địa chỉ nhập hàng"
              />
            </div>
          </div>
        </div>

        {/* NHÀ CUNG CẤP HOẶC ĐƠN VỊ CUNG CẤP */}
        {loaiPhieu === "dieu_chuyen" ? (
          <div className="bg-white border rounded-lg p-4">
            <PhongBanCungCapField />
          </div>
        ) : (
          <div className="bg-white border rounded-lg p-4">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              <Building className="inline h-4 w-4 mr-1" />
              Nhà cung cấp *
            </label>
            <AutoComplete
              searchFunction={(query) =>
                searchService.searchNhaCungCapByType(query, loaiPhieu)
              }
              value={watch("nha_cung_cap")}
              onSelect={handleNhaCungCapSelect}
              placeholder="Tìm kiếm nhà cung cấp..."
              displayField="ten_ncc"
              searchField="ten_ncc"
              allowCreateOption={true}
              createNewLabel="Tạo nhà cung cấp mới"
              noResultsText="Không tìm thấy nhà cung cấp"
              minSearchLength={2}
            />
            {errors.nha_cung_cap_id && (
              <p className="mt-1 text-sm text-red-600">
                {errors.nha_cung_cap_id.message}
              </p>
            )}
          </div>
        )}

        {/* CHI TIẾT HÀNG HÓA */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Chi tiết hàng hóa
            </h3>
            <button
              type="button"
              onClick={addNewRow}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm hàng hóa</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hàng hóa *
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Số lượng kế hoạch *
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Phẩm chất
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thành tiền
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Xóa
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {fields.map((field, index) => {
                  const item = watch(`chi_tiet.${index}`) || {};
                  const thanhTien =
                    (parseFloat(item.so_luong_ke_hoach) || 0) *
                    (parseFloat(item.don_gia) || 0);

                  return (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>

                      {/* TÌM KIẾM HÀNG HÓA */}
                      <td className="px-4 py-3">
                        <AutoComplete
                          searchFunction={async (query) => {
                            try {
                              if (!query || query.length < 2) return [];
                              const results = await searchService.searchHangHoa(
                                query,
                                loaiPhieu
                              );
                              return results.filter((item) => !item.isNewItem);
                            } catch (error) {
                              console.error("Search error:", error);
                              return [];
                            }
                          }}
                          onSelect={(hangHoa) =>
                            handleHangHoaSelect(hangHoa, index)
                          }
                          placeholder="Nhập tên hàng hóa..."
                          displayField="ten_hang_hoa"
                          renderItem={(hangHoa) => (
                            <div className="p-2 hover:bg-gray-50">
                              <div className="font-medium text-gray-900">
                                {hangHoa.ten_hang_hoa}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="font-mono">
                                  {hangHoa.ma_hang_hoa}
                                </span>
                                {hangHoa.don_vi_tinh && (
                                  <span className="ml-2">
                                    • {hangHoa.don_vi_tinh}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          allowCreateOption={true}
                          createNewLabel="Tạo hàng hóa mới"
                          noResultsText="Không tìm thấy hàng hóa"
                          minSearchLength={2}
                        />
                        {errors.chi_tiet?.[index]?.hang_hoa_id && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.chi_tiet[index].hang_hoa_id.message}
                          </p>
                        )}
                      </td>

                      {/* SỐ LƯỢNG KẾ HOẠCH */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          {...register(`chi_tiet.${index}.so_luong_ke_hoach`, {
                            required: "Vui lòng nhập số lượng kế hoạch",
                            min: {
                              value: 1,
                              message: "Số lượng phải lớn hơn 0",
                            },
                          })}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            handleSoLuongKeHoachChange(value, index);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-green-500"
                          placeholder="0"
                        />
                        {errors.chi_tiet?.[index]?.so_luong_ke_hoach && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.chi_tiet[index].so_luong_ke_hoach.message}
                          </p>
                        )}
                      </td>

                      {/* ĐƠN GIÁ */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`chi_tiet.${index}.don_gia`)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-green-500"
                          placeholder="0"
                        />
                      </td>

                      {/* PHẨM CHẤT */}
                      <td className="px-4 py-3">
                        <select
                          {...register(`chi_tiet.${index}.pham_chat`)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                        >
                          {Object.entries(PHAM_CHAT).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* THÀNH TIỀN */}
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(thanhTien)}
                      </td>

                      {/* XÓA */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* TỔNG TIỀN */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">
              Tổng tiền:
            </span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(tongTien)}
            </span>
          </div>
        </div>

        {/* NÚT HÀNH ĐỘNG */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Đang xử lý..." : "Tạo phiếu nhập"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNhapKhoForm;
