import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  User,
  Calendar,
  FileText,
  Package,
  Building,
  AlertTriangle,
  Info,
  Clock,
  Link2,
  RefreshCw,
  Truck,
  Target,
} from "lucide-react";
import { xuatKhoService } from "../../services/xuatKhoService";
import { formatCurrency, formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const CompletePhieuXuatForm = ({ phieuId, onSuccess, onCancel }) => {
  // States
  const [phieuData, setPhieuData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nguoi_giao_hang: "",
    nguoi_nhan: "",
    ghi_chu_xac_nhan: "",
  });
  const [errors, setErrors] = useState({});

  // Load phieu data when component mounts
  useEffect(() => {
    if (phieuId) {
      loadPhieuData();
    }
  }, [phieuId]);

  // ✅ LOAD PHIEU DATA VỚI THÔNG TIN PHIẾU LIÊN KẾT
  const loadPhieuData = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Loading phieu xuat data for completion:", phieuId);

      const response = await xuatKhoService.getDetail(phieuId);
      const phieu = response.data;

      console.log("📄 Loaded phieu xuat for completion:", phieu);
      setPhieuData(phieu);

      // Pre-fill form với dữ liệu có sẵn
      setFormData({
        nguoi_giao_hang: phieu.nguoi_giao_hang || "",
        nguoi_nhan: phieu.nguoi_nhan || "",
        ghi_chu_xac_nhan: "",
      });
    } catch (error) {
      console.error("❌ Error loading phieu data:", error);
      toast.error("Không thể tải thông tin phiếu");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ VALIDATION FORM TRƯỚC KHI SUBMIT
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nguoi_giao_hang.trim()) {
      newErrors.nguoi_giao_hang = "Vui lòng nhập thông tin người giao hàng";
    }

    if (!formData.nguoi_nhan.trim()) {
      newErrors.nguoi_nhan = "Vui lòng nhập thông tin người nhận hàng";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ HANDLE FORM CHANGES
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // ✅ SUBMIT FORM - HOÀN THÀNH PHIẾU XUẤT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Confirm trước khi hoàn thành
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hoàn thành phiếu xuất này? Sau khi hoàn thành sẽ không thể chỉnh sửa."
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    toast.loading("Đang hoàn thành phiếu xuất...", { id: "completing" });

    try {
      const submitData = {
        nguoi_giao_hang: formData.nguoi_giao_hang.trim(),
        nguoi_nhan: formData.nguoi_nhan.trim(),
        ghi_chu_xac_nhan: formData.ghi_chu_xac_nhan.trim() || null,
      };

      console.log("📤 Completing phieu xuat with data:", submitData);

      const response = await xuatKhoService.complete(phieuId, submitData);

      toast.dismiss("completing");

      // ✅ THÔNG BÁO THÀNH CÔNG VỚI THÔNG TIN PHIẾU LIÊN KẾT
      if (phieuData?.phieu_nhap_lien_ket_id && phieuData?.is_tu_dong) {
        toast.success(
          "Hoàn thành phiếu xuất thành công! Phiếu nhập liên kết cũng đã được tự động cập nhật.",
          {
            duration: 6000,
            icon: "🔗",
            style: {
              background: "#DC2626",
              color: "white",
            },
          }
        );
      } else {
        toast.success("Hoàn thành phiếu xuất thành công!", {
          icon: "✅",
          duration: 4000,
        });
      }

      onSuccess();
    } catch (error) {
      console.error("❌ Error completing phieu xuat:", error);
      toast.dismiss("completing");

      const errorMessage =
        error.response?.data?.message || "Không thể hoàn thành phiếu xuất";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ COMPONENT HIỂN THỊ THÔNG TIN PHIẾU XUẤT
  const PhieuInfoSection = () => (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
        <Package className="h-5 w-5 mr-2 text-red-600" />
        Thông tin phiếu xuất: {phieuData?.so_phieu}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-gray-600">Ngày xuất:</span>
            <span className="ml-1 font-medium">
              {formatDate(phieuData?.ngay_xuat)}
            </span>
          </div>
          <div className="flex items-center">
            <Building className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-gray-600">Phòng ban:</span>
            <span className="ml-1 font-medium">
              {phieuData?.phong_ban?.ten_phong_ban}
            </span>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-gray-600">Người tạo:</span>
            <span className="ml-1 font-medium">{phieuData?.nguoi_tao_ten}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-gray-600">Loại xuất:</span>
            <span className="ml-1 font-medium">
              {phieuData?.loai_xuat === "don_vi_nhan"
                ? "Đơn vị nhận"
                : phieuData?.loai_xuat === "don_vi_su_dung"
                ? "Đơn vị sử dụng"
                : "N/A"}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600">Tổng tiền:</span>
            <span className="ml-1 font-bold text-red-600">
              {formatCurrency(phieuData?.tong_tien)}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600">Số mặt hàng:</span>
            <span className="ml-1 font-medium">
              {phieuData?.chi_tiet?.length || 0}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            <span className="text-gray-600">Trạng thái:</span>
            <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
              Đã duyệt
            </span>
          </div>
          {phieuData?.nguoi_duyet_ten && (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Người duyệt:</span>
              <span className="ml-1 font-medium">
                {phieuData.nguoi_duyet_ten}
              </span>
            </div>
          )}
          {phieuData?.ngay_duyet_cap1 && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Ngày duyệt:</span>
              <span className="ml-1 font-medium">
                {formatDate(phieuData.ngay_duyet_cap1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Đơn vị nhận info */}
      {(phieuData?.don_vi_nhan || phieuData?.phong_ban_nhan) && (
        <div className="mt-3 p-3 bg-white border rounded">
          <p className="text-sm">
            <span className="font-medium text-gray-700">
              {phieuData.loai_xuat === "don_vi_nhan"
                ? "Đơn vị nhận:"
                : "Đơn vị sử dụng:"}
            </span>
            <span className="ml-1 text-gray-600">
              {phieuData.don_vi_nhan?.ten ||
                phieuData.phong_ban_nhan?.ten_phong_ban}
            </span>
          </p>
        </div>
      )}

      {/* Lý do xuất */}
      {phieuData?.ly_do_xuat && (
        <div className="mt-3 p-3 bg-white border rounded">
          <p className="text-sm">
            <span className="font-medium text-gray-700">Lý do xuất:</span>
            <span className="ml-1 text-gray-600">{phieuData.ly_do_xuat}</span>
          </p>
        </div>
      )}
    </div>
  );

  // ✅ COMPONENT HIỂN THỊ THÔNG TIN PHIẾU LIÊN KẾT
  const LinkedDocumentInfo = () => {
    if (!phieuData?.phieu_nhap_lien_ket_id) return null;

    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Link2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">
              Phiếu liên kết tự động
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              Phiếu xuất này có liên kết với phiếu nhập tự động của đơn vị nhận.
              Khi hoàn thành, phiếu nhập liên kết cũng sẽ được tự động cập nhật.
            </p>

            {phieuData.phieu_nhap_lien_ket && (
              <div className="bg-white p-3 rounded border">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium">Phiếu nhập liên kết:</span>
                    <div className="text-gray-600 mt-1">
                      {phieuData.phieu_nhap_lien_ket.so_phieu}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Đơn vị nhận:</span>
                    <div className="text-gray-600 mt-1">
                      {phieuData.don_vi_nhan?.ten ||
                        phieuData.phong_ban_nhan?.ten_phong_ban ||
                        "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Trạng thái nhập:</span>
                    <div className="text-gray-600 mt-1">
                      {phieuData.phieu_nhap_lien_ket.trang_thai === "draft"
                        ? "Nháp tự động"
                        : phieuData.phieu_nhap_lien_ket.trang_thai ===
                          "completed"
                        ? "Đã hoàn thành"
                        : "Khác"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Tự động:</span>
                    <div className="text-blue-600 mt-1 font-medium">Có</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <strong>Lưu ý:</strong> Sau khi hoàn thành phiếu xuất này, đơn vị
              nhận sẽ nhận được thông báo và phiếu nhập liên kết sẽ được tự động
              cập nhật.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ COMPONENT CHI TIẾT HÀNG HÓA - CHỈ HIỂN THỊ, KHÔNG EDIT
  const ChiTietSection = () => (
    <div className="bg-white border rounded-lg mb-6">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">
          Chi tiết hàng hóa xuất kho
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Danh sách hàng hóa sẽ được xuất khỏi kho
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                STT
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hàng hóa
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                ĐVT
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                SL yêu cầu
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                SL thực xuất
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Đơn giá
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thành tiền
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phẩm chất
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(phieuData?.chi_tiet || []).map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-center text-sm text-gray-900">
                  {index + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {item.hang_hoa?.ten_hang_hoa || "N/A"}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Mã: {item.hang_hoa?.ma_hang_hoa || "N/A"}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-900">
                  {item.hang_hoa?.don_vi_tinh || "N/A"}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {item.so_luong_yeu_cau || 0}
                </td>
                <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                  {item.so_luong_thuc_xuat || item.so_luong || 0}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">
                  {formatCurrency(item.don_gia || 0)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(item.thanh_tien || 0)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      item.pham_chat === "tot"
                        ? "bg-green-100 text-green-800"
                        : item.pham_chat === "kem"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.pham_chat === "tot"
                      ? "Tốt"
                      : item.pham_chat === "kem"
                      ? "Kém"
                      : "Hỏng"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-red-50">
              <td
                colSpan={6}
                className="px-4 py-3 text-right text-sm font-bold text-gray-900"
              >
                TỔNG CỘNG:
              </td>
              <td className="px-4 py-3 text-right text-lg font-bold text-red-600">
                {formatCurrency(phieuData?.tong_tien || 0)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  // ✅ FORM NHẬP THÔNG TIN HOÀN THÀNH
  const CompletionForm = () => (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center mb-4">
        <CheckCircle className="h-6 w-6 text-red-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">
          Thông tin hoàn thành xuất kho
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Người giao hàng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Người giao hàng *
          </label>
          <input
            type="text"
            value={formData.nguoi_giao_hang}
            onChange={(e) =>
              handleInputChange("nguoi_giao_hang", e.target.value)
            }
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
              errors.nguoi_giao_hang
                ? "border-red-300 bg-red-50"
                : "border-gray-300"
            }`}
            placeholder="Nhập tên người thực tế giao hàng"
            disabled={isSubmitting}
          />
          {errors.nguoi_giao_hang && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {errors.nguoi_giao_hang}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Tên người thực tế giao hàng từ kho
          </p>
        </div>

        {/* Người nhận hàng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Người nhận hàng *
          </label>
          <input
            type="text"
            value={formData.nguoi_nhan}
            onChange={(e) => handleInputChange("nguoi_nhan", e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
              errors.nguoi_nhan ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
            placeholder="Nhập tên người thực tế nhận hàng"
            disabled={isSubmitting}
          />
          {errors.nguoi_nhan && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {errors.nguoi_nhan}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Tên người thực tế nhận hàng từ{" "}
            {phieuData?.don_vi_nhan?.ten ||
              phieuData?.phong_ban_nhan?.ten_phong_ban ||
              "đơn vị"}
          </p>
        </div>
      </div>

      {/* Ghi chú xác nhận */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileText className="inline h-4 w-4 mr-1" />
          Ghi chú xác nhận giao nhận
        </label>
        <textarea
          value={formData.ghi_chu_xac_nhan}
          onChange={(e) =>
            handleInputChange("ghi_chu_xac_nhan", e.target.value)
          }
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          rows={4}
          placeholder="Nhập ghi chú về quá trình giao nhận hàng (tùy chọn)..."
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-gray-500">
          Ghi chú bổ sung về tình trạng giao nhận, phương thức vận chuyển thực
          tế, v.v.
        </p>
      </div>

      {/* Validation summary */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 mb-1">
              Lưu ý khi hoàn thành xuất kho
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>
                • Phiếu sẽ chuyển sang trạng thái "Hoàn thành" và không thể
                chỉnh sửa
              </li>
              <li>• Hàng hóa sẽ chính thức được trừ khỏi tồn kho</li>
              <li>• Người tạo phiếu sẽ nhận thông báo về việc hoàn thành</li>
              {phieuData?.loai_xuat === "don_vi_nhan" && (
                <li>• Đơn vị nhận sẽ được thông báo về việc giao hàng</li>
              )}
              {phieuData?.phieu_nhap_lien_ket_id && (
                <li>
                  • Phiếu nhập liên kết sẽ được tự động cập nhật thông tin giao
                  nhận
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin phiếu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!phieuData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không thể tải phiếu
        </h3>
        <p className="text-gray-600">Vui lòng thử lại sau</p>
      </div>
    );
  }

  // Check if can complete
  if (phieuData.trang_thai !== "approved") {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không thể hoàn thành
        </h3>
        <p className="text-gray-600">
          Phiếu phải ở trạng thái "Đã duyệt" mới có thể hoàn thành.
          <br />
          Trạng thái hiện tại: {phieuData.trang_thai}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phiếu info */}
        <PhieuInfoSection />

        {/* Linked document info */}
        <LinkedDocumentInfo />

        {/* Chi tiết hàng hóa */}
        <ChiTietSection />

        {/* Completion form */}
        <CompletionForm />

        {/* Action buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t bg-gray-50 -mx-6 px-6 -mb-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2 transition-colors shadow-lg"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Đang hoàn thành...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Hoàn thành phiếu xuất</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompletePhieuXuatForm;
