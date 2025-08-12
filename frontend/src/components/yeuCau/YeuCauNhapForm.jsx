import React, { useState, useEffect, useContext } from "react";
import {
  Plus,
  Minus,
  Save,
  X,
  Search,
  Calendar,
  AlertTriangle,
  Package,
  FileText,
  Clock,
  User,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { yeuCauService } from "../../services/yeuCauService";
import { hangHoaService } from "../../services/hangHoaService";
import { departmentService } from "../../services/departmentService";
import { formatCurrency } from "../../utils/helpers";
import toast from "react-hot-toast";
import Loading from "../common/Loading";

const YeuCauNhapForm = ({
  mode = "create",
  yeuCauId = null,
  onSuccess,
  onCancel,
}) => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hangHoaOptions, setHangHoaOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    ngay_yeu_cau: new Date().toISOString().split("T")[0],
    ngay_can_hang: "",
    ly_do_yeu_cau: "",
    muc_do_uu_tien: "binh_thuong",
    don_vi_yeu_cau_id: user?.phong_ban_id || "",
    ghi_chu: "",
    chi_tiet: [],
  });

  const [errors, setErrors] = useState({});

  // Priority options
  const priorityOptions = [
    { value: "thap", label: "Thấp", color: "text-gray-600" },
    { value: "binh_thuong", label: "Bình thường", color: "text-blue-600" },
    { value: "cao", label: "Cao", color: "text-orange-600" },
    { value: "khan_cap", label: "Khẩn cấp", color: "text-red-600" },
  ];

  // Load initial data
  useEffect(() => {
    loadDepartments();
    if (mode === "edit" && yeuCauId) {
      loadYeuCauData();
    }
  }, [mode, yeuCauId]);

  // Load hang hoa options when searching
  useEffect(() => {
    if (searchTerm.length >= 2) {
      loadHangHoaOptions();
    }
  }, [searchTerm]);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getList();
      if (response.success) {
        setDepartmentOptions(response.data.items || []);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const loadHangHoaOptions = async () => {
    try {
      const response = await hangHoaService.searchSuggestions({
        search: searchTerm,
        limit: 20,
      });
      if (response.success) {
        setHangHoaOptions(response.data.items || []);
      }
    } catch (error) {
      console.error("Error loading hang hoa options:", error);
    }
  };

  const loadYeuCauData = async () => {
    try {
      setIsLoading(true);
      const response = await yeuCauService.getYeuCauNhapDetail(yeuCauId);
      if (response.success) {
        const data = response.data;
        setFormData({
          ngay_yeu_cau: data.ngay_yeu_cau,
          ngay_can_hang: data.ngay_can_hang || "",
          ly_do_yeu_cau: data.ly_do_yeu_cau || "",
          muc_do_uu_tien: data.muc_do_uu_tien || "binh_thuong",
          don_vi_yeu_cau_id: data.don_vi_yeu_cau_id || "",
          ghi_chu: data.ghi_chu || "",
          chi_tiet: data.chi_tiet || [],
        });
      }
    } catch (error) {
      console.error("Error loading yeu cau data:", error);
      toast.error("Không thể tải dữ liệu yêu cầu");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ly_do_yeu_cau.trim()) {
      newErrors.ly_do_yeu_cau = "Vui lòng nhập lý do yêu cầu";
    }

    if (!formData.don_vi_yeu_cau_id) {
      newErrors.don_vi_yeu_cau_id = "Vui lòng chọn đơn vị yêu cầu";
    }

    if (
      formData.ngay_can_hang &&
      formData.ngay_can_hang < formData.ngay_yeu_cau
    ) {
      newErrors.ngay_can_hang = "Ngày cần hàng không thể trước ngày yêu cầu";
    }

    if (formData.chi_tiet.length === 0) {
      newErrors.chi_tiet = "Vui lòng thêm ít nhất một mặt hàng";
    }

    // Validate chi tiet items
    formData.chi_tiet.forEach((item, index) => {
      if (!item.hang_hoa_id) {
        newErrors[`chi_tiet_${index}_hang_hoa`] = "Vui lòng chọn hàng hóa";
      }
      if (!item.so_luong_yeu_cau || item.so_luong_yeu_cau <= 0) {
        newErrors[`chi_tiet_${index}_so_luong`] = "Số lượng phải lớn hơn 0";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const addChiTietItem = () => {
    setFormData((prev) => ({
      ...prev,
      chi_tiet: [
        ...prev.chi_tiet,
        {
          hang_hoa_id: "",
          so_luong_yeu_cau: 1,
          don_gia_uoc_tinh: 0,
          ly_do_su_dung: "",
          ghi_chu: "",
        },
      ],
    }));
  };

  const removeChiTietItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      chi_tiet: prev.chi_tiet.filter((_, i) => i !== index),
    }));
  };

  const updateChiTietItem = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      chi_tiet: prev.chi_tiet.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));

    // Clear error for this field
    const errorKey = `chi_tiet_${index}_${
      field === "hang_hoa_id"
        ? "hang_hoa"
        : field === "so_luong_yeu_cau"
        ? "so_luong"
        : field
    }`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const calculateTotalValue = () => {
    return formData.chi_tiet.reduce((total, item) => {
      return total + item.so_luong_yeu_cau * (item.don_gia_uoc_tinh || 0);
    }, 0);
  };

  const handleSubmit = async (action = "draft") => {
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    try {
      setIsSaving(true);

      const submitData = {
        ...formData,
        trang_thai: action === "submit" ? "submitted" : "draft",
      };

      let response;
      if (mode === "edit") {
        response = await yeuCauService.updateYeuCauNhap(yeuCauId, submitData);
      } else {
        response = await yeuCauService.createYeuCauNhap(submitData);
      }

      if (response.success) {
        toast.success(
          action === "submit"
            ? "Gửi yêu cầu thành công"
            : mode === "edit"
            ? "Cập nhật yêu cầu thành công"
            : "Lưu nháp thành công"
        );
        onSuccess && onSuccess(response.data);
      }
    } catch (error) {
      console.error("Error saving yeu cau:", error);
      toast.error("Có lỗi xảy ra khi lưu yêu cầu");
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    //const option = priorityOptions.find(opt => opt.value === priority);
    const baseClass =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (priority) {
      case "khan_cap":
        return `${baseClass} bg-red-100 text-red-800`;
      case "cao":
        return `${baseClass} bg-orange-100 text-orange-800`;
      case "binh_thuong":
        return `${baseClass} bg-blue-100 text-blue-800`;
      case "thap":
        return `${baseClass} bg-gray-100 text-gray-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="mr-2 h-6 w-6 text-blue-600" />
              {mode === "edit"
                ? "Chỉnh sửa yêu cầu nhập kho"
                : "Tạo yêu cầu nhập kho"}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {mode === "edit"
                ? "Cập nhật thông tin yêu cầu nhập kho"
                : "Tạo yêu cầu nhập hàng mới vào kho"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={getPriorityBadgeClass(formData.muc_do_uu_tien)}>
              <AlertTriangle size={12} className="mr-1" />
              {
                priorityOptions.find(
                  (opt) => opt.value === formData.muc_do_uu_tien
                )?.label
              }
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Thông tin cơ bản
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={16} className="inline mr-1" />
                Ngày yêu cầu
              </label>
              <input
                type="date"
                value={formData.ngay_yeu_cau}
                onChange={(e) =>
                  handleInputChange("ngay_yeu_cau", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock size={16} className="inline mr-1" />
                Ngày cần hàng
              </label>
              <input
                type="date"
                value={formData.ngay_can_hang}
                onChange={(e) =>
                  handleInputChange("ngay_can_hang", e.target.value)
                }
                min={formData.ngay_yeu_cau}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.ngay_can_hang ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.ngay_can_hang && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.ngay_can_hang}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <AlertTriangle size={16} className="inline mr-1" />
                Mức độ ưu tiên
              </label>
              <select
                value={formData.muc_do_uu_tien}
                onChange={(e) =>
                  handleInputChange("muc_do_uu_tien", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User size={16} className="inline mr-1" />
                Đơn vị yêu cầu
              </label>
              <select
                value={formData.don_vi_yeu_cau_id}
                onChange={(e) =>
                  handleInputChange("don_vi_yeu_cau_id", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.don_vi_yeu_cau_id
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
                required
              >
                <option value="">Chọn đơn vị</option>
                {departmentOptions.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.ten_phong_ban}
                  </option>
                ))}
              </select>
              {errors.don_vi_yeu_cau_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.don_vi_yeu_cau_id}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do yêu cầu *
            </label>
            <textarea
              value={formData.ly_do_yeu_cau}
              onChange={(e) =>
                handleInputChange("ly_do_yeu_cau", e.target.value)
              }
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.ly_do_yeu_cau ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Nhập lý do cần nhập hàng..."
              required
            />
            {errors.ly_do_yeu_cau && (
              <p className="mt-1 text-sm text-red-600">
                {errors.ly_do_yeu_cau}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={formData.ghi_chu}
              onChange={(e) => handleInputChange("ghi_chu", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ghi chú thêm (không bắt buộc)..."
            />
          </div>
        </div>

        {/* Chi tiet hang hoa */}
        <div className="bg-white border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Package size={20} className="mr-2" />
              Danh sách hàng hóa yêu cầu
            </h3>
            <button
              type="button"
              onClick={addChiTietItem}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1 transition-colors"
            >
              <Plus size={16} />
              <span>Thêm hàng hóa</span>
            </button>
          </div>

          {errors.chi_tiet && (
            <div className="p-4 bg-red-50 border-b">
              <p className="text-sm text-red-600">{errors.chi_tiet}</p>
            </div>
          )}

          <div className="p-4 space-y-4">
            {formData.chi_tiet.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    Mặt hàng #{index + 1}
                  </h4>
                  {formData.chi_tiet.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChiTietItem(index)}
                      className="text-red-600 hover:text-red-800 p-1 rounded"
                    >
                      <Minus size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hàng hóa *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors[`chi_tiet_${index}_hang_hoa`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="Tìm kiếm hàng hóa..."
                      />
                      <Search
                        size={16}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                    </div>

                    {hangHoaOptions.length > 0 && searchTerm.length >= 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {hangHoaOptions.map((hangHoa) => (
                          <button
                            key={hangHoa.id}
                            type="button"
                            onClick={() => {
                              updateChiTietItem(
                                index,
                                "hang_hoa_id",
                                hangHoa.id
                              );
                              updateChiTietItem(
                                index,
                                "don_gia_uoc_tinh",
                                hangHoa.gia_nhap_gan_nhat || 0
                              );
                              setSearchTerm("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {hangHoa.ten_hang_hoa}
                              </p>
                              <p className="text-xs text-gray-500">
                                {hangHoa.ma_hang_hoa} - {hangHoa.don_vi_tinh}
                              </p>
                            </div>
                            <span className="text-sm text-green-600">
                              {formatCurrency(hangHoa.gia_nhap_gan_nhat || 0)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {errors[`chi_tiet_${index}_hang_hoa`] && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors[`chi_tiet_${index}_hang_hoa`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lượng *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={item.so_luong_yeu_cau}
                      onChange={(e) =>
                        updateChiTietItem(
                          index,
                          "so_luong_yeu_cau",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors[`chi_tiet_${index}_so_luong`]
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      required
                    />
                    {errors[`chi_tiet_${index}_so_luong`] && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors[`chi_tiet_${index}_so_luong`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đơn giá ước tính
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={item.don_gia_uoc_tinh}
                      onChange={(e) =>
                        updateChiTietItem(
                          index,
                          "don_gia_uoc_tinh",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lý do sử dụng
                    </label>
                    <input
                      type="text"
                      value={item.ly_do_su_dung}
                      onChange={(e) =>
                        updateChiTietItem(
                          index,
                          "ly_do_su_dung",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mục đích sử dụng..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      value={item.ghi_chu}
                      onChange={(e) =>
                        updateChiTietItem(index, "ghi_chu", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ghi chú..."
                    />
                  </div>
                </div>

                {item.so_luong_yeu_cau > 0 && item.don_gia_uoc_tinh > 0 && (
                  <div className="mt-2 text-right">
                    <span className="text-sm text-gray-600">Thành tiền: </span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(
                        item.so_luong_yeu_cau * item.don_gia_uoc_tinh
                      )}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {formData.chi_tiet.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Chưa có hàng hóa nào được thêm</p>
                <p className="text-sm">Nhấn "Thêm hàng hóa" để bắt đầu</p>
              </div>
            )}
          </div>

          {formData.chi_tiet.length > 0 && (
            <div className="border-t p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Tổng số mặt hàng: {formData.chi_tiet.length}
                </span>
                <span className="text-lg font-medium text-gray-900">
                  Tổng giá trị ước tính: {formatCurrency(calculateTotalValue())}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X size={16} className="inline mr-1" />
            Hủy
          </button>

          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={isSaving}
            className="px-4 py-2 text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <Save size={16} className="inline mr-1" />
            {isSaving ? "Đang lưu..." : "Lưu nháp"}
          </button>

          <button
            type="button"
            onClick={() => handleSubmit("submit")}
            disabled={isSaving}
            className="px-4 py-2 text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <FileText size={16} className="inline mr-1" />
            {isSaving ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default YeuCauNhapForm;
