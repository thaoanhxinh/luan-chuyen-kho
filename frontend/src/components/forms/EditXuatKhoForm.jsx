// EditXuatKhoForm.jsx - COMPLETE VERSION FIXED
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Building,
  CheckCircle,
  Package,
  Hash,
  FileText,
  User,
  Calendar,
  Link2,
} from "lucide-react";
import { searchService } from "../../services/searchService";
import { xuatKhoService } from "../../services/xuatKhoService";
import { formatCurrency } from "../../utils/helpers";
import { LOAI_PHIEU_XUAT, PHAM_CHAT } from "../../utils/constants";
import AutoComplete from "../common/AutoComplete";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const EditXuatKhoForm = ({
  phieuId,
  onSuccess,
  onCancel,
  mode = "edit", // "edit" hoặc "edit-actual"
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formReady, setFormReady] = useState(false);

  // States for data management
  const [originalData, setOriginalData] = useState(null);
  const [phieuStatus, setPhieuStatus] = useState(null);
  const [linkedPhieu, setLinkedPhieu] = useState(null);

  // States for dropdowns - THÊM STATES CHO CẤP 2/3
  const [phongBanNhanList, setPhongBanNhanList] = useState([]);
  const [tonKhoInfo, setTonKhoInfo] = useState({});

  // States cho dropdown cấp 2/3 như CreateXuatKhoForm
  const [selectedCap2, setSelectedCap2] = useState(null);
  const [selectedCap3, setSelectedCap3] = useState(null);
  const [phongBanCap2List, setPhongBanCap2List] = useState([]);
  const [phongBanCap3List, setPhongBanCap3List] = useState([]);

  // States for selected data
  const [donViNhanData, setDonViNhanData] = useState(null);
  const [phongBanNhanData, setPhongBanNhanData] = useState(null);

  // Mode checks
  const isEditActualMode = mode === "edit-actual";
  const isViewMode = mode === "view";

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
      ngay_xuat: new Date().toISOString().split("T")[0],
      loai_xuat: "don_vi_nhan",
      so_quyet_dinh: "",
      nguoi_nhan: "",
      nguoi_giao_hang: "",
      ly_do_xuat: "",
      ghi_chu: "",
      don_vi_nhan: null,
      phong_ban_nhan: null,
      chi_tiet: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "chi_tiet",
  });

  // Watched values
  const loaiXuat = watch("loai_xuat");
  const chiTietItems = watch("chi_tiet");

  // Permission checks
  const canEdit =
    !isViewMode &&
    originalData &&
    ["draft", "revision_required"].includes(phieuStatus) &&
    (user.role === "admin" || originalData.nguoi_tao === user.id);

  const canEditActual =
    !isViewMode &&
    originalData &&
    phieuStatus === "approved" &&
    (user.role === "admin" || user.role === "manager");

  // Calculated total
  const tongTien = (chiTietItems || []).reduce(
    (sum, item) =>
      sum +
      parseFloat(item.so_luong_thuc_xuat || 0) * parseFloat(item.don_gia || 0),
    0
  );

  // ✅ ALL LOADING FUNCTIONS - ĐỊNH NGHĨA TRƯỚC KHI SỬ DỤNG
  const loadPhongBanNhanList = async () => {
    try {
      console.log("🔄 Loading phong ban nhan list...");
      const response = await xuatKhoService.getPhongBanNhanHang();
      const phongBanList = response.data || [];

      console.log("📋 Phong ban nhan list:", phongBanList);
      setPhongBanNhanList(phongBanList);

      return phongBanList;
    } catch (error) {
      console.error("❌ Error loading phong ban nhan hang:", error);
      setPhongBanNhanList([]);
      return [];
    }
  };

  const loadPhongBanCap2List = async () => {
    try {
      console.log("🔄 Loading phong ban cap 2 list...");
      const response = await xuatKhoService.getPhongBanCap2List();
      setPhongBanCap2List(response.data || []);
    } catch (error) {
      console.error("❌ Error loading phong ban cap 2:", error);
      setPhongBanCap2List([]);
    }
  };

  const loadTonKhoInfo = async () => {
    try {
      const response = await xuatKhoService.getTonKho();
      setTonKhoInfo(response.data || {});
    } catch (error) {
      console.error("Error loading ton kho info:", error);
      setTonKhoInfo({});
    }
  };

  // ✅ HANDLER FUNCTIONS
  const handleCap2Select = (cap2Id) => {
    setSelectedCap2(cap2Id);
    setSelectedCap3(null);
    setPhongBanCap3List([]);
    setValue("phong_ban_nhan", null);
    setValue("phong_ban_nhan_id", null);
    setPhongBanNhanData(null);
  };

  const handleCap3Select = (cap3Id) => {
    setSelectedCap3(cap3Id);
    const selectedPhongBan = phongBanCap3List.find(
      (pb) => pb.id === parseInt(cap3Id)
    );
    if (selectedPhongBan) {
      setPhongBanNhanData(selectedPhongBan);
      setValue("phong_ban_nhan", selectedPhongBan);
      setValue("phong_ban_nhan_id", selectedPhongBan.id);

      // Clear đơn vị ngoài
      setValue("don_vi_nhan", null);
      setValue("don_vi_nhan_id", null);
      setDonViNhanData(null);

      toast.success(`Đã chọn đơn vị nhận: ${selectedPhongBan.ten_phong_ban}`);
    }
  };

  const handleDonViNhanSelect = (donVi) => {
    console.log("🎯 Selected don vi nhan:", donVi);

    setDonViNhanData(donVi);
    setValue("don_vi_nhan", donVi);
    setValue("don_vi_nhan_id", donVi.id);

    // Clear phòng ban
    setValue("phong_ban_nhan", null);
    setValue("phong_ban_nhan_id", null);
    setPhongBanNhanData(null);

    toast.success(`Đã chọn đơn vị: ${donVi.ten_don_vi}`);
  };

  const handlePhongBanNhanSelect = (phongBan) => {
    console.log("🎯 Selected phong ban nhan:", phongBan);

    setPhongBanNhanData(phongBan);
    setValue("phong_ban_nhan", phongBan);
    setValue("phong_ban_nhan_id", phongBan.id);

    // Clear đơn vị ngoài
    setValue("don_vi_nhan", null);
    setValue("don_vi_nhan_id", null);
    setDonViNhanData(null);

    toast.success(`Đã chọn phòng ban: ${phongBan.ten_phong_ban}`);
  };

  // Handle hàng hóa select
  const handleHangHoaSelect = (hangHoa, index) => {
    if (!hangHoa) return;

    console.log("🎯 Selected hang hoa for xuat:", hangHoa, "for index:", index);

    // Get tồn kho info
    const tonKho = tonKhoInfo[hangHoa.id] || { so_luong: 0 };

    // Update fields for selected item
    const updates = {
      [`chi_tiet.${index}.hang_hoa_id`]: hangHoa.id,
      [`chi_tiet.${index}.hang_hoa`]: hangHoa,
      [`chi_tiet.${index}.don_gia`]:
        hangHoa.don_gia_xuat || hangHoa.don_gia_nhap || 0,
      [`chi_tiet.${index}.ton_kho`]: tonKho.so_luong,
    };

    Object.entries(updates).forEach(([field, value]) => {
      setValue(field, value);
    });

    // Trigger recalculation
    setTimeout(() => {
      const currentItems = watch("chi_tiet");
      if (currentItems[index]) {
        const soLuong = currentItems[index].so_luong_thuc_xuat || 1;
        const donGia = currentItems[index].don_gia || 0;
        setValue(`chi_tiet.${index}.thanh_tien`, soLuong * donGia);
      }
    }, 100);
  };

  // Add new item
  const handleAddItem = () => {
    append({
      hang_hoa_id: null,
      hang_hoa: null,
      so_luong_yeu_cau: 1,
      so_luong_thuc_xuat: 1,
      don_gia: 0,
      thanh_tien: 0,
      pham_chat: "tot",
      so_seri_xuat: "",
      ghi_chu: "",
    });
  };

  // Remove item
  const handleRemoveItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("Phải có ít nhất một hàng hóa");
    }
  };

  const handleQuantityOrPriceChange = (index, field, value) => {
    // ✅ FIX: Prevent default scroll behavior
    const numValue = parseFloat(value) || 0;

    // Set value immediately without setTimeout
    setValue(`chi_tiet.${index}.${field}`, numValue);

    // Calculate thanh_tien immediately
    const currentItems = watch("chi_tiet");
    const currentItem = currentItems[index];

    if (currentItem) {
      const soLuong =
        field === "so_luong_thuc_xuat"
          ? numValue
          : currentItem.so_luong_thuc_xuat || 0;
      const donGia = field === "don_gia" ? numValue : currentItem.don_gia || 0;
      const thanhTien = soLuong * donGia;

      setValue(`chi_tiet.${index}.thanh_tien`, thanhTien);
    }

    // ✅ FIX: Sync số lượng yêu cầu với thực xuất
    if (field === "so_luong_thuc_xuat") {
      setValue(`chi_tiet.${index}.so_luong_yeu_cau`, numValue);
    } else if (field === "so_luong_yeu_cau") {
      setValue(`chi_tiet.${index}.so_luong_thuc_xuat`, numValue);
    }
  };

  // ✅ LOAD DATA WHEN COMPONENT MOUNTS
  useEffect(() => {
    if (phieuId) {
      reset({});
      setDataLoaded(false);
      setFormReady(false);
      setPhieuStatus(null);
      setOriginalData(null);
      setLinkedPhieu(null);
      loadPhieuData();
    }
  }, [phieuId, reset]);

  // Load phòng ban nhận when needed + THÊM LOAD CẤP 2/3
  useEffect(() => {
    if (canEdit && loaiXuat === "don_vi_nhan") {
      loadPhongBanNhanList();
      loadPhongBanCap2List(); // Load cấp 2 list
    }
  }, [canEdit, loaiXuat]);

  // Load cấp 3 khi chọn cấp 2
  useEffect(() => {
    const loadPhongBanCap3 = async () => {
      if (selectedCap2 && loaiXuat === "don_vi_nhan") {
        try {
          const response = await xuatKhoService.getPhongBanCap3ByParent(
            selectedCap2
          );
          setPhongBanCap3List(response.data || []);
        } catch (error) {
          console.error("Error loading cap 3 list:", error);
          setPhongBanCap3List([]);
        }
      } else {
        setPhongBanCap3List([]);
      }
    };

    loadPhongBanCap3();
  }, [selectedCap2, loaiXuat]);

  const loadPhieuData = async () => {
    try {
      setIsLoadingData(true);
      setDataLoaded(false);
      setFormReady(false);

      console.log("📄 Loading phieu xuat data for ID:", phieuId);
      const response = await xuatKhoService.getDetail(phieuId);
      const phieu = response.data;

      console.log("📄 Raw phieu data from backend:", phieu);

      setPhieuStatus(phieu.trang_thai);
      setOriginalData(phieu);
      setLinkedPhieu(phieu.phieu_nhap_lien_ket || null);

      // Format date for input
      const formattedDate = phieu.ngay_xuat
        ? new Date(phieu.ngay_xuat).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      // ✅ FIX: Xử lý đơn vị nhận và phòng ban nhận
      let donViNhanData = null;
      let phongBanNhanData = null;

      // Nếu có phong_ban_nhan_id -> đây là xuất đơn vị (luân chuyển)
      if (phieu.phong_ban_nhan_id && phieu.ten_phong_ban_nhan) {
        phongBanNhanData = {
          id: phieu.phong_ban_nhan_id,
          ten_phong_ban: phieu.ten_phong_ban_nhan,
          cap_bac: phieu.cap_bac_nhan || 3,
          ma_phong_ban: phieu.ma_phong_ban_nhan || "",
        };
      }

      // Nếu có don_vi_nhan_id -> đây là xuất cho đơn vị ngoài
      if (phieu.don_vi_nhan_id && phieu.ten_don_vi_nhan) {
        donViNhanData = {
          id: phieu.don_vi_nhan_id,
          ten_don_vi: phieu.ten_don_vi_nhan,
          dia_chi: phieu.don_vi_nhan_dia_chi || "",
        };
      }

      // ✅ FIX: Xử lý chi tiết hàng hóa đúng cách
      const chiTietFormatted = (phieu.chi_tiet || []).map((item) => ({
        id: item.id,
        hang_hoa_id: item.hang_hoa_id,
        hang_hoa: {
          id: item.hang_hoa_id,
          ten_hang_hoa: item.ten_hang_hoa, // ← Backend response có sẵn
          ma_hang_hoa: item.ma_hang_hoa, // ← Backend response có sẵn
          don_vi_tinh: item.don_vi_tinh, // ← Backend response có sẵn
          don_gia_xuat: parseFloat(item.don_gia) || 0,
        },
        so_luong_yeu_cau: parseFloat(item.so_luong_yeu_cau) || 1,
        so_luong_thuc_xuat: parseFloat(item.so_luong_thuc_xuat) || 1,
        don_gia: parseFloat(item.don_gia) || 0,
        thanh_tien: parseFloat(item.thanh_tien) || 0,
        pham_chat: item.pham_chat || "tot",
        so_seri_xuat: item.so_seri_xuat || "",
        ghi_chu: item.ghi_chu || "",
      }));

      // Reset form with properly formatted data
      const formData = {
        so_phieu: phieu.so_phieu || "",
        ngay_xuat: formattedDate,
        loai_xuat: phieu.loai_xuat || "don_vi_nhan",
        ly_do_xuat: phieu.ly_do_xuat || "",
        so_quyet_dinh: phieu.so_quyet_dinh || "",
        nguoi_giao_hang: phieu.nguoi_giao_hang || "",
        nguoi_nhan: phieu.nguoi_nhan || "",
        ghi_chu: phieu.ghi_chu || "",

        // ✅ Set đúng dữ liệu đã format
        don_vi_nhan: donViNhanData,
        don_vi_nhan_id: donViNhanData?.id || null,
        phong_ban_nhan: phongBanNhanData,
        phong_ban_nhan_id: phongBanNhanData?.id || null,

        chi_tiet: chiTietFormatted,
      };

      console.log("🔧 Formatted form data:", formData);

      // ✅ FIX: Set đúng states cho dropdown cấp 2/3 - LOAD THÔNG TIN CHA
      if (phongBanNhanData && phongBanNhanData.cap_bac === 3) {
        setPhongBanNhanData(phongBanNhanData);

        // Load thông tin phòng ban cha (cấp 2)
        try {
          const parentResponse = await xuatKhoService.getPhongBanParent(
            phongBanNhanData.id
          );
          if (parentResponse.success && parentResponse.data) {
            const parentData = parentResponse.data;
            setSelectedCap2(parentData.id);

            // Load danh sách cấp 3 của cấp 2 này
            const cap3Response = await xuatKhoService.getPhongBanCap3ByParent(
              parentData.id
            );
            if (cap3Response.success) {
              setPhongBanCap3List(cap3Response.data || []);
              setSelectedCap3(phongBanNhanData.id);
            }
          }
        } catch (error) {
          console.error("❌ Error loading parent info:", error);
          // Fallback: chỉ set cấp 3
          setSelectedCap3(phongBanNhanData.id);
        }
      }

      if (donViNhanData) {
        setDonViNhanData(donViNhanData);
      }

      // Reset form
      reset(formData);

      // Replace chi tiết array
      replace(chiTietFormatted);

      setDataLoaded(true);

      // Delay để đảm bảo form được reset hoàn toàn
      setTimeout(() => {
        setFormReady(true);
        console.log("✅ Form ready with data");
      }, 200);
    } catch (error) {
      console.error("❌ Error loading phieu data:", error);
      toast.error("Không thể tải thông tin phiếu");
      setDataLoaded(false);
      setFormReady(false);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Submit form
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      console.log("📤 Submitting edit xuat kho:", data);

      // Validation
      if (!data.chi_tiet || data.chi_tiet.length === 0) {
        toast.error("Vui lòng thêm ít nhất một hàng hóa");
        return;
      }

      // Validate each item
      for (let i = 0; i < data.chi_tiet.length; i++) {
        const item = data.chi_tiet[i];
        if (!item.hang_hoa_id) {
          toast.error(`Dòng ${i + 1}: Vui lòng chọn hàng hóa`);
          return;
        }
        if (!item.so_luong_thuc_xuat || item.so_luong_thuc_xuat <= 0) {
          toast.error(`Dòng ${i + 1}: Số lượng phải lớn hơn 0`);
          return;
        }
      }

      // Format data for submission
      const submitData = {
        ...data,
        chi_tiet: data.chi_tiet.map((item) => ({
          id: item.id,
          hang_hoa_id: item.hang_hoa_id,
          so_luong_yeu_cau: parseFloat(item.so_luong_yeu_cau) || 1,
          so_luong_thuc_xuat: parseFloat(item.so_luong_thuc_xuat) || 1,
          don_gia: parseFloat(item.don_gia) || 0,
          thanh_tien:
            parseFloat(item.so_luong_thuc_xuat || 1) *
            parseFloat(item.don_gia || 0),
          pham_chat: item.pham_chat || "tot",
          so_seri_xuat: item.so_seri_xuat || "",
          ghi_chu: item.ghi_chu || "",
        })),
      };

      let response;
      if (isEditActualMode) {
        // Update actual quantity only
        response = await xuatKhoService.updateActualQuantity(phieuId, {
          chi_tiet: submitData.chi_tiet,
        });
      } else {
        // Regular update
        response = await xuatKhoService.update(phieuId, submitData);
      }

      console.log("✅ Update response:", response);

      toast.success(
        isEditActualMode
          ? "Cập nhật số lượng thực tế thành công!"
          : "Cập nhật phiếu xuất thành công!"
      );

      onSuccess?.();
    } catch (error) {
      console.error("❌ Error updating phieu:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật phiếu"
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (isLoadingData || !dataLoaded || !formReady) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!originalData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
        <p className="text-gray-600">Không thể tải thông tin phiếu xuất</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header Info */}
      <HeaderInfo />

      {/* Basic Info */}
      <BasicInfoSection />

      {/* Đơn vị nhận */}
      <DonViNhanSection />

      {/* Chi tiết hàng hóa */}
      <ChiTietSection />

      {/* Footer */}
      <FooterSection />
    </form>
  );

  // ✅ HEADER INFO COMPONENT
  function HeaderInfo() {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditActualMode
                ? "Chỉnh sửa số lượng thực tế"
                : "Chỉnh sửa phiếu xuất"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Số phiếu:{" "}
              <span className="font-medium">{originalData.so_phieu}</span>
            </p>
          </div>

          {/* Status badge */}
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                phieuStatus === "draft"
                  ? "bg-gray-100 text-gray-800"
                  : phieuStatus === "confirmed"
                  ? "bg-blue-100 text-blue-800"
                  : phieuStatus === "approved"
                  ? "bg-green-100 text-green-800"
                  : phieuStatus === "completed"
                  ? "bg-purple-100 text-purple-800"
                  : phieuStatus === "revision_required"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {phieuStatus === "draft" && "Nháp"}
              {phieuStatus === "confirmed" && "Chờ duyệt"}
              {phieuStatus === "approved" && "Đã duyệt"}
              {phieuStatus === "completed" && "Hoàn thành"}
              {phieuStatus === "revision_required" && "Yêu cầu chỉnh sửa"}
              {phieuStatus === "cancelled" && "Đã hủy"}
            </span>

            {originalData.loai_xuat && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {originalData.loai_xuat === "don_vi_nhan"
                  ? "Xuất đơn vị"
                  : "Xuất sử dụng"}
              </span>
            )}
          </div>
        </div>

        {/* Revision info */}
        {phieuStatus === "revision_required" &&
          originalData?.ghi_chu_phan_hoi && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Yêu cầu chỉnh sửa:
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    {originalData.ghi_chu_phan_hoi}
                  </p>
                  {originalData.nguoi_phan_hoi_ten && (
                    <p className="text-xs text-orange-600 mt-1">
                      - Người yêu cầu: {originalData.nguoi_phan_hoi_ten}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Edit actual mode info */}
        {isEditActualMode && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Bạn chỉ có thể chỉnh sửa số lượng thực tế xuất kho.
              </span>
            </div>
          </div>
        )}

        {/* Linked phieu info */}
        {linkedPhieu && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center space-x-2">
              <Link2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                Phiếu xuất tự động từ phiếu nhập:
                <span className="font-medium ml-1">{linkedPhieu.so_phieu}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ✅ BASIC INFO SECTION
  function BasicInfoSection() {
    return (
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Thông tin cơ bản</h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Ngày xuất */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
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

          {/* Loại xuất */}
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
                  {value.label || value}
                </option>
              ))}
            </select>
            {errors.loai_xuat && (
              <p className="mt-1 text-sm text-red-600">
                {errors.loai_xuat.message}
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
              disabled={isEditActualMode || !canEdit}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100"
              placeholder="Số quyết định xuất"
            />
          </div>

          {/* Người nhận */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="inline h-4 w-4 mr-1" />
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

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Lý do xuất */}
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

          {/* Ghi chú */}
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
    );
  }

  // ✅ ĐƠN VỊ NHẬN SECTION - LOGIC ĐÚNG NHƯ CreateXuatKhoForm
  function DonViNhanSection() {
    if (loaiXuat !== "don_vi_nhan") return null;

    return (
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">
          <Building className="inline h-4 w-4 mr-1" />
          Đơn vị nhận hàng
        </h4>

        {/* ✅ DROPDOWN CẤP 2/3 GIỐNG CreateXuatKhoForm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cấp 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. Chọn cấp 2 *
            </label>
            {!formReady ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 text-sm">
                Đang tải dữ liệu...
              </div>
            ) : (
              <select
                value={selectedCap2 || ""}
                onChange={(e) => handleCap2Select(e.target.value)}
                disabled={!canEdit || isEditActualMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100"
              >
                <option value="">-- Chọn cấp 2 --</option>
                {phongBanCap2List.map((pb) => (
                  <option key={pb.id} value={pb.id}>
                    {pb.ten_phong_ban}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Cấp 3 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Chọn cấp 3 (kho) *
            </label>
            {!formReady ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 text-sm">
                Đang tải dữ liệu...
              </div>
            ) : (
              <select
                value={selectedCap3 || ""}
                onChange={(e) => handleCap3Select(e.target.value)}
                disabled={
                  !canEdit ||
                  isEditActualMode ||
                  !selectedCap2 ||
                  phongBanCap3List.length === 0
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm disabled:bg-gray-100"
              >
                <option value="">-- Chọn cấp 3 --</option>
                {phongBanCap3List.map((pb) => (
                  <option key={pb.id} value={pb.id}>
                    {pb.ten_phong_ban}
                  </option>
                ))}
              </select>
            )}
            {!selectedCap2 && (
              <p className="mt-1 text-xs text-gray-500">
                Vui lòng chọn cấp 2 trước
              </p>
            )}
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Chọn phòng ban cấp 3 để xuất hàng nội bộ (luân chuyển)
        </p>
      </div>
    );
  }

  // ✅ CHI TIẾT SECTION
  function ChiTietSection() {
    return (
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              <Package className="inline h-4 w-4 mr-1" />
              Chi tiết hàng hóa xuất kho
            </h4>
            {canEdit && !isEditActualMode && (
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Thêm hàng hóa</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-12">
                  STT
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase min-w-[250px]">
                  Hàng hóa *
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[12%]">
                  SL yêu cầu *
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[12%]">
                  SL thực xuất *
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-[13%]">
                  Đơn giá *
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-[10%]">
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

                return (
                  <tr key={field.id} className="hover:bg-gray-50">
                    {/* STT */}
                    <td className="px-3 py-2 text-center text-gray-900 font-medium">
                      {index + 1}
                    </td>

                    {/* Hàng hóa */}
                    <td className="px-3 py-2">
                      {canEdit && !isEditActualMode ? (
                        <AutoComplete
                          key={`product-${index}-${
                            formReady
                              ? currentItem.hang_hoa_id || "new"
                              : "loading"
                          }`}
                          searchFunction={(query) =>
                            searchService.searchHangHoaForXuatKho(
                              query,
                              user.phong_ban_id
                            )
                          }
                          onSelect={(hangHoa) =>
                            handleHangHoaSelect(hangHoa, index)
                          }
                          placeholder="Chọn hàng hóa..."
                          displayField="ten_hang_hoa"
                          className="w-full"
                          // ✅ FIX: Truyền object thay vì string
                          initialValue={currentItem.hang_hoa || null}
                          allowCreate={false}
                        />
                      ) : (
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {/* ✅ COPY EXACT LOGIC TỪ PhieuXuatDetail */}
                            {currentItem.hang_hoa?.ten_hang_hoa ||
                              currentItem.ten_hang_hoa ||
                              "Không xác định"}
                          </div>

                          {/* ✅ SỬA ĐIỀU KIỆN HIỂN THỊ MÃ HÀNG HÓA */}
                          {(currentItem.hang_hoa?.ma_hang_hoa ||
                            currentItem.ma_hang_hoa) && (
                            <div className="text-xs text-gray-500 space-x-4">
                              <span>
                                Mã:{" "}
                                {currentItem.hang_hoa?.ma_hang_hoa ||
                                  currentItem.ma_hang_hoa ||
                                  "N/A"}
                              </span>

                              {/* ✅ THÊM ĐƠN VỊ TÍNH */}
                              <span>
                                ĐVT:{" "}
                                {currentItem.hang_hoa?.don_vi_tinh ||
                                  currentItem.don_vi_tinh ||
                                  "N/A"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* SL yêu cầu */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        {...register(`chi_tiet.${index}.so_luong_yeu_cau`, {
                          required: "Bắt buộc",
                          min: { value: 0.01, message: "Phải > 0" },
                        })}
                        disabled={isEditActualMode || !canEdit}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm disabled:bg-gray-100"
                        onChange={(e) => {
                          handleQuantityOrPriceChange(
                            index,
                            "so_luong_yeu_cau",
                            e.target.value
                          );
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                    </td>

                    {/* SL thực xuất */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        {...register(`chi_tiet.${index}.so_luong_thuc_xuat`, {
                          required: "Bắt buộc",
                          min: { value: 0.01, message: "Phải > 0" },
                        })}
                        disabled={!canEdit && !canEditActual}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm disabled:bg-gray-100"
                        onChange={(e) => {
                          handleQuantityOrPriceChange(
                            index,
                            "so_luong_thuc_xuat",
                            e.target.value
                          );
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                    </td>

                    {/* Đơn giá */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        {...register(`chi_tiet.${index}.don_gia`, {
                          required: "Bắt buộc",
                          min: { value: 0, message: "Phải >= 0" },
                        })}
                        disabled={isEditActualMode || !canEdit}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right text-sm disabled:bg-gray-100"
                        onChange={(e) => {
                          handleQuantityOrPriceChange(
                            index,
                            "don_gia",
                            e.target.value
                          );
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                    </td>

                    {/* Phẩm chất */}
                    <td className="px-3 py-2">
                      <select
                        {...register(`chi_tiet.${index}.pham_chat`)}
                        disabled={isEditActualMode || !canEdit}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      >
                        {Object.entries(PHAM_CHAT).map(([key, value]) => (
                          <option key={key} value={key}>
                            {value.label || value}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Thành tiền */}
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(thanhTien)}
                    </td>

                    {/* Thao tác */}
                    {canEdit && !isEditActualMode && (
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          disabled={fields.length <= 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-600">Tổng tiền:</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(tongTien)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FOOTER SECTION
  function FooterSection() {
    return (
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Hủy
        </button>

        {(canEdit || (isEditActualMode && canEditActual)) && (
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>
              {loading
                ? "Đang lưu..."
                : isEditActualMode
                ? "Cập nhật số lượng"
                : "Cập nhật phiếu"}
            </span>
          </button>
        )}
      </div>
    );
  }
};

export default EditXuatKhoForm;
