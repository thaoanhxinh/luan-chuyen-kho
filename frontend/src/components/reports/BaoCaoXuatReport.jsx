import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Download,
  Calendar,
  Building2,
  Package,
  TrendingDown,
  RefreshCw,
  Eye,
  Truck,
  ArrowUpFromLine,
  Users,
  FileText,
  X,
  Warehouse,
} from "lucide-react";

const BaoCaoXuatReport = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("don_vi_su_dung");
  const [filters, setFilters] = useState({
    tu_ngay: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    den_ngay: new Date().toISOString().split("T")[0],
    timeFrame: "month",
    phong_ban_cap2_id: "all",
    phong_ban_cap3_id: "all",
  });

  const [data, setData] = useState({
    don_vi_su_dung: { items: [], total: 0 },
    don_vi_nhan: { items: [], total: 0 },
  });
  const [phongBanOptions, setPhongBanOptions] = useState({
    cap2: [],
    cap3: [],
    hierarchy: {},
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    timeFrame: "month", // month, quarter, year
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1,
    selectedQuarter: Math.ceil((new Date().getMonth() + 1) / 3),
  });
  const [signatures, setSignatures] = useState({
    nguoi_lap: "",
    truong_ban_tmkh: "",
    chu_nhiem_hckt: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "manager") {
      fetchPhongBanList();
    }
  }, [user]);

  useEffect(() => {
    fetchXuatData();
  }, [filters]);

  const fetchPhongBanList = async () => {
    try {
      const response = await fetch("/api/bao-cao/phong-ban-list", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setPhongBanOptions(result.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchXuatData = async () => {
    try {
      setIsLoading(true);

      // Fetch data for both types using real API
      const [donViSuDungResponse, donViNhanResponse] = await Promise.all([
        fetchDataByType("don_vi_su_dung"),
        fetchDataByType("don_vi_nhan"),
      ]);

      setData({
        don_vi_su_dung: donViSuDungResponse,
        don_vi_nhan: donViNhanResponse,
      });
    } catch (error) {
      console.error("Error fetching xuat data:", error);
      setData({
        don_vi_su_dung: { items: [], total: 0 },
        don_vi_nhan: { items: [], total: 0 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      // Reset cấp 3 khi chọn cấp 2 mới
      if (key === "phong_ban_cap2_id") {
        newFilters.phong_ban_cap3_id = "all";
      }
      return newFilters;
    });
  };

  const fetchDataByType = async (loaiPhieu) => {
    const params = new URLSearchParams({
      tu_ngay: filters.tu_ngay,
      den_ngay: filters.den_ngay,
      page: 1,
      limit: 1000,
      loai_phieu: loaiPhieu,
    });

    // Logic chọn filter cuối cùng để gửi API
    let selectedFilter = "all";

    if (filters.phong_ban_cap3_id !== "all") {
      selectedFilter = filters.phong_ban_cap3_id;
    } else if (filters.phong_ban_cap2_id !== "all") {
      selectedFilter = filters.phong_ban_cap2_id;
    }

    if (selectedFilter !== "all") {
      params.append("phong_ban_id", selectedFilter);
    }

    const response = await fetch(`/api/bao-cao/xuat-by-type?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    if (result.success) {
      const items = result.data.items || [];
      const total = items.reduce(
        (sum, item) => sum + (parseFloat(item.tong_tien) || 0),
        0
      );
      return { items, total };
    }
    return { items: [], total: 0 };
  };

  const handleExport = () => {
    setShowExportOptionsModal(true);
  };

  // Render dropdown phòng ban theo quyền
  const renderPhongBanFilter = () => {
    if (user?.role === "user" && user?.phong_ban?.cap_bac === 3) {
      // Cấp 3: Hiển thị thông tin phòng ban hiện tại
      return (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Phòng ban:</span>
          <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
            🏢 {user.phong_ban?.ten_phong_ban}
          </span>
        </div>
      );
    }

    // Logic cho manager và admin
    const availableCap3 =
      filters.phong_ban_cap2_id !== "all"
        ? phongBanOptions.cap3.filter(
            (cap3) =>
              cap3.phong_ban_cha_id === parseInt(filters.phong_ban_cap2_id)
          )
        : phongBanOptions.cap3;

    return (
      <div className="flex items-center space-x-4">
        {/* Dropdown Cấp 2 */}
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Cấp 2:</label>
          <select
            value={filters.phong_ban_cap2_id}
            onChange={(e) =>
              handleFilterChange("phong_ban_cap2_id", e.target.value)
            }
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tất cả cấp 2</option>
            {phongBanOptions.cap2.map((cap2) => (
              <option key={cap2.id} value={cap2.id}>
                {cap2.ten_phong_ban}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown Cấp 3 */}
        <div className="flex items-center space-x-2">
          <Warehouse className="h-4 w-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Cấp 3:</label>
          <select
            value={filters.phong_ban_cap3_id}
            onChange={(e) =>
              handleFilterChange("phong_ban_cap3_id", e.target.value)
            }
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={
              filters.phong_ban_cap2_id !== "all" && availableCap3.length === 0
            }
          >
            <option value="all">
              {filters.phong_ban_cap2_id !== "all"
                ? "Tất cả cấp 3 thuộc cấp 2"
                : "Tất cả cấp 3"}
            </option>
            {availableCap3.map((cap3) => (
              <option key={cap3.id} value={cap3.id}>
                {cap3.ten_phong_ban}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const handleExportOptionsConfirm = () => {
    setShowExportOptionsModal(false);
    setShowSignatureModal(true);
  };

  const handleExportConfirm = async () => {
    try {
      setIsExporting(true);

      // Tính toán thời gian dựa trên lựa chọn
      let tu_ngay, den_ngay;
      const year = exportOptions.selectedYear;

      if (exportOptions.timeFrame === "month") {
        const month = exportOptions.selectedMonth;
        tu_ngay = `${year}-${month.toString().padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        den_ngay = `${year}-${month.toString().padStart(2, "0")}-${lastDay
          .toString()
          .padStart(2, "0")}`;
      } else if (exportOptions.timeFrame === "quarter") {
        const quarter = exportOptions.selectedQuarter;
        const startMonth = (quarter - 1) * 3 + 1;
        const endMonth = quarter * 3;
        tu_ngay = `${year}-${startMonth.toString().padStart(2, "0")}-01`;
        const lastDay = new Date(year, endMonth, 0).getDate();
        den_ngay = `${year}-${endMonth.toString().padStart(2, "0")}-${lastDay
          .toString()
          .padStart(2, "0")}`;
      } else if (exportOptions.timeFrame === "year") {
        tu_ngay = `${year}-01-01`;
        den_ngay = `${year}-12-31`;
      }

      const params = new URLSearchParams({
        tu_ngay,
        den_ngay,
        timeFrame: exportOptions.timeFrame,
      });

      // Logic chọn filter cuối cùng để gửi API
      let selectedFilter = "all";

      if (filters.phong_ban_cap3_id !== "all") {
        selectedFilter = filters.phong_ban_cap3_id;
      } else if (filters.phong_ban_cap2_id !== "all") {
        selectedFilter = filters.phong_ban_cap2_id;
      }

      if (selectedFilter !== "all") {
        params.append("phong_ban_id", selectedFilter);
      }

      // Add signature data
      Object.entries(signatures).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(
        `/api/bao-cao/export/xuat-with-tabs?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bao-cao-xuat-${filters.timeFrame}-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setShowSignatureModal(false);

        // Reset signature form
        setSignatures({
          nguoi_lap: "",
          truong_ban_tmkh: "",
          chu_nhiem_hckt: "",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Có lỗi xảy ra khi tạo báo cáo!");
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const getCurrentData = () => data[activeTab] || { items: [], total: 0 };
  const currentData = getCurrentData();

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(currentData.items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = currentData.items.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getTotalStats = () => {
    const donViSuDungTotal = data.don_vi_su_dung?.total || 0;
    const donViNhanTotal = data.don_vi_nhan?.total || 0;
    return {
      totalValue: donViSuDungTotal + donViNhanTotal,
      totalItems:
        (data.don_vi_su_dung?.items?.length || 0) +
        (data.don_vi_nhan?.items?.length || 0),
    };
  };

  const totalStats = getTotalStats();

  // Reset pagination when changing tab
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Show department column when viewing multiple departments
  const showDepartmentColumn =
    (user?.role === "admin" || user?.role === "manager") &&
    filters.phong_ban_cap3_id === "all";

  return (
    <div className="space-y-3">
      {/* Header + Filters row */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-gray-900 whitespace-nowrap">
            Báo cáo phiếu xuất
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            {/* date range + department filters should already exist in this component; keep in one row if any */}
          </div>
        </div>
      </div>

      {/* Filter Section - Simplified */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        {/* Main Filters - one line */}
        <div className="flex items-center gap-3 flex-nowrap">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm text-gray-700">Từ ngày</span>
            <input
              type="date"
              value={filters.tu_ngay}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, tu_ngay: e.target.value }))
              }
              className="px-2 py-1.5 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm text-gray-700">Đến ngày</span>
            <input
              type="date"
              value={filters.den_ngay}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, den_ngay: e.target.value }))
              }
              className="px-2 py-1.5 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xuất báo cáo
            </label>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Xuất Excel
                </>
              )}
            </button>
          </div>

          {/* Filter phòng ban */}
          {renderPhongBanFilter()}
        </div>
      </div>

      {/* Tab Navigation & Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("don_vi_su_dung")}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === "don_vi_su_dung"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Đơn vị sử dụng ({data.don_vi_su_dung?.items?.length || 0})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("don_vi_nhan")}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === "don_vi_nhan"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Đơn vị nhận ({data.don_vi_nhan?.items?.length || 0})
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">
              {activeTab === "don_vi_su_dung"
                ? "Sử dụng nội bộ"
                : "Luân chuyển"}
              ({formatNumber(currentData.items.length)} phiếu)
            </h3>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-base font-semibold text-red-600">
                  {formatCurrency(currentData.total)}
                </div>
                <div className="text-xs text-gray-500">Tổng giá trị</div>
              </div>
              {isLoading && (
                <div className="flex items-center text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-xs">Đang tải...</span>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-16">
                    STT
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Số phiếu
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Ngày, tháng
                  </th>
                  {showDepartmentColumn && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Phòng ban
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Nội dung
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Số tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {startIndex + index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {item.so_phieu}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-900">
                        {formatDate(item.ngay_xuat)}
                      </div>
                    </td>
                    {showDepartmentColumn && (
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {item.ten_phong_ban || "-"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.ly_do_xuat || "Xuất kho"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium text-red-600">
                        {formatCurrency(item.tong_tien)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan={showDepartmentColumn ? 5 : 4}
                    className="px-6 py-4 text-center font-bold text-gray-900"
                  >
                    Cộng
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">
                    {formatCurrency(currentData.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {paginatedItems.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Truck className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không có dữ liệu
              </h3>
              <p className="text-sm text-gray-600">
                Không tìm thấy phiếu xuất{" "}
                {activeTab === "don_vi_su_dung"
                  ? "sử dụng nội bộ"
                  : "luân chuyển"}{" "}
                nào trong khoảng thời gian này
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} đến{" "}
                {Math.min(startIndex + itemsPerPage, currentData.items.length)}{" "}
                trong tổng số {currentData.items.length} kết quả
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>

                <span className="px-3 py-2 text-sm text-gray-700">
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Options Modal */}
      {showExportOptionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Tùy chọn xuất báo cáo
              </h3>
              <button
                onClick={() => setShowExportOptionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn loại xuất báo cáo
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timeFrame"
                      value="month"
                      checked={exportOptions.timeFrame === "month"}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          timeFrame: e.target.value,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Theo tháng (chi tiết 3 tab)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timeFrame"
                      value="quarter"
                      checked={exportOptions.timeFrame === "quarter"}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          timeFrame: e.target.value,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Theo quý (3 tab theo tháng)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="timeFrame"
                      value="year"
                      checked={exportOptions.timeFrame === "year"}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          timeFrame: e.target.value,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Theo năm (4 tab theo quý)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn thời gian
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Năm
                    </label>
                    <select
                      value={exportOptions.selectedYear}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          selectedYear: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {exportOptions.timeFrame === "month" && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Tháng
                      </label>
                      <select
                        value={exportOptions.selectedMonth}
                        onChange={(e) =>
                          setExportOptions((prev) => ({
                            ...prev,
                            selectedMonth: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Tháng {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {exportOptions.timeFrame === "quarter" && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Quý
                      </label>
                      <select
                        value={exportOptions.selectedQuarter}
                        onChange={(e) =>
                          setExportOptions((prev) => ({
                            ...prev,
                            selectedQuarter: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        {Array.from({ length: 4 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Quý {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowExportOptionsModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleExportOptionsConfirm}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Thông tin người ký
              </h3>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Người lập
                </label>
                <input
                  type="text"
                  value={signatures.nguoi_lap}
                  onChange={(e) =>
                    setSignatures((prev) => ({
                      ...prev,
                      nguoi_lap: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên người lập"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trưởng ban TMKH
                </label>
                <input
                  type="text"
                  value={signatures.truong_ban_tmkh}
                  onChange={(e) =>
                    setSignatures((prev) => ({
                      ...prev,
                      truong_ban_tmkh: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên trưởng ban"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chủ nhiệm HC-KT
                </label>
                <input
                  type="text"
                  value={signatures.chu_nhiem_hckt}
                  onChange={(e) =>
                    setSignatures((prev) => ({
                      ...prev,
                      chu_nhiem_hckt: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên chủ nhiệm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleExportConfirm}
                disabled={isExporting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isExporting ? "Đang xuất..." : "Xuất Excel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaoCaoXuatReport;
