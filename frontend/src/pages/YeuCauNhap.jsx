import React, { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  Send,
  X,
  Search,
  Filter,
  ArrowDownToLine,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { yeuCauNhapService } from "../services/yeuCauNhapService";
import { formatCurrency, formatDate } from "../utils/helpers";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import YeuCauNhapForm from "../components/yeuCau/YeuCauNhapForm";
import YeuCauDetail from "../components/yeuCau/YeuCauDetail";
import toast from "react-hot-toast";

const YeuCauNhap = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    tu_ngay: "",
    den_ngay: "",
    trang_thai: "",
    muc_do_uu_tien: "",
    don_vi_yeu_cau_id: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [selectedTab, setSelectedTab] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedYeuCau, setSelectedYeuCau] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const yeuCauList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  // Tabs configuration
  const tabs = [
    {
      key: "all",
      label: "Tất cả",
      icon: FileText,
      count: data?.data?.summary?.tong_so || 0,
      color: "text-gray-600",
    },
    {
      key: "draft",
      label: "Nháp",
      icon: FileText,
      count: data?.data?.summary?.draft || 0,
      color: "text-gray-600",
    },
    {
      key: "confirmed",
      label: "Đã gửi",
      icon: Send,
      count: data?.data?.summary?.confirmed || 0,
      color: "text-blue-600",
    },
    {
      key: "under_review",
      label: "Đang xem xét",
      icon: Clock,
      count: data?.data?.summary?.under_review || 0,
      color: "text-yellow-600",
    },
    {
      key: "approved",
      label: "Đã duyệt",
      icon: CheckCircle,
      count: data?.data?.summary?.approved || 0,
      color: "text-green-600",
    },
    {
      key: "rejected",
      label: "Từ chối",
      icon: XCircle,
      count: data?.data?.summary?.rejected || 0,
      color: "text-red-600",
    },
    {
      key: "completed",
      label: "Hoàn thành",
      icon: CheckCircle,
      count: data?.data?.summary?.completed || 0,
      color: "text-emerald-600",
    },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await yeuCauNhapService.getList({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        sort_by: sortConfig.key,
        sort_direction: sortConfig.direction,
        trang_thai: selectedTab === "all" ? "" : selectedTab,
        ...filters,
      });
      setData(response);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu yêu cầu nhập kho");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, filters, sortConfig, selectedTab]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await yeuCauNhapService.getDetail(id);
      setSelectedYeuCau(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải chi tiết yêu cầu");
    }
  };

  const handleSubmit = async (id) => {
    if (window.confirm("Bạn có chắc muốn gửi yêu cầu này để phê duyệt?")) {
      try {
        await yeuCauNhapService.submit(id);
        toast.success("Gửi yêu cầu thành công");
        fetchData();
      } catch (error) {
        console.error("Error submitting:", error);
        toast.error("Không thể gửi yêu cầu");
      }
    }
  };

  const handleCancel = async (id) => {
    const lyDo = prompt("Nhập lý do hủy yêu cầu:");
    if (lyDo) {
      try {
        await yeuCauNhapService.cancel(id, { ly_do_huy: lyDo });
        toast.success("Hủy yêu cầu thành công");
        fetchData();
      } catch (error) {
        console.error("Error canceling:", error);
        toast.error("Không thể hủy yêu cầu");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa yêu cầu này?")) {
      try {
        await yeuCauNhapService.delete(id);
        toast.success("Xóa yêu cầu thành công");
        fetchData();
      } catch (error) {
        console.error("Error deleting:", error);
        toast.error("Không thể xóa yêu cầu");
      }
    }
  };

  const getTrangThaiInfo = (trangThai) => {
    const statusMap = {
      draft: {
        label: "Nháp",
        color: "bg-gray-100 text-gray-800",
        icon: FileText,
      },
      confirmed: {
        label: "Đã gửi",
        color: "bg-blue-100 text-blue-800",
        icon: Send,
      },
      under_review: {
        label: "Đang xem xét",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
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
        label: "Đã hủy",
        color: "bg-gray-100 text-gray-800",
        icon: XCircle,
      },
      completed: {
        label: "Hoàn thành",
        color: "bg-emerald-100 text-emerald-800",
        icon: CheckCircle,
      },
    };
    return statusMap[trangThai] || statusMap.draft;
  };

  const getMucDoUuTienInfo = (mucDo) => {
    const priorityMap = {
      thap: { label: "Thấp", color: "bg-gray-100 text-gray-800" },
      binh_thuong: { label: "Bình thường", color: "bg-blue-100 text-blue-800" },
      cao: { label: "Cao", color: "bg-orange-100 text-orange-800" },
      khan_cap: { label: "Khẩn cấp", color: "bg-red-100 text-red-800" },
    };
    return priorityMap[mucDo] || priorityMap.binh_thuong;
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    fetchData();
  };

  const getActionButtons = (yeuCau) => {
    const buttons = [];

    // Xem chi tiết (luôn có)
    buttons.push(
      <button
        key="view"
        onClick={() => handleViewDetail(yeuCau.id)}
        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
        title="Xem chi tiết"
      >
        <Eye size={14} />
      </button>
    );

    // Gửi yêu cầu (chỉ khi ở trạng thái draft)
    if (yeuCau.trang_thai === "draft") {
      buttons.push(
        <button
          key="submit"
          onClick={() => handleSubmit(yeuCau.id)}
          className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-all"
          title="Gửi yêu cầu"
        >
          <Send size={14} />
        </button>
      );
    }

    // Hủy yêu cầu (khi chưa hoàn thành)
    if (!["completed", "cancelled"].includes(yeuCau.trang_thai)) {
      buttons.push(
        <button
          key="cancel"
          onClick={() => handleCancel(yeuCau.id)}
          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
          title="Hủy yêu cầu"
        >
          <X size={14} />
        </button>
      );
    }

    // Xóa yêu cầu (chỉ khi ở trạng thái draft)
    if (yeuCau.trang_thai === "draft") {
      buttons.push(
        <button
          key="delete"
          onClick={() => handleDelete(yeuCau.id)}
          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-all"
          title="Xóa yêu cầu"
        >
          <X size={14} />
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <ArrowDownToLine className="mr-2 h-5 w-5 text-blue-600" />
            Yêu cầu nhập kho
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý các yêu cầu nhập hàng vào kho
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Tạo yêu cầu</span>
        </button>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} className={tab.color} />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedTab === tab.key
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, tu_ngay: e.target.value }))
              }
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
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, den_ngay: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mức độ ưu tiên
            </label>
            <select
              value={filters.muc_do_uu_tien}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  muc_do_uu_tien: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              <option value="">Tất cả</option>
              <option value="thap">Thấp</option>
              <option value="binh_thuong">Bình thường</option>
              <option value="cao">Cao</option>
              <option value="khan_cap">Khẩn cấp</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  tu_ngay: "",
                  den_ngay: "",
                  trang_thai: "",
                  muc_do_uu_tien: "",
                  don_vi_yeu_cau_id: "",
                });
                setSearchTerm("");
              }}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
            >
              <Filter size={14} />
              <span>Xóa bộ lọc</span>
            </button>
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
              <table className="w-full">
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
                      Lý do yêu cầu
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Mức độ ưu tiên
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("tong_gia_tri_uoc_tinh")}
                    >
                      Giá trị ước tính {getSortIcon("tong_gia_tri_uoc_tinh")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Người yêu cầu
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-24">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {yeuCauList.map((yeuCau) => {
                    const statusInfo = getTrangThaiInfo(yeuCau.trang_thai);
                    const priorityInfo = getMucDoUuTienInfo(
                      yeuCau.muc_do_uu_tien
                    );

                    return (
                      <tr
                        key={yeuCau.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {yeuCau.so_yeu_cau}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(yeuCau.ngay_yeu_cau)}
                          </div>
                          {yeuCau.ngay_can_hang && (
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <Calendar size={12} className="mr-1" />
                              Cần: {formatDate(yeuCau.ngay_can_hang)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {yeuCau.ly_do_yeu_cau}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {yeuCau.so_mat_hang} mặt hàng
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityInfo.color}`}
                          >
                            {priorityInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-blue-600">
                            {formatCurrency(yeuCau.tong_gia_tri_uoc_tinh)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            <statusInfo.icon size={12} className="mr-1" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900 flex items-center justify-center">
                            <User size={14} className="mr-1 text-gray-400" />
                            {yeuCau.nguoi_yeu_cau_info?.ho_ten || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {yeuCau.don_vi_yeu_cau?.ten_phong_ban}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {getActionButtons(yeuCau)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {yeuCauList.length === 0 && (
              <div className="text-center py-8">
                <ArrowDownToLine className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Không có yêu cầu nào
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedTab === "all"
                    ? "Chưa có yêu cầu nhập kho nào được tạo."
                    : `Không có yêu cầu nào ở trạng thái "${
                        tabs.find((t) => t.key === selectedTab)?.label
                      }".`}
                </p>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.page || 1}
                  totalPages={pagination.pages || 1}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo yêu cầu nhập kho"
        size="xl"
      >
        <YeuCauNhapForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Chi tiết yêu cầu: ${selectedYeuCau?.so_yeu_cau || ""}`}
        size="xl"
      >
        {selectedYeuCau && (
          <YeuCauDetail
            yeuCau={selectedYeuCau}
            onUpdate={fetchData}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default YeuCauNhap;
