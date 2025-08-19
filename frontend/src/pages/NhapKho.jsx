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
  MoreVertical,
  Send,
  AlertTriangle,
  RefreshCw,
  Building,
  Link2,
  Info,
  Filter,
  ChevronDown, // ✅ Thêm icon ChevronDown
} from "lucide-react";
import { nhapKhoService } from "../services/nhapKhoService";
import { formatCurrency, formatDate } from "../utils/helpers";
import {
  TRANG_THAI_PHIEU,
  LOAI_PHIEU_NHAP,
  getActionPermissions,
} from "../utils/constants";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import CreateNhapKhoForm from "../components/forms/CreateNhapKhoForm";
import EditNhapKhoForm from "../components/forms/EditNhapKhoForm";
import Loading from "../components/common/Loading";
import PrintPhieuForm from "../components/forms/PrintPhieuForm";
import PhieuNhapDetail from "../components/details/PhieuNhapDetail";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

// Tab configuration based on user role and status
const TAB_CONFIG = {
  "tat-ca": {
    label: "Tất cả",
    filter: {},
    color: "text-gray-600 border-gray-300",
    activeColor: "text-blue-600 border-blue-500 bg-blue-50",
  },
  "cho-duyet": {
    label: "Chờ duyệt",
    filter: { trang_thai: "confirmed" },
    color: "text-orange-600 border-orange-300",
    activeColor: "text-orange-600 border-orange-500 bg-orange-50",
  },
  "da-duyet": {
    label: "Đã duyệt",
    filter: { trang_thai: "approved" },
    color: "text-green-600 border-green-300",
    activeColor: "text-green-600 border-green-500 bg-green-50",
  },
  "can-sua": {
    label: "Cần sửa",
    filter: { trang_thai: "revision_required" },
    color: "text-yellow-600 border-yellow-300",
    activeColor: "text-yellow-600 border-yellow-500 bg-yellow-50",
  },
  "hoan-thanh": {
    label: "Hoàn thành",
    filter: { trang_thai: "completed" },
    color: "text-green-600 border-green-300",
    activeColor: "text-green-600 border-green-500 bg-green-50",
  },
  "da-huy": {
    label: "Đã hủy",
    filter: { trang_thai: "cancelled" },
    color: "text-red-600 border-red-300",
    activeColor: "text-red-600 border-red-500 bg-red-50",
  },
};

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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Nhập lý do cần chỉnh sửa phiếu nhập..."
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !ghiChu.trim()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Component Dropdown Actions
const ActionDropdown = ({ phieu, onAction, userRole }) => {
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

  const permissions = getActionPermissions(phieu.trang_thai, userRole);

  const actions = [
    {
      key: "view",
      label: "Xem chi tiết",
      icon: Eye,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: permissions.canView,
    },
    {
      key: "edit",
      label: "Sửa phiếu",
      icon: Edit,
      color: "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50",
      show: permissions.canEdit,
    },
    {
      key: "edit-actual",
      label: "Sửa số lượng thực tế",
      icon: Edit,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: permissions.canEditActual,
    },
    {
      key: "submit",
      label: "Gửi duyệt",
      icon: Send,
      color: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      show: permissions.canSubmit,
    },
    {
      key: "approve",
      label: "Duyệt phiếu",
      icon: Check,
      color: "text-green-600 hover:text-green-800 hover:bg-green-50",
      show: permissions.canApprove,
    },
    {
      key: "request-revision",
      label: "Yêu cầu sửa",
      icon: AlertTriangle,
      color: "text-orange-600 hover:text-orange-800 hover:bg-orange-50",
      show: permissions.canRequestRevision,
    },
    {
      key: "upload",
      label: "Upload quyết định",
      icon: Upload,
      color: "text-purple-600 hover:text-purple-800 hover:bg-purple-50",
      show: permissions.canUploadDecision,
    },
    {
      key: "complete",
      label: "Hoàn thành",
      icon: CheckCircle,
      color: "text-green-600 hover:text-green-800 hover:bg-green-50",
      show: permissions.canComplete,
    },
    {
      key: "cancel",
      label: "Hủy phiếu",
      icon: X,
      color: "text-red-600 hover:text-red-800 hover:bg-red-50",
      show: permissions.canCancel,
    },
    {
      key: "print",
      label: "In phiếu",
      icon: FileText,
      color: "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
      show: permissions.canPrint,
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
  const { user } = useAuth();
  const userRole = user?.role || "user";
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("tat-ca");
  const [highlightPhieuId, setHighlightPhieuId] = useState(null);
  const [filters, setFilters] = useState({
    tu_ngay: "",
    den_ngay: "",
    loai_phieu: "",
    phong_ban_filter: "own", // ✅ Mặc định là "own" (phòng ban của mình)
  });
  const [sortConfig, setSortConfig] = useState({
    key: "ngay_nhap",
    direction: "desc",
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showEditActualModal, setShowEditActualModal] = useState(false);

  // Data states
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [editPhieuId, setEditPhieuId] = useState(null);
  const [printPhieuId, setPrintPhieuId] = useState(null);
  const [editActualPhieuId, setEditActualPhieuId] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabCounts, setTabCounts] = useState({});

  // ✅ SỬA: State cho danh sách phòng ban - dùng chung logic như HangHoa
  const [phongBanList, setPhongBanList] = useState([]);
  const [isLoadingPhongBan, setIsLoadingPhongBan] = useState(false);

  const phieuNhapList = data?.data?.items || [];
  const pagination = data?.data?.pagination || {};

  // ✅ SỬA: Logic kiểm tra quyền giống như HangHoa
  const isAdminCap1 = userRole === "admin" && user?.phong_ban?.cap_bac === 1;
  const isCap2 = user?.phong_ban?.cap_bac === 2;
  const shouldShowDropdown = isAdminCap1 || isCap2;

  // Handle URL parameters for notification routing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    const highlight = urlParams.get("highlight");

    if (tab && TAB_CONFIG[tab]) {
      setActiveTab(tab);
    }

    if (highlight) {
      setHighlightPhieuId(parseInt(highlight));
      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightPhieuId(null), 3000);
    }
  }, []);

  // Filter available tabs based on user role
  const availableTabs = Object.entries(TAB_CONFIG).filter(([, config]) => {
    if (config.adminOnly && userRole !== "admin") {
      return false;
    }
    return true;
  });

  // ✅ SỬA: Fetch danh sách phòng ban - dùng chung logic như HangHoa
  const fetchPhongBanList = async () => {
    if (!shouldShowDropdown) {
      console.log("⌛ Không cần fetch phòng ban list");
      return;
    }

    try {
      setIsLoadingPhongBan(true);
      console.log("🔄 Fetching phong ban list...");

      const response = await nhapKhoService.getPhongBanList();
      console.log("✅ Phong ban list response:", response);

      setPhongBanList(response.data || []);
    } catch (error) {
      console.error("⌛ Error fetching phong ban list:", error);
      setPhongBanList([]);
    } finally {
      setIsLoadingPhongBan(false);
    }
  };

  // ✅ SỬA: Logic lấy tên phòng ban được chọn - giống như HangHoa
  const getSelectedPhongBanName = () => {
    if (filters.phong_ban_filter === "own") {
      if (isAdminCap1) {
        return "BTL Vùng (Cấp 1) - Tồn kho của mình";
      } else if (isCap2) {
        return `${
          user?.phong_ban?.ten_phong_ban || "Phòng ban hiện tại"
        } (Cấp 2) - Tồn kho của mình`;
      } else {
        return `${
          user?.phong_ban?.ten_phong_ban || "Đơn vị hiện tại"
        } (Cấp 3) - Tồn kho của mình`;
      }
    }

    if (filters.phong_ban_filter === "all") {
      if (isAdminCap1) return "Tất cả phòng ban";
      if (isCap2) return "Phòng ban quản lý + cấp 3";
      return "Tất cả";
    }

    const selectedPB = availablePhongBan.find(
      (pb) => pb.id.toString() === filters.phong_ban_filter
    );
    return selectedPB
      ? `${selectedPB.ten_phong_ban} (Cấp ${selectedPB.cap_bac}) - Đang xem phiếu`
      : "Không xác định";
  };

  // ✅ SỬA: Logic lọc phòng ban có sẵn - giống như HangHoa
  const getAvailablePhongBan = () => {
    if (isAdminCap1) {
      // Admin xem được tất cả cấp 2 và 3
      return phongBanList.filter((pb) => pb.cap_bac === 2 || pb.cap_bac === 3);
    } else if (isCap2) {
      // Manager chỉ xem được cấp 3 dưới quyền
      return phongBanList.filter(
        (pb) => pb.cap_bac === 3 && pb.phong_ban_cha_id === user.phong_ban_id
      );
    }
    return [];
  };

  const availablePhongBan = getAvailablePhongBan();

  useEffect(() => {
    console.log("🔋 UseEffect - shouldShowDropdown:", shouldShowDropdown);
    fetchPhongBanList();
  }, [shouldShowDropdown]);

  // Debug log
  useEffect(() => {
    console.log("🟢 NhapKho Debug:", {
      userRole,
      user_cap_bac: user?.phong_ban?.cap_bac,
      isAdminCap1,
      isCap2,
      shouldShowDropdown,
      phong_ban_filter: filters.phong_ban_filter,
      phongBanListLength: phongBanList.length,
      availablePhongBanLength: availablePhongBan.length,
    });
  }, [
    userRole,
    isAdminCap1,
    isCap2,
    filters.phong_ban_filter,
    phongBanList,
    availablePhongBan,
  ]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Combine tab filter with other filters
      const tabFilter = TAB_CONFIG[activeTab]?.filter || {};

      const response = await nhapKhoService.getList({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        sort_by: sortConfig.key,
        sort_direction: sortConfig.direction,
        ...filters,
        ...tabFilter,
      });
      setData(response);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu phiếu nhập");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tab counts for badge display
  const fetchTabCounts = async () => {
    try {
      const counts = {};
      for (const [tabKey, tabConfig] of availableTabs) {
        if (tabKey === "tat-ca") continue; // Skip all tab

        const response = await nhapKhoService.getList({
          page: 1,
          limit: 1,
          ...tabConfig.filter,
          phong_ban_filter: filters.phong_ban_filter, // ✅ Thêm filter phòng ban vào count
        });
        counts[tabKey] = response.data?.pagination?.total || 0;
      }
      setTabCounts(counts);
    } catch (error) {
      console.error("Error fetching tab counts:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, filters, sortConfig, activeTab]);

  useEffect(() => {
    fetchTabCounts();
  }, [filters.phong_ban_filter]); // Thêm dependency cho filter phòng ban

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set("tab", tabKey);
    window.history.replaceState({}, "", url);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
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
      orange: "bg-orange-100 text-orange-800",
      red: "bg-red-100 text-red-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
  };

  // Hiển thị thông tin nguồn cung cấp theo loại phiếu với icon cấp bậc
  const renderNguonCungCap = (phieu) => {
    if (phieu.loai_phieu === "tu_mua") {
      return (
        <div className="flex items-center space-x-1">
          <div
            className="w-2 h-2 bg-blue-500 rounded-full"
            title="Nhà cung cấp bên ngoài"
          ></div>
          <span>{phieu.nha_cung_cap?.ten_ncc || "Chưa có"}</span>
        </div>
      );
    } else if (
      phieu.loai_phieu === "tren_cap" ||
      phieu.loai_phieu === "dieu_chuyen"
    ) {
      return phieu.phong_ban_cung_cap ? (
        <div className="flex items-center space-x-1">
          <Building size={12} className="text-blue-500" />
          <span>{phieu.phong_ban_cung_cap.ten_phong_ban}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
            Cấp {phieu.phong_ban_cung_cap.cap_bac}
          </span>
        </div>
      ) : (
        "Chưa có"
      );
    }
    return "Chưa có";
  };

  // Hiển thị thông tin phiếu liên kết (nếu có)
  const renderPhieuLienKet = (phieu) => {
    if (phieu.phieu_xuat_lien_ket_id) {
      return (
        <div className="flex items-center space-x-1 text-xs text-blue-600">
          <Link2 size={12} />
          <span
            title={`Phiếu xuất liên kết: ${
              phieu.phieu_xuat_lien_ket?.so_phieu ||
              phieu.phieu_xuat_lien_ket_id
            }`}
          >
            Có phiếu xuất liên kết
          </span>
        </div>
      );
    }
    return null;
  };

  // Action handlers
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

  const handleSubmit = async (id) => {
    if (window.confirm("Bạn có chắc muốn gửi phiếu nhập này để duyệt?")) {
      try {
        await nhapKhoService.submit(id);
        toast.success("Gửi phiếu nhập thành công");
        fetchData();
        fetchTabCounts();
      } catch (error) {
        console.error("Error submitting:", error);
        toast.error(
          error.response?.data?.message || "Không thể gửi phiếu nhập"
        );
      }
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm("Bạn có chắc muốn duyệt phiếu nhập này?")) {
      try {
        await nhapKhoService.approve(id);
        toast.success(
          "Duyệt phiếu nhập thành công. Hệ thống sẽ tự động tạo phiếu xuất liên kết nếu cần."
        );
        fetchData();
        fetchTabCounts();
      } catch (error) {
        console.error("Error approving:", error);
        toast.error("Không thể duyệt phiếu nhập");
      }
    }
  };

  const handleRequestRevision = async (id) => {
    try {
      const response = await nhapKhoService.getDetail(id);
      setSelectedPhieu(response.data);
      setShowRevisionModal(true);
    } catch (error) {
      console.error("Error fetching detail:", error);
      toast.error("Không thể tải thông tin phiếu");
    }
  };

  const handleRevisionSubmit = async (ghiChu) => {
    try {
      await nhapKhoService.requestRevision(selectedPhieu.id, {
        ghi_chu_phan_hoi: ghiChu,
      });
      toast.success("Đã gửi yêu cầu chỉnh sửa");
      fetchData();
      fetchTabCounts();
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast.error("Không thể gửi yêu cầu chỉnh sửa");
      throw error;
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Bạn có chắc muốn hủy phiếu nhập này?")) {
      try {
        await nhapKhoService.cancel(id);
        toast.success("Hủy phiếu nhập thành công");
        fetchData();
        fetchTabCounts();
      } catch (error) {
        console.error("Error canceling:", error);
        toast.error("Không thể hủy phiếu nhập");
      }
    }
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
        fetchTabCounts();
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
    if (
      window.confirm(
        "Bạn có chắc muốn hoàn thành phiếu nhập này? Tồn kho sẽ được cập nhật theo số lượng thực nhận."
      )
    ) {
      try {
        await nhapKhoService.complete(id);
        toast.success(
          "Hoàn thành phiếu nhập thành công. Hệ thống đã tự động cập nhật tồn kho và tạo phiếu xuất liên kết nếu cần."
        );
        fetchData();
        fetchTabCounts();
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

  const handleEditActualQuantity = async (id) => {
    setEditActualPhieuId(id);
    setShowEditActualModal(true);
  };

  // Handler cho dropdown actions
  const handleActionClick = (actionKey, phieuId) => {
    switch (actionKey) {
      case "view":
        handleViewDetail(phieuId);
        break;
      case "edit":
        handleEditPhieu(phieuId);
        break;
      case "submit":
        handleSubmit(phieuId);
        break;
      case "approve":
        handleApprove(phieuId);
        break;
      case "request-revision":
        handleRequestRevision(phieuId);
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
      case "print":
        handlePrintPhieu(phieuId);
        break;
      case "edit-actual":
        handleEditActualQuantity(phieuId);
        break;
      default:
        break;
    }
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowPrintModal(false);
    setShowEditActualModal(false);
    setSelectedPhieu(null);
    setEditPhieuId(null);
    setPrintPhieuId(null);
    setEditActualPhieuId(null);
    fetchData();
    fetchTabCounts();
  };

  const handleFormCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowPrintModal(false);
    setShowEditActualModal(false);
    setSelectedPhieu(null);
    setEditPhieuId(null);
    setPrintPhieuId(null);
    setEditActualPhieuId(null);
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
            Quản lý các phiếu nhập hàng vào kho theo cấu trúc 3 cấp
            {userRole !== "admin" && (
              <span className="ml-2 text-blue-600">
                • Phòng ban: {user?.phong_ban?.ten_phong_ban || "Chưa xác định"}
                {user?.phong_ban?.cap_bac && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    Cấp {user?.phong_ban?.cap_bac}
                  </span>
                )}
              </span>
            )}
            {/* ✅ Hiển thị phòng ban đang được chọn lọc */}
            {shouldShowDropdown && (
              <span className="ml-2 text-green-600">
                • Đang xem: {getSelectedPhongBanName()}
              </span>
            )}
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

      {/* ✅ SỬA: Selector phòng ban cho admin/manager - giống như HangHoa */}
      {shouldShowDropdown && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Đang xem phiếu nhập của:
                </h3>
                <div className="text-lg font-bold text-blue-900">
                  {getSelectedPhongBanName()}
                </div>
              </div>
            </div>

            {availablePhongBan.length > 0 && (
              <div className="relative">
                <select
                  value={filters.phong_ban_filter}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      phong_ban_filter: e.target.value,
                    }))
                  }
                  disabled={isLoadingPhongBan}
                  className="appearance-none bg-white border border-blue-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[200px]"
                >
                  <option value="own">
                    {isAdminCap1
                      ? "BTL Vùng (Cấp 1) - Phiếu nhập của mình"
                      : `${user?.phong_ban?.ten_phong_ban} (Cấp ${user?.phong_ban?.cap_bac}) - Phiếu nhập của mình`}
                  </option>
                  <option value="all">
                    {isAdminCap1 ? "Tất cả phòng ban" : "Tất cả (mình + cấp 3)"}
                  </option>
                  {availablePhongBan.map((phongBan) => (
                    <option key={phongBan.id} value={phongBan.id}>
                      {phongBan.ten_phong_ban} (Cấp {phongBan.cap_bac}) - Xem
                      phiếu nhập
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          {filters.phong_ban_filter !== "own" && (
            <div className="mt-3 text-sm text-blue-700 bg-blue-100 rounded-lg p-2">
              <Info className="h-4 w-4 inline mr-1" />
              Đang hiển thị PHIẾU NHẬP từ góc nhìn của đơn vị được chọn
            </div>
          )}
        </div>
      )}

      {/* Workflow Info Banner */}
      {userRole !== "admin" && user?.phong_ban?.cap_bac && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Quy trình 3 cấp:</p>
              <ul className="text-xs space-y-1">
                <li>• Cấp 3 (Đơn vị tác nghiệp) → gửi yêu cầu lên Cấp 2</li>
                <li>
                  • Cấp 2 (Phòng ban/Ban chuyên môn) → gửi yêu cầu lên Cấp 1
                </li>
                <li>• Cấp 1 (BTL Vùng) → phê duyệt cuối cùng</li>
                <li>
                  • Hệ thống tự động tạo phiếu xuất liên kết khi phiếu nhập từ
                  cấp trên được duyệt
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {availableTabs.map(([tabKey, tabConfig]) => {
            const isActive = activeTab === tabKey;
            const count = tabCounts[tabKey];

            return (
              <button
                key={tabKey}
                onClick={() => handleTabChange(tabKey)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? tabConfig.activeColor
                    : `${tabConfig.color} hover:border-gray-300`
                }`}
              >
                <span>{tabConfig.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      isActive
                        ? "bg-white text-gray-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
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
                placeholder="Tìm theo số quyết định, nhà cung cấp hoặc đơn vị cung cấp..."
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

          <div className="flex items-end">
            <button
              onClick={() => {
                fetchData();
                fetchTabCounts();
              }}
              className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors text-sm"
            >
              <RefreshCw size={16} />
              <span>Làm mới</span>
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
              <table className="w-full min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("so_quyet_dinh")}
                    >
                      Số QĐ {getSortIcon("so_quyet_dinh")}
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
                      Nguồn cung cấp
                    </th>
                    {/* ✅ Hiển thị cột phòng ban khi admin/cấp 2 xem tất cả */}
                    {shouldShowDropdown &&
                      filters.phong_ban_filter === "all" && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Phòng ban
                        </th>
                      )}
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
                      className={`hover:bg-gray-50 transition-colors ${
                        highlightPhieuId === phieu.id
                          ? "bg-yellow-50 ring-2 ring-yellow-400"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {phieu.so_quyet_dinh || "Chưa có"}
                        </div>
                        {renderPhieuLienKet(phieu)}
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
                          {renderNguonCungCap(phieu)}
                        </div>
                      </td>
                      {/* ✅ Hiển thị cột phòng ban khi admin/cấp 2 xem tất cả */}
                      {shouldShowDropdown &&
                        filters.phong_ban_filter === "all" && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center space-x-1">
                                <Building size={12} className="text-gray-500" />
                                <span>
                                  {phieu.ten_phong_ban || "Không xác định"}
                                </span>
                              </div>
                            </div>
                          </td>
                        )}
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
                        <div className="flex flex-col items-center space-y-1">
                          <span className={getTrangThaiColor(phieu.trang_thai)}>
                            {TRANG_THAI_PHIEU[phieu.trang_thai]?.label}
                          </span>
                          {phieu.ghi_chu_phan_hoi &&
                            phieu.trang_thai === "revision_required" && (
                              <span
                                className="text-xs text-orange-600 cursor-help"
                                title={phieu.ghi_chu_phan_hoi}
                              >
                                💬
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <ActionDropdown
                          phieu={phieu}
                          onAction={handleActionClick}
                          userRole={userRole}
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
                  Chưa có phiếu nhập nào được tạo trong tab này.
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
        size="xl"
      >
        {selectedPhieu && <PhieuNhapDetail phieu={selectedPhieu} />}
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Sửa phiếu nhập: ${selectedPhieu?.so_phieu || "Loading..."}`}
        size="xl"
      >
        {editPhieuId && (
          <EditNhapKhoForm
            mode="edit"
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
        onClose={() => setShowRevisionModal(false)}
        onSubmit={handleRevisionSubmit}
        phieu={selectedPhieu}
      />

      <Modal
        isOpen={showEditActualModal}
        onClose={() => setShowEditActualModal(false)}
        title="Chỉnh sửa số lượng thực tế"
        size="xl"
      >
        {editActualPhieuId && (
          <EditNhapKhoForm
            mode="edit-actual"
            phieuId={editActualPhieuId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </Modal>
    </div>
  );
};

export default NhapKho;
