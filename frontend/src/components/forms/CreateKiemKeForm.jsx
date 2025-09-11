import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  Users,
  Building,
  FileText,
} from "lucide-react";
import { searchService } from "../../services/searchService";
import { kiemKeService } from "../../services/kiemKeService";
import { formatCurrency, formatNumber } from "../../utils/helpers";
import { LOAI_KIEM_KE, PHAM_CHAT } from "../../utils/constants";
import AutoComplete from "../common/AutoComplete";
import toast from "react-hot-toast";

const CreateKiemKeForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [loadingTonKho, setLoadingTonKho] = useState(false);
  const [danhSachTonKho, setDanhSachTonKho] = useState([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ngay_kiem_ke: new Date().toISOString().split("T")[0],
      gio_kiem_ke: "08:00",
      so_quyet_dinh: "",
      don_vi_kiem_ke: "",
      ly_do_kiem_ke: "Kiểm kê định kỳ",
      loai_kiem_ke: "dinh_ky",
      ghi_chu: "",
      // Thông tin tổ kiểm kê (JSONB)
      to_kiem_ke: {
        to_truong: "",
        uy_vien_1: "",
        uy_vien_2: "",
        uy_vien_3: "",
        uy_vien_4: "",
        thu_kho: "",
      },
      chi_tiet: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "chi_tiet",
  });

  const chiTietItems = watch("chi_tiet");

  // Lấy danh sách tồn kho khi component mount
  useEffect(() => {
    fetchTonKhoData();
  }, []);

  const fetchTonKhoData = async () => {
    try {
      setLoadingTonKho(true);
      const response = await kiemKeService.getHangHoaForKiemKe();
      setDanhSachTonKho(response.data || []);
    } catch (error) {
      console.error("Error fetching ton kho:", error);
      toast.error("Không thể lấy danh sách tồn kho");
    } finally {
      setLoadingTonKho(false);
    }
  };

  // Thêm tất cả hàng hóa có tồn kho vào danh sách kiểm kê
  const addAllTonKho = () => {
    if (danhSachTonKho.length === 0) {
      toast.error("Không có hàng hóa nào để kiểm kê");
      return;
    }

    // Xóa tất cả chi tiết hiện tại
    while (fields.length > 0) {
      remove(0);
    }

    // Thêm tất cả hàng hóa có tồn kho
    danhSachTonKho.forEach((item, idx) => {
      const hangHoaData = {
        id: item.hang_hoa_id,
        ma_hang_hoa: item.ma_hang_hoa,
        ten_hang_hoa: item.ten_hang_hoa,
        don_vi_tinh: item.don_vi_tinh,
      };

      append({
        hang_hoa_id: item.hang_hoa_id,
        hang_hoa: hangHoaData,
        so_luong_so_sach: parseFloat(item.so_luong_ton || 0),
        sl_tot: parseFloat(item.sl_tot || 0),
        sl_kem_pham_chat: parseFloat(item.sl_kem_pham_chat || 0),
        sl_mat_pham_chat: parseFloat(item.sl_mat_pham_chat || 0),
        sl_hong: parseFloat(item.sl_hong || 0),
        sl_can_thanh_ly: parseFloat(item.sl_can_thanh_ly || 0),
        don_gia: parseFloat(item.don_gia_moi_nhat || 0),
        ly_do_chenh_lech: "",
        de_nghi_xu_ly: "",
        danh_sach_seri_kiem_ke: [],
      });

      // Set giá trị hang_hoa sau khi append để đảm bảo hiển thị
      setTimeout(() => {
        setValue(`chi_tiet.${idx}.hang_hoa`, hangHoaData);
      }, 10);
    });

    toast.success(
      `Đã thêm ${danhSachTonKho.length} mặt hàng vào danh sách kiểm kê`
    );
  };

  // Thêm hàng hóa thủ công
  const addNewRow = () => {
    append({
      hang_hoa_id: null,
      hang_hoa: null,
      so_luong_so_sach: 0,
      sl_tot: 0,
      sl_kem_pham_chat: 0,
      sl_mat_pham_chat: 0,
      sl_hong: 0,
      sl_can_thanh_ly: 0,
      don_gia: 0,
      ly_do_chenh_lech: "",
      de_nghi_xu_ly: "",
      danh_sach_seri_kiem_ke: [],
    });
  };

  // Xử lý chọn hàng hóa
  const handleHangHoaSelect = (hangHoa, index) => {
    setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id);
    setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);

    // Tìm thông tin tồn kho hiện tại
    const tonKhoInfo = danhSachTonKho.find(
      (item) => item.hang_hoa_id === hangHoa.id
    );

    if (tonKhoInfo) {
      setValue(
        `chi_tiet.${index}.so_luong_so_sach`,
        parseFloat(tonKhoInfo.so_luong_ton || 0)
      );
      setValue(`chi_tiet.${index}.sl_tot`, parseFloat(tonKhoInfo.sl_tot || 0));
      setValue(
        `chi_tiet.${index}.sl_kem_pham_chat`,
        parseFloat(tonKhoInfo.sl_kem_pham_chat || 0)
      );
      setValue(
        `chi_tiet.${index}.sl_mat_pham_chat`,
        parseFloat(tonKhoInfo.sl_mat_pham_chat || 0)
      );
      setValue(
        `chi_tiet.${index}.sl_hong`,
        parseFloat(tonKhoInfo.sl_hong || 0)
      );
      setValue(
        `chi_tiet.${index}.sl_can_thanh_ly`,
        parseFloat(tonKhoInfo.sl_can_thanh_ly || 0)
      );
      setValue(
        `chi_tiet.${index}.don_gia`,
        parseFloat(tonKhoInfo.don_gia_moi_nhat || 0)
      );

      toast.success(
        `Đã tự động điền thông tin tồn kho cho ${hangHoa.ten_hang_hoa}`
      );
    } else {
      toast.info(
        `Đã chọn ${hangHoa.ten_hang_hoa}. Vui lòng nhập thông tin kiểm kê.`
      );
    }
  };

  const onSubmit = async (data) => {
    if (data.chi_tiet.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hàng hóa để kiểm kê");
      return;
    }

    // Validation chi tiết
    for (let i = 0; i < data.chi_tiet.length; i++) {
      const item = data.chi_tiet[i];
      if (!item.hang_hoa) {
        toast.error(`Dòng ${i + 1}: Vui lòng chọn hàng hóa`);
        return;
      }
      if (item.don_gia < 0) {
        toast.error(`Dòng ${i + 1}: Đơn giá không hợp lệ`);
        return;
      }
    }

    setLoading(true);

    try {
      toast.loading("Đang tạo phiếu kiểm kê...", { id: "processing" });

      // Chuẩn bị dữ liệu chi tiết
      const chiTietData = data.chi_tiet.map((item) => ({
        hang_hoa_id: item.hang_hoa.id,
        so_luong_so_sach: parseFloat(item.so_luong_so_sach || 0),
        sl_tot: parseFloat(item.sl_tot || 0),
        sl_kem_pham_chat: parseFloat(item.sl_kem_pham_chat || 0),
        sl_mat_pham_chat: parseFloat(item.sl_mat_pham_chat || 0),
        sl_hong: parseFloat(item.sl_hong || 0),
        sl_can_thanh_ly: parseFloat(item.sl_can_thanh_ly || 0),
        don_gia: parseFloat(item.don_gia || 0),
        ly_do_chenh_lech: item.ly_do_chenh_lech || "",
        de_nghi_xu_ly: item.de_nghi_xu_ly || "",
        danh_sach_seri_kiem_ke: item.danh_sach_seri_kiem_ke || [],
      }));

      // Tạo phiếu kiểm kê
      const submitData = {
        ngay_kiem_ke: data.ngay_kiem_ke,
        gio_kiem_ke: data.gio_kiem_ke,
        so_quyet_dinh: data.so_quyet_dinh,
        don_vi_kiem_ke: data.don_vi_kiem_ke,
        ly_do_kiem_ke: data.ly_do_kiem_ke,
        loai_kiem_ke: data.loai_kiem_ke,
        ghi_chu: data.ghi_chu,
        to_kiem_ke: data.to_kiem_ke,
        chi_tiet: chiTietData,
      };

      const response = await kiemKeService.create(submitData);

      toast.dismiss("processing");
      toast.success(
        `🎉 Tạo phiếu kiểm kê thành công! Mã phiếu: ${
          response.data?.so_phieu || ""
        }. Phiếu sẽ ở trạng thái nháp và chỉ cập nhật tồn kho khi được duyệt.`
      );
      onSuccess?.("create");
    } catch (error) {
      console.error("Submit error:", error);
      toast.dismiss("processing");

      let errorMessage = "Có lỗi xảy ra khi tạo phiếu kiểm kê";

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

  // Tính tổng chênh lệch
  const tongChenhLech = chiTietItems.reduce((sum, item) => {
    const tonThuc =
      parseFloat(item.sl_tot || 0) +
      parseFloat(item.sl_kem_pham_chat || 0) +
      parseFloat(item.sl_mat_pham_chat || 0) +
      parseFloat(item.sl_hong || 0) +
      parseFloat(item.sl_can_thanh_ly || 0);
    const tonSo = parseFloat(item.so_luong_so_sach || 0);
    return sum + (tonThuc - tonSo);
  }, 0);

  const tongGiaTriChenhLech = chiTietItems.reduce((sum, item) => {
    const tonThuc =
      parseFloat(item.sl_tot || 0) +
      parseFloat(item.sl_kem_pham_chat || 0) +
      parseFloat(item.sl_mat_pham_chat || 0) +
      parseFloat(item.sl_hong || 0) +
      parseFloat(item.sl_can_thanh_ly || 0);
    const tonSo = parseFloat(item.so_luong_so_sach || 0);
    const chenhLech = tonThuc - tonSo;
    return sum + chenhLech * parseFloat(item.don_gia || 0);
  }, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Lưu ý:</strong> Phiếu kiểm kê sẽ được tạo ở trạng thái
              nháp. Tồn kho chỉ được cập nhật khi Admin duyệt phiếu.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Thông tin phiếu kiểm kê */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Thông tin phiếu kiểm kê
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Ngày kiểm kê *
              </label>
              <input
                type="date"
                {...register("ngay_kiem_ke", {
                  required: "Vui lòng chọn ngày kiểm kê",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              {errors.ngay_kiem_ke && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.ngay_kiem_ke.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Giờ kiểm kê *
              </label>
              <input
                type="time"
                {...register("gio_kiem_ke", {
                  required: "Vui lòng chọn giờ kiểm kê",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              {errors.gio_kiem_ke && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.gio_kiem_ke.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline w-4 h-4 mr-1" />
                Số quyết định
              </label>
              <input
                type="text"
                {...register("so_quyet_dinh")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Ví dụ: 123/QĐ-UBND"
              />
              {errors.so_quyet_dinh && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.so_quyet_dinh.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline w-4 h-4 mr-1" />
                Đơn vị kiểm kê *
              </label>
              <input
                type="text"
                {...register("don_vi_kiem_ke", {
                  required: "Vui lòng nhập đơn vị kiểm kê",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Ví dụ: Ngành Xe máy/ Ban TMKT/ Phòng Hậu cần - Kỹ thuật"
              />
              {errors.don_vi_kiem_ke && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.don_vi_kiem_ke.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại kiểm kê
              </label>
              <select
                {...register("loai_kiem_ke")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                {Object.entries(LOAI_KIEM_KE).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do kiểm kê
              </label>
              <input
                type="text"
                {...register("ly_do_kiem_ke")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Lý do thực hiện kiểm kê"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <input
                type="text"
                rows={3}
                {...register("ghi_chu")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Ghi chú thêm (nếu có)"
              />
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Thông tin tổ kiểm kê
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tổ trưởng
              </label>
              <input
                type="text"
                {...register("to_kiem_ke.to_truong")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Họ tên tổ trưởng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thủ kho
              </label>
              <input
                type="text"
                {...register("to_kiem_ke.thu_kho")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Họ tên thủ kho"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ủy viên 1
              </label>
              <input
                type="text"
                {...register("to_kiem_ke.uy_vien_1")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Họ tên ủy viên 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ủy viên 2
              </label>
              <input
                type="text"
                {...register("to_kiem_ke.uy_vien_2")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Họ tên ủy viên 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ủy viên 3
              </label>
              <input
                type="text"
                {...register("to_kiem_ke.uy_vien_3")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Họ tên ủy viên 3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ủy viên 4
              </label>
              <input
                type="text"
                {...register("to_kiem_ke.uy_vien_4")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Họ tên ủy viên 4"
              />
            </div>
          </div>
        </div>

        {/* Chi tiết hàng hóa kiểm kê */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              Chi tiết hàng hóa kiểm kê ({fields.length} mặt hàng)
            </h4>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={addAllTonKho}
                disabled={loadingTonKho || danhSachTonKho.length === 0}
                className="px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded text-sm transition-all disabled:opacity-50"
                title="Thêm tất cả hàng hóa có tồn kho"
              >
                {loadingTonKho ? "Đang tải..." : "Thêm tất cả tồn kho"}
              </button>
              <button
                type="button"
                onClick={addNewRow}
                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-all"
                title="Thêm dòng thủ công"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase w-[3%]">
                    STT
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase w-[15%]">
                    Hàng hóa *
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[8%]">
                    Tồn sổ
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[8%]">
                    Tốt
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[8%]">
                    Kém PC
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[8%]">
                    Mất PC
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[8%]">
                    Hỏng
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[8%]">
                    Thanh lý
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[8%]">
                    Chênh lệch
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[10%]">
                    Đơn giá
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[12%]">
                    Lý do/Đề nghị
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[4%]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fields.map((field, index) => {
                  const currentItem = chiTietItems[index] || {};
                  const tonThuc =
                    parseFloat(currentItem.sl_tot || 0) +
                    parseFloat(currentItem.sl_kem_pham_chat || 0) +
                    parseFloat(currentItem.sl_mat_pham_chat || 0) +
                    parseFloat(currentItem.sl_hong || 0) +
                    parseFloat(currentItem.sl_can_thanh_ly || 0);
                  const tonSo = parseFloat(currentItem.so_luong_so_sach || 0);
                  const chenhLech = tonThuc - tonSo;

                  return (
                    <React.Fragment key={field.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-2 py-2 text-center text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-2 py-2">
                          <div className="min-w-[200px]">
                            {currentItem.hang_hoa ? (
                              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                                <div className="font-medium text-green-800">
                                  {currentItem.hang_hoa.ten_hang_hoa}
                                </div>
                              </div>
                            ) : (
                              <AutoComplete
                                searchFunction={searchService.searchHangHoa}
                                onSelect={(hangHoa) =>
                                  handleHangHoaSelect(hangHoa, index)
                                }
                                placeholder="Nhập tên hàng hóa..."
                                displayField="ten_hang_hoa"
                                className="min-w-[200px]"
                                allowCreate={false}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            {...register(`chi_tiet.${index}.so_luong_so_sach`)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                            readOnly
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            {...register(`chi_tiet.${index}.sl_tot`)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            {...register(`chi_tiet.${index}.sl_kem_pham_chat`)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            {...register(`chi_tiet.${index}.sl_mat_pham_chat`)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            {...register(`chi_tiet.${index}.sl_hong`)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            {...register(`chi_tiet.${index}.sl_can_thanh_ly`)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                          />
                        </td>
                        <td className="px-2 py-2 text-right font-medium">
                          <span
                            className={`text-sm ${
                              chenhLech > 0
                                ? "text-green-600"
                                : chenhLech < 0
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          >
                            {chenhLech > 0 ? "+" : ""}
                            {formatNumber(chenhLech)}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            {...register(`chi_tiet.${index}.don_gia`)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="space-y-1">
                            <input
                              type="text"
                              {...register(
                                `chi_tiet.${index}.ly_do_chenh_lech`
                              )}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              placeholder="Lý do chênh lệch"
                            />
                            <input
                              type="text"
                              {...register(`chi_tiet.${index}.de_nghi_xu_ly`)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              placeholder="Đề nghị xử lý"
                            />
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
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
                    </React.Fragment>
                  );
                })}
                {fields.length > 0 && (
                  <tr className="bg-blue-50 font-bold">
                    <td
                      colSpan="8"
                      className="px-2 py-3 text-right text-gray-900"
                    >
                      TỔNG CHÊNH LỆCH:
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span
                        className={`text-lg ${
                          tongChenhLech > 0
                            ? "text-green-600"
                            : tongChenhLech < 0
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {tongChenhLech > 0 ? "+" : ""}
                        {formatNumber(tongChenhLech)}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span
                        className={`text-lg ${
                          tongGiaTriChenhLech > 0
                            ? "text-green-600"
                            : tongGiaTriChenhLech < 0
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {tongGiaTriChenhLech > 0 ? "+" : ""}
                        {formatCurrency(tongGiaTriChenhLech)}
                      </span>
                    </td>
                    <td colSpan="2"></td>
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
            disabled={loading || fields.length === 0}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>
              {loading ? "Đang xử lý..." : "Tạo phiếu kiểm kê (Nháp)"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateKiemKeForm;
