import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { nhapKhoService } from "../../services/nhapKhoService";
import { formatCurrency, formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const CompletePhieuNhapForm = ({ phieuId, onSuccess, onCancel }) => {
  // 🔥 FIX: Tách state để tránh re-render không cần thiết
  const [phieuData, setPhieuData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 FIX: Form state riêng biệt và stable
  const [formData, setFormData] = useState({
    nguoi_giao_hang: "",
    nguoi_nhap_hang: "",
    ghi_chu_hoan_thanh: "",
  });

  const [errors, setErrors] = useState({});

  // 🔥 FIX: Load data một lần và không re-render
  useEffect(() => {
    if (phieuId) {
      loadPhieuData();
    }
  }, [phieuId]); // CHỈ depend vào phieuId

  const loadPhieuData = async () => {
    try {
      setIsLoading(true);
      console.log("📄 Loading phieu data for completion:", phieuId);

      const response = await nhapKhoService.getDetail(phieuId);
      const phieu = response.data;

      console.log("📄 Loaded phieu for completion:", phieu);
      setPhieuData(phieu);

      // 🔥 FIX: Pre-fill form STABLE - chỉ set một lần
      setFormData((prevData) => ({
        nguoi_giao_hang: phieu.nguoi_giao_hang || prevData.nguoi_giao_hang,
        nguoi_nhap_hang: phieu.nguoi_nhap_hang || prevData.nguoi_nhap_hang,
        ghi_chu_hoan_thanh: prevData.ghi_chu_hoan_thanh || "", // Giữ nguyên user input
      }));
    } catch (error) {
      console.error("❌ Error loading phieu data:", error);
      toast.error("Không thể tải thông tin phiếu");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 FIX: Memoize validation function để tránh re-create
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.nguoi_giao_hang.trim()) {
      newErrors.nguoi_giao_hang = "Vui lòng nhập thông tin người giao hàng";
    }

    if (!formData.nguoi_nhap_hang.trim()) {
      newErrors.nguoi_nhap_hang = "Vui lòng nhập thông tin người nhận hàng";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.nguoi_giao_hang, formData.nguoi_nhap_hang]);

  // 🔥 FIX: Stable input handlers để tránh re-render
  const handleInputChange = useCallback((field, value) => {
    console.log(`🖊️ Input change: ${field} = "${value}"`);

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    setErrors((prev) => {
      if (prev[field]) {
        const { [field]: removed, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  }, []); // KHÔNG dependency để tránh re-create function

  // 🔥 FIX: Memoize submit function
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
        return;
      }

      // Confirm trước khi hoàn thành
      if (
        !window.confirm(
          "Bạn có chắc chắn muốn hoàn thành phiếu này? Sau khi hoàn thành sẽ không thể chỉnh sửa."
        )
      ) {
        return;
      }

      setIsSubmitting(true);
      const toastId = toast.loading("Đang hoàn thành phiếu...");

      try {
        const submitData = {
          nguoi_giao_hang: formData.nguoi_giao_hang.trim(),
          nguoi_nhap_hang: formData.nguoi_nhap_hang.trim(),
          ghi_chu_hoan_thanh: formData.ghi_chu_hoan_thanh.trim() || null,
        };

        console.log("📤 Completing phieu with data:", submitData);

        await nhapKhoService.complete(phieuId, submitData);

        toast.success("Hoàn thành phiếu nhập thành công!", {
          id: toastId,
          icon: "✅",
          duration: 4000,
        });

        onSuccess();
      } catch (error) {
        console.error("❌ Error completing phieu:", error);

        const errorMessage =
          error.response?.data?.message || "Không thể hoàn thành phiếu nhập";

        toast.error(errorMessage, {
          id: toastId,
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [phieuId, formData, validateForm, onSuccess]
  ); // Stable dependencies

  // 🔥 FIX: Memoize các components để tránh re-render
  const PhieuInfoSection = useMemo(() => {
    if (!phieuData) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Package className="h-5 w-5 mr-2 text-green-600" />
          Thông tin phiếu nhập: {phieuData.so_phieu}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Ngày nhập:</span>
              <span className="ml-1 font-medium">
                {formatDate(phieuData.ngay_nhap)}
              </span>
            </div>
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Phòng ban:</span>
              <span className="ml-1 font-medium">
                {phieuData.phong_ban?.ten_phong_ban}
              </span>
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Người tạo:</span>
              <span className="ml-1 font-medium">
                {phieuData.nguoi_tao_ten}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Loại phiếu:</span>
              <span className="ml-1 font-medium">
                {phieuData.loai_phieu === "tu_mua"
                  ? "Tự mua"
                  : phieuData.loai_phieu === "tren_cap"
                  ? "Từ cấp trên"
                  : phieuData.loai_phieu === "dieu_chuyen"
                  ? "Điều chuyển"
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600">Tổng tiền:</span>
              <span className="ml-1 font-bold text-green-600">
                {formatCurrency(phieuData.tong_tien)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600">Số mặt hàng:</span>
              <span className="ml-1 font-medium">
                {phieuData.chi_tiet?.length || 0}
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
            {phieuData.nguoi_duyet_ten && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">Người duyệt:</span>
                <span className="ml-1 font-medium">
                  {phieuData.nguoi_duyet_ten}
                </span>
              </div>
            )}
            {phieuData.ngay_duyet_cap1 && (
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

        {/* Lý do nhập */}
        {phieuData.ly_do_nhap && (
          <div className="mt-3 p-3 bg-white border rounded">
            <p className="text-sm">
              <span className="font-medium text-gray-700">Lý do nhập:</span>
              <span className="ml-1 text-gray-600">{phieuData.ly_do_nhap}</span>
            </p>
          </div>
        )}
      </div>
    );
  }, [phieuData]); // Chỉ re-render khi phieuData thay đổi

  // 🔥 FIX: Memoize chi tiết section
  const ChiTietSection = useMemo(() => {
    if (!phieuData?.chi_tiet) return null;

    return (
      <div className="bg-white border rounded-lg mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Chi tiết hàng hóa
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Danh sách hàng hóa sẽ được nhập vào kho
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
                  Số lượng
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
              {phieuData.chi_tiet.map((item, index) => (
                <tr
                  key={`${item.hang_hoa_id}-${index}`}
                  className="hover:bg-gray-50"
                >
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
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                    {item.so_luong || 0}
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
              <tr className="bg-green-50">
                <td
                  colSpan={5}
                  className="px-4 py-3 text-right text-sm font-bold text-gray-900"
                >
                  TỔNG CỘNG:
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                  {formatCurrency(phieuData.tong_tien || 0)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }, [phieuData]); // Chỉ re-render khi phieuData thay đổi

  // 🔥 FIX: Memoize LinkedDocumentInfo
  const LinkedDocumentInfo = useMemo(() => {
    if (!phieuData?.phieu_xuat_lien_ket_id) return null;

    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Link2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">
              Phiếu liên kết tự động
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              Phiếu này được tạo tự động từ phiếu xuất. Khi hoàn thành, phiếu
              xuất liên kết cũng sẽ được tự động cập nhật thông tin.
            </p>

            {phieuData.phieu_xuat_lien_ket && (
              <div className="bg-white p-3 rounded border">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium">Phiếu xuất gốc:</span>
                    <div className="text-gray-600 mt-1">
                      {phieuData.phieu_xuat_lien_ket.so_phieu}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Phòng ban cung cấp:</span>
                    <div className="text-gray-600 mt-1">
                      {phieuData.phieu_xuat_lien_ket.phong_ban?.ten_phong_ban ||
                        "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Ngày xuất:</span>
                    <div className="text-gray-600 mt-1">
                      {formatDate(phieuData.phieu_xuat_lien_ket.ngay_xuat)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Trạng thái xuất:</span>
                    <div className="text-gray-600 mt-1">
                      {phieuData.phieu_xuat_lien_ket.trang_thai === "approved"
                        ? "Đã duyệt"
                        : phieuData.phieu_xuat_lien_ket.trang_thai ===
                          "completed"
                        ? "Hoàn thành"
                        : "Khác"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <strong>Lưu ý:</strong> Sau khi hoàn thành phiếu nhập này, phòng
              ban cung cấp sẽ nhận được thông báo về việc giao hàng thành công.
            </div>
          </div>
        </div>
      </div>
    );
  }, [phieuData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
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
        {PhieuInfoSection}

        {/* Linked document info */}
        {LinkedDocumentInfo}

        {/* Chi tiết hàng hóa */}
        {ChiTietSection}

        {/* 🔥 FIX: Form input với stable handlers */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Thông tin hoàn thành nhập kho
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 🔥 FIX: Người giao hàng với stable key và id */}
            <div>
              <label
                htmlFor="nguoi_giao_hang_input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <User className="inline h-4 w-4 mr-1" />
                Người giao hàng *
              </label>
              <input
                id="nguoi_giao_hang_input" /* 🔥 Stable ID */
                key="nguoi_giao_hang" /* 🔥 Stable key */
                type="text"
                value={formData.nguoi_giao_hang}
                onChange={(e) =>
                  handleInputChange("nguoi_giao_hang", e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                  errors.nguoi_giao_hang
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="Nhập tên người giao hàng"
                disabled={isSubmitting}
                autoComplete="off" /* 🔥 Tắt autocomplete */
              />
              {errors.nguoi_giao_hang && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.nguoi_giao_hang}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Tên người thực tế giao hàng tại kho
              </p>
            </div>

            {/* 🔥 FIX: Người nhận hàng với stable key và id */}
            <div>
              <label
                htmlFor="nguoi_nhap_hang_input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                <User className="inline h-4 w-4 mr-1" />
                Người nhận hàng *
              </label>
              <input
                id="nguoi_nhap_hang_input" /* 🔥 Stable ID */
                key="nguoi_nhap_hang" /* 🔥 Stable key */
                type="text"
                value={formData.nguoi_nhap_hang}
                onChange={(e) =>
                  handleInputChange("nguoi_nhap_hang", e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                  errors.nguoi_nhap_hang
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="Nhập tên người nhận hàng"
                disabled={isSubmitting}
                autoComplete="off" /* 🔥 Tắt autocomplete */
              />
              {errors.nguoi_nhap_hang && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.nguoi_nhap_hang}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Tên người thực tế nhận hàng vào kho
              </p>
            </div>
          </div>

          {/* 🔥 FIX: Ghi chú với stable key */}
          <div className="mt-6">
            <label
              htmlFor="ghi_chu_hoan_thanh_input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <FileText className="inline h-4 w-4 mr-1" />
              Ghi chú hoàn thành
            </label>
            <textarea
              id="ghi_chu_hoan_thanh_input" /* 🔥 Stable ID */
              key="ghi_chu_hoan_thanh" /* 🔥 Stable key */
              value={formData.ghi_chu_hoan_thanh}
              onChange={(e) =>
                handleInputChange("ghi_chu_hoan_thanh", e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              rows={4}
              placeholder="Nhập ghi chú về quá trình hoàn thành (tùy chọn)..."
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Ghi chú bổ sung về quá trình nhập kho, tình trạng hàng hóa, v.v.
            </p>
          </div>

          {/* Validation summary */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  Lưu ý khi hoàn thành
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>
                    • Phiếu sẽ chuyển sang trạng thái "Hoàn thành" và không thể
                    chỉnh sửa
                  </li>
                  <li>• Hàng hóa sẽ chính thức được cập nhật vào tồn kho</li>
                  <li>
                    • Người tạo phiếu sẽ nhận thông báo về việc hoàn thành
                  </li>
                  {phieuData?.phieu_xuat_lien_ket_id && (
                    <li>
                      • Phiếu xuất liên kết cũng sẽ được tự động cập nhật thông
                      tin giao nhận
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 FIX: Action buttons cố định */}
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
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 transition-colors shadow-lg"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Đang hoàn thành...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Hoàn thành phiếu nhập</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompletePhieuNhapForm;
