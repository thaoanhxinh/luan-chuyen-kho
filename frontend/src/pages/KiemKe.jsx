import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Eye,
  FileText,
  Check,
  X,
  Search,
  ClipboardCheck,
  Printer,
  MoreVertical,
  Pencil,
} from "lucide-react";
import { kiemKeService } from "../services/kiemKeService";
import { formatCurrency, formatDate, formatNumber } from "../utils/helpers";
import { TRANG_THAI_KIEM_KE, LOAI_KIEM_KE } from "../utils/constants";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import PageHeader from "../components/common/PageHeader";
import CreateKiemKeForm from "../components/forms/CreateKiemKeForm";
import PhieuKiemKeDetail from "../components/details/PhieuKiemKeDetail";
import EditKiemKeForm from "../components/forms/EditKiemKeForm";
import toast from "react-hot-toast";

// Component Dropdown Actions
const ActionDropdown = ({ phieu, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const actions = [
    {
      key: "view",
      label: "Xem chi tiết",
      icon: Eye,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: true,
    },
    {
      key: "edit",
      label: "Sửa phiếu",
      icon: Pencil,
      color: "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50",
      show: phieu.trang_thai === "draft",
    },
    {
      key: "approve",
      label: "Duyệt phiếu",
      icon: Check,
      color: "text-green-600 hover:text-green-800 hover:bg-green-50",
      show: phieu.trang_thai === "draft",
    },
    {
      key: "cancel",
      label: "Hủy phiếu",
      icon: X,
      color: "text-red-600 hover:text-red-800 hover:bg-red-50",
      show: phieu.trang_thai === "draft",
    },
    {
      key: "print",
      label: "In biên bản",
      icon: Printer,
      color: "text-purple-600 hover:text-purple-800 hover:bg-purple-50",
      show: true,
    },
  ];

  const visibleActions = actions.filter((action) => action.show);

  const handleActionClick = (actionKey) => {
    setIsOpen(false);
    onAction(actionKey, phieu.id);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
        title="Thao tác"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div
          className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] overflow-hidden"
          style={{
            top: `${dropdownRef.current?.getBoundingClientRect().bottom + 4}px`,
            left: `${
              dropdownRef.current?.getBoundingClientRect().right - 192
            }px`,
          }}
        >
          <div className="py-1">
            {visibleActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.key}
                  onClick={() => handleActionClick(action.key)}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-all ${action.color}`}
                >
                  <IconComponent size={14} />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const KiemKe = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    tu_ngay: "",
    den_ngay: "",
    trang_thai: "",
    loai_kiem_ke: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "ngay_kiem_ke",
    direction: "desc",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const phieuKiemKeList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await kiemKeService.getList({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        sort_by: sortConfig.key,
        sort_direction: sortConfig.direction,
        ...filters,
      });
      setData(response);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu phiếu kiểm kê");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await kiemKeService.getDetail(id);
      setSelectedPhieu(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải chi tiết phiếu kiểm kê");
    }
  };

  const handlePrint = (phieu) => {
    setSelectedPhieu(phieu);
    setShowPrintModal(true);
  };

  const handleEdit = (phieu) => {
    setSelectedPhieu(phieu);
    setShowEditModal(true);
  };

  const handleApprove = async (id) => {
    if (window.confirm("Bạn có chắc muốn duyệt phiếu kiểm kê này?")) {
      try {
        await kiemKeService.approve(id);
        toast.success("Duyệt phiếu kiểm kê thành công");
        fetchData();
      } catch (error) {
        console.error("Error approving:", error);
        toast.error("Không thể duyệt phiếu kiểm kê");
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Bạn có chắc muốn hủy phiếu kiểm kê này?")) {
      try {
        await kiemKeService.cancel(id);
        toast.success("Hủy phiếu kiểm kê thành công");
        fetchData();
      } catch (error) {
        console.error("Error canceling:", error);
        toast.error("Không thể hủy phiếu kiểm kê");
      }
    }
  };

  const getTrangThaiColor = (trangThai) => {
    const config = TRANG_THAI_KIEM_KE[trangThai] || {};
    const colorMap = {
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      yellow: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const handleFormCancel = () => {
    setShowCreateModal(false);
  };

  // Handler cho dropdown actions
  const handleActionClick = (actionKey, phieuId) => {
    const phieu = phieuKiemKeList.find((p) => p.id === phieuId);

    switch (actionKey) {
      case "view":
        handleViewDetail(phieuId);
        break;
      case "edit":
        handleEdit(phieu);
        break;
      case "approve":
        handleApprove(phieuId);
        break;
      case "cancel":
        handleCancel(phieuId);
        break;
      case "print":
        handlePrint(phieu);
        break;
      default:
        break;
    }
  };

  const handleFormSuccess = (modalType) => {
    if (modalType === "create") setShowCreateModal(false);
    if (modalType === "edit") setShowEditModal(false);
    fetchData();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Quản lý kiểm kê kho"
        subtitle="Quản lý các phiếu kiểm kê định kỳ và đột xuất"
        Icon={ClipboardCheck}
      />

      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={18} />
          <span>Tạo phiếu kiểm kê</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
                placeholder="Tìm theo số phiếu..."
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.trang_thai}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, trang_thai: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(TRANG_THAI_KIEM_KE).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại kiểm kê
            </label>
            <select
              value={filters.loai_kiem_ke}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  loai_kiem_ke: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(LOAI_KIEM_KE).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loading size="large" />
          </div>
        ) : (
          <>
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("so_quyet_dinh")}
                    >
                      Số phiếu {getSortIcon("so_quyet_dinh")}
                    </th>
                    <th
                      className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("ngay_kiem_ke")}
                    >
                      Ngày KK {getSortIcon("ngay_kiem_ke")}
                    </th>
                    <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Loại KK
                    </th>
                    <th className="w-20 px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Số MH
                    </th>
                    <th className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Chênh lệch
                    </th>
                    <th className="w-32 px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      GT chênh lệch
                    </th>
                    <th className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Người tạo
                    </th>
                    <th className="w-16 px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {phieuKiemKeList.map((phieu) => (
                    <tr
                      key={phieu.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="w-32 px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {phieu.so_quyet_dinh}
                        </div>
                      </td>
                      <td className="w-28 px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(phieu.ngay_kiem_ke)}
                        </div>
                      </td>
                      <td className="w-24 px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 truncate">
                          {LOAI_KIEM_KE[phieu.loai_kiem_ke]}
                        </span>
                      </td>
                      <td className="w-20 px-4 py-3 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {phieu.so_mat_hang || 0}
                        </div>
                      </td>
                      <td className="w-24 px-4 py-3 whitespace-nowrap text-center">
                        {phieu.chenh_lech > 0 ? (
                          <span className="text-green-600 font-medium text-sm">
                            +{formatNumber(phieu.chenh_lech)}
                          </span>
                        ) : phieu.chenh_lech < 0 ? (
                          <span className="text-red-600 font-medium text-sm">
                            {formatNumber(phieu.chenh_lech)}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">0</span>
                        )}
                      </td>
                      <td className="w-32 px-4 py-3 whitespace-nowrap text-right">
                        {phieu.gia_tri_chenh_lech > 0 ? (
                          <span className="text-green-600 font-medium text-sm">
                            +{formatCurrency(phieu.gia_tri_chenh_lech)}
                          </span>
                        ) : phieu.gia_tri_chenh_lech < 0 ? (
                          <span className="text-red-600 font-medium text-sm">
                            {formatCurrency(phieu.gia_tri_chenh_lech)}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            {formatCurrency(0)}
                          </span>
                        )}
                      </td>
                      <td className="w-24 px-4 py-3 whitespace-nowrap text-center">
                        <span className={getTrangThaiColor(phieu.trang_thai)}>
                          {TRANG_THAI_KIEM_KE[phieu.trang_thai]?.label}
                        </span>
                      </td>
                      <td className="w-28 px-4 py-3 whitespace-nowrap overflow-hidden text-ellipsis">
                        <div className="text-sm text-gray-900 truncate">
                          {phieu.nguoi_tao_ten}
                        </div>
                      </td>
                      <td className="w-16 px-4 py-3 whitespace-nowrap text-center relative">
                        <ActionDropdown
                          phieu={phieu}
                          onAction={handleActionClick}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {phieuKiemKeList.length === 0 && (
              <div className="text-center py-8">
                <ClipboardCheck className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Không có dữ liệu
                </h3>
                <p className="text-xs text-gray-500">
                  Chưa có phiếu kiểm kê nào được tạo.
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
        title="Tạo phiếu kiểm kê"
        size="full"
      >
        <CreateKiemKeForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Sửa phiếu kiểm kê: ${selectedPhieu?.so_phieu}`}
        size="full"
      >
        {selectedPhieu && (
          <EditKiemKeForm
            phieuId={selectedPhieu.id}
            onSuccess={() => handleFormSuccess("edit")}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Chi tiết phiếu kiểm kê: ${selectedPhieu?.so_quyet_dinh}`}
        size="xl"
      >
        {selectedPhieu && <PhieuKiemKeDetail phieu={selectedPhieu} />}
      </Modal>

      {/* Print Modal */}
      <Modal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title={`In biên bản kiểm kê: ${selectedPhieu?.so_quyet_dinh}`}
        size="lg"
      >
        {selectedPhieu && (
          <PrintKiemKeForm
            phieu={selectedPhieu}
            onCancel={() => setShowPrintModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

// Form in phiếu kiểm kê

const PrintKiemKeForm = ({ phieu, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Chỉ cần thông tin người ký, tổ kiểm kê đã có từ database
  const [signatories, setSignatories] = useState({
    nguoi_lap: "",
    tieu_doi_truong_kho: "",
    ban_tai_chinh: "",
    chu_nhiem_hckt: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSignatories((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await kiemKeService.print(phieu.id, signatories);

      // Tạo link download từ URL an toàn do server trả về
      const downloadUrl = response.data.downloadUrl.startsWith("http")
        ? response.data.downloadUrl
        : `http://localhost:5000${response.data.downloadUrl}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = response.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Tạo file Excel thành công");
      onCancel();
    } catch (error) {
      console.error("Error printing:", error);
      const errorMessage =
        error.response?.data?.message || "Không thể tạo file Excel";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Các trường nhập liệu cho người ký
  const signatoryFields = [
    { name: "nguoi_lap", label: "Người lập" },
    { name: "tieu_doi_truong_kho", label: "Tiểu đội trưởng kho" },
    { name: "ban_tai_chinh", label: "Ban tài chính" },
    { name: "chu_nhiem_hckt", label: "Chủ nhiệm HC-KT" },
  ];

  return (
    <form onSubmit={handleSubmit} className="p-1">
      {/* Phần người ký */}
      <div className="p-4 mb-4 bg-purple-50 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-800 mb-4 border-b border-purple-200 pb-2">
          Thông tin người ký (phần cuối biên bản)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {signatoryFields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {field.label}
              </label>
              <input
                type="text"
                id={field.name}
                name={field.name}
                value={signatories[field.name]}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                placeholder={`Nhập tên ${field.label.toLowerCase()}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Thủ kho sẽ tự động lấy từ thông tin tổ kiểm
            kê đã nhập khi tạo phiếu.
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 bg-gray-50 px-4 py-3 rounded-b-lg">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50 flex items-center space-x-2"
        >
          <Printer size={16} />
          <span>{isSubmitting ? "Đang tạo..." : "Tạo và tải file Excel"}</span>
        </button>
      </div>
    </form>
  );
};

export default KiemKe;
