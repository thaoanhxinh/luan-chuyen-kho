import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Package,
  MessageSquare,
  Clock,
  Save,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { workflowService } from "../../services/workflowService";
import { formatCurrency, formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";
import Loading from "../common/Loading";

const ApprovalInterface = ({ yeuCau, type = "nhap", onApprovalComplete }) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [approvalData, setApprovalData] = useState({
    ghi_chu_duyet: "",
    chi_tiet_duyet: [],
  });
  const [rejectionData, setRejectionData] = useState({
    ly_do_tu_choi: "",
    ghi_chu_duyet: "",
  });

  // Initialize approval details with request data
  useEffect(() => {
    if (yeuCau?.chi_tiet) {
      setApprovalData((prev) => ({
        ...prev,
        chi_tiet_duyet: yeuCau.chi_tiet.map((item) => ({
          hang_hoa_id: item.hang_hoa_id,
          so_luong_yeu_cau: item.so_luong_yeu_cau,
          so_luong_duyet: item.so_luong_yeu_cau, // Default to requested quantity
        })),
      }));
    }
  }, [yeuCau]);

  if (!yeuCau) {
    return <div>Không có dữ liệu yêu cầu</div>;
  }

  // Check if user can approve this request
  const canApprove = () => {
    if (user.role === "admin") return true;

    // Check if user is from authorized departments (HCK, TMKH)
    const authorizedDepts = ["HCK", "TMKH"];
    return authorizedDepts.includes(user.phong_ban_info?.ma_phong_ban);
  };

  // Check if request is in approvable state
  const isApprovable = () => {
    return ["confirmed", "under_review"].includes(yeuCau.trang_thai);
  };

  const handleApprovalDetailChange = (index, field, value) => {
    setApprovalData((prev) => ({
      ...prev,
      chi_tiet_duyet: prev.chi_tiet_duyet.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleApprove = async () => {
    if (!canApprove() || !isApprovable()) {
      toast.error("Bạn không có quyền phê duyệt yêu cầu này");
      return;
    }

    try {
      setIsProcessing(true);

      let response;
      if (type === "nhap") {
        response = await workflowService.approveYeuCauNhap(
          yeuCau.id,
          approvalData
        );
      } else {
        response = await workflowService.approveYeuCauXuat(
          yeuCau.id,
          approvalData
        );
      }

      if (response.success) {
        toast.success("Phê duyệt yêu cầu thành công");
        setShowApprovalForm(false);
        onApprovalComplete && onApprovalComplete("approved");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Không thể phê duyệt yêu cầu");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!canApprove() || !isApprovable()) {
      toast.error("Bạn không có quyền từ chối yêu cầu này");
      return;
    }

    if (!rejectionData.ly_do_tu_choi.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setIsProcessing(true);

      let response;
      if (type === "nhap") {
        response = await workflowService.rejectYeuCauNhap(
          yeuCau.id,
          rejectionData
        );
      } else {
        response = await workflowService.rejectYeuCauXuat(
          yeuCau.id,
          rejectionData
        );
      }

      if (response.success) {
        toast.success("Từ chối yêu cầu thành công");
        setShowRejectionForm(false);
        onApprovalComplete && onApprovalComplete("rejected");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Không thể từ chối yêu cầu");
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotalApproved = () => {
    return approvalData.chi_tiet_duyet.reduce((total, item) => {
      return total + (item.so_luong_duyet || 0);
    }, 0);
  };

  const calculateTotalRequested = () => {
    return (
      yeuCau.chi_tiet?.reduce((total, item) => {
        return total + (item.so_luong_yeu_cau || 0);
      }, 0) || 0
    );
  };

  if (!canApprove()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <p className="text-sm text-yellow-800">
            Bạn không có quyền phê duyệt yêu cầu này. Chỉ có Admin hoặc nhân
            viên phòng HCK, TMKH mới có thể phê duyệt.
          </p>
        </div>
      </div>
    );
  }

  if (!isApprovable()) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-gray-600 mr-2" />
          <p className="text-sm text-gray-800">
            Yêu cầu này không thể phê duyệt. Trạng thái hiện tại:{" "}
            {yeuCau.trang_thai}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Request Summary */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Eye className="mr-2 h-5 w-5" />
          Thông tin yêu cầu cần phê duyệt
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Số yêu cầu</p>
              <p className="text-sm text-gray-600">{yeuCau.so_yeu_cau}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Ngày yêu cầu</p>
              <p className="text-sm text-gray-600">
                {formatDate(yeuCau.ngay_yeu_cau)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Người yêu cầu</p>
              <p className="text-sm text-gray-600">
                {yeuCau.ten_nguoi_yeu_cau || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Số lượng hàng hóa
              </p>
              <p className="text-sm text-gray-600">
                {yeuCau.chi_tiet?.length || 0} mặt hàng
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900 mb-2">
            Lý do yêu cầu
          </p>
          <p className="text-sm text-gray-700">{yeuCau.ly_do_yeu_cau}</p>
        </div>
      </div>

      {/* Action Buttons */}
      {!showApprovalForm && !showRejectionForm && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowApprovalForm(true)}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Phê duyệt
          </button>

          <button
            onClick={() => setShowRejectionForm(true)}
            className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="mr-2 h-5 w-5" />
            Từ chối
          </button>
        </div>
      )}

      {/* Approval Form */}
      {showApprovalForm && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <CheckCircle className="mr-2 h-5 w-5" />
            Phê duyệt yêu cầu
          </h4>

          {/* Approval Details */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chi tiết phê duyệt
              </label>

              <div className="space-y-3">
                {yeuCau.chi_tiet?.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">
                          {item.hang_hoa?.ten_hang_hoa ||
                            `Hàng hóa ID: ${item.hang_hoa_id}`}
                        </h5>
                        {item.hang_hoa?.ma_hang_hoa && (
                          <p className="text-xs text-gray-500">
                            Mã: {item.hang_hoa.ma_hang_hoa} | ĐVT:{" "}
                            {item.hang_hoa.don_vi_tinh}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Số lượng yêu cầu
                        </label>
                        <input
                          type="number"
                          value={item.so_luong_yeu_cau}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Số lượng phê duyệt *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.so_luong_yeu_cau}
                          step="0.01"
                          value={
                            approvalData.chi_tiet_duyet[index]
                              ?.so_luong_duyet || 0
                          }
                          onChange={(e) =>
                            handleApprovalDetailChange(
                              index,
                              "so_luong_duyet",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Thành tiền ước tính
                        </label>
                        <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600">
                          {formatCurrency(
                            (approvalData.chi_tiet_duyet[index]
                              ?.so_luong_duyet || 0) *
                              (item.don_gia_uoc_tinh || 0)
                          )}
                        </div>
                      </div>
                    </div>

                    {item.ly_do_su_dung && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500">
                          Lý do sử dụng:
                        </p>
                        <p className="text-sm text-gray-700">
                          {item.ly_do_su_dung}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú phê duyệt
              </label>
              <textarea
                value={approvalData.ghi_chu_duyet}
                onChange={(e) =>
                  setApprovalData((prev) => ({
                    ...prev,
                    ghi_chu_duyet: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ghi chú về quyết định phê duyệt (không bắt buộc)..."
              />
            </div>

            {/* Summary */}
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Tổng số lượng: {calculateTotalApproved()} /{" "}
                  {calculateTotalRequested()}
                </span>
                <span className="text-sm font-medium text-green-600">
                  Phê duyệt:{" "}
                  {Math.round(
                    (calculateTotalApproved() / calculateTotalRequested()) * 100
                  ) || 0}
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowApprovalForm(false)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing || calculateTotalApproved() === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isProcessing ? (
                <>
                  <Loading size="small" className="mr-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Xác nhận phê duyệt
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Rejection Form */}
      {showRejectionForm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
            <XCircle className="mr-2 h-5 w-5" />
            Từ chối yêu cầu
          </h4>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối *
              </label>
              <textarea
                value={rejectionData.ly_do_tu_choi}
                onChange={(e) =>
                  setRejectionData((prev) => ({
                    ...prev,
                    ly_do_tu_choi: e.target.value,
                  }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Nhập lý do cụ thể tại sao yêu cầu bị từ chối..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú bổ sung
              </label>
              <textarea
                value={rejectionData.ghi_chu_duyet}
                onChange={(e) =>
                  setRejectionData((prev) => ({
                    ...prev,
                    ghi_chu_duyet: e.target.value,
                  }))
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Ghi chú bổ sung (không bắt buộc)..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowRejectionForm(false)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing || !rejectionData.ly_do_tu_choi.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isProcessing ? (
                <>
                  <Loading size="small" className="mr-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Xác nhận từ chối
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions Info */}
      {!showApprovalForm && !showRejectionForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Lưu ý khi phê duyệt:
              </p>
              <ul className="text-blue-800 space-y-1">
                <li>• Kiểm tra kỹ thông tin yêu cầu trước khi phê duyệt</li>
                <li>
                  • Có thể phê duyệt một phần bằng cách điều chỉnh số lượng
                </li>
                <li>• Ghi chú lý do nếu từ chối hoặc phê duyệt có điều kiện</li>
                <li>
                  • Quyết định sẽ được lưu vào lịch sử và gửi thông báo cho
                  người yêu cầu
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalInterface;
