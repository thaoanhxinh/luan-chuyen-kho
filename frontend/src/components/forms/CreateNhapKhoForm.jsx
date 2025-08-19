import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Building, AlertCircle } from "lucide-react";
import { searchService } from "../../services/searchService";
import { nhapKhoService } from "../../services/nhapKhoService";
import { hangHoaService } from "../../services/hangHoaService";
import { formatCurrency } from "../../utils/helpers";
import { LOAI_PHIEU_NHAP, PHAM_CHAT } from "../../utils/constants";
import AutoComplete from "../common/AutoComplete";
import toast from "react-hot-toast";

const CreateNhapKhoForm = ({ onSuccess, onCancel }) => {
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

  // Tải danh sách phòng ban có thể cung cấp khi thay đổi loại phiếu
  useEffect(() => {
    if (loaiPhieu === "tren_cap" || loaiPhieu === "dieu_chuyen") {
      loadPhongBanCungCap();
    } else {
      setPhongBanCungCap([]);
      setValue("phong_ban_cung_cap_id", null);
      setValue("phong_ban_cung_cap", null);
    }
  }, [loaiPhieu, setValue]);

  const loadPhongBanCungCap = async () => {
    try {
      setLoadingPhongBan(true);
      const response = await hangHoaService.getPhongBanCungCap({
        loai_phieu: loaiPhieu,
      });
      setPhongBanCungCap(response.data || []);
    } catch (error) {
      console.error("Error loading phong ban cung cap:", error);
      toast.error("Không thể tải danh sách phòng ban cung cấp");
      setPhongBanCungCap([]);
    } finally {
      setLoadingPhongBan(false);
    }
  };

  const tongTien = chiTietItems.reduce((sum, item) => {
    return sum + parseFloat(item.so_luong || 0) * parseFloat(item.don_gia || 0);
  }, 0);

  const handleNhaCungCapSelect = (nhaCungCap) => {
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

    // Validation theo loại phiếu
    if (
      (data.loai_phieu === "tren_cap" || data.loai_phieu === "dieu_chuyen") &&
      !data.phong_ban_cung_cap
    ) {
      toast.error("Vui lòng chọn đơn vị cung cấp");
      return;
    }

    if (data.loai_phieu === "tu_mua" && !data.nha_cung_cap) {
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

      // Xử lý nhà cung cấp hoặc phòng ban cung cấp
      if (data.loai_phieu === "tu_mua" && data.nha_cung_cap) {
        finalNhaCungCap = await createNhaCungCapIfNeeded(data.nha_cung_cap);
        if (finalNhaCungCap && data.nha_cung_cap.isNewItem) {
          toast.success(`✓ Đã tạo nhà cung cấp: ${finalNhaCungCap.ten_ncc}`);
        }
      } else if (
        (data.loai_phieu === "tren_cap" || data.loai_phieu === "dieu_chuyen") &&
        data.phong_ban_cung_cap
      ) {
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
          so_luong: parseFloat(item.so_luong),
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
        chi_tiet: finalChiTiet,
      };

      const response = await nhapKhoService.create(submitData);

      toast.dismiss("processing");
      toast.success(
        `🎉 Tạo phiếu nhập thành công! Mã phiếu: ${
          response.data?.so_phieu || ""
        }`
      );

      // Hiển thị thông báo liên kết nếu có
      if (data.loai_phieu === "tren_cap" || data.loai_phieu === "dieu_chuyen") {
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

  // Component hiển thị thông tin phòng ban cung cấp
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
            onChange={(e) => {
              const selectedId = parseInt(e.target.value);
              const selectedPhongBan = phongBanCungCap.find(
                (pb) => pb.id === selectedId
              );
              if (selectedPhongBan) {
                handlePhongBanCungCapSelect(selectedPhongBan);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
            defaultValue=""
          >
            <option value="">-- Chọn đơn vị cung cấp --</option>
            {phongBanCungCap.map((pb) => (
              <option key={pb.id} value={pb.id}>
                {pb.ten_phong_ban} (Cấp {pb.cap_bac})
              </option>
            ))}
          </select>
        ) : (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-red-50 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            Không có đơn vị nào có thể cung cấp cho bạn
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-2">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="Số quyết định"
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
            {/* Nhà cung cấp - chỉ hiện khi tự mua */}
            {loaiPhieu === "tu_mua" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhà cung cấp *
                </label>
                <AutoComplete
                  searchFunction={searchService.searchNhaCungCap}
                  onSelect={handleNhaCungCapSelect}
                  placeholder="Nhập tên nhà cung cấp..."
                  displayField="ten_ncc"
                  createLabel="Sẽ tạo nhà cung cấp mới"
                  className="w-full"
                  allowCreate={true}
                />
              </div>
            )}

            {/* Phòng ban cung cấp - hiện khi từ trên cấp hoặc điều chuyển */}
            <PhongBanCungCapField />

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
                placeholder="Lý do nhập kho"
              />
            </div>
          </div>
        </div>

        {/* Phần thông báo quan trọng */}
        {(loaiPhieu === "tren_cap" || loaiPhieu === "dieu_chuyen") && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Lưu ý quan trọng:</strong> Khi phiếu nhập được hoàn
                  thành, hệ thống sẽ tự động tạo phiếu xuất tương ứng cho đơn vị
                  cung cấp và trừ tồn kho của họ.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border rounded-lg">
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

          <div>
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
                            searchFunction={searchService.searchHangHoa}
                            onSelect={(hangHoa) =>
                              handleHangHoaSelect(hangHoa, index)
                            }
                            placeholder="Nhập tên hàng hóa..."
                            displayField="ten_hang_hoa"
                            className="w-full"
                            allowCreate={true}
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
                            onChange={(e) => {
                              setValue(
                                `chi_tiet.${index}.so_luong`,
                                e.target.value
                              );
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
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
                                {typeof value === "object"
                                  ? value.label
                                  : value}
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
                      currentItem.hang_hoa?.isNewItem ? (
                        <tr>
                          <td></td>
                          <td
                            colSpan="8"
                            className="px-3 py-1 text-xs text-gray-500"
                          >
                            {currentItem.hang_hoa &&
                              !currentItem.hang_hoa.isNewItem && (
                                <span className="text-green-600">
                                  ✓ {currentItem.hang_hoa.ma_hang_hoa} -{" "}
                                  {currentItem.hang_hoa.don_vi_tinh}
                                </span>
                              )}
                            {currentItem.hang_hoa?.isNewItem && (
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
            <span>{loading ? "Đang xử lý..." : "Tạo phiếu nhập"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNhapKhoForm;
