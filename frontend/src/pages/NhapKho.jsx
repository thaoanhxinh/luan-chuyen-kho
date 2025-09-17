import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  MoreVertical,
  Building,
  Calendar,
  User,
  Package,
  CreditCard,
  Filter,
  AlertTriangle,
  MessageCircle,
  Send,
} from "lucide-react";
import { nhapKhoService } from "../services/nhapKhoService";
import { formatCurrency, formatDate } from "../utils/helpers";
import {
  TRANG_THAI_PHIEU,
  LOAI_PHIEU_NHAP,
  TAB_CONFIG,
} from "../utils/constants";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import CreateNhapKhoForm from "../components/forms/CreateNhapKhoForm";
import EditNhapKhoForm from "../components/forms/EditNhapKhoForm";
import CompletePhieuNhapForm from "../components/forms/CompletePhieuNhapForm";
import Loading from "../components/common/Loading";
import PrintPhieuForm from "../components/forms/PrintPhieuForm";
import PhieuNhapDetail from "../components/details/PhieuNhapDetail";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/common/PageHeader";

// Component for revision request modal
const RevisionRequestModal = ({ isOpen, onClose, onSubmit, phieu }) => {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yêu cầu chỉnh sửa phiếu"
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Phiếu nhập: <span className="font-medium">{phieu?.so_phieu}</span>
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do yêu cầu chỉnh sửa <span className="text-red-500">*</span>
          </label>
          <textarea
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập lý do cần chỉnh sửa (ví dụ: sai thông tin nhà cung cấp, thiếu hàng hóa...)"
            required
          />
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 flex items-center space-x-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <AlertTriangle size={16} />
            <span>{isSubmitting ? "Đang gửi..." : "Yêu cầu chỉnh sửa"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

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

  // Determine permissions based on UPDATED backend logic
  const isAdmin = user.role === "admin";
  const isManager = user.role === "manager";
  const isOwner = phieu.nguoi_tao === user.id;

  // LOGIC ĐÚNG: Quyền submit - chỉ chủ sở hữu và phiếu ở draft
  const canSubmit =
    isOwner && ["draft", "revision_required"].includes(phieu.trang_thai);

  // LOGIC ĐÚNG: Quyền edit - chỉ chủ sở hữu và phiếu ở draft hoặc revision_required
  const canEdit =
    isOwner && ["draft", "revision_required"].includes(phieu.trang_thai);

  // LOGIC ĐÚNG: Quyền approve
  // - Admin/Manager: chỉ approve khi KHÔNG phải điều chuyển ở trạng thái pending_level3_approval
  // - pending_level3_approval của điều chuyển: chỉ cấp 3 được duyệt (nút riêng)
  const canApprove =
    (isAdmin || isManager) &&
    ["confirmed", "pending_approval", "pending_level3_approval"].includes(
      phieu.trang_thai
    ) &&
    !(
      phieu.loai_phieu === "dieu_chuyen" &&
      phieu.trang_thai === "pending_level3_approval"
    );

  // LOGIC ĐÚNG: Quyền yêu cầu sửa - admin/manager với phiếu pending
  const canRequestRevision =
    (isAdmin || isManager) &&
    ["confirmed", "pending_approval", "pending_level3_approval"].includes(
      phieu.trang_thai
    );

  // LOGIC ĐÚNG: Quyền cancel - chủ sở hữu hoặc admin với phiếu chưa hoàn thành
  const canCancel =
    (isOwner || isAdmin) &&
    ["draft", "confirmed", "pending_approval", "revision_required"].includes(
      phieu.trang_thai
    );

  // LOGIC DUYỆT CẤP 3 cho điều chuyển
  const canLevel3Approve =
    user.role === "user" &&
    user.phong_ban?.cap_bac === 3 &&
    phieu.trang_thai === "pending_level3_approval" &&
    phieu.loai_phieu === "dieu_chuyen" &&
    // Cấp 3 bên NHẬN duyệt trên phiếu NHẬP: PN thuộc phòng ban của user
    phieu.phong_ban?.id === user.phong_ban_id;
  // Debug log để kiểm tra
  if (
    phieu.loai_phieu === "dieu_chuyen" &&
    phieu.trang_thai === "pending_level3_approval"
  ) {
    console.log(
      "🔍 Debug canLevel3Approve - canLevel3Approve:",
      canLevel3Approve
    );
    console.log(
      "🔍 Debug canLevel3Approve - condition1 (user.role === 'user'):",
      user.role === "user"
    );
    console.log(
      "🔍 Debug canLevel3Approve - condition2 (user.phong_ban?.cap_bac === 3):",
      user.phong_ban?.cap_bac === 3
    );
    console.log(
      "🔍 Debug canLevel3Approve - condition3 (phieu.trang_thai === 'pending_level3_approval'):",
      phieu.trang_thai === "pending_level3_approval"
    );
    console.log(
      "🔍 Debug canLevel3Approve - condition4 (phieu.loai_phieu === 'dieu_chuyen'):",
      phieu.loai_phieu === "dieu_chuyen"
    );
    console.log(
      "🔍 Debug canLevel3Approve - condition5 (phieu.phong_ban?.id === user.phong_ban_id):",
      phieu.phong_ban?.id === user.phong_ban_id
    );
    console.log(
      "🔍 Debug canLevel3Approve - phieuPhongBanId:",
      phieu.phong_ban?.id
    );
    console.log(
      "🔍 Debug canLevel3Approve - userPhongBanId:",
      user.phong_ban_id
    );
  }

  // FIX 1: Upload quyết định - CHỦ SỞ HỮU CŨNG CÓ THỂ UPLOAD
  const canUpload =
    (isAdmin || isManager || isOwner) &&
    ["approved", "completed"].includes(phieu.trang_thai);

  // FIX 2: Hoàn thành - CHỦ SỞ HỮU CŨNG CÓ THỂ HOÀN THÀNH
  const canComplete =
    (isAdmin || isManager || isOwner) && phieu.trang_thai === "approved";

  console.log("Debug permissions:", {
    phieuId: phieu.id,
    userRole: user.role,
    phieuStatus: phieu.trang_thai,
    isOwner,
    isAdmin,
    isManager,
    canUpload,
    canComplete,
  });

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
      label: isManager ? "Duyệt (Cấp 2)" : "Duyệt (Cấp 1)",
      icon: Check,
      color: "text-green-600 hover:text-green-800 hover:bg-green-50",
      show: canApprove,
    },
    {
      key: "level3_approve",
      label: "Duyệt điều chuyển",
      icon: Check,
      color: "text-purple-600 hover:text-purple-800 hover:bg-purple-50",
      show: canLevel3Approve,
    },
    {
      key: "request_revision",
      label: "Yêu cầu sửa",
      icon: MessageCircle,
      color: "text-orange-600 hover:text-orange-800 hover:bg-orange-50",
      show: canRequestRevision,
    },
    {
      key: "edit",
      label: "Sửa phiếu",
      icon: Edit,
      color: "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50",
      show: canEdit,
    },
    {
      key: "cancel",
      label: "Hủy phiếu",
      icon: X,
      color: "text-red-600 hover:text-red-800 hover:bg-red-50",
      show: canCancel,
    },
    {
      key: "upload",
      label: phieu.decision_pdf_url ? "Cập nhật QĐ" : "Upload quyết định",
      icon: Upload,
      color: "text-purple-600 hover:text-purple-800 hover:bg-purple-50",
      show: canUpload,
    },
    {
      key: "complete",
      label: "Hoàn thành",
      icon: CheckCircle,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: canComplete,
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
    <div
      className="relative inline-block"
      ref={dropdownRef}
      style={{ overflow: "visible" }}
    >
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
        title="Thao tác"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] ${
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

const NhapKho = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Khởi tạo activeTab từ URL
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get("tab");
    const validTabs = TAB_CONFIG.NHAP_KHO.map((tab) => tab.key);
    return tabParam && validTabs.includes(tabParam) ? tabParam : "tat_ca";
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [highlightId, setHighlightId] = useState(null);
  const [filters, setFilters] = useState({
    tu_ngay: "",
    den_ngay: "",
    loai_phieu: "",
    phong_ban_filter: user?.role === "admin" ? "all" : "own",
  });
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
  const [phongBanList, setPhongBanList] = useState([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completePhieuId, setCompletePhieuId] = useState(null);

  const phieuNhapList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  // Get tab configuration with status mapping
  const getTabStatusFilter = (tabKey) => {
    const tabConfig = TAB_CONFIG.NHAP_KHO.find((tab) => tab.key === tabKey);

    console.log("🔍 DEBUG getTabStatusFilter:", {
      tabKey,
      tabConfig,
      userRole: user.role,
      hasRoleFilter: !!tabConfig?.roleFilter,
      roleFilter: tabConfig?.roleFilter,
    });

    // Check roleFilter
    if (tabConfig?.roleFilter && !tabConfig.roleFilter.includes(user.role)) {
      console.log("🔍 DEBUG - User không có quyền xem tab này");
      return []; // User không có quyền xem tab này
    }

    const result = tabConfig?.status || [];
    console.log("🔍 DEBUG - getTabStatusFilter result:", result);
    return result;
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Build filters based on active tab
      const statusFilter = getTabStatusFilter(activeTab);

      console.log("🔍 DEBUG frontend fetchData:", {
        activeTab,
        statusFilter,
        statusFilterLength: statusFilter?.length,
      });

      const queryParams = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        sort_by: sortConfig.key,
        sort_direction: sortConfig.direction,
        ...filters,
      };

      // Add status filter if not "tat_ca"
      if (activeTab !== "tat_ca" && statusFilter.length > 0) {
        // Always pass array to service, let service handle the conversion
        queryParams.trang_thai = statusFilter;
      }

      console.log("🔍 DEBUG Fetching with params:", queryParams);

      const response = await nhapKhoService.getList(queryParams);
      setData(response);

      // Fetch counts for all tabs
      await fetchTabCounts();
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu phiếu nhập");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTabCounts = async () => {
    try {
      const counts = {};

      // Get counts for each tab
      for (const tab of TAB_CONFIG.NHAP_KHO) {
        if (tab.key === "tat_ca") {
          const response = await nhapKhoService.getList({
            page: 1,
            limit: 1,
            search: searchTerm,
            ...filters,
          });
          counts[tab.key] = response.data?.pagination?.total || 0;
        } else {
          // ✅ FIX: Xử lý array status đúng cách
          const queryParams = {
            page: 1,
            limit: 1,
            search: searchTerm,
            ...filters,
          };

          // Add status filter if tab has status
          if (tab.status && tab.status.length > 0) {
            if (tab.status.length === 1) {
              queryParams.trang_thai = tab.status[0];
            } else {
              // Multiple statuses - send as array
              queryParams.trang_thai = tab.status;
            }
          }

          const response = await nhapKhoService.getList(queryParams);
          counts[tab.key] = response.data?.pagination?.total || 0;
        }
      }

      setTabCounts(counts);
    } catch (error) {
      console.error("Error fetching tab counts:", error);
    }
  };

  const fetchPhongBanList = async () => {
    try {
      // Sử dụng đúng API endpoint từ backend
      const response = await nhapKhoService.getPhongBanList();
      if (response.success) {
        setPhongBanList(response.data);
      }
    } catch (error) {
      console.error("Error fetching phong ban list:", error);
    }
  };

  // Effect để xử lý URL parameters và highlighting
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get("tab");
    const highlightParam = urlParams.get("highlight");

    console.log("🔍 URL params:", { tabParam, highlightParam });
    console.log("🔍 Current location:", location.search);

    // ✅ Set active tab từ URL - QUAN TRỌNG: phải set trước khi load data
    if (tabParam && TAB_CONFIG.NHAP_KHO.some((tab) => tab.key === tabParam)) {
      console.log("✅ Setting active tab from URL:", tabParam);
      setActiveTab(tabParam);
    }

    // Xử lý highlight
    if (highlightParam) {
      const highlightIdNum = parseInt(highlightParam);
      setHighlightId(highlightIdNum);

      // Auto scroll và highlight sau khi data load
      setTimeout(() => {
        const element = document.getElementById(`phieu-${highlightIdNum}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("highlight-animation");
          setTimeout(() => {
            element.classList.remove("highlight-animation");
            setHighlightId(null);
          }, 3000);
        }
      }, 1000); // Tăng thời gian chờ từ 800ms lên 1000ms
    }
  }, [location.search]);

  useEffect(() => {
    console.log("📊 Loading data for tab:", activeTab);
    fetchData(); // FIX: Đổi từ loadData() thành fetchData()
  }, [activeTab, currentPage, searchTerm, filters, sortConfig]);

  useEffect(() => {
    // Reset to first page when changing tabs or filters
    setCurrentPage(1);
  }, [activeTab, searchTerm, filters, sortConfig, pageSize]);

  useEffect(() => {
    fetchData(); // FIX: Đổi từ loadData() thành fetchData()
  }, [currentPage, activeTab, searchTerm, filters, sortConfig]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPhongBanList();
    }
  }, [user]);

  // Function để update URL khi đổi tab
  const handleTabChange = (newTab) => {
    console.log("🔄 DEBUG - Changing tab from", activeTab, "to", newTab);

    // Debug: Kiểm tra status filter cho tab mới
    const newStatusFilter = getTabStatusFilter(newTab);
    console.log("🔄 DEBUG - New tab status filter:", {
      newTab,
      newStatusFilter,
      newStatusFilterLength: newStatusFilter?.length,
    });

    setActiveTab(newTab);
    setCurrentPage(1);

    // ✅ Update URL - QUAN TRỌNG: phải cập nhật URL đúng cách
    const params = new URLSearchParams(location.search);

    if (newTab === "tat_ca") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }

    // Xóa highlight khi đổi tab
    params.delete("highlight");

    const newSearch = params.toString();
    const newPath = newSearch
      ? `${location.pathname}?${newSearch}`
      : location.pathname;

    console.log("🔄 Updating URL to:", newPath);

    // ✅ Sử dụng navigate thay vì history.pushState để đảm bảo React Router cập nhật
    navigate(newPath, { replace: true });
  };

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

  // Handle submit với workflow chính xác
  const handleSubmit = async (id) => {
    if (window.confirm("Bạn có chắc muốn gửi phiếu này để duyệt?")) {
      try {
        await nhapKhoService.submit(id);
        toast.success("Đã gửi phiếu để duyệt");
        fetchData();
      } catch (error) {
        console.error("Error submitting:", error);
        toast.error(error.response?.data?.message || "Không thể gửi phiếu");
      }
    }
  };

  // Handle approve với workflow chính xác
  const handleApprove = async (id) => {
    //const phieu = phieuNhapList.find((p) => p.id === id);

    if (window.confirm("Bạn có chắc muốn duyệt phiếu nhập này?")) {
      try {
        // Chọn đúng API method dựa trên role và workflow
        if (user.role === "manager") {
          await nhapKhoService.managerApprove(id);
          toast.success("Duyệt phiếu thành công (Cấp 2)");
        } else if (user.role === "admin") {
          await nhapKhoService.approve(id);
          toast.success("Duyệt phiếu thành công (Cấp 1)");
        }
        fetchData();
      } catch (error) {
        console.error("Error approving:", error);
        toast.error(
          error.response?.data?.message || "Không thể duyệt phiếu nhập"
        );
      }
    }
  };

  // Handle cấp 3 duyệt điều chuyển
  const handleLevel3Approve = async (id) => {
    if (window.confirm("Bạn có chắc muốn duyệt phiếu điều chuyển này?")) {
      try {
        await nhapKhoService.level3Approve(id);
        toast.success("Duyệt phiếu điều chuyển thành công");
        fetchData();
      } catch (error) {
        console.error("Error level3 approving:", error);
        toast.error(
          error.response?.data?.message || "Không thể duyệt phiếu điều chuyển"
        );
      }
    }
  };

  const handleRequestRevision = async (ghiChu) => {
    try {
      await nhapKhoService.requestRevision(selectedPhieu.id, {
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
      emerald: "bg-emerald-100 text-emerald-800",
      purple: "bg-purple-100 text-purple-800",
      orange: "bg-orange-100 text-orange-800",
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
    setShowEditModal(false);
    setSelectedPhieu(null);
    setEditPhieuId(null);
    fetchData();
  };

  const handleFormCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedPhieu(null);
    setEditPhieuId(null);
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

  const handleComplete = (id) => {
    console.log("Opening complete modal for phieu:", id);
    setCompletePhieuId(id);
    setShowCompleteModal(true);
  };

  const handleCompleteSuccess = () => {
    console.log("Complete success, refreshing data");
    setShowCompleteModal(false);
    setCompletePhieuId(null);
    fetchData();
    toast.success("Hoàn thành phiếu nhập thành công!");
  };

  const handleCompleteCancel = () => {
    console.log("Complete cancelled");
    setShowCompleteModal(false);
    setCompletePhieuId(null);
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
    console.log("Action clicked:", actionKey, "for phieu:", phieuId);

    switch (actionKey) {
      case "view":
        handleViewDetail(phieuId);
        break;
      case "submit":
        handleSubmit(phieuId);
        break;
      case "approve":
        handleApprove(phieuId);
        break;
      case "level3_approve":
        handleLevel3Approve(phieuId);
        break;
      case "request_revision": {
        const phieu = phieuNhapList.find((p) => p.id === phieuId);
        setSelectedPhieu(phieu);
        setShowRevisionModal(true);
        break;
      }
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
        console.warn("Unknown action:", actionKey);
        break;
    }
  };

  const shouldShowPhongBanFilter =
    user?.role === "admin" || user?.role === "manager";
  const canCreatePhieu = user?.role === "user";

  return (
    <div className="space-y-4 pb-8">
      {/* FIX: Remove invalid jsx attribute and use regular CSS */}
      <style>
        {`
          .highlight-animation {
            background: linear-gradient(45deg, #fef3c7, #fed7aa);
            animation: highlightPulse 3s ease-in-out;
          }

          @keyframes highlightPulse {
            0%,
            100% {
              background-color: #fef3c7;
            }
            50% {
              background-color: #fcd34d;
            }
          }
        `}
      </style>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Quản lý nhập kho"
            subtitle="Quản lý các phiếu nhập hàng vào kho theo quy trình duyệt"
            Icon={ArrowDownToLine}
          />
          {canCreatePhieu && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors shadow-sm"
            >
              <Plus size={20} />
              <span>Tạo phiếu nhập</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {TAB_CONFIG.NHAP_KHO.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {tabCounts[tab.key] !== undefined && (
                    <span
                      className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                        activeTab === tab.key
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-500"
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                    placeholder="Tìm theo số phiếu, số QĐ hoặc nhà cung cấp..."
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                  placeholder="Đến ngày"
                />
              </div>

              {/* Type filter */}
              <div>
                <select
                  value={filters.loai_phieu}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      loai_phieu: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                >
                  <option value="">Tất cả loại</option>
                  {Object.entries(LOAI_PHIEU_NHAP).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department filter for admin */}
              {shouldShowPhongBanFilter && (
                <div>
                  <select
                    value={filters.phong_ban_filter}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        phong_ban_filter: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                  >
                    <option value="all">Tất cả phòng ban</option>
                    <option value="own">Phòng ban của tôi</option>
                    {phongBanList.map((pb) => (
                      <option key={pb.id} value={pb.id}>
                        {pb.ten_phong_ban} (Cấp {pb.cap_bac})
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                        onClick={() => handleSort("ngay_nhap")}
                      >
                        Ngày nhập {getSortIcon("ngay_nhap")}
                      </th>
                      <th className="w-[120px] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại phiếu
                      </th>
                      <th className="w-[250px] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhà cung cấp
                      </th>
                      {shouldShowPhongBanFilter && (
                        <th className="w-[150px] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phòng ban
                        </th>
                      )}
                      <th
                        className="w-[120px] px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("tong_tien")}
                      >
                        Tổng tiền {getSortIcon("tong_tien")}
                      </th>
                      <th className="w-[100px] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="w-[60px] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        QĐ
                      </th>
                      <th className="w-[100px] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {phieuNhapList.map((phieu) => {
                      const isHighlighted = highlightId === phieu.id;

                      return (
                        <tr
                          key={phieu.id}
                          id={`phieu-${phieu.id}`}
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
                              {formatDate(phieu.ngay_nhap)}
                            </div>
                            {phieu.nguoi_nhap_hang && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <User size={12} className="mr-1" />
                                <span className="truncate">
                                  {phieu.nguoi_nhap_hang}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {LOAI_PHIEU_NHAP[phieu.loai_phieu]}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <div className="text-sm text-gray-900 truncate">
                              {phieu.nha_cung_cap?.ten_ncc || "Chưa có"}
                            </div>
                            {phieu.nha_cung_cap?.ma_so_thue && (
                              <div className="text-xs text-gray-500 truncate">
                                MST: {phieu.nha_cung_cap.ma_so_thue}
                              </div>
                            )}
                          </td>
                          {shouldShowPhongBanFilter && (
                            <td className="px-3 py-4">
                              <div className="text-sm text-gray-900 flex items-center">
                                <Building
                                  size={14}
                                  className="mr-2 text-gray-400 flex-shrink-0"
                                />
                                <span className="truncate">
                                  {phieu.ten_phong_ban || "N/A"}
                                </span>
                              </div>
                            </td>
                          )}
                          <td className="px-3 py-4 text-right">
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(phieu.tong_tien)}
                            </div>
                            {phieu.so_hoa_don && (
                              <div className="text-xs text-gray-500">
                                HĐ: {phieu.so_hoa_don}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span
                              className={getTrangThaiColor(phieu.trang_thai)}
                            >
                              {TRANG_THAI_PHIEU[phieu.trang_thai]?.label}
                            </span>
                            {phieu.trang_thai === "revision_required" &&
                              phieu.ghi_chu_phan_hoi && (
                                <div
                                  className="text-xs text-orange-600 mt-1 truncate"
                                  title={phieu.ghi_chu_phan_hoi}
                                >
                                  Có yêu cầu sửa
                                </div>
                              )}
                          </td>
                          <td className="px-3 py-4 text-center">
                            {phieu.decision_pdf_url ? (
                              <button
                                onClick={() => handleDownloadDecision(phieu.id)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                                title="Tải quyết định"
                              >
                                <FileDown size={16} />
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-center">
                            <ActionDropdown
                              phieu={phieu}
                              user={user}
                              onAction={handleActionClick}
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
                {phieuNhapList.map((phieu) => (
                  <div key={phieu.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {phieu.so_phieu}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(phieu.ngay_nhap)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={getTrangThaiColor(phieu.trang_thai)}>
                          {TRANG_THAI_PHIEU[phieu.trang_thai]?.label}
                        </span>
                        <ActionDropdown
                          phieu={phieu}
                          user={user}
                          onAction={handleActionClick}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Loại:</span>
                        <span className="text-xs font-medium">
                          {LOAI_PHIEU_NHAP[phieu.loai_phieu]}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">NCC:</span>
                        <span className="text-xs font-medium">
                          {phieu.nha_cung_cap?.ten_ncc || "Chưa có"}
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

              {phieuNhapList.length === 0 && (
                <div className="text-center py-12">
                  <ArrowDownToLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không có dữ liệu
                  </h3>
                  <p className="text-sm text-gray-500">
                    {activeTab === "tat_ca"
                      ? "Chưa có phiếu nhập nào được tạo."
                      : `Không có phiếu nhập nào ở trạng thái "${
                          TAB_CONFIG.NHAP_KHO.find((t) => t.key === activeTab)
                            ?.label
                        }".`}
                  </p>
                </div>
              )}

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
                    className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo phiếu nhập kho"
        size="xl"
      >
        <CreateNhapKhoForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Chi tiết phiếu nhập: ${selectedPhieu?.so_phieu || ""}`}
        size="full"
      >
        {selectedPhieu && <PhieuNhapDetail phieu={selectedPhieu} />}
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Sửa phiếu nhập: ${selectedPhieu?.so_phieu || ""}`}
        size="xl"
      >
        {editPhieuId && (
          <EditNhapKhoForm
            phieuId={editPhieuId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </Modal>

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

      <RevisionRequestModal
        isOpen={showRevisionModal}
        onClose={() => {
          setShowRevisionModal(false);
          setSelectedPhieu(null);
        }}
        onSubmit={handleRequestRevision}
        phieu={selectedPhieu}
      />

      {showCompleteModal && completePhieuId && (
        <Modal
          isOpen={showCompleteModal}
          onClose={handleCompleteCancel}
          title="Hoàn thành phiếu nhập"
          size="6xl"
        >
          <CompletePhieuNhapForm
            phieuId={completePhieuId}
            onSuccess={handleCompleteSuccess}
            onCancel={handleCompleteCancel}
          />
        </Modal>
      )}
    </div>
  );
};

export default NhapKho;
