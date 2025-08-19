// YeuCauXuat.jsx - Optimized for full space utilization
import React, { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  Send,
  X,
  Search,
  Filter,
  ArrowUpFromLine,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Package,
} from "lucide-react";
import { yeuCauXuatService } from "../services/yeuCauXuatService";
import { formatCurrency, formatDate } from "../utils/helpers";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import YeuCauXuatForm from "../components/yeuCau/YeuCauXuatForm";
import YeuCauDetail from "../components/yeuCau/YeuCauDetail";
import toast from "react-hot-toast";

const YeuCauXuat = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    tu_ngay: "",
    den_ngay: "",
    trang_thai: "",
    muc_do_uu_tien: "",
    don_vi_yeu_cau_id: "",
    don_vi_nhan_id: "",
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
  const [tonKhoAlert, setTonKhoAlert] = useState(null);

  const yeuCauList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  // Tabs configuration - more compact
  const tabs = [
    {
      key: "all",
      label: "Tất cả",
      icon: FileText,
      count: data?.data?.summary?.tong_so || 0,
    },
    {
      key: "draft",
      label: "Nháp",
      icon: FileText,
      count: data?.data?.summary?.draft || 0,
    },
    {
      key: "confirmed",
      label: "Đã gửi",
      icon: Send,
      count: data?.data?.summary?.confirmed || 0,
    },
    {
      key: "under_review",
      label: "Xem xét",
      icon: Clock,
      count: data?.data?.summary?.under_review || 0,
    },
    {
      key: "approved",
      label: "Đã duyệt",
      icon: CheckCircle,
      count: data?.data?.summary?.approved || 0,
    },
    {
      key: "rejected",
      label: "Từ chối",
      icon: XCircle,
      count: data?.data?.summary?.rejected || 0,
    },
    {
      key: "completed",
      label: "Hoàn thành",
      icon: CheckCircle,
      count: data?.data?.summary?.completed || 0,
    },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await yeuCauXuatService.getList({
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
      toast.error("Không thể tải dữ liệu yêu cầu xuất kho");
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
      const response = await yeuCauXuatService.getDetail(id);
      setSelectedYeuCau(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải chi tiết yêu cầu");
    }
  };

  const handleSubmit = async (id) => {
    try {
      // Kiểm tra tồn kho trước khi gửi
      const tonKhoCheck = await yeuCauXuatService.checkTonKho(id);
      const khongDuHang = tonKhoCheck.data.filter((item) => !item.co_the_xuat);

      if (khongDuHang.length > 0) {
        setTonKhoAlert({
          yeuCauId: id,
          khongDuHang: khongDuHang,
        });
        return;
      }

      if (window.confirm("Bạn có chắc muốn gửi yêu cầu này để phê duyệt?")) {
        await yeuCauXuatService.submit(id);
        toast.success("Gửi yêu cầu thành công");
        fetchData();
      }
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Không thể gửi yêu cầu");
    }
  };

  const handleForceSubmit = async (yeuCauId) => {
    if (
      window.confirm("Yêu cầu có hàng không đủ tồn kho. Bạn có chắc muốn gửi?")
    ) {
      try {
        await yeuCauXuatService.submit(yeuCauId, { force: true });
        toast.success("Gửi yêu cầu thành công");
        setTonKhoAlert(null);
        fetchData();
      } catch (error) {
        console.error("Error force submitting:", error);
        toast.error("Không thể gửi yêu cầu");
      }
    }
  };

  const handleCancel = async (id) => {
    const lyDo = prompt("Nhập lý do hủy yêu cầu:");
    if (lyDo) {
      try {
        await yeuCauXuatService.cancel(id, { ly_do_huy: lyDo });
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
        await yeuCauXuatService.delete(id);
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
        label: "Xem xét",
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

    // View detail
    buttons.push(
      <button
        key="view"
        onClick={() => handleViewDetail(yeuCau.id)}
        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
        title="Xem chi tiết"
      >
        <Eye size={12} />
      </button>
    );

    // Submit request (draft only)
    if (yeuCau.trang_thai === "draft") {
      buttons.push(
        <button
          key="submit"
          onClick={() => handleSubmit(yeuCau.id)}
          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-all"
          title="Gửi yêu cầu"
        >
          <Send size={12} />
        </button>
      );
    }

    // Cancel request
    if (!["completed", "cancelled"].includes(yeuCau.trang_thai)) {
      buttons.push(
        <button
          key="cancel"
          onClick={() => handleCancel(yeuCau.id)}
          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
          title="Hủy yêu cầu"
        >
          <X size={12} />
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header - compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center">
            <ArrowUpFromLine className="mr-2 h-4 w-4 text-red-600" />
            Yêu cầu xuất kho
          </h1>
          <p className="mt-1 text-xs text-gray-600">
            Quản lý các yêu cầu xuất hàng từ kho
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={14} />
          <span>Tạo yêu cầu</span>
        </button>
      </div>

      {/* Ton Kho Alert Modal */}
      {tonKhoAlert && (
        <Modal
          isOpen={true}
          onClose={() => setTonKhoAlert(null)}
          title="Cảnh báo tồn kho"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-yellow-600">
              <AlertTriangle size={20} />
              <span className="font-medium">
                Một số hàng hóa không đủ tồn kho
              </span>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="space-y-2">
                {tonKhoAlert.khongDuHang.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="font-medium">{item.ten_hang_hoa}</span>
                    <span className="text-red-600">
                      Yêu cầu: {item.so_luong_yeu_cau} | Tồn:{" "}
                      {item.so_luong_ton}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setTonKhoAlert(null)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => handleForceSubmit(tonKhoAlert.yeuCauId)}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Tabs - compact scrollable */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 border-b-2 font-medium text-xs transition-colors ${
                  selectedTab === tab.key
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    selectedTab === tab.key
                      ? "bg-red-100 text-red-800"
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

      {/* Filters - compact grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Số yêu cầu, lý do..."
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.tu_ngay}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, tu_ngay: e.target.value }))
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.den_ngay}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, den_ngay: e.target.value }))
              }
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
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
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            >
              <option value="">Tất cả</option>
              <option value="thap">Thấp</option>
              <option value="binh_thuong">Bình thường</option>
              <option value="cao">Cao</option>
              <option value="khan_cap">Khẩn cấp</option>
            </select>
          </div>

          <div className="col-span-2 flex items-end">
            <button
              onClick={() => {
                setFilters({
                  tu_ngay: "",
                  den_ngay: "",
                  trang_thai: "",
                  muc_do_uu_tien: "",
                  don_vi_yeu_cau_id: "",
                  don_vi_nhan_id: "",
                });
                setSearchTerm("");
              }}
              className="w-full px-2 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center space-x-1"
            >
              <Filter size={12} />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table - flex-1 to take remaining space */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loading size="large" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th
                      className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("so_yeu_cau")}
                    >
                      Số YC {getSortIcon("so_yeu_cau")}
                    </th>
                    <th
                      className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("ngay_yeu_cau")}
                    >
                      Ngày YC {getSortIcon("ngay_yeu_cau")}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Lý do
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Đơn vị nhận
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Ưu tiên
                    </th>
                    <th
                      className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("tong_gia_tri_uoc_tinh")}
                    >
                      Giá trị {getSortIcon("tong_gia_tri_uoc_tinh")}
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Người YC
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-20">
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
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">
                            {yeuCau.so_yeu_cau}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            {formatDate(yeuCau.ngay_yeu_cau)}
                          </div>
                          {yeuCau.ngay_can_hang && (
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <Calendar size={10} className="mr-1" />
                              {formatDate(yeuCau.ngay_can_hang)}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-900 max-w-32 truncate">
                            {yeuCau.ly_do_yeu_cau}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <Package size={10} className="mr-1" />
                            {yeuCau.so_mat_hang} item
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-900 max-w-24 truncate">
                            {yeuCau.don_vi_nhan?.ten_don_vi || "Chưa chọn"}
                          </div>
                          {yeuCau.nguoi_nhan && (
                            <div className="text-xs text-gray-500 truncate">
                              {yeuCau.nguoi_nhan}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}
                          >
                            {priorityInfo.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="text-xs font-medium text-red-600">
                            {formatCurrency(yeuCau.tong_gia_tri_uoc_tinh)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            <statusInfo.icon size={10} className="mr-1" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className="text-xs text-gray-900 flex items-center justify-center">
                            <User size={12} className="mr-1 text-gray-400" />
                            <span className="max-w-16 truncate">
                              {yeuCau.nguoi_yeu_cau_info?.ho_ten || "N/A"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-20">
                            {yeuCau.don_vi_yeu_cau?.ten_phong_ban}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
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
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="text-center">
                  <ArrowUpFromLine className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    Không có yêu cầu nào
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedTab === "all"
                      ? "Chưa có yêu cầu xuất kho nào được tạo."
                      : `Không có yêu cầu nào ở trạng thái "${
                          tabs.find((t) => t.key === selectedTab)?.label
                        }".`}
                  </p>
                </div>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="px-3 py-2 border-t border-gray-200">
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

      {/* Modals */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo yêu cầu xuất kho"
        size="xl"
      >
        <YeuCauXuatForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Chi tiết yêu cầu: ${selectedYeuCau?.so_yeu_cau || ""}`}
        size="xl"
      >
        {selectedYeuCau && (
          <YeuCauDetail
            yeuCau={selectedYeuCau}
            type="xuat"
            onUpdate={fetchData}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default YeuCauXuat;
