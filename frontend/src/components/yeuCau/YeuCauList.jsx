import React, { useState, useEffect } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Plus,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
  ArrowUpFromLine,
  ArrowDownToLine,
  User,
  Building2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { yeuCauService } from "../../services/yeuCauService";
import { formatCurrency, formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";
import Loading from "../common/Loading";
import Pagination from "../common/Pagination";
import Modal from "../common/Modal";
import YeuCauDetail from "./YeuCauDetail";

const YeuCauList = ({
  type = "nhap", // "nhap" | "xuat"
  title,
  allowCreate = true,
  onCreateNew,
  filterOptions = {},
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [yeuCauList, setYeuCauList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedYeuCau, setSelectedYeuCau] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    tu_ngay: "",
    den_ngay: "",
    trang_thai: "",
    muc_do_uu_tien: "",
    don_vi_yeu_cau_id: "",
    ...filterOptions,
  });

  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

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

  useEffect(() => {
    fetchYeuCauList();
  }, [currentPage, filters, sortConfig, type]);

  const fetchYeuCauList = async () => {
    try {
      setIsLoading(true);

      const params = {
        page: currentPage,
        limit: 20,
        sort_by: sortConfig.key,
        sort_direction: sortConfig.direction,
        ...filters,
      };

      let response;
      if (type === "nhap") {
        response = await yeuCauService.getYeuCauNhapList(params);
      } else {
        response = await yeuCauService.getYeuCauXuatList(params);
      }

      if (response.success) {
        setYeuCauList(response.data.items || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching yeu cau list:", error);
      toast.error("Không thể tải danh sách yêu cầu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleViewDetail = async (yeuCau) => {
    try {
      let response;
      if (type === "nhap") {
        response = await yeuCauService.getYeuCauNhapDetail(yeuCau.id);
      } else {
        response = await yeuCauService.getYeuCauXuatDetail(yeuCau.id);
      }

      if (response.success) {
        setSelectedYeuCau(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải chi tiết yêu cầu");
    }
  };

  const handleEdit = (yeuCau) => {
    // Navigate to edit page or open edit modal
    if (onCreateNew) {
      onCreateNew("edit", yeuCau.id);
    }
  };

  const handleDelete = async (yeuCau) => {
    if (!window.confirm(`Bạn có chắc muốn xóa yêu cầu ${yeuCau.so_yeu_cau}?`)) {
      return;
    }

    try {
      let response;
      if (type === "nhap") {
        response = await yeuCauService.deleteYeuCauNhap(yeuCau.id);
      } else {
        response = await yeuCauService.deleteYeuCauXuat(yeuCau.id);
      }

      if (response.success) {
        toast.success("Xóa yêu cầu thành công");
        fetchYeuCauList();
      }
    } catch (error) {
      console.error("Error deleting yeu cau:", error);
      toast.error("Không thể xóa yêu cầu");
    }
  };

  const handleCancel = async (yeuCau) => {
    if (!window.confirm(`Bạn có chắc muốn hủy yêu cầu ${yeuCau.so_yeu_cau}?`)) {
      return;
    }

    try {
      let response;
      if (type === "nhap") {
        response = await yeuCauService.cancelYeuCauNhap(yeuCau.id);
      } else {
        response = await yeuCauService.cancelYeuCauXuat(yeuCau.id);
      }

      if (response.success) {
        toast.success("Hủy yêu cầu thành công");
        fetchYeuCauList();
      }
    } catch (error) {
      console.error("Error canceling yeu cau:", error);
      toast.error("Không thể hủy yêu cầu");
    }
  };

  const handleSubmit = async (yeuCau) => {
    if (!window.confirm(`Bạn có chắc muốn gửi yêu cầu ${yeuCau.so_yeu_cau}?`)) {
      return;
    }

    try {
      let response;
      if (type === "nhap") {
        response = await yeuCauService.submitYeuCauNhap(yeuCau.id);
      } else {
        response = await yeuCauService.submitYeuCauXuat(yeuCau.id);
      }

      if (response.success) {
        toast.success("Gửi yêu cầu thành công");
        fetchYeuCauList();
      }
    } catch (error) {
      console.error("Error submitting yeu cau:", error);
      toast.error("Không thể gửi yêu cầu");
    }
  };

  const ActionDropdown = ({ yeuCau, onClose }) => {
    const canEdit =
      yeuCau.trang_thai === "draft" && yeuCau.nguoi_yeu_cau === user.id;
    const canDelete =
      yeuCau.trang_thai === "draft" && yeuCau.nguoi_yeu_cau === user.id;
    const canCancel =
      ["confirmed", "under_review"].includes(yeuCau.trang_thai) &&
      (yeuCau.nguoi_yeu_cau === user.id || user.role === "admin");
    const canSubmit =
      yeuCau.trang_thai === "draft" && yeuCau.nguoi_yeu_cau === user.id;

    const actions = [
      {
        icon: Eye,
        label: "Xem chi tiết",
        action: () => handleViewDetail(yeuCau),
        show: true,
      },
      {
        icon: Edit,
        label: "Chỉnh sửa",
        action: () => handleEdit(yeuCau),
        show: canEdit,
      },
      {
        icon: FileText,
        label: "Gửi yêu cầu",
        action: () => handleSubmit(yeuCau),
        show: canSubmit,
      },
      {
        icon: XCircle,
        label: "Hủy yêu cầu",
        action: () => handleCancel(yeuCau),
        show: canCancel,
        danger: true,
      },
      {
        icon: Trash2,
        label: "Xóa",
        action: () => handleDelete(yeuCau),
        show: canDelete,
        danger: true,
      },
    ].filter((action) => action.show);

    return (
      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.action();
              onClose();
            }}
            className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-colors first:rounded-t-lg last:rounded-b-lg ${
              action.danger
                ? "text-red-600 hover:text-red-800 hover:bg-red-50"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <action.icon size={14} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.draft;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <IconComponent size={12} className="mr-1" />
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = priorityConfig[priority] || priorityConfig.binh_thuong;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {priority === "khan_cap" && (
          <AlertTriangle size={12} className="mr-1" />
        )}
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            {type === "nhap" ? (
              <ArrowDownToLine className="mr-2 h-5 w-5 text-blue-600" />
            ) : (
              <ArrowUpFromLine className="mr-2 h-5 w-5 text-red-600" />
            )}
            {title || `Yêu cầu ${type === "nhap" ? "nhập" : "xuất"} kho`}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý các yêu cầu {type === "nhap" ? "nhập" : "xuất"} hàng{" "}
            {type === "nhap" ? "vào" : "khỏi"} kho
          </p>
        </div>
        {allowCreate && onCreateNew && (
          <button
            onClick={() => onCreateNew("create")}
            className={`${
              type === "nhap"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors`}
          >
            <Plus size={16} />
            <span>Tạo yêu cầu</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                placeholder="Tìm theo số yêu cầu hoặc lý do..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.tu_ngay}
              onChange={(e) => handleFilterChange("tu_ngay", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.den_ngay}
              onChange={(e) => handleFilterChange("den_ngay", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.trang_thai}
              onChange={(e) => handleFilterChange("trang_thai", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ưu tiên
            </label>
            <select
              value={filters.muc_do_uu_tien}
              onChange={(e) =>
                handleFilterChange("muc_do_uu_tien", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(priorityConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loading size="large" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("so_yeu_cau")}
                    >
                      Số yêu cầu {getSortIcon("so_yeu_cau")}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("ngay_yeu_cau")}
                    >
                      Ngày yêu cầu {getSortIcon("ngay_yeu_cau")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Đơn vị yêu cầu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Lý do
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Ưu tiên
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("tong_gia_tri_uoc_tinh")}
                    >
                      Giá trị {getSortIcon("tong_gia_tri_uoc_tinh")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-16">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {yeuCauList.map((yeuCau) => (
                    <tr
                      key={yeuCau.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {yeuCau.so_yeu_cau}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {yeuCau.id}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(yeuCau.ngay_yeu_cau)}
                        </div>
                        {yeuCau.ngay_can_hang && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock size={12} className="mr-1" />
                            Cần: {formatDate(yeuCau.ngay_can_hang)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 flex items-center">
                          <User size={14} className="mr-1" />
                          {yeuCau.don_vi_yeu_cau?.ten_phong_ban || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {yeuCau.nguoi_yeu_cau_info?.ho_ten || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="text-sm text-gray-900 max-w-xs truncate"
                          title={yeuCau.ly_do_yeu_cau}
                        >
                          {yeuCau.ly_do_yeu_cau}
                        </div>
                        <div className="text-xs text-gray-500">
                          {yeuCau.so_mat_hang} mặt hàng
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {getPriorityBadge(yeuCau.muc_do_uu_tien)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(yeuCau.tong_gia_tri_uoc_tinh || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {getStatusBadge(yeuCau.trang_thai)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center relative">
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === yeuCau.id ? null : yeuCau.id
                            )
                          }
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeDropdown === yeuCau.id && (
                          <ActionDropdown
                            yeuCau={yeuCau}
                            onClose={() => setActiveDropdown(null)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {yeuCauList.length === 0 && (
              <div className="text-center py-8">
                {type === "nhap" ? (
                  <ArrowDownToLine className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                ) : (
                  <ArrowUpFromLine className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                )}
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Không có dữ liệu
                </h3>
                <p className="text-xs text-gray-500">
                  Chưa có yêu cầu {type === "nhap" ? "nhập" : "xuất"} kho nào
                  được tạo.
                </p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedYeuCau?.so_yeu_cau || "Chi tiết yêu cầu"}
        size="xl"
      >
        {selectedYeuCau && <YeuCauDetail yeuCau={selectedYeuCau} type={type} />}
      </Modal>
    </div>
  );
};

export default YeuCauList;
