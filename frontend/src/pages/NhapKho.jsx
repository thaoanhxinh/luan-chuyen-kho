import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Eye,
  FileText,
  Check,
  X,
  Search,
  ArrowDownToLine,
  Upload,
  CheckCircle,
  Download,
  FileDown,
  Edit,
  MoreVertical, // Icon cho dropdown
} from "lucide-react";
import { nhapKhoService } from "../services/nhapKhoService";
import { formatCurrency, formatDate } from "../utils/helpers";
import { TRANG_THAI_PHIEU, LOAI_PHIEU_NHAP } from "../utils/constants";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import NhapKhoForm from "../components/forms/NhapKhoForm";
import CreateNhapKhoForm from "../components/forms/CreateNhapKhoForm";
import EditNhapKhoForm from "../components/forms/EditNhapKhoForm";
import Loading from "../components/common/Loading";
import PrintPhieuForm from "../components/forms/PrintPhieuForm";
import PhieuNhapDetail from "../components/details/PhieuNhapDetail";
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

  const actions = [
    {
      key: "view",
      label: "Xem chi tiết",
      icon: Eye,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: true,
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
      key: "upload",
      label: "Upload quyết định",
      icon: Upload,
      color: "text-purple-600 hover:text-purple-800 hover:bg-purple-50",
      show: phieu.trang_thai === "approved",
    },
    {
      key: "complete",
      label: "Hoàn thành",
      icon: CheckCircle,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: phieu.trang_thai === "approved" && phieu.decision_pdf_url,
    },
    {
      key: "edit",
      label: "Sửa phiếu",
      icon: Edit,
      color: "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50",
      show: phieu.trang_thai !== "completed",
    },
    {
      key: "print",
      label: "In phiếu",
      icon: FileText,
      color: "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
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
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
        title="Thao tác"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-none overflow-visible">
          {visibleActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => handleActionClick(action.key)}
                className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-all first:rounded-t-lg last:rounded-b-lg ${action.color}`}
              >
                <IconComponent size={14} />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const NhapKho = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    tu_ngay: "",
    den_ngay: "",
    trang_thai: "",
    loai_phieu: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "ngay_nhap",
    direction: "desc",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const phieuNhapList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printPhieuId, setPrintPhieuId] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editPhieuId, setEditPhieuId] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await nhapKhoService.getList({
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
      toast.error("Không thể tải dữ liệu phiếu nhập");
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
      const response = await nhapKhoService.getDetail(id);
      setSelectedPhieu(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải chi tiết phiếu nhập");
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm("Bạn có chắc muốn duyệt phiếu nhập này?")) {
      try {
        await nhapKhoService.approve(id);
        toast.success("Duyệt phiếu nhập thành công");
        fetchData();
      } catch (error) {
        console.error("Error approving:", error);
        toast.error("Không thể duyệt phiếu nhập");
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Bạn có chắc muốn hủy phiếu nhập này?")) {
      try {
        await nhapKhoService.cancel(id);
        toast.success("Hủy phiếu nhập thành công");
        fetchData();
      } catch (error) {
        console.error("Error canceling:", error);
        toast.error("Không thể hủy phiếu nhập");
      }
    }
  };

  const getTrangThaiColor = (trangThai) => {
    const config = TRANG_THAI_PHIEU[trangThai] || {};
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

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    fetchData();
  };

  const handleFormCancel = () => {
    setShowCreateModal(false);
    setSelectedPhieu(null);
  };

  const handleUploadDecision = async (id) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        toast.error("Chỉ chấp nhận file PDF");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File không được vượt quá 10MB");
        return;
      }

      const ghiChu = prompt("Nhập ghi chú (không bắt buộc):");

      const formData = new FormData();
      formData.append("decision_pdf", file);
      formData.append("ghi_chu_hoan_thanh", ghiChu || "");

      try {
        await nhapKhoService.uploadDecision(id, formData);
        toast.success("Upload quyết định thành công");
        fetchData();
      } catch (error) {
        console.error("Error uploading decision:", error);
        toast.error("Không thể upload quyết định");
      }
    };

    input.click();
  };

  const handleDownloadDecision = async (id) => {
    try {
      const response = await nhapKhoService.downloadDecision(id);
      const { url, filename } = response.data;

      const link = document.createElement("a");
      link.href = `http://localhost:5000${url}`;
      link.download = filename || "quyet_dinh.pdf";
      link.target = "_blank";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Đang tải file...");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Không thể tải file");
    }
  };

  const handleComplete = async (id) => {
    if (window.confirm("Bạn có chắc muốn hoàn thành phiếu nhập này?")) {
      try {
        await nhapKhoService.complete(id);
        toast.success("Hoàn thành phiếu nhập thành công");
        fetchData();
      } catch (error) {
        console.error("Error completing:", error);
        toast.error("Không thể hoàn thành phiếu nhập");
      }
    }
  };

  const handlePrintPhieu = (id) => {
    setPrintPhieuId(id);
    setShowPrintModal(true);
  };

  const handleEditPhieu = async (id) => {
    try {
      const response = await nhapKhoService.getDetail(id);
      setSelectedPhieu(response.data);
      setEditPhieuId(id);
      setShowEditModal(true);
    } catch (error) {
      console.error("Error fetching edit data:", error);
      toast.error("Không thể tải dữ liệu để chỉnh sửa");
    }
  };

  // Handler cho dropdown actions
  const handleActionClick = (actionKey, phieuId) => {
    switch (actionKey) {
      case "view":
        handleViewDetail(phieuId);
        break;
      case "approve":
        handleApprove(phieuId);
        break;
      case "cancel":
        handleCancel(phieuId);
        break;
      case "upload":
        handleUploadDecision(phieuId);
        break;
      case "complete":
        handleComplete(phieuId);
        break;
      case "edit":
        handleEditPhieu(phieuId);
        break;
      case "print":
        handlePrintPhieu(phieuId);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <ArrowDownToLine className="mr-2 h-5 w-5 text-green-600" />
            Quản lý nhập kho
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý các phiếu nhập hàng vào kho
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Tạo phiếu nhập</span>
        </button>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                placeholder="Tìm theo số quyết định hoặc nhà cung cấp..."
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(TRANG_THAI_PHIEU).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại phiếu
            </label>
            <select
              value={filters.loai_phieu}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, loai_phieu: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(LOAI_PHIEU_NHAP).map(([key, value]) => (
                <option key={key} value={key}>
                  {typeof value === "object" ? value.label : value}
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
            <div className="w-full">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("so_quyet_dinh")}
                    >
                      Số qđ {getSortIcon("so_quyet_dinh")}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("ngay_nhap")}
                    >
                      Ngày nhập {getSortIcon("ngay_nhap")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Loại phiếu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Nhà cung cấp
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("tong_tien")}
                    >
                      Tổng tiền {getSortIcon("tong_tien")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Quyết định
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
                  {phieuNhapList.map((phieu) => (
                    <tr
                      key={phieu.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {phieu.so_quyet_dinh || "Chưa có"}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(phieu.ngay_nhap)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {LOAI_PHIEU_NHAP[phieu.loai_phieu]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {phieu.nha_cung_cap?.ten_ncc || "Chưa có"}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(phieu.tong_tien)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {phieu.decision_pdf_url ? (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleDownloadDecision(phieu.id)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                                title={`Tải về: ${
                                  phieu.decision_pdf_filename || "Quyết định"
                                }`}
                              >
                                <FileDown size={14} />
                              </button>
                              {phieu.ghi_chu_hoan_thanh && (
                                <span
                                  className="text-xs text-gray-500 cursor-help"
                                  title={phieu.ghi_chu_hoan_thanh}
                                >
                                  📝
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={getTrangThaiColor(phieu.trang_thai)}>
                          {TRANG_THAI_PHIEU[phieu.trang_thai]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
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

            {phieuNhapList.length === 0 && (
              <div className="text-center py-8">
                <ArrowDownToLine className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Không có dữ liệu
                </h3>
                <p className="text-xs text-gray-500">
                  Chưa có phiếu nhập nào được tạo.
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
        title="Tạo phiếu nhập kho"
        size="xl"
      >
        <NhapKhoForm
          mode="create"
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        // title={selectedPhieu?.so_phieu || "Loading..."}
        size="s"
      >
        {selectedPhieu && <PhieuNhapDetail phieu={selectedPhieu} />}
      </Modal>

      {/* Print Modal */}
      <Modal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="In phiếu nhập kho"
        size="md"
      >
        <PrintPhieuForm
          phieuId={printPhieuId}
          onSuccess={() => setShowPrintModal(false)}
          onCancel={() => setShowPrintModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Sửa phiếu nhập: ${selectedPhieu?.so_phieu || "Loading..."}`}
        size="xl"
      >
        {editPhieuId && (
          <NhapKhoForm
            mode="edit"
            phieuId={editPhieuId}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedPhieu(null);
              setEditPhieuId(null);
              fetchData();
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedPhieu(null);
              setEditPhieuId(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default NhapKho;
