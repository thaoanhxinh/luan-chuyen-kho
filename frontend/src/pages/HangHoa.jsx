import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  BarChart3,
  DollarSign,
  AlertTriangle,
  Building,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react";
import { hangHoaService } from "../services/hangHoaService";
import { formatCurrency } from "../utils/helpers";
import Pagination from "../components/common/Pagination";
import PageHeader from "../components/common/PageHeader";
import Loading from "../components/common/Loading";
import HangHoaDetailModal from "../components/details/HangHoaDetailModal";
import EditHangHoaModal from "../components/forms/EditHangHoaModal";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const HangHoa = () => {
  const { user } = useAuth();

  // States cơ bản
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHangHoaId, setSelectedHangHoaId] = useState(null);
  const [selectedPhongBanId, setSelectedPhongBanId] = useState(null);

  // Filter states cho Manager và Admin
  const [userRole, setUserRole] = useState(user?.role || "");
  const [departmentFilters, setDepartmentFilters] = useState({
    cap2List: [],
    cap3List: [],
    selectedCap2: "",
    selectedCap3: "",
  });

  // View mode states - chỉ sử dụng aggregated view
  const [expandedItems, setExpandedItems] = useState(new Set());

  const hangHoaList = React.useMemo(
    () => data?.data?.items || [],
    [data?.data?.items]
  );
  const pagination = React.useMemo(
    () => data?.data?.pagination || {},
    [data?.data?.pagination]
  );

  // Load department filters cho Manager và Admin
  useEffect(() => {
    const loadDepartmentFilters = async () => {
      try {
        if (userRole === "manager" || userRole === "admin") {
          const response = await hangHoaService.getPhongBanForFilter();
          const departments = response.data;

          const cap2List = departments.filter((d) => d.cap_bac === 2);
          const cap3List = departments.filter((d) => d.cap_bac === 3);

          setDepartmentFilters({
            cap2List,
            cap3List,
            selectedCap2: "",
            selectedCap3: "",
          });
        }
      } catch (error) {
        console.error("Error loading department filters:", error);
      }
    };

    if (userRole) {
      loadDepartmentFilters();
    }
  }, [userRole]);

  // Fetch data với filters
  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);

      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
      };

      // Thêm department filters
      if (userRole === "manager" && departmentFilters.selectedCap3) {
        params.cap3_id = departmentFilters.selectedCap3;
      } else if (userRole === "admin") {
        if (departmentFilters.selectedCap2) {
          params.cap2_id = departmentFilters.selectedCap2;
        }
        if (departmentFilters.selectedCap3) {
          params.cap3_id = departmentFilters.selectedCap3;
        }
      }

      const response = await hangHoaService.getList(params);
      setData(response);

      // Set user role từ response (lần đầu)
      if (response.data?.user_role && !userRole) {
        setUserRole(response.data.user_role);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu hàng hóa");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    searchTerm,
    departmentFilters.selectedCap2,
    departmentFilters.selectedCap3,
    userRole,
    pageSize,
  ]);

  useEffect(() => {
    fetchData();
  }, [
    currentPage,
    searchTerm,
    departmentFilters.selectedCap2,
    departmentFilters.selectedCap3,
    pageSize,
    fetchData,
  ]);

  // Handlers cho department filters
  const handleCap2Change = (cap2Id) => {
    setDepartmentFilters((prev) => ({
      ...prev,
      selectedCap2: cap2Id,
      selectedCap3: "", // Reset cấp 3 khi thay đổi cấp 2
    }));
    setCurrentPage(1); // Reset về trang 1
  };

  const handleCap3Change = (cap3Id) => {
    setDepartmentFilters((prev) => ({
      ...prev,
      selectedCap3: cap3Id,
    }));
    setCurrentPage(1); // Reset về trang 1
  };

  // Handler xem chi tiết
  const handleViewDetail = (hangHoa, phongBanId = null) => {
    setSelectedHangHoaId(hangHoa.id);
    setSelectedPhongBanId(phongBanId || hangHoa.phong_ban_id);
    setShowDetailModal(true);
  };

  const handleEditHangHoa = (hangHoaId) => {
    setSelectedHangHoaId(hangHoaId);
    setShowEditModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedHangHoaId(null);
    setSelectedPhongBanId(null);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setSelectedHangHoaId(null);
  };

  const handleEditSuccess = () => {
    fetchData();
  };

  const handleDeleteHangHoa = async (hangHoaId, tenHangHoa) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa hàng hóa "${tenHangHoa}"?\n\nLưu ý: Chỉ có thể xóa hàng hóa chưa có giao dịch và không còn tồn kho.`
      )
    ) {
      return;
    }

    try {
      const loadingToast = toast.loading("Đang xóa hàng hóa...");
      await hangHoaService.delete(hangHoaId);
      toast.dismiss(loadingToast);
      toast.success("Xóa hàng hóa thành công!");
      fetchData();
    } catch (error) {
      console.error("Error deleting hang hoa:", error);
      const errorMessage =
        error.response?.data?.message || "Không thể xóa hàng hóa";
      toast.error(errorMessage);
    }
  };

  // Helper functions
  const getInventoryStatusColor = (soLuongTon) => {
    if (!soLuongTon || soLuongTon === 0) return "text-red-600";
    if (soLuongTon < 10) return "text-yellow-600";
    return "text-green-600";
  };

  const getInventoryStatusBadge = (soLuongTon) => {
    if (!soLuongTon || soLuongTon === 0) return "bg-red-100 text-red-800";
    if (soLuongTon < 10) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getInventoryStatusText = (soLuongTon) => {
    if (!soLuongTon || soLuongTon === 0) return "Hết hàng";
    if (soLuongTon < 10) return "Sắp hết";
    return "Còn hàng";
  };

  const formatInteger = (value) => {
    if (!value) return "0";
    return Math.floor(value).toLocaleString();
  };

  const calculateStats = () => {
    const total = hangHoaList.length;
    const inStock = hangHoaList.filter((h) => h.so_luong_ton > 0).length;
    const lowStock = hangHoaList.filter(
      (h) => h.so_luong_ton > 0 && h.so_luong_ton < 10
    ).length;
    const outOfStock = hangHoaList.filter(
      (h) => !h.so_luong_ton || h.so_luong_ton === 0
    ).length;
    const totalValue = hangHoaList.reduce((sum, h) => {
      const giaTriTon = parseFloat(h.gia_tri_ton) || 0;
      return sum + giaTriTon;
    }, 0);

    return { total, inStock, lowStock, outOfStock, totalValue };
  };

  // Determine if viewing aggregated (multi-department) list
  const isAggregatedView =
    (userRole === "admin" || userRole === "manager") &&
    !departmentFilters.selectedCap3;

  // Aggregate items by hang_hoa id when viewing across departments
  const aggregatedList = React.useMemo(() => {
    if (!isAggregatedView) return hangHoaList;

    const map = new Map();
    for (const item of hangHoaList) {
      const key = item.id;
      if (!map.has(key)) {
        map.set(key, {
          ...item,
          phong_ban_id: null,
          ten_phong_ban: null,
          so_luong_ton: 0,
          gia_tri_ton: 0,
          don_gia_binh_quan: 0,
          departments: [],
        });
      }
      const acc = map.get(key);
      acc.so_luong_ton += Number(item.so_luong_ton || 0);
      acc.gia_tri_ton += Number(item.gia_tri_ton || 0);
      acc.departments.push({
        phong_ban_id: item.phong_ban_id,
        ten_phong_ban: item.ten_phong_ban,
        so_luong_ton: item.so_luong_ton,
        gia_tri_ton: item.gia_tri_ton,
      });
    }

    // Compute weighted average price if possible
    for (const acc of map.values()) {
      acc.don_gia_binh_quan = acc.so_luong_ton
        ? Math.round(acc.gia_tri_ton / acc.so_luong_ton)
        : 0;
    }

    return Array.from(map.values());
  }, [isAggregatedView, hangHoaList]);

  const displayList = isAggregatedView ? aggregatedList : hangHoaList;
  const stats = calculateStats();

  // Toggle expanded state for aggregated items
  const toggleExpanded = (hangHoaId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(hangHoaId)) {
      newExpanded.delete(hangHoaId);
    } else {
      newExpanded.add(hangHoaId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Quản lý hàng hóa"
        subtitle={`Quản lý danh sách hàng hóa và tồn kho ${
          userRole === "user" ? "của phòng ban" : ""
        }`}
        Icon={Package}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Tổng số loại</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Còn hàng</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.inStock}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Sắp hết</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.lowStock}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Hết hàng</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.outOfStock}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Giá trị tồn</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4 items-end">
            {/* Search bar */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
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
                  placeholder="Tìm theo tên hoặc mã hàng hóa..."
                />
              </div>
            </div>

            {/* Department filters cho Manager và Admin */}
            {(userRole === "manager" || userRole === "admin") && (
              <>
                {/* Filter cho Admin - Cấp 2 */}
                {userRole === "admin" && (
                  <div className="min-w-0 flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phòng ban cấp 2
                    </label>
                    <select
                      value={departmentFilters.selectedCap2}
                      onChange={(e) => handleCap2Change(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                    >
                      <option value="">-- Tất cả cấp 2 --</option>
                      {departmentFilters.cap2List.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.ten_phong_ban}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filter cho Manager và Admin - Cấp 3 */}
                <div className="min-w-0 flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phòng ban cấp 3
                  </label>
                  <select
                    value={departmentFilters.selectedCap3}
                    onChange={(e) => handleCap3Change(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                  >
                    <option value="">-- Tất cả cấp 3 --</option>
                    {departmentFilters.cap3List
                      .filter((dept) => {
                        // Nếu admin và đã chọn cấp 2, chỉ hiển thị cấp 3 thuộc cấp 2 đó
                        if (
                          userRole === "admin" &&
                          departmentFilters.selectedCap2
                        ) {
                          return (
                            dept.phong_ban_cha_id ===
                            parseInt(departmentFilters.selectedCap2)
                          );
                        }
                        // Nếu manager, chỉ hiển thị cấp 3 thuộc quyền (sẽ do backend filter)
                        return true;
                      })
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.ten_phong_ban}
                        </option>
                      ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="large" />
          </div>
        ) : (
          <>
            <div className="">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[28%]">
                      Hàng hóa
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[14%]">
                      Loại / Đơn vị
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-[14%]">
                      Giá gần nhất
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-[14%]">
                      Số lượng tồn
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-[14%]">
                      Giá trị tồn
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%]">
                      Trạng thái
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[16%]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayList.map((hangHoa) => (
                    <React.Fragment key={hangHoa.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {isAggregatedView && (
                              <button
                                onClick={() => toggleExpanded(hangHoa.id)}
                                className="mr-2 p-1 hover:bg-gray-200 rounded"
                              >
                                {expandedItems.has(hangHoa.id) ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </button>
                            )}
                            <div className="flex-1">
                              <div className="text-sm text-gray-900 font-medium truncate">
                                {hangHoa.ten_hang_hoa}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                Mã: {hangHoa.ma_hang_hoa}
                              </div>
                              {!isAggregatedView && hangHoa.ten_phong_ban && (
                                <div className="text-xs text-gray-500 flex items-center mt-1 truncate">
                                  <Building
                                    size={12}
                                    className="mr-1 flex-shrink-0"
                                  />
                                  <span className="truncate">
                                    {hangHoa.ten_phong_ban}
                                  </span>
                                </div>
                              )}
                              {isAggregatedView && (
                                <div className="text-xs text-blue-600 flex items-center mt-1">
                                  <Users size={12} className="mr-1" />
                                  <span>
                                    {hangHoa.departments?.length || 0} đơn vị
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {hangHoa.ten_loai || "Chưa phân loại"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {hangHoa.don_vi_tinh}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-green-600">
                            {hangHoa.gia_nhap_gan_nhat > 0
                              ? formatCurrency(hangHoa.gia_nhap_gan_nhat)
                              : "Chưa có"}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right">
                          <div
                            className={`text-sm font-semibold ${getInventoryStatusColor(
                              hangHoa.so_luong_ton
                            )}`}
                          >
                            {formatInteger(hangHoa.so_luong_ton)}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(hangHoa.gia_tri_ton)}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInventoryStatusBadge(
                              hangHoa.so_luong_ton
                            )}`}
                          >
                            {getInventoryStatusText(hangHoa.so_luong_ton)}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleViewDetail(hangHoa)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                              title="Xem chi tiết"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              onClick={() => handleEditHangHoa(hangHoa.id)}
                              className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-all"
                              title="Chỉnh sửa"
                            >
                              <Edit size={14} />
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteHangHoa(
                                  hangHoa.id,
                                  hangHoa.ten_hang_hoa
                                )
                              }
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
                              title="Xóa"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row cho aggregated view */}
                      {isAggregatedView &&
                        expandedItems.has(hangHoa.id) &&
                        hangHoa.departments?.map((dept) => (
                          <tr
                            key={`${hangHoa.id}-${dept.phong_ban_id}`}
                            className="bg-gray-50"
                          >
                            <td className="px-4 py-2 pl-12">
                              <div className="flex items-center">
                                <Building
                                  size={12}
                                  className="mr-2 text-gray-500"
                                />
                                <span className="text-xs text-gray-600">
                                  {dept.ten_phong_ban}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2"></td>
                            <td className="px-3 py-2"></td>
                            <td className="px-3 py-2 text-right">
                              <div
                                className={`text-xs font-medium ${getInventoryStatusColor(
                                  dept.so_luong_ton
                                )}`}
                              >
                                {formatInteger(dept.so_luong_ton)}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="text-xs text-gray-600">
                                {formatCurrency(dept.gia_tri_ton)}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getInventoryStatusBadge(
                                  dept.so_luong_ton
                                )}`}
                              >
                                {getInventoryStatusText(dept.so_luong_ton)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() =>
                                  handleViewDetail(hangHoa, dept.phong_ban_id)
                                }
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                                title="Xem chi tiết theo đơn vị"
                              >
                                <Eye size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {hangHoaList.length === 0 && (
              <div className="text-center py-8">
                <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Không có dữ liệu
                </h3>
                <p className="text-xs text-gray-500">
                  Chưa có hàng hóa nào được tạo hoặc không tìm thấy kết quả phù
                  hợp.
                </p>
              </div>
            )}

            {/* Pagination & Page size */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-4">
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

      {/* Modals */}
      <HangHoaDetailModal
        hangHoaId={selectedHangHoaId}
        phongBanId={selectedPhongBanId}
        isOpen={showDetailModal}
        onClose={handleCloseDetail}
      />

      <EditHangHoaModal
        hangHoaId={selectedHangHoaId}
        isOpen={showEditModal}
        onClose={handleCloseEdit}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default HangHoa;
