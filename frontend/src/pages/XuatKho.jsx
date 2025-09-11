import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Printer,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Building,
  Calendar,
  Package,
} from "lucide-react";
import { xuatKhoService } from "../services/xuatKhoService";
import { formatCurrency, formatDate } from "../utils/helpers";
import {
  TRANG_THAI_PHIEU,
  LOAI_PHIEU_XUAT,
  TAB_CONFIG,
  WORKFLOW_RULES,
} from "../utils/constants";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import CreateXuatKhoForm from "../components/forms/CreateXuatKhoForm";
import EditXuatKhoForm from "../components/forms/EditXuatKhoForm";
import Loading from "../components/common/Loading";
import PhieuXuatDetail from "../components/details/PhieuXuatDetail";
import PrintPhieuXuatForm from "../components/forms/PrintPhieuXuatForm";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/common/PageHeader";

// Component for revision request modal
const RevisionRequestModal = ({ isOpen, onClose, onSubmit }) => {
  const [ghiChu, setGhiChu] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ghiChu.trim()) {
      toast.error("Vui lòng nhập lý do yêu cầu chỉnh sửa");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(ghiChu);
      setGhiChu("");
      onClose();
    } catch (error) {
      console.error("Error submitting revision request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yêu cầu chỉnh sửa phiếu">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-yellow-600 mt-1" size={20} />
            <div>
              <h3 className="font-medium text-yellow-800">Lưu ý</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Phiếu sẽ được chuyển về trạng thái "Cần sửa" và người tạo sẽ
                nhận được thông báo để chỉnh sửa lại.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do yêu cầu chỉnh sửa <span className="text-red-500">*</span>
          </label>
          <textarea
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập lý do cần chỉnh sửa phiếu..."
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !ghiChu.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <AlertTriangle size={16} />
            <span>{isSubmitting ? "Đang gửi..." : "Yêu cầu chỉnh sửa"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ✅ Component Dropdown Actions với logic permissions CHÍNH XÁC cho XUẤT KHO
const ActionDropdown = ({ phieu, onAction, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAbove, setIsAbove] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

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

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldShowAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
      setIsAbove(shouldShowAbove);
    }
    setIsOpen(!isOpen);
  };

  // Determine permissions based on CHÍNH XÁC backend logic
  const isAdmin = user.role === "admin";
  const isManager = user.role === "manager";
  const isOwner = phieu.nguoi_tao === user.id;
  const isLevel3User = user.role === "user" && user.phong_ban?.cap_bac === 3;

  // ✅ LOGIC ĐÚNG: Quyền submit - chỉ chủ sở hữu và phiếu ở draft hoặc revision_required
  const canSubmit =
    isOwner && ["draft", "revision_required"].includes(phieu.trang_thai);

  // ✅ LOGIC ĐÚNG: Quyền edit - chỉ chủ sở hữu và phiếu ở draft hoặc revision_required
  const canEdit =
    isOwner && ["draft", "revision_required"].includes(phieu.trang_thai);

  // ✅ LOGIC ĐÚNG XUẤT KHO: Quyền approve theo loại xuất (2-bước cho don_vi_nhan)
  let canApprove = false;
  const isStep1Status = ["confirmed", "pending_approval"].includes(
    phieu.trang_thai
  );
  const isStep2Status = phieu.trang_thai === "pending_level3_approval";

  if (phieu.loai_xuat === "don_vi_su_dung") {
    // XUẤT SỬ DỤNG: Admin/Manager duyệt một bước khi đã gửi
    canApprove = isStep1Status && (isAdmin || isManager);
  } else if (phieu.loai_xuat === "don_vi_nhan") {
    // Bước 1 (3A gửi → cấp 2 hoặc admin duyệt)
    if (isStep1Status) {
      canApprove = isAdmin || isManager;
    }
    // Bước 2 (sau khi tạo phiếu nhập cho 3B → 3B (đơn vị xuất) duyệt)
    if (isStep2Status) {
      canApprove = isLevel3User && phieu.phong_ban?.id === user.phong_ban_id;
    }
  }

  // ✅ LOGIC ĐÚNG: Quyền yêu cầu sửa - admin/manager với phiếu confirmed
  const canRequestRevision =
    (isAdmin || isManager) && phieu.trang_thai === "confirmed";

  // ✅ LOGIC ĐÚNG: Quyền cancel - chủ sở hữu hoặc admin với phiếu chưa hoàn thành
  const canCancel =
    (isOwner || isAdmin) &&
    ["draft", "confirmed", "revision_required"].includes(phieu.trang_thai);

  // ✅ LOGIC COMPLETE: admin/manager hoặc chủ sở hữu với phiếu approved
  const canComplete =
    (isAdmin || isManager || isOwner) && phieu.trang_thai === "approved";

  const actions = [
    {
      key: "view",
      label: "Xem chi tiết",
      icon: Eye,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: true,
    },
    {
      key: "submit",
      label: "Gửi duyệt",
      icon: Send,
      color: "text-green-600 hover:text-green-800 hover:bg-green-50",
      show: canSubmit,
    },
    {
      key: "approve",
      label:
        phieu.loai_xuat === "don_vi_nhan" ? "Duyệt nhận hàng" : "Duyệt xuất",
      icon: CheckCircle,
      color: "text-green-600 hover:text-green-800 hover:bg-green-50",
      show: canApprove,
    },
    {
      key: "edit",
      label: "Chỉnh sửa",
      icon: Edit,
      color: "text-amber-600 hover:text-amber-800 hover:bg-amber-50",
      show: canEdit,
    },
    {
      key: "request_revision",
      label: "Yêu cầu sửa",
      icon: AlertTriangle,
      color: "text-orange-600 hover:text-orange-800 hover:bg-orange-50",
      show: canRequestRevision,
    },
    {
      key: "complete",
      label: "Hoàn thành",
      icon: CheckCircle,
      color: "text-green-600 hover:text-green-800 hover:bg-green-50",
      show: canComplete,
    },
    {
      key: "print",
      label: "In phiếu",
      icon: Printer,
      color: "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
      show: ["approved", "completed"].includes(phieu.trang_thai),
    },
    {
      key: "cancel",
      label: "Hủy phiếu",
      icon: XCircle,
      color: "text-red-600 hover:text-red-800 hover:bg-red-50",
      show: canCancel,
    },
  ];

  const visibleActions = actions.filter((action) => action.show);

  const handleActionClick = (actionKey) => {
    setIsOpen(false);
    onAction(actionKey, phieu.id);
  };

  if (visibleActions.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef} style={{ overflow: "visible" }}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] ${
            isAbove ? "-translate-y-full -mt-2" : "mt-2"
          }`}
          style={{ top: 0 }}
        >
          <div className="py-1">
            {visibleActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.key}
                  onClick={() => handleActionClick(action.key)}
                  className={`w-full px-4 py-3 text-left text-sm flex items-center space-x-3 transition-all first:rounded-t-lg last:rounded-b-lg ${action.color}`}
                >
                  <IconComponent size={16} />
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

const XuatKho = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const validTabs = TAB_CONFIG.XUAT_KHO.map((t) => t.key);
    return tab && validTabs.includes(tab) ? tab : "tat_ca";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [filters, setFilters] = useState({
    tu_ngay: "",
    den_ngay: "",
    loai_xuat: "",
    phong_ban_filter: user?.role === "admin" ? "all" : "own",
  });
  const [highlightId, setHighlightId] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [editPhieuId, setEditPhieuId] = useState(null);
  const [printPhieuId, setPrintPhieuId] = useState(null);

  // Data states
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabCounts, setTabCounts] = useState({});
  //const [phongBanList, setPhongBanList] = useState([]);

  const phieuXuatList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  // ✅ FIX: Correct tab status filter
  const getTabStatusFilter = (tabKey) => {
    const tabConfig = TAB_CONFIG.XUAT_KHO.find((tab) => tab.key === tabKey);
    return tabConfig?.status || [];
  };

  const fetchTabCounts = useCallback(async () => {
    try {
      const counts = {};

      // Get counts for each tab
      for (const tab of TAB_CONFIG.XUAT_KHO) {
        if (tab.key === "tat_ca") {
          const response = await xuatKhoService.getList({
            page: 1,
            limit: 1,
            search: searchTerm,
            ...filters,
          });
          counts[tab.key] = response.data?.pagination?.total || 0;
        } else {
          const response = await xuatKhoService.getList({
            page: 1,
            limit: 1,
            search: searchTerm,
            trang_thai: tab.status,
            ...filters,
          });
          counts[tab.key] = response.data?.pagination?.total || 0;
        }
      }

      setTabCounts(counts);
    } catch (error) {
      console.error("Error fetching tab counts:", error);
    }
  }, [searchTerm, filters]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // ✅ FIX: Build filters based on active tab
      const statusFilter = getTabStatusFilter(activeTab);
      const queryParams = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        sort_by: sortConfig.key,
        sort_direction: sortConfig.direction,
        ...filters,
      };

      // ✅ FIX: Add status filter correctly
      if (activeTab !== "tat_ca" && statusFilter.length > 0) {
        queryParams.trang_thai = statusFilter;
      }

      console.log("✅ Fetching xuat kho with correct params:", queryParams);

      const response = await xuatKhoService.getList(queryParams);
      setData(response);

      // Fetch counts for all tabs
      await fetchTabCounts();
    } catch (error) {
      console.error("Error fetching xuat kho data:", error);
      toast.error("Không thể tải dữ liệu phiếu xuất");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    activeTab,
    searchTerm,
    filters,
    sortConfig,
    pageSize,
    fetchTabCounts,
  ]);

  // Check if user can create phieu: only cấp 3 (user role at level 3)
  const canCreatePhieu =
    (user?.role === "user" && user?.phong_ban?.cap_bac === 3) || false;

  useEffect(() => {
    // Reset to first page when changing tabs, filters or page size
    setCurrentPage(1);
  }, [activeTab, searchTerm, filters, sortConfig, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync activeTab with URL changes (e.g., via notifications)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const validTabs = TAB_CONFIG.XUAT_KHO.map((t) => t.key);
    const next = tab && validTabs.includes(tab) ? tab : "tat_ca";
    if (next !== activeTab) setActiveTab(next);
    const hl = params.get("highlight");
    setHighlightId(hl ? Number(hl) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await xuatKhoService.getDetail(id);
      setSelectedPhieu(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải chi tiết phiếu xuất");
    }
  };

  // ✅ Handle submit với workflow chính xác
  const handleSubmit = async (id) => {
    if (window.confirm("Bạn có chắc muốn gửi phiếu này để duyệt?")) {
      try {
        const response = await xuatKhoService.submit(id);
        toast.success(response.message || "Đã gửi phiếu để duyệt");
        fetchData();
      } catch (error) {
        console.error("Error submitting:", error);
        const errorMessage =
          error.response?.data?.message || "Không thể gửi phiếu";

        // ✅ Handle stock validation error
        if (error.response?.data?.data?.stock_check) {
          const stockIssues = error.response.data.data.stock_check
            .filter((item) => !item.du_hang)
            .map(
              (item) =>
                `Hàng hóa ID ${item.hang_hoa_id}: cần ${item.so_luong_xuat}, còn ${item.ton_kho}`
            )
            .join("; ");
          toast.error(`${errorMessage}. Chi tiết: ${stockIssues}`);
        } else {
          toast.error(errorMessage);
        }
      }
    }
  };

  // ✅ Handle approve với workflow chính xác
  const handleApprove = async (id) => {
    if (window.confirm("Bạn có chắc muốn duyệt phiếu xuất này?")) {
      try {
        const response = await xuatKhoService.approve(id);
        toast.success(response.message || "Duyệt phiếu xuất thành công");
        fetchData();
      } catch (error) {
        console.error("Error approving:", error);
        toast.error(
          error.response?.data?.message || "Không thể duyệt phiếu xuất"
        );
      }
    }
  };

  const handleRequestRevision = async (ghiChu) => {
    try {
      await xuatKhoService.requestRevision(selectedPhieu.id, {
        ghi_chu_phan_hoi: ghiChu,
      });
      toast.success("Đã yêu cầu chỉnh sửa phiếu");
      setShowRevisionModal(false);
      setSelectedPhieu(null);
      fetchData();
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast.error("Không thể yêu cầu chỉnh sửa");
    }
  };

  const handleComplete = async (id) => {
    if (window.confirm("Bạn có chắc muốn hoàn thành phiếu xuất này?")) {
      try {
        await xuatKhoService.complete(id);
        toast.success("Hoàn thành phiếu thành công");
        fetchData();
      } catch (error) {
        console.error("Error completing:", error);
        toast.error(
          error.response?.data?.message || "Không thể hoàn thành phiếu"
        );
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Bạn có chắc muốn hủy phiếu xuất này?")) {
      try {
        await xuatKhoService.cancel(id);
        toast.success("Hủy phiếu thành công");
        fetchData();
      } catch (error) {
        console.error("Error canceling:", error);
        toast.error("Không thể hủy phiếu");
      }
    }
  };

  // Action handler
  const handleAction = async (action, id) => {
    switch (action) {
      case "view":
        handleViewDetail(id);
        break;
      case "submit":
        handleSubmit(id);
        break;
      case "approve":
        handleApprove(id);
        break;
      case "edit":
        try {
          const response = await xuatKhoService.getDetail(id);
          setSelectedPhieu(response.data);
          setEditPhieuId(id);
          setShowEditModal(true);
          // eslint-disable-next-line no-unused-vars
        } catch (error) {
          toast.error("Không thể tải dữ liệu để chỉnh sửa");
        }
        break;
      case "request_revision":
        try {
          const response = await xuatKhoService.getDetail(id);
          setSelectedPhieu(response.data);
          setShowRevisionModal(true);
          // eslint-disable-next-line no-unused-vars
        } catch (error) {
          toast.error("Không thể tải dữ liệu phiếu");
        }
        break;
      case "complete":
        handleComplete(id);
        break;
      case "print":
        setPrintPhieuId(id);
        setShowPrintModal(true);
        break;
      case "cancel":
        handleCancel(id);
        break;
      default:
        console.warn("Unknown action:", action);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const getTrangThaiColor = (trangThai) => {
    const config = TRANG_THAI_PHIEU[trangThai] || {};
    const colorMap = {
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      yellow: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800",
      gray: "bg-gray-100 text-gray-800",
      emerald: "bg-emerald-100 text-emerald-800",
      purple: "bg-purple-100 text-purple-800",
      orange: "bg-orange-100 text-orange-800",
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
  };

  const getLoaiXuatBadge = (loaiXuat) => {
    const colors = {
      don_vi_su_dung: "bg-blue-100 text-blue-800",
      don_vi_nhan: "bg-green-100 text-green-800",
    };

    // ✅ FIX: Lấy label từ LOAI_PHIEU_XUAT với structure mới
    const config = LOAI_PHIEU_XUAT[loaiXuat];
    const label = config?.label || "Không xác định";

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          colors[loaiXuat] || "bg-gray-100 text-gray-800"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Quản lý xuất kho"
            subtitle="Quản lý các phiếu xuất hàng khỏi kho theo quy trình duyệt"
            Icon={Package}
          />
          {canCreatePhieu && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors shadow-sm"
            >
              <Plus size={20} />
              <span>Tạo phiếu xuất</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {TAB_CONFIG.XUAT_KHO.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  const params = new URLSearchParams(location.search);
                  if (tab.key === "tat_ca") params.delete("tab");
                  else params.set("tab", tab.key);
                  navigate(
                    {
                      pathname: location.pathname,
                      search: params.toString(),
                    },
                    { replace: true }
                  );
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tabCounts[tab.key] !== undefined && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.key
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="col-span-1 sm:col-span-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
                  placeholder="Tìm theo số phiếu, lý do..."
                />
              </div>
            </div>

            {/* Date filters */}
            <div>
              <input
                type="date"
                value={filters.tu_ngay}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, tu_ngay: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
                placeholder="Từ ngày"
              />
            </div>

            <div>
              <input
                type="date"
                value={filters.den_ngay}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    den_ngay: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
                placeholder="Đến ngày"
              />
            </div>

            {/* Type filter */}
            <div>
              <select
                value={filters.loai_xuat}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    loai_xuat: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm"
              >
                <option value="">Tất cả loại</option>
                {Object.entries(LOAI_PHIEU_XUAT).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loading size="large" />
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <table className="w-full table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="w-[140px] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("so_phieu")}
                      >
                        Số phiếu {getSortIcon("so_phieu")}
                      </th>
                      <th
                        className="w-[120px] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("ngay_xuat")}
                      >
                        Ngày xuất {getSortIcon("ngay_xuat")}
                      </th>
                      <th className="w-[120px] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại xuất
                      </th>
                      <th className="w-[250px] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn vị nhận
                      </th>
                      <th className="w-[150px] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phòng ban
                      </th>
                      <th
                        className="w-[120px] px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("tong_tien")}
                      >
                        Tổng tiền {getSortIcon("tong_tien")}
                      </th>
                      <th className="w-[100px] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="w-[100px] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {phieuXuatList.map((phieu) => {
                      const isHighlighted = highlightId === phieu.id;

                      return (
                        <tr
                          key={phieu.id}
                          className={`hover:bg-gray-50 transition-all duration-300 ${
                            isHighlighted
                              ? "bg-yellow-100 ring-2 ring-yellow-400"
                              : ""
                          }`}
                        >
                          <td className="px-3 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              <div className="truncate">{phieu.so_phieu}</div>
                              {isHighlighted && (
                                <span className="animate-pulse bg-yellow-200 text-yellow-800 text-xs px-1 py-0.5 rounded-full">
                                  Mới
                                </span>
                              )}
                            </div>
                            {phieu.so_quyet_dinh && (
                              <div className="text-xs text-gray-500 truncate">
                                QĐ: {phieu.so_quyet_dinh}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-4">
                            <div className="text-sm text-gray-900">
                              {formatDate(phieu.ngay_xuat)}
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            {getLoaiXuatBadge(phieu.loai_xuat)}
                          </td>
                          <td className="px-3 py-4">
                            <div className="text-sm text-gray-900 truncate">
                              {phieu.loai_xuat === "don_vi_su_dung"
                                ? "Sử dụng nội bộ"
                                : phieu.ten_phong_ban_nhan
                                ? phieu.ten_phong_ban_nhan
                                : phieu.ten_don_vi_nhan
                                ? phieu.ten_don_vi_nhan
                                : "N/A"}
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Building
                                size={14}
                                className="mr-2 text-gray-400 flex-shrink-0"
                              />
                              <span className="truncate">
                                {phieu.phong_ban?.ten_phong_ban || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-right">
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(phieu.tong_tien)}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span
                              className={getTrangThaiColor(phieu.trang_thai)}
                            >
                              {TRANG_THAI_PHIEU[phieu.trang_thai]?.label}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <ActionDropdown
                              phieu={phieu}
                              onAction={handleAction}
                              user={user}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-gray-200">
                {phieuXuatList.map((phieu) => (
                  <div key={phieu.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {phieu.so_phieu}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(phieu.ngay_xuat)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={getTrangThaiColor(phieu.trang_thai)}>
                          {TRANG_THAI_PHIEU[phieu.trang_thai]?.label}
                        </span>
                        <ActionDropdown
                          phieu={phieu}
                          onAction={handleAction}
                          user={user}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Loại:</span>
                        <span className="text-xs font-medium">
                          {LOAI_PHIEU_XUAT[phieu.loai_xuat]?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">
                          Đơn vị nhận:
                        </span>
                        <span className="text-xs font-medium">
                          {phieu.loai_xuat === "don_vi_su_dung"
                            ? "Sử dụng nội bộ"
                            : phieu.ten_phong_ban_nhan
                            ? phieu.ten_phong_ban_nhan
                            : phieu.ten_don_vi_nhan
                            ? phieu.ten_don_vi_nhan
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">
                          Phòng ban:
                        </span>
                        <span className="text-xs font-medium">
                          {phieu.phong_ban?.ten_phong_ban || "Chưa xác định"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">
                          Tổng tiền:
                        </span>
                        <span className="text-xs font-bold text-green-600">
                          {formatCurrency(phieu.tong_tien)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination & Page size */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value) || 6);
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value={6}>6</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                  <span>dòng / trang</span>
                </div>
                {pagination.pages > 1 && (
                  <Pagination
                    currentPage={pagination.page || 1}
                    totalPages={pagination.pages || 1}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>

              {phieuXuatList.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không có dữ liệu
                  </h3>
                  <p className="text-sm text-gray-500">
                    {activeTab === "tat_ca"
                      ? "Chưa có phiếu xuất nào được tạo."
                      : `Không có phiếu xuất nào ở trạng thái "${
                          TAB_CONFIG.XUAT_KHO.find((t) => t.key === activeTab)
                            ?.label
                        }".`}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo phiếu xuất kho"
        size="xl"
      >
        <CreateXuatKhoForm
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPhieu(null);
        }}
        title={`Chi tiết phiếu xuất: ${selectedPhieu?.so_phieu || ""}`}
        size="full"
      >
        {selectedPhieu && <PhieuXuatDetail phieu={selectedPhieu} />}
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPhieu(null);
          setEditPhieuId(null);
        }}
        title={`Sửa phiếu xuất: ${selectedPhieu?.so_phieu || ""}`}
        size="xl"
      >
        {editPhieuId && (
          <EditXuatKhoForm
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

      <Modal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setPrintPhieuId(null);
        }}
        title="In phiếu xuất kho"
        size="md"
      >
        <PrintPhieuXuatForm
          phieuId={printPhieuId}
          onSuccess={() => setShowPrintModal(false)}
          onCancel={() => setShowPrintModal(false)}
        />
      </Modal>

      <RevisionRequestModal
        isOpen={showRevisionModal}
        onClose={() => {
          setShowRevisionModal(false);
          setSelectedPhieu(null);
        }}
        onSubmit={handleRequestRevision}
        phieu={selectedPhieu}
      />
    </div>
  );
};

export default XuatKho;
