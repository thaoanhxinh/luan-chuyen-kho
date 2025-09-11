// CreateXuatKhoForm.jsx - COMPLETE VERSION với Serial Selection

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  AlertCircle,
  Building,
  CheckCircle,
  Package,
  Hash,
} from "lucide-react";
import { searchService } from "../../services/searchService";
import { xuatKhoService } from "../../services/xuatKhoService";
import { formatCurrency } from "../../utils/helpers";
import { LOAI_PHIEU_XUAT, PHAM_CHAT } from "../../utils/constants";
import AutoComplete from "../common/AutoComplete";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const CreateXuatKhoForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [tonKhoInfo, setTonKhoInfo] = useState({});

  // ✅ STATE CHO SERIAL/DANH ĐIỂM SELECTION
  const [lotInfo, setLotInfo] = useState({}); // Lưu thông tin các lô hàng có thể xuất
  const [selectedLots, setSelectedLots] = useState({}); // Lô đã chọn cho từng hàng hóa

  // State cho dropdown cấp 2/3
  const [selectedCap2, setSelectedCap2] = useState(null);
  const [selectedCap3, setSelectedCap3] = useState(null);
  const [phongBanCap2List, setPhongBanCap2List] = useState([]);
  const [phongBanCap3List, setPhongBanCap3List] = useState([]);

  const { user } = useAuth();
  const isLevel3User = user?.phong_ban?.cap_bac === 3;

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
      loai_xuat: "don_vi_su_dung",
      so_quyet_dinh: "",
      nguoi_nhan: "",
      ly_do_xuat: "",
      ghi_chu: "",
      don_vi_nhan_id: null,
      don_vi_nhan: null,
      phong_ban_nhan_id: null,
      phong_ban_nhan: null,
      chi_tiet: [
        {
          hang_hoa_id: null,
          hang_hoa: null,
          so_luong: 1,
          don_gia: 0,
          pham_chat: "tot",
          chi_tiet_nhap_id: null, // ✅ Không dùng nữa
          phieu_nhap_id: null, // ✅ Dùng phieu_nhap_id thay thế
          danh_diem: null, // ✅ Danh điểm được chọn (so_seri_xuat)
          so_seri_list: null, // ✅ Không dùng nữa
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "chi_tiet",
  });

  const chiTietItems = watch("chi_tiet");
  const loaiXuat = watch("loai_xuat");

  const handleHangHoaSelect = async (hangHoa, index) => {
    console.log("🎯 handleHangHoaSelect called:", { hangHoa, index });

    setValue(`chi_tiet.${index}.hang_hoa_id`, hangHoa.id || null);
    setValue(`chi_tiet.${index}.hang_hoa`, hangHoa);

    // Reset các field liên quan đến lô/serial
    setValue(`chi_tiet.${index}.phieu_nhap_id`, null);
    setValue(`chi_tiet.${index}.danh_diem`, null);
    setValue(`chi_tiet.${index}.don_gia`, 0);

    if (hangHoa.id) {
      // Cập nhật thông tin tồn kho
      setTonKhoInfo((prev) => ({
        ...prev,
        [hangHoa.id]: hangHoa.ton_kho_hien_tai || 0,
      }));

      // ✅ LẤY DANH SÁCH CÁC LÔ CÓ THỂ XUẤT
      try {
        console.log(
          "🔍 Getting lots for hang hoa:",
          hangHoa.id,
          user?.phong_ban?.id
        );

        const response = await xuatKhoService.getLotsForXuatKho(
          hangHoa.id,
          user?.phong_ban?.id
        );

        console.log("🔍 Lots response:", response);

        if (response.success && response.data.length > 0) {
          setLotInfo((prev) => ({
            ...prev,
            [hangHoa.id]: response.data,
          }));

          // ✅ Tự động chọn lô đầu tiên (FIFO) nếu KHÔNG có serial
          const firstLot = response.data[0];
          console.log("🔍 First lot:", firstLot);

          if (!hangHoa.co_so_seri && firstLot) {
            console.log("🔍 Auto-selecting FIFO lot for non-serial item");
            handleLotSelect(hangHoa.id, firstLot, index);
          }
        } else {
          console.warn("⚠️ No lots available for:", hangHoa.ten_hang_hoa);
          toast.error(
            `Hàng hóa "${hangHoa.ten_hang_hoa}" không có tồn kho khả dụng`
          );
        }
      } catch (error) {
        console.error("❌ Error getting lots:", error);
        toast.error("Lỗi khi lấy thông tin lô hàng");
      }
    }
  };

  const handleLotSelect = (hangHoaId, lot, index) => {
    console.log("📦 handleLotSelect called:", { hangHoaId, lot, index });

    // Set thông tin lô
    setValue(`chi_tiet.${index}.phieu_nhap_id`, lot.phieu_nhap_id);
    setValue(`chi_tiet.${index}.don_gia`, lot.don_gia);
    setValue(`chi_tiet.${index}.pham_chat`, lot.pham_chat);

    // Xử lý danh điểm
    const hangHoa = watch(`chi_tiet.${index}.hang_hoa`);

    console.log("📦 handleLotSelect processing:", {
      hang_hoa: hangHoa,
      co_so_seri: hangHoa?.co_so_seri,
      lot_so_seri_list: lot.so_seri_list,
      is_array: Array.isArray(lot.so_seri_list),
      length: lot.so_seri_list?.length,
    });

    if (
      hangHoa?.co_so_seri &&
      lot.so_seri_list &&
      Array.isArray(lot.so_seri_list) &&
      lot.so_seri_list.length > 0
    ) {
      // ✅ Hàng CÓ serial VÀ lô CÓ serial data: Reset để user chọn
      console.log("📦 Setting up serial selection");
      setValue(`chi_tiet.${index}.danh_diem`, "");
      setValue(`chi_tiet.${index}.so_luong`, 1);
    } else {
      // ✅ Hàng KHÔNG có serial HOẶC lô KHÔNG có serial data: Không cần danh điểm
      console.log("📦 No serial needed, setting danh_diem to null");
      setValue(`chi_tiet.${index}.danh_diem`, null);
      setValue(`chi_tiet.${index}.so_luong`, Math.min(1, lot.so_luong_con_lai));
    }

    // Lưu thông tin lô đã chọn
    setSelectedLots((prev) => ({
      ...prev,
      [`${hangHoaId}-${index}`]: lot,
    }));

    toast.success(`Đã chọn lô: ${lot.so_phieu}`);
  };

  const LotSelectionField = ({ hangHoa, index }) => {
    if (!hangHoa?.id) return null;

    const lots = lotInfo[hangHoa.id] || [];
    const selectedLot = selectedLots[`${hangHoa.id}-${index}`];
    const hasSerial = hangHoa.co_so_seri;
    //const currentDanhDiem = watch(`chi_tiet.${index}.danh_diem`);

    if (lots.length === 0) {
      return (
        <div className="text-xs text-red-600 mt-1">
          ⚠️ Không có lô hàng khả dụng
        </div>
      );
    }

    // ✅ Hàng KHÔNG có serial - hiển thị thông tin lô FIFO đã chọn tự động
    if (!hasSerial && selectedLot) {
      return (
        <div className="text-xs text-green-600 mt-1 p-2 bg-green-50 border border-green-200 rounded">
          <div className="font-medium">✅ Lô FIFO được chọn:</div>
          <div>{selectedLot.display_text}</div>
          <div>
            Giá: {formatCurrency(selectedLot.don_gia)} - Chất lượng:{" "}
            {selectedLot.pham_chat}
          </div>
        </div>
      );
    }

    // ✅ Hàng CÓ serial - cần chọn lô và serial
    if (hasSerial) {
      return (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
          {/* Dropdown chọn lô */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-blue-800 mb-1">
              📦 Chọn lô hàng:
            </label>
            <select
              onChange={(e) => {
                const selectedLotId = e.target.value;
                if (selectedLotId) {
                  const lot = lots.find(
                    (l) => l.phieu_nhap_id == selectedLotId
                  );
                  if (lot) {
                    handleLotSelect(hangHoa.id, lot, index);
                  }
                } else {
                  // Reset khi không chọn lô
                  setValue(`chi_tiet.${index}.phieu_nhap_id`, null);
                  setValue(`chi_tiet.${index}.danh_diem`, null);
                  setValue(`chi_tiet.${index}.don_gia`, 0);

                  setSelectedLots((prev) => {
                    const newState = { ...prev };
                    delete newState[`${hangHoa.id}-${index}`];
                    return newState;
                  });
                }
              }}
              className="w-full px-2 py-1 border border-blue-300 rounded text-xs"
              value={selectedLot?.phieu_nhap_id || ""}
            >
              <option value="">-- Chọn lô --</option>
              {lots.map((lot) => (
                <option key={lot.phieu_nhap_id} value={lot.phieu_nhap_id}>
                  {lot.display_text}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown chọn serial (chỉ hiển thị khi đã chọn lô) */}
          {selectedLot &&
            selectedLot.so_seri_list &&
            Array.isArray(selectedLot.so_seri_list) &&
            selectedLot.so_seri_list.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-blue-800 mb-1">
                  📝 Chọn số seri:
                </label>
                <select
                  {...register(`chi_tiet.${index}.danh_diem`, {
                    required: "Vui lòng chọn số seri",
                  })}
                  className="w-full px-2 py-1 border border-blue-300 rounded text-xs"
                >
                  <option value="">-- Chọn số seri --</option>
                  {selectedLot.so_seri_list.map((serial, idx) => (
                    <option key={idx} value={serial}>
                      {serial}
                    </option>
                  ))}
                </select>
                {errors.chi_tiet?.[index]?.danh_diem && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.chi_tiet[index].danh_diem.message}
                  </p>
                )}
              </div>
            )}

          {/* Hiển thị thông báo nếu lô không có serial */}
          {selectedLot &&
            (!selectedLot.so_seri_list ||
              !Array.isArray(selectedLot.so_seri_list) ||
              selectedLot.so_seri_list.length === 0) && (
              <div className="text-xs text-orange-600 mt-2 p-2 bg-orange-50 rounded">
                ⚠️ Lô này không có số seri trong hệ thống
              </div>
            )}

          {/* Thông tin lô đã chọn */}
          {selectedLot && (
            <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
              <div>
                <strong>Lô:</strong> {selectedLot.so_phieu}
              </div>
              <div>
                <strong>Giá:</strong> {formatCurrency(selectedLot.don_gia)}
              </div>
              <div>
                <strong>Chất lượng:</strong> {selectedLot.pham_chat}
              </div>
              <div>
                <strong>Còn lại:</strong> {selectedLot.so_luong_con_lai}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // ✅ LOAD DANH SÁCH CẤP 2 KHI CHỌN LOẠI "XUẤT ĐƠN VỊ"
  useEffect(() => {
    const loadPhongBanCap2 = async () => {
      if (loaiXuat !== "don_vi_nhan") {
        setPhongBanCap2List([]);
        setPhongBanCap3List([]);
        setSelectedCap2(null);
        setSelectedCap3(null);
        return;
      }

      try {
        const response = await xuatKhoService.getPhongBanCap2List();
        if (response.success) {
          setPhongBanCap2List(response.data);
        }
      } catch (error) {
        console.error("❌ Error loading phong ban cap 2:", error);
        toast.error("Không thể tải danh sách phòng ban cấp 2");
        setPhongBanCap2List([]);
      }
    };

    loadPhongBanCap2();
  }, [loaiXuat]);

  // ✅ LOAD DANH SÁCH CẤP 3 KHI CHỌN CẤP 2
  useEffect(() => {
    const loadPhongBanCap3 = async () => {
      if (!selectedCap2 || loaiXuat !== "don_vi_nhan") {
        setPhongBanCap3List([]);
        return;
      }

      try {
        const response = await xuatKhoService.getPhongBanCap3ByParent(
          selectedCap2
        );
        if (response.success) {
          setPhongBanCap3List(response.data);
        }
      } catch (error) {
        console.error("❌ Error loading phong ban cap 3:", error);
        toast.error("Không thể tải danh sách kho cấp 3");
        setPhongBanCap3List([]);
      }
    };

    loadPhongBanCap3();
  }, [selectedCap2, loaiXuat]);

  // Helper functions cho dropdown cấp 2/3
  const handleCap2Select = (cap2Id) => {
    setSelectedCap2(cap2Id);
    setSelectedCap3(null);
    setPhongBanCap3List([]);
    setValue("phong_ban_nhan", null);
    setValue("phong_ban_nhan_id", null);
  };

  const handleCap3Select = (cap3Id) => {
    setSelectedCap3(cap3Id);
    const selectedPhongBan = phongBanCap3List.find(
      (pb) => pb.id === parseInt(cap3Id)
    );
    if (selectedPhongBan) {
      setValue("phong_ban_nhan", selectedPhongBan);
      setValue("phong_ban_nhan_id", selectedPhongBan.id);
      toast.success(`Đã chọn đơn vị nhận: ${selectedPhongBan.ten_phong_ban}`);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      console.log("🔍 Starting validation with data:", data);

      // ✅ Validation chi tiết - LOGIC MỚI
      let isValid = true;

      for (let i = 0; i < data.chi_tiet.length; i++) {
        const item = data.chi_tiet[i];

        console.log(`🔍 Validating item ${i + 1}:`, {
          hang_hoa_id: item.hang_hoa_id,
          hang_hoa: item.hang_hoa,
          phieu_nhap_id: item.phieu_nhap_id,
          danh_diem: item.danh_diem,
          so_luong: item.so_luong,
        });

        // 1. Kiểm tra đã chọn hàng hóa chưa
        if (!item.hang_hoa_id || !item.hang_hoa) {
          toast.error(`Dòng ${i + 1}: Vui lòng chọn một hàng hóa hợp lệ.`);
          console.log(`❌ Item ${i + 1}: Missing hang hoa`);
          isValid = false;
          break;
        }

        const hangHoaInfo = item.hang_hoa;
        const selectedLot = selectedLots[`${hangHoaInfo.id}-${i}`];

        console.log(`🔍 Item ${i + 1} hang hoa info:`, {
          ten_hang_hoa: hangHoaInfo.ten_hang_hoa,
          co_so_seri: hangHoaInfo.co_so_seri,
          selectedLot: selectedLot
            ? {
                phieu_nhap_id: selectedLot.phieu_nhap_id,
                so_seri_list: selectedLot.so_seri_list,
                has_serial:
                  selectedLot.so_seri_list &&
                  Array.isArray(selectedLot.so_seri_list) &&
                  selectedLot.so_seri_list.length > 0,
              }
            : null,
        });

        // 2. Kiểm tra đã chọn lô chưa
        if (!item.phieu_nhap_id) {
          toast.error(
            `Dòng ${i + 1}: Chưa chọn lô hàng cho "${hangHoaInfo.ten_hang_hoa}"`
          );
          console.log(`❌ Item ${i + 1}: Missing phieu_nhap_id`);
          isValid = false;
          break;
        }

        // 3. ✅ LOGIC MỚI: Kiểm tra serial CHỈ KHI hàng hóa CÓ serial VÀ lô CÓ serial data
        const needsSerial =
          hangHoaInfo.co_so_seri &&
          selectedLot &&
          selectedLot.so_seri_list &&
          Array.isArray(selectedLot.so_seri_list) &&
          selectedLot.so_seri_list.length > 0;

        console.log(`🔍 Item ${i + 1} serial check:`, {
          hang_hoa_co_so_seri: hangHoaInfo.co_so_seri,
          lot_has_serials:
            selectedLot &&
            selectedLot.so_seri_list &&
            Array.isArray(selectedLot.so_seri_list) &&
            selectedLot.so_seri_list.length > 0,
          needs_serial: needsSerial,
          current_danh_diem: item.danh_diem,
        });

        if (needsSerial && !item.danh_diem) {
          toast.error(
            `Dòng ${i + 1}: Hàng hóa "${
              hangHoaInfo.ten_hang_hoa
            }" cần chọn số seri từ lô`
          );
          console.log(`❌ Item ${i + 1}: Needs serial but not selected`);
          isValid = false;
          break;
        }

        // 4. Kiểm tra số lượng
        if (!item.so_luong || parseFloat(item.so_luong) <= 0) {
          toast.error(`Dòng ${i + 1}: Số lượng phải lớn hơn 0`);
          console.log(`❌ Item ${i + 1}: Invalid quantity`);
          isValid = false;
          break;
        }

        console.log(`✅ Item ${i + 1}: Validation passed`);
      }

      if (!isValid) {
        console.log("❌ Validation failed, stopping submission");
        setLoading(false);
        return;
      }

      console.log("✅ All validation passed, submitting data");
      console.log("📋 Final submission data:", data);

      const response = await xuatKhoService.create(data);

      if (response.success) {
        toast.success("Tạo phiếu xuất thành công!");
        if (onSuccess) onSuccess(response.data);
      } else {
        toast.error(response.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error creating phieu xuat:", error);
      toast.error("Lỗi khi tạo phiếu xuất: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ COMPONENT CHỌN ĐƠN VỊ NHẬN
  const DonViNhanField = () => {
    if (loaiXuat !== "don_vi_nhan") return null;

    return (
      <div className="bg-white border rounded-lg p-4">
        <label className="block text-lg font-medium text-gray-900 mb-3">
          <Building className="inline h-4 w-4 mr-1" />
          Đơn vị nhận *
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              1. Chọn cấp 2
            </label>
            <select
              value={selectedCap2 || ""}
              onChange={(e) => handleCap2Select(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="">-- Chọn cấp 2 --</option>
              {phongBanCap2List.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {pb.ten_phong_ban}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              2. Chọn cấp 3 (kho)
            </label>
            <select
              value={selectedCap3 || ""}
              onChange={(e) => handleCap3Select(e.target.value)}
              disabled={!selectedCap2 || phongBanCap3List.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100"
            >
              <option value="">-- Chọn cấp 3 --</option>
              {phongBanCap3List.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {pb.ten_phong_ban}
                </option>
              ))}
            </select>
          </div>
        </div>

        {watch("phong_ban_nhan") && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                Đã chọn: {watch("phong_ban_nhan").ten_phong_ban}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isLevel3User) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không có quyền truy cập
        </h3>
        <p className="text-gray-600">
          Chỉ có cấp 3 mới được tạo phiếu xuất kho.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* THÔNG TIN CHUNG */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Thông tin phiếu xuất
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại xuất *
              </label>
              <select
                {...register("loai_xuat", {
                  required: "Vui lòng chọn loại xuất",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {Object.entries(LOAI_PHIEU_XUAT).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Nhập ghi chú (nếu có)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do xuất *
              </label>
              <input
                type="text"
                {...register("ly_do_xuat", {
                  required: "Vui lòng nhập lý do xuất",
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Nhập lý do xuất hàng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người nhận
              </label>
              <input
                type="text"
                {...register("nguoi_nhan")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Nhập tên người nhận"
              />
            </div>
          </div>
        </div>

        {/* ĐƠN VỊ NHẬN (chỉ hiện khi loại xuất = don_vi_nhan) */}
        <DonViNhanField />

        {/* CHI TIẾT HÀNG HÓA */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Chi tiết hàng hóa
            </h3>
            <button
              type="button"
              onClick={() =>
                append({
                  hang_hoa_id: null,
                  hang_hoa: null,
                  so_luong: 1,
                  don_gia: 0,
                  pham_chat: "tot",
                  chi_tiet_nhap_id: null,
                  danh_diem: null,
                  so_seri_list: null,
                })
              }
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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
                    Tồn kho
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Số lượng *
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
                  const item = chiTietItems[index] || {};
                  const thanhTien =
                    (parseFloat(item.so_luong) || 0) *
                    (parseFloat(item.don_gia) || 0);
                  const tonKho = tonKhoInfo[item.hang_hoa_id] || 0;
                  const hasSelectedHangHoa = item.hang_hoa && item.hang_hoa.id;
                  const selectedLot =
                    selectedLots[`${item.hang_hoa_id}-${index}`];

                  return (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>

                      {/* ✅ TÌM KIẾM HÀNG HÓA với API mới */}
                      <td className="px-4 py-3">
                        <AutoComplete
                          searchFunction={async (query) => {
                            try {
                              if (!query || query.length < 2) return [];
                              const results =
                                await searchService.searchHangHoaForXuatKho(
                                  query,
                                  user?.phong_ban?.id
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
                                <span className="mx-2">•</span>
                                <span className="text-green-600 font-medium">
                                  Tồn: {hangHoa.ton_kho_hien_tai}{" "}
                                  {hangHoa.don_vi_tinh}
                                </span>
                                {hangHoa.co_so_seri && (
                                  <span className="ml-2 text-blue-600 font-medium">
                                    🏷️ Có Serial
                                  </span>
                                )}
                                {hangHoa.warning && (
                                  <span className="ml-2 text-orange-600 font-medium">
                                    ⚠️ {hangHoa.warning}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          className="min-w-[200px]"
                          key={`hangHoa-${index}`}
                        />

                        {hasSelectedHangHoa && (
                          <div className="text-xs text-green-600 mt-1">
                            ✅ {item.hang_hoa.ma_hang_hoa} -{" "}
                            {item.hang_hoa.don_vi_tinh}
                            {item.hang_hoa.co_so_seri && (
                              <span className="text-blue-600 ml-2">
                                🏷️ Có danh điểm
                              </span>
                            )}
                          </div>
                        )}

                        {/* ✅ COMPONENT CHỌN LÔ/SERIAL */}
                        <LotSelectionField
                          hangHoa={item.hang_hoa}
                          index={index}
                        />
                      </td>

                      {/* TỒN KHO */}
                      <td className="px-4 py-3 text-center">
                        {hasSelectedHangHoa ? (
                          <div>
                            <span
                              className={`font-medium text-sm ${
                                tonKho > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {tonKho > 0
                                ? tonKho.toLocaleString()
                                : "Hết hàng"}
                            </span>
                            {selectedLot && (
                              <div className="text-xs text-blue-600 mt-1">
                                Lô: {selectedLot.so_luong_con_lai}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>

                      {/* SỐ LƯỢNG */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          {...register(`chi_tiet.${index}.so_luong`, {
                            required: true,
                            min: 1,
                            max:
                              selectedLot?.so_luong_con_lai || tonKho || 999999,
                          })}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
                          step="1"
                          min="1"
                          max={
                            selectedLot?.so_luong_con_lai || tonKho || 999999
                          }
                        />
                        {hasSelectedHangHoa &&
                          selectedLot &&
                          parseFloat(item.so_luong) >
                            selectedLot.so_luong_con_lai && (
                            <div className="text-xs text-red-600 mt-1">
                              Vượt quá số lượng lô!
                            </div>
                          )}
                        {hasSelectedHangHoa &&
                          !selectedLot &&
                          parseFloat(item.so_luong) > tonKho && (
                            <div className="text-xs text-red-600 mt-1">
                              Vượt quá tồn kho!
                            </div>
                          )}
                      </td>

                      {/* ĐƠN GIÁ */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          {...register(`chi_tiet.${index}.don_gia`, {
                            required: true,
                            min: 0,
                          })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm focus:ring-2 focus:ring-blue-500"
                          step="1000"
                          min="0"
                          readOnly={!!selectedLot} // ✅ Chỉ đọc nếu đã chọn lô (giá theo lô)
                        />
                        {selectedLot && (
                          <div className="text-xs text-blue-600 mt-1">
                            💰 Giá theo lô nhập
                          </div>
                        )}
                      </td>

                      {/* PHẨM CHẤT */}
                      <td className="px-4 py-3">
                        <select
                          {...register(`chi_tiet.${index}.pham_chat`)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          disabled={!!selectedLot} // ✅ Chỉ đọc nếu đã chọn lô
                        >
                          {Object.entries(PHAM_CHAT).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value.label}
                            </option>
                          ))}
                        </select>
                        {selectedLot && (
                          <div className="text-xs text-blue-600 mt-1">
                            📋 Theo lô nhập
                          </div>
                        )}
                      </td>

                      {/* THÀNH TIỀN */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(thanhTien)}
                        </span>
                      </td>

                      {/* XÓA */}
                      <td className="px-4 py-3 text-center">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              // ✅ Xóa thông tin lô khi xóa dòng
                              const hangHoaId = item.hang_hoa_id;
                              if (hangHoaId) {
                                setSelectedLots((prev) => {
                                  const newState = { ...prev };
                                  delete newState[`${hangHoaId}-${index}`];
                                  return newState;
                                });
                                setLotInfo((prev) => {
                                  const newState = { ...prev };
                                  delete newState[hangHoaId];
                                  return newState;
                                });
                                setTonKhoInfo((prev) => {
                                  const newState = { ...prev };
                                  delete newState[hangHoaId];
                                  return newState;
                                });
                              }
                              remove(index);
                            }}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* TỔNG TIỀN */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Tổng tiền:</span>
              <span className="text-blue-600">
                {formatCurrency(
                  chiTietItems.reduce((total, item) => {
                    return (
                      total +
                      (parseFloat(item.so_luong) || 0) *
                        (parseFloat(item.don_gia) || 0)
                    );
                  }, 0)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Đang tạo..." : "Tạo phiếu xuất"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateXuatKhoForm;
