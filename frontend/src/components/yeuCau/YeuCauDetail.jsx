import React from "react";
import {
  Calendar,
  User,
  Building2,
  FileText,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ArrowRight,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../utils/helpers";

const YeuCauDetail = ({ yeuCau, type = "nhap" }) => {
  if (!yeuCau) {
    return <div>Không có dữ liệu</div>;
  }

  // Status configurations
  const statusConfig = {
    draft: {
      label: "Nháp",
      color: "bg-gray-100 text-gray-800",
      icon: FileText,
    },
    confirmed: {
      label: "Đã gửi",
      color: "bg-blue-100 text-blue-800",
      icon: Clock,
    },
    under_review: {
      label: "Đang xem xét",
      color: "bg-yellow-100 text-yellow-800",
      icon: Eye,
    },
    approved: {
      label: "Đã duyệt",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
    },
    rejected: {
      label: "Từ chối",
      color: "bg-red-100 text-red-800",
      icon: XCircle,
    },
    cancelled: {
      label: "Hủy bỏ",
      color: "bg-gray-100 text-gray-800",
      icon: XCircle,
    },
    completed: {
      label: "Hoàn thành",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
    },
  };

  const priorityConfig = {
    thap: { label: "Thấp", color: "bg-gray-100 text-gray-800" },
    binh_thuong: { label: "Bình thường", color: "bg-blue-100 text-blue-800" },
    cao: { label: "Cao", color: "bg-orange-100 text-orange-800" },
    khan_cap: { label: "Khẩn cấp", color: "bg-red-100 text-red-800" },
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.draft;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <IconComponent size={14} className="mr-1" />
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = priorityConfig[priority] || priorityConfig.binh_thuong;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        {priority === "khan_cap" && (
          <AlertTriangle size={14} className="mr-1" />
        )}
        {config.label}
      </span>
    );
  };

  const calculateTotalValue = () => {
    return (
      yeuCau.chi_tiet?.reduce((total, item) => {
        return total + item.so_luong_yeu_cau * (item.don_gia_uoc_tinh || 0);
      }, 0) || 0
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText
                className={`mr-2 h-6 w-6 ${
                  type === "nhap" ? "text-blue-600" : "text-red-600"
                }`}
              />
              Yêu cầu {type === "nhap" ? "nhập" : "xuất"} kho
            </h1>
            <p className="text-lg text-gray-600 mt-1">{yeuCau.so_yeu_cau}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(yeuCau.trang_thai)}
            {getPriorityBadge(yeuCau.muc_do_uu_tien)}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin cơ bản
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Ngày yêu cầu
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(yeuCau.ngay_yeu_cau)}
                </p>
              </div>
            </div>

            {yeuCau.ngay_can_hang && (
              <div className="flex items-start space-x-3">
                <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Ngày cần hàng
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(yeuCau.ngay_can_hang)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <User className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Người yêu cầu
                </p>
                <p className="text-sm text-gray-600">
                  {yeuCau.ten_nguoi_yeu_cau || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Building2 className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Đơn vị yêu cầu
                </p>
                <p className="text-sm text-gray-600">
                  {yeuCau.ten_don_vi_yeu_cau || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {type === "xuat" && yeuCau.don_vi_nhan && (
              <div className="flex items-start space-x-3">
                <Building2 className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Đơn vị nhận
                  </p>
                  <p className="text-sm text-gray-600">
                    {yeuCau.don_vi_nhan.ten_don_vi}
                  </p>
                </div>
              </div>
            )}

            {yeuCau.nguoi_duyet && (
              <div className="flex items-start space-x-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Người duyệt
                  </p>
                  <p className="text-sm text-gray-600">
                    {yeuCau.ten_nguoi_duyet}
                  </p>
                  {yeuCau.ngay_duyet && (
                    <p className="text-xs text-gray-500">
                      {formatDateTime(yeuCau.ngay_duyet)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <FileText className="mt-0.5 h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Tạo lúc</p>
                <p className="text-sm text-gray-600">
                  {formatDateTime(yeuCau.created_at)}
                </p>
              </div>
            </div>

            {yeuCau.updated_at && yeuCau.updated_at !== yeuCau.created_at && (
              <div className="flex items-start space-x-3">
                <FileText className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Cập nhật lúc
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(yeuCau.updated_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-900 mb-2">
            Lý do yêu cầu
          </p>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              {yeuCau.ly_do_yeu_cau || "Không có"}
            </p>
          </div>
        </div>

        {/* Notes */}
        {yeuCau.ghi_chu && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900 mb-2">Ghi chú</p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">{yeuCau.ghi_chu}</p>
            </div>
          </div>
        )}

        {/* Rejection reason */}
        {yeuCau.ly_do_tu_choi && (
          <div className="mt-4">
            <p className="text-sm font-medium text-red-900 mb-2">
              Lý do từ chối
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{yeuCau.ly_do_tu_choi}</p>
            </div>
          </div>
        )}

        {/* Approval notes */}
        {yeuCau.ghi_chu_duyet && (
          <div className="mt-4">
            <p className="text-sm font-medium text-green-900 mb-2">
              Ghi chú phê duyệt
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">{yeuCau.ghi_chu_duyet}</p>
            </div>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Danh sách hàng hóa ({yeuCau.chi_tiet?.length || 0} mặt hàng)
          </h2>
        </div>

        <div className="p-6">
          {yeuCau.chi_tiet && yeuCau.chi_tiet.length > 0 ? (
            <div className="space-y-4">
              {yeuCau.chi_tiet.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {item.hang_hoa?.ten_hang_hoa ||
                          `Hàng hóa ID: ${item.hang_hoa_id}`}
                      </h3>
                      {item.hang_hoa?.ma_hang_hoa && (
                        <p className="text-xs text-gray-500 mt-1">
                          Mã: {item.hang_hoa.ma_hang_hoa} | ĐVT:{" "}
                          {item.hang_hoa.don_vi_tinh}
                        </p>
                      )}
                      {item.hang_hoa?.ten_loai_hang_hoa && (
                        <p className="text-xs text-gray-500">
                          Loại: {item.hang_hoa.ten_loai_hang_hoa}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng yêu cầu
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {item.so_luong_yeu_cau?.toLocaleString()}
                      </p>
                    </div>

                    {item.so_luong_duyet !== undefined && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng duyệt
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          {item.so_luong_duyet?.toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn giá ước tính
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.don_gia_uoc_tinh || 0)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thành tiền
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(
                          (item.so_luong_yeu_cau || 0) *
                            (item.don_gia_uoc_tinh || 0)
                        )}
                      </p>
                    </div>
                  </div>

                  {(item.ly_do_su_dung || item.ghi_chu) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {item.ly_do_su_dung && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">
                            Lý do sử dụng:
                          </p>
                          <p className="text-gray-600">{item.ly_do_su_dung}</p>
                        </div>
                      )}
                      {item.ghi_chu && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">
                            Ghi chú:
                          </p>
                          <p className="text-gray-600">{item.ghi_chu}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Không có hàng hóa nào</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {yeuCau.chi_tiet && yeuCau.chi_tiet.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Tổng số mặt hàng: {yeuCau.chi_tiet.length}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                Tổng giá trị ước tính: {formatCurrency(calculateTotalValue())}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Workflow History */}
      {yeuCau.workflow_history && yeuCau.workflow_history.length > 0 && (
        <div className="bg-white border rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Lịch sử xử lý
            </h2>
          </div>

          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {yeuCau.workflow_history.map((item, index) => (
                  <li key={index}>
                    <div className="relative pb-8">
                      {index !== yeuCau.workflow_history.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span
                            className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              item.trang_thai === "approved"
                                ? "bg-green-500"
                                : item.trang_thai === "rejected"
                                ? "bg-red-500"
                                : "bg-blue-500"
                            }`}
                          >
                            {item.trang_thai === "approved" ? (
                              <CheckCircle className="h-5 w-5 text-white" />
                            ) : item.trang_thai === "rejected" ? (
                              <XCircle className="h-5 w-5 text-white" />
                            ) : (
                              <Eye className="h-5 w-5 text-white" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">
                                {item.ten_nguoi_duyet || "N/A"}
                              </span>{" "}
                              {item.trang_thai === "approved"
                                ? "đã phê duyệt"
                                : item.trang_thai === "rejected"
                                ? "đã từ chối"
                                : "đã xem xét"}
                            </p>
                            {item.ly_do_quyet_dinh && (
                              <p className="mt-1 text-sm text-gray-700">
                                {item.ly_do_quyet_dinh}
                              </p>
                            )}
                            {item.ghi_chu && (
                              <p className="mt-1 text-sm text-gray-600">
                                Ghi chú: {item.ghi_chu}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {formatDateTime(item.ngay_xu_ly || item.created_at)}
                            {item.ten_phong_ban_duyet && (
                              <p className="text-xs">
                                {item.ten_phong_ban_duyet}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Related Documents */}
      {yeuCau.phieu_nhap_id && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tài liệu liên quan
          </h2>

          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Phiếu {type === "nhap" ? "nhập" : "xuất"} kho đã tạo
                </p>
                <p className="text-sm text-blue-700">
                  {yeuCau.so_phieu_nhap ||
                    yeuCau.so_phieu_xuat ||
                    `ID: ${yeuCau.phieu_nhap_id || yeuCau.phieu_xuat_id}`}
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default YeuCauDetail;
