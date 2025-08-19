import React, { useState, useEffect } from "react";
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
  const [phongBanNhanList, setPhongBanNhanList] = useState([]);
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
      ngay_xuat: new Date().toISOString().split("T")[0],
      loai_xuat: Object.keys(LOAI_PHIEU_XUAT)[0], // Loại đầu tiên
      so_quyet_dinh: "",
      nguoi_nhan: "",
      ly_do_xuat: "",
      ghi_chu: "",
      phong_ban_nhan_id: null,
      phong_ban_nhan: null,
      chi_tiet: [
        {
          hang_hoa_id: null,
          hang_hoa: null,
          so_luong_yeu_cau: 1,
          so_luong_thuc_xuat: 1,
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
  const phongBanNhanData = watch("phong_ban_nhan");

  // Load danh sách phòng ban nhận ngay khi component mount
  useEffect(() => {
    loadPhongBanNhanList();
  }, []);

  const loadPhongBanNhanList = async () => {
    try {
      setLoadingPhongBan(true);
      const response = await xuatKhoService.getPhongBanNhanHang();
      setPhongBanNhanList(response.data || []);
    } catch (error) {
      console.error("Error loading phong ban nhan hang:", error);
      toast.error("Không thể tải danh sách phòng ban nhận hàng");
      setPhongBanNhanList([]);
    } finally {
      setLoadingPhongBan(false);
    }
  };

  const tongTienThucTe = chiTietItems.reduce((sum, item) => {
    const soLuongThucXuat = item.so_luong_thuc_xuat || 0;
    return sum + parseFloat(soLuongThucXuat) * parseFloat(item.don_gia || 0);
  }, 0);

  // Xử lý chọn phòng ban nhận
  const handlePhongBanNhanSelect = (phongBan) => {
    setValue("phong_ban_nhan_id", phongBan.id || null);
    setValue("phong_ban_nhan", phongBan);
    toast.success(`Đã chọn phòng ban nhận: ${phongBan.ten_phong_ban}`);
  };

  const handleHangHoaSelect = async (hangHoa, index) => {
    setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id || null);
    setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);

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

        if (tonKhoItem.don_gia_binh_quan > 0) {
          setValue(`chi_tiet.${index}.don_gia`, tonKhoItem.don_gia_binh_quan);
        }

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
      so_luong_thuc_xuat: 1,
      don_gia: 0,
    });
  };

  const onSubmit = async (data) => {
    if (data.chi_tiet.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hàng hóa");
      return;
    }

    // Kiểm tra phải chọn phòng ban nhận
    if (!data.phong_ban_nhan) {
      toast.error("Vui lòng chọn phòng ban nhận");
      return;
    }

    // Validation chi tiết
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
      if (!item.so_luong_thuc_xuat || item.so_luong_thuc_xuat <= 0) {
        toast.error(`Dòng ${i + 1}: Số lượng thực xuất phải lớn hơn 0`);
        return;
      }
      if (item.don_gia === undefined || item.don_gia <= 0) {
        toast.error(`Dòng ${i + 1}: Đơn giá không hợp lệ`);
        return;
      }

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

      const finalChiTiet = data.chi_tiet.map((item) => ({
        hang_hoa_id: item.hang_hoa.id,
        so_luong_yeu_cau: parseFloat(item.so_luong_yeu_cau),
        so_luong_thuc_xuat: parseFloat(item.so_luong_thuc_xuat),
        don_gia: parseFloat(item.don_gia),
        ghi_chu: item.ghi_chu || null,
      }));

      const submitData = {
        ngay_xuat: data.ngay_xuat,
        loai_xuat: data.loai_xuat,
        so_quyet_dinh: data.so_quyet_dinh || "",
        nguoi_nhan: data.nguoi_nhan || "",
        ly_do_xuat: data.ly_do_xuat || "",
        ghi_chu: data.ghi_chu || "",
        // Chỉ có phòng ban nhận (xuất nội bộ)
        phong_ban_nhan_id: data.phong_ban_nhan?.id || null,
        don_vi_nhan_id: null, // Luôn null vì chỉ xuất nội bộ
        chi_tiet: finalChiTiet,
      };

      const response = await xuatKhoService.create(submitData);

      toast.dismiss("processing");
      toast.success(
        `🎉 Tạo phiếu xuất thành công! Mã phiếu: ${
          response.data?.so_phieu || ""
        }`
      );

      // Hiển thị thông báo về quy trình 3 cấp
      setTimeout(() => {
        toast.info(
          `📦 Khi phiếu được duyệt, hệ thống sẽ tự động tạo phiếu nhập cho ${data.phong_ban_nhan?.ten_phong_ban}`,
          { duration: 4000 }
        );
      }, 1000);

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
            Phòng ban nhận *
          </label>
          {loadingPhongBan ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Đang tải danh sách...
              </div>
            </div>
          ) : phongBanNhanList.length > 0 ? (
            <select
              onChange={(e) => {
                const selectedId = parseInt(e.target.value);
                if (selectedId) {
                  const selectedPhongBan = phongBanNhanList.find(
                    (pb) => pb.id === selectedId
                  );
                  if (selectedPhongBan) {
                    handlePhongBanNhanSelect(selectedPhongBan);
                  }
                } else {
                  // Clear selection
                  setValue("phong_ban_nhan_id", null);
                  setValue("phong_ban_nhan", null);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
              defaultValue=""
            >
              <option value="">-- Chọn phòng ban nhận --</option>
              {phongBanNhanList.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {pb.ten_phong_ban} (Cấp {pb.cap_bac})
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50 text-sm text-yellow-700 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Không có phòng ban khả dụng
              <button
                type="button"
                onClick={loadPhongBanNhanList}
                className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
              >
                Tải lại
              </button>
            </div>
          )}

          {phongBanNhanData && (
            <div className="mt-1 text-xs text-green-600">
              ✓ {phongBanNhanData.ma_phong_ban} - Cấp {phongBanNhanData.cap_bac}
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

      {/* Thông báo hướng dẫn */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Quy trình 3 cấp:</strong> Khi phiếu xuất được duyệt, hệ
              thống sẽ tự động tạo phiếu nhập tương ứng cho phòng ban nhận và
              cộng tồn kho cho họ.
            </p>
          </div>
        </div>
      </div>

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
                  SL thực xuất *
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
                          <div className="space-y-1">
                            <span
                              className={`font-medium ${
                                tonKhoItem.so_luong_co_the_xuat > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {tonKhoItem.so_luong_co_the_xuat}
                            </span>
                            {tonKhoItem.so_luong_dang_cho_xuat > 0 && (
                              <div className="text-xs text-orange-600">
                                Chờ xuất: {tonKhoItem.so_luong_dang_cho_xuat}
                              </div>
                            )}
                            {tonKhoItem.canh_bao && (
                              <div className="text-xs text-red-600">
                                ⚠️ {tonKhoItem.canh_bao}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
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
                        onChange={(e) => {
                          setValue(
                            `chi_tiet.${index}.so_luong_thuc_xuat`,
                            e.target.value
                          );
                        }}
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
                        {...register(`chi_tiet.${index}.so_luong_thuc_xuat`, {
                          required: "Vui lòng nhập số lượng thực xuất",
                          min: {
                            value: 1,
                            message: "Số lượng phải lớn hơn 0",
                          },
                        })}
                        className="w-20 px-1 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                        {formatCurrency(thanhTienThucTe)}
                      </div>
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

        <div className="mt-3 flex justify-end">
          <div className="bg-gray-50 px-4 py-2 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              Tổng tiền thực tế: {formatCurrency(tongTienThucTe)}
            </div>
          </div>
        </div>
      </div>

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
