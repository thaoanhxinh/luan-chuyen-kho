/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { kiemKeService } from "../../services/kiemKeService";
import { searchService } from "../../services/searchService";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Search,
  Calendar,
  Clock,
  Users,
  Building,
  FileText,
} from "lucide-react";
import { formatNumber, formatCurrency } from "../../utils/helpers";
import { LOAI_KIEM_KE } from "../../utils/constants";
import Loading from "../common/Loading";
import AutoComplete from "../common/AutoComplete";

const EditKiemKeForm = ({ phieuId, onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hangHoaList, setHangHoaList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [danhSachTonKho, setDanhSachTonKho] = useState([]);
  const [loadingTonKho, setLoadingTonKho] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ngay_kiem_ke: "",
      gio_kiem_ke: "",
      so_quyet_dinh: "",
      don_vi_kiem_ke: "",
      ly_do_kiem_ke: "",
      loai_kiem_ke: "dinh_ky",
      ghi_chu: "",
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

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "chi_tiet",
  });

  const chiTietItems = watch("chi_tiet");

  // Fetch dữ liệu phiếu kiểm kê và danh sách hàng hóa
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [phieuResponse, hangHoaResponse] = await Promise.all([
          kiemKeService.getDetail(phieuId),
          kiemKeService.getHangHoaForKiemKe({ phieu_id: phieuId }),
        ]);

        const phieuData = phieuResponse.data;

        // Parse to_kiem_ke nếu là string
        let toKiemKe = phieuData.to_kiem_ke;
        if (typeof toKiemKe === "string") {
          try {
            toKiemKe = JSON.parse(toKiemKe);
          } catch (error) {
            toKiemKe = {
              to_truong: "",
              uy_vien_1: "",
              uy_vien_2: "",
              uy_vien_3: "",
              uy_vien_4: "",
              thu_kho: "",
            };
          }
        }

        // Format ngày
        const ngayKiemKe = phieuData.ngay_kiem_ke
          ? new Date(phieuData.ngay_kiem_ke).toISOString().split("T")[0]
          : "";

        // Chuẩn bị dữ liệu chi tiết
        const chiTietData =
          phieuData.chi_tiet?.map((item) => ({
            hang_hoa_id: item.hang_hoa_id,
            hang_hoa: {
              id: item.hang_hoa_id,
              ma_hang_hoa: item.ma_hang_hoa,
              ten_hang_hoa: item.ten_hang_hoa,
              don_vi_tinh: item.don_vi_tinh,
            },
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
          })) || [];

        // Reset form với dữ liệu
        reset({
          ngay_kiem_ke: ngayKiemKe,
          gio_kiem_ke: phieuData.gio_kiem_ke || "",
          so_quyet_dinh: phieuData.so_quyet_dinh || "",
          don_vi_kiem_ke: phieuData.don_vi_kiem_ke || "",
          ly_do_kiem_ke: phieuData.ly_do_kiem_ke || "",
          loai_kiem_ke: phieuData.loai_kiem_ke || "dinh_ky",
          ghi_chu: phieuData.ghi_chu || "",
          to_kiem_ke: toKiemKe,
          chi_tiet: chiTietData,
        });

        setHangHoaList(hangHoaResponse.data || []);

        // Fetch danh sách tồn kho
        await fetchTonKhoData();
      } catch (error) {
        toast.error("Không thể tải dữ liệu phiếu kiểm kê.");
        console.error("Fetch data for edit error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [phieuId, reset]);

  // Lấy danh sách tồn kho
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
    replace([]);

    // Thêm tất cả hàng hóa có tồn kho
    const newChiTiet = danhSachTonKho.map((item) => {
      const hangHoaData = {
        id: item.hang_hoa_id,
        ma_hang_hoa: item.ma_hang_hoa,
        ten_hang_hoa: item.ten_hang_hoa,
        don_vi_tinh: item.don_vi_tinh,
      };

      return {
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
      };
    });

    replace(newChiTiet);
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
    // Kiểm tra trùng lặp
    const existingIndex = chiTietItems.findIndex(
      (item, idx) => idx !== index && item.hang_hoa_id === hangHoa.id
    );

    if (existingIndex !== -1) {
      toast.error("Hàng hóa này đã có trong phiếu.");
      return;
    }

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

  // Xử lý submit form
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

    setIsSubmitting(true);

    try {
      toast.loading("Đang cập nhật phiếu kiểm kê...", { id: "processing" });

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

      // Cập nhật phiếu kiểm kê
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

      await kiemKeService.update(phieuId, submitData);

      toast.dismiss("processing");
      toast.success("Cập nhật phiếu kiểm kê thành công!");
      onSuccess?.();
    } catch (error) {
      console.error("Submit edit form error:", error);
      toast.dismiss("processing");

      let errorMessage = "Có lỗi xảy ra khi cập nhật phiếu kiểm kê";

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
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loading />;

  // Lọc hàng hóa theo từ khóa tìm kiếm
  const filteredHangHoa = hangHoaList.filter(
    (hh) =>
      hh.ten_hang_hoa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hh.ma_hang_hoa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="p-4 space-y-4 bg-gray-50">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Chỉnh sửa phiếu kiểm kê:</strong> Chỉ có thể chỉnh sửa
              phiếu ở trạng thái Nháp. Tồn kho sẽ được cập nhật khi Admin duyệt
              phiếu.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Thông tin phiếu kiểm kê */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <input
                type="text"
                {...register("ghi_chu")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Ghi chú thêm (nếu có)"
              />
            </div>
          </div>
        </div>

        {/* Thông tin tổ kiểm kê */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
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

          {/* Phần tìm kiếm và thêm hàng hóa */}
          <div className="p-4 border-b bg-gray-50">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Search size={16} className="text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm hàng hóa để thêm vào phiếu..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              {searchTerm && (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                  {filteredHangHoa.length > 0 ? (
                    filteredHangHoa.slice(0, 10).map((hangHoa) => (
                      <div
                        key={hangHoa.hang_hoa_id}
                        className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          // Kiểm tra trùng lặp
                          const exists = chiTietItems.some(
                            (item) => item.hang_hoa_id === hangHoa.hang_hoa_id
                          );

                          if (exists) {
                            toast.error("Hàng hóa này đã có trong phiếu.");
                            return;
                          }

                          // Thêm hàng hóa mới
                          const hangHoaData = {
                            id: hangHoa.hang_hoa_id,
                            ma_hang_hoa: hangHoa.ma_hang_hoa,
                            ten_hang_hoa: hangHoa.ten_hang_hoa,
                            don_vi_tinh: hangHoa.don_vi_tinh,
                          };

                          append({
                            hang_hoa_id: hangHoa.hang_hoa_id,
                            hang_hoa: hangHoaData,
                            so_luong_so_sach: parseFloat(
                              hangHoa.so_luong_ton || 0
                            ),
                            sl_tot: parseFloat(hangHoa.sl_tot || 0),
                            sl_kem_pham_chat: parseFloat(
                              hangHoa.sl_kem_pham_chat || 0
                            ),
                            sl_mat_pham_chat: parseFloat(
                              hangHoa.sl_mat_pham_chat || 0
                            ),
                            sl_hong: parseFloat(hangHoa.sl_hong || 0),
                            sl_can_thanh_ly: parseFloat(
                              hangHoa.sl_can_thanh_ly || 0
                            ),
                            don_gia: parseFloat(hangHoa.don_gia_moi_nhat || 0),
                            ly_do_chenh_lech: "",
                            de_nghi_xu_ly: "",
                            danh_sach_seri_kiem_ke: [],
                          });

                          setSearchTerm("");
                          toast.success(
                            `Đã thêm ${hangHoa.ten_hang_hoa} vào phiếu`
                          );
                        }}
                      >
                        <div className="font-medium text-gray-900">
                          {hangHoa.ten_hang_hoa}
                        </div>
                        <div className="text-sm text-gray-500">
                          Mã: {hangHoa.ma_hang_hoa} | ĐVT: {hangHoa.don_vi_tinh}{" "}
                          | Tồn: {formatNumber(hangHoa.so_luong_ton || 0)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-center">
                      Không tìm thấy hàng hóa nào
                    </div>
                  )}
                </div>
              )}
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
                                <div className="text-green-600">
                                  Mã: {currentItem.hang_hoa.ma_hang_hoa} | ĐVT:{" "}
                                  {currentItem.hang_hoa.don_vi_tinh}
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
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right bg-gray-50"
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
                            className="text-red-600 hover:text-red-800"
                            title="Xóa dòng"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}

                {fields.length === 0 && (
                  <tr>
                    <td
                      colSpan="12"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Chưa có hàng hóa nào. Vui lòng thêm hàng hóa để kiểm kê.
                    </td>
                  </tr>
                )}

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

        {/* Nút bấm */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting || fields.length === 0}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditKiemKeForm;
