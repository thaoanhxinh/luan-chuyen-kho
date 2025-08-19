import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2, AlertTriangle, Info } from "lucide-react";
import { searchService } from "../../services/searchService";
import { xuatKhoService } from "../../services/xuatKhoService";
import { formatCurrency } from "../../utils/helpers";
import { LOAI_PHIEU_XUAT, PHAM_CHAT } from "../../utils/constants";
import AutoComplete from "../common/AutoComplete";
import toast from "react-hot-toast";

const EditXuatKhoForm = ({ phieuId, onSuccess, onCancel, mode = "edit" }) => {
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [phieuStatus, setPhieuStatus] = useState(null);
  const [tonKhoInfo, setTonKhoInfo] = useState({});
  const [phongBanNhanList, setPhongBanNhanList] = useState([]);
  const [linkedPhieu, setLinkedPhieu] = useState(null);

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
  //const loaiXuat = watch("loai_xuat");
  const phongBanNhanData = watch("phong_ban_nhan");
  const donViNhanData = watch("don_vi_nhan");

  useEffect(() => {
    if (phieuId) {
      reset({});
      setDataLoaded(false);
      setFormReady(false);
      setPhieuStatus(null);
      setLinkedPhieu(null);
      loadPhieuData();
    }
  }, [phieuId, reset]);

  // Load phòng ban nhận khi cần
  useEffect(() => {
    if (canEdit) {
      loadPhongBanNhanList();
    }
  }, [canEdit]);

  const loadPhongBanNhanList = async () => {
    try {
      const response = await xuatKhoService.getPhongBanNhanHang();
      setPhongBanNhanList(response.data || []);
    } catch (error) {
      console.error("Error loading phong ban nhan hang:", error);
    }
  };

  const loadPhieuData = async () => {
    try {
      setIsLoadingData(true);
      setDataLoaded(false);
      setFormReady(false);

      const response = await xuatKhoService.getDetail(phieuId);
      const phieu = response.data;

      console.log("Phieu data:", phieu); // Debug

      setPhieuStatus(phieu.trang_thai);
      setLinkedPhieu(phieu.phieu_nhap_lien_ket || null);

      const formattedDate = phieu.ngay_xuat
        ? new Date(phieu.ngay_xuat).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      // ✅ Mapping dữ liệu đúng
      const formData = {
        ngay_xuat: formattedDate,
        loai_xuat: phieu.loai_xuat || "su_dung",
        nguoi_nhan: phieu.nguoi_nhan || "",
        so_quyet_dinh: phieu.so_quyet_dinh || "",
        ly_do_xuat: phieu.ly_do_xuat || "",
        ghi_chu: phieu.ghi_chu || "",

        // ✅ Map đúng dữ liệu từ API
        phong_ban_nhan_id: phieu.phong_ban_nhan?.id || null,
        phong_ban_nhan: phieu.phong_ban_nhan || null,
        don_vi_nhan_id: phieu.don_vi_nhan?.id || null,
        don_vi_nhan: phieu.don_vi_nhan || null,
      };

      console.log("Form data:", formData); // Debug

      reset(formData, { keepDefaultValues: false });

      const chiTietData = phieu.chi_tiet.map((item) => ({
        hang_hoa_id: item.hang_hoa.id,
        hang_hoa: item.hang_hoa,
        so_luong_yeu_cau:
          parseFloat(item.so_luong_yeu_cau) ||
          parseFloat(item.so_luong_thuc_xuat) ||
          1,
        so_luong_thuc_xuat: parseFloat(item.so_luong_thuc_xuat) || 1,
        don_gia: parseFloat(item.don_gia) || 0,
        pham_chat: item.pham_chat || "tot",
        so_seri_xuat: item.so_seri_xuat ? item.so_seri_xuat.join(", ") : "",
      }));

      replace(chiTietData);

      // Load tồn kho info
      if (chiTietData.length > 0) {
        const tonKhoRequest = {
          phieu_hien_tai_id: phieuId,
          chi_tiet: chiTietData.map((item) => ({
            hang_hoa_id: item.hang_hoa_id,
            so_luong_yeu_cau: item.so_luong_yeu_cau,
          })),
        };

        try {
          const tonKhoResponse = await xuatKhoService.checkTonKhoThucTe(
            tonKhoRequest
          );
          const tonKhoData = {};
          tonKhoResponse.data.ton_kho.forEach((item, index) => {
            tonKhoData[index] = item;
          });
          setTonKhoInfo(tonKhoData);
        } catch (error) {
          console.error("Error loading ton kho:", error);
        }
      }

      setTimeout(() => setDataLoaded(true), 150);
      setTimeout(() => setFormReady(true), 300);
    } catch (error) {
      console.error("Error loading phieu data:", error);
      toast.error("Không thể tải dữ liệu phiếu xuất");
    } finally {
      setIsLoadingData(false);
    }
  };

  const tongTien = chiTietItems.reduce((sum, item) => {
    const soLuong = parseFloat(item.so_luong_thuc_xuat || 0);
    const donGia = parseFloat(item.don_gia || 0);
    return sum + soLuong * donGia;
  }, 0);

  const handlePhongBanNhanSelect = (phongBan) => {
    if (!canEdit) return;
    setValue("phong_ban_nhan_id", phongBan.id || null);
    setValue("phong_ban_nhan", phongBan);
    toast.success(`Đã chọn phòng ban nhận: ${phongBan.ten_phong_ban}`);
  };

  const handleDonViNhanSelect = (donViNhan) => {
    if (!canEdit) return;
    setValue("don_vi_nhan_id", donViNhan.id || null);
    setValue("don_vi_nhan", donViNhan);
    toast.success(`Đã chọn đơn vị nhận: ${donViNhan.ten_don_vi}`);
  };

  const handleHangHoaSelect = async (hangHoa, index) => {
    if (!canEdit) return;
    setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id || null);
    setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);

    try {
      const response = await xuatKhoService.checkTonKhoThucTe({
        phieu_hien_tai_id: phieuId,
        chi_tiet: [{ hang_hoa_id: hangHoa.id, so_luong_yeu_cau: 1 }],
      });

      const tonKhoItem = response.data.ton_kho[0];
      if (tonKhoItem) {
        setTonKhoInfo((prev) => ({ ...prev, [index]: tonKhoItem }));

        if (tonKhoItem.don_gia_binh_quan > 0) {
          setValue(`chi_tiet.${index}.don_gia`, tonKhoItem.don_gia_binh_quan);
        }

        if (tonKhoItem.so_luong_co_the_xuat > 0) {
          let message = `Đã chọn ${hangHoa.ten_hang_hoa}. Có thể xuất: ${tonKhoItem.so_luong_co_the_xuat} ${hangHoa.don_vi_tinh}`;
          if (tonKhoItem.canh_bao) {
            message += ` (${tonKhoItem.canh_bao})`;
          }
          toast.success(message);
        } else {
          toast.warning(
            `${hangHoa.ten_hang_hoa} không thể xuất! ${
              tonKhoItem.canh_bao || ""
            }`
          );
        }
      }
    } catch (error) {
      console.error("Error checking ton kho:", error);
      toast.error("Không thể kiểm tra tồn kho");
    }
  };

  const addNewRow = () => {
    if (!canEdit) return;
    append({
      hang_hoa_id: null,
      hang_hoa: null,
      so_luong_yeu_cau: 1,
      so_luong_thuc_xuat: 1,
      don_gia: 0,
      pham_chat: "tot",
      so_seri_xuat: "",
    });
  };

  const onSubmit = async (data) => {
    if (!canEdit && !canEditActual) {
      toast.error("Không thể chỉnh sửa phiếu đã hoàn thành");
      return;
    }

    if (data.chi_tiet.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hàng hóa");
      return;
    }

    // Validation theo loại phiếu
    if (!isEditActualMode) {
      // Kiểm tra xem có phòng ban nhận hay đơn vị nhận
      const hasPhongBanNhan = data.phong_ban_nhan && data.phong_ban_nhan.id;
      const hasDonViNhan = data.don_vi_nhan && data.don_vi_nhan.id;

      if (!hasPhongBanNhan && !hasDonViNhan) {
        toast.error("Vui lòng chọn phòng ban nhận hoặc đơn vị nhận");
        return;
      }
    }

    // Validation chi tiết
    for (let i = 0; i < data.chi_tiet.length; i++) {
      const item = data.chi_tiet[i];
      const tonKhoItem = tonKhoInfo[i];

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
      if (item.don_gia === undefined || item.don_gia < 0) {
        toast.error(`Dòng ${i + 1}: Đơn giá không hợp lệ`);
        return;
      }

      if (
        tonKhoItem &&
        item.so_luong_yeu_cau > tonKhoItem.so_luong_co_the_xuat
      ) {
        toast.error(
          `Dòng ${i + 1}: Số lượng yêu cầu (${
            item.so_luong_yeu_cau
          }) vượt quá số lượng có thể xuất (${tonKhoItem.so_luong_co_the_xuat})`
        );
        return;
      }
    }

    setLoading(true);
    try {
      toast.loading("Đang cập nhật phiếu xuất...", { id: "processing" });

      if (isEditActualMode) {
        // Mode sửa số lượng thực tế
        const updateData = {
          chi_tiet_cap_nhat: data.chi_tiet.map((item) => ({
            hang_hoa_id: item.hang_hoa.id,
            so_luong_thuc_xuat: parseFloat(item.so_luong_thuc_xuat),
          })),
        };

        await xuatKhoService.updateActualQuantity(phieuId, updateData);
        toast.dismiss("processing");
        toast.success("🎉 Cập nhật số lượng thực tế thành công!");
      } else {
        // Mode sửa toàn bộ phiếu
        const finalChiTiet = data.chi_tiet.map((item) => ({
          hang_hoa_id: item.hang_hoa.id,
          so_luong_yeu_cau: parseFloat(item.so_luong_yeu_cau),
          so_luong_thuc_xuat: parseFloat(item.so_luong_thuc_xuat),
          don_gia: parseFloat(item.don_gia),
          pham_chat: item.pham_chat,
          so_seri_xuat: item.so_seri_xuat
            ? item.so_seri_xuat
                .split(/[,\n]/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        }));

        const submitData = {
          ngay_xuat: data.ngay_xuat,
          loai_xuat: data.loai_xuat,
          nguoi_nhan: data.nguoi_nhan || "",
          so_quyet_dinh: data.so_quyet_dinh || "",
          ly_do_xuat: data.ly_do_xuat || "",
          ghi_chu: data.ghi_chu || "",
          phong_ban_nhan_id: data.phong_ban_nhan?.id || null,
          don_vi_nhan_id: data.don_vi_nhan?.id || null,
          chi_tiet: finalChiTiet,
        };

        await xuatKhoService.update(phieuId, submitData);
        toast.dismiss("processing");
        toast.success("🎉 Cập nhật phiếu xuất thành công!");
      }

      onSuccess?.();
    } catch (error) {
      toast.dismiss("processing");

      let errorMessage = "Có lỗi xảy ra khi cập nhật phiếu xuất";
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

  if (isLoadingData || !dataLoaded || !formReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  // ✅ Xác định hiển thị theo dữ liệu thực tế
  const hasPhongBanNhan = phongBanNhanData && phongBanNhanData.id;
  const hasDonViNhan = donViNhanData && donViNhanData.id;

  return (
    <div className="p-4 space-y-4">
      {isEditActualMode && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
          <Info className="inline h-4 w-4 mr-1" />
          Chế độ chỉnh sửa số lượng thực tế. Chỉ có thể sửa cột "SL thực xuất".
        </div>
      )}

      {!canEdit && !isEditActualMode && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
          <AlertTriangle className="inline h-4 w-4 mr-1" />
          Phiếu đã hoàn thành nên không thể chỉnh sửa. Tồn kho đã được điều
          chỉnh theo số lượng thực xuất.
        </div>
      )}

      {linkedPhieu && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          <Info className="inline h-4 w-4 mr-1" />
          <strong>Phiếu liên kết:</strong> Phiếu nhập {linkedPhieu.so_phieu} đã
          được tự động tạo cho phòng ban nhận khi phiếu này được duyệt.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isEditActualMode
              ? "Chỉnh sửa số lượng thực tế"
              : "Thông tin phiếu xuất"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày xuất *
              </label>
              <input
                type="date"
                {...register("ngay_xuat", {
                  required: "Vui lòng chọn ngày xuất",
                })}
                disabled={isEditActualMode || !canEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100"
              />
              {errors.ngay_xuat && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.ngay_xuat.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại xuất *
              </label>
              <select
                {...register("loai_xuat", {
                  required: "Vui lòng chọn loại xuất",
                })}
                disabled={isEditActualMode || !canEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100"
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
                Số quyết định
              </label>
              <input
                type="text"
                {...register("so_quyet_dinh")}
                disabled={isEditActualMode || !canEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100"
                placeholder="Số quyết định xuất"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người nhận
              </label>
              <input
                type="text"
                {...register("nguoi_nhan")}
                disabled={isEditActualMode || !canEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100"
                placeholder="Tên người nhận hàng"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {hasPhongBanNhan ? "Phòng ban nhận" : "Đơn vị nhận"}
              </label>

              {hasPhongBanNhan ? (
                // Hiển thị dropdown phòng ban
                phongBanNhanList.length > 0 ? (
                  <select
                    onChange={(e) => {
                      const selectedId = parseInt(e.target.value);
                      const selectedPhongBan = phongBanNhanList.find(
                        (pb) => pb.id === selectedId
                      );
                      if (selectedPhongBan) {
                        handlePhongBanNhanSelect(selectedPhongBan);
                      }
                    }}
                    disabled={isEditActualMode || !canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100"
                    value={phongBanNhanData?.id || ""}
                  >
                    <option value="">-- Chọn phòng ban nhận --</option>
                    {phongBanNhanList.map((pb) => (
                      <option key={pb.id} value={pb.id}>
                        {pb.ten_phong_ban} (Cấp {pb.cap_bac})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={phongBanNhanData?.ten_phong_ban || ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm"
                    placeholder="Không có dữ liệu"
                  />
                )
              ) : (
                // Hiển thị AutoComplete đơn vị nhận
                <AutoComplete
                  key={`donvi-${
                    formReady ? donViNhanData?.id || "loaded" : "loading"
                  }`}
                  searchFunction={searchService.searchDonViNhan}
                  onSelect={handleDonViNhanSelect}
                  placeholder="Nhập tên đơn vị nhận..."
                  displayField="ten_don_vi"
                  className="w-full"
                  initialValue={donViNhanData?.ten_don_vi || ""}
                  allowCreate={false}
                  disabled={isEditActualMode || !canEdit}
                />
              )}

              {/* Hiển thị thông tin đã chọn */}
              {hasPhongBanNhan && phongBanNhanData && (
                <div className="mt-1 text-xs text-green-600">
                  ✓ {phongBanNhanData.ma_phong_ban} - Cấp{" "}
                  {phongBanNhanData.cap_bac}
                </div>
              )}
              {hasDonViNhan && donViNhanData && (
                <div className="mt-1 text-xs text-green-600">
                  ✓ {donViNhanData.ma_don_vi} - {donViNhanData.loai_don_vi}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do xuất
              </label>
              <input
                type="text"
                {...register("ly_do_xuat")}
                disabled={isEditActualMode || !canEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100"
                placeholder="Nhập lý do xuất kho"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <input
                type="text"
                {...register("ghi_chu")}
                disabled={isEditActualMode || !canEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100"
                placeholder="Ghi chú thêm"
              />
            </div>
          </div>
        </div>

        {/* Chi tiết hàng hóa */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              Chi tiết hàng hóa ({fields.length} mặt hàng)
            </h4>
            {canEdit && !isEditActualMode && (
              <button
                type="button"
                onClick={addNewRow}
                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase w-[22%]">
                    Hàng hóa *
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[10%]">
                    Có thể xuất
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[13%]">
                    SL yêu cầu *
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[15%]">
                    SL thực xuất *
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[13%]">
                    Đơn giá *
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[13%]">
                    Phẩm chất
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[13%]">
                    Thành tiền
                  </th>
                  {canEdit && !isEditActualMode && (
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-16">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fields.map((field, index) => {
                  const currentItem = chiTietItems[index] || {};
                  const thanhTien =
                    (currentItem.so_luong_thuc_xuat || 0) *
                    (currentItem.don_gia || 0);
                  const tonKhoItem = tonKhoInfo[index];

                  return (
                    <tr key={field.id} className="hover:bg-gray-50">
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
                          searchFunction={searchService.searchHangHoa}
                          onSelect={(hangHoa) =>
                            handleHangHoaSelect(hangHoa, index)
                          }
                          placeholder="Nhập tên hàng hóa..."
                          displayField="ten_hang_hoa"
                          className="min-w-[250px]"
                          initialValue={
                            currentItem.hang_hoa?.ten_hang_hoa || ""
                          }
                          allowCreate={false}
                          disabled={isEditActualMode || !canEdit}
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

                      <td className="px-3 py-2 text-center">
                        {tonKhoItem ? (
                          <div className="text-center">
                            <div
                              className={`font-medium text-xs ${
                                tonKhoItem.so_luong_co_the_xuat > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {tonKhoItem.so_luong_co_the_xuat}
                            </div>
                            {tonKhoItem.canh_bao && (
                              <span
                                className="text-orange-500 text-sm"
                                title={tonKhoItem.canh_bao}
                              >
                                ⚠️
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            {...register(`chi_tiet.${index}.so_luong_yeu_cau`, {
                              required: "Vui lòng nhập số lượng yêu cầu",
                              min: {
                                value: 1,
                                message: "Số lượng phải lớn hơn 0",
                              },
                            })}
                            disabled={isEditActualMode || !canEdit}
                            onChange={(e) => {
                              if (!isEditActualMode) {
                                setValue(
                                  `chi_tiet.${index}.so_luong_thuc_xuat`,
                                  e.target.value
                                );
                              }
                            }}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs disabled:bg-gray-100 text-center"
                          />
                          {tonKhoItem &&
                            currentItem.so_luong_yeu_cau >
                              tonKhoItem.so_luong_co_the_xuat && (
                              <span
                                className="text-xs text-red-600"
                                title="Vượt quá số lượng có thể xuất"
                              >
                                ⚠️
                              </span>
                            )}
                        </div>
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
                          disabled={!canEdit && !canEditActual}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                        />
                      </td>

                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          {...register(`chi_tiet.${index}.don_gia`, {
                            required: "Vui lòng nhập đơn giá",
                            min: { value: 0, message: "Đơn giá không được âm" },
                          })}
                          disabled={isEditActualMode || !canEdit}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
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
                              {typeof value === "object" ? value.label : value}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(thanhTien)}
                      </td>

                      {canEdit && !isEditActualMode && (
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
                  );
                })}

                {fields.length > 0 && (
                  <tr className="bg-red-50 font-bold">
                    <td
                      colSpan={canEdit && !isEditActualMode ? "8" : "7"}
                      className="px-3 py-3 text-right text-gray-900"
                    >
                      TỔNG CỘNG:
                    </td>
                    <td className="px-3 py-3 text-right text-red-600 text-lg">
                      {formatCurrency(tongTien)}
                    </td>
                    {canEdit && !isEditActualMode && <td></td>}
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
            {canEdit || canEditActual ? "Hủy" : "Đóng"}
          </button>

          {(canEdit || canEditActual) && (
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{loading ? "Đang xử lý..." : "Cập nhật phiếu"}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditXuatKhoForm;
