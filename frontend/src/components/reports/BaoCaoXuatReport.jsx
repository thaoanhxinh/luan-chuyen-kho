import React, { useState, useEffect } from "react";
import {
  Download,
  Calendar,
  Building2,
  Package,
  TrendingDown,
  RefreshCw,
  Eye,
  Truck,
} from "lucide-react";

const BaoCaoXuatReport = ({ user }) => {
  const [filters, setFilters] = useState({
    tu_ngay: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    den_ngay: new Date().toISOString().split("T")[0],
    timeFrame: "month",
    phong_ban_id: user?.role === "admin" ? "all" : user?.phong_ban_id,
  });

  const [data, setData] = useState({ items: [] });
  const [phongBanList, setPhongBanList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPhongBanList();
    }
  }, [user]);

  useEffect(() => {
    fetchXuatData();
  }, [filters]);

  const fetchPhongBanList = async () => {
    try {
      const response = await fetch("/api/departments/list", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setPhongBanList(result.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchXuatData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        tu_ngay: filters.tu_ngay,
        den_ngay: filters.den_ngay,
        page: 1,
        limit: 1000,
      });

      if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
        params.append("phong_ban_id", filters.phong_ban_id);
      }

      const response = await fetch(`/api/xuat-kho?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        // Chỉ lấy các phiếu đã hoàn thành
        const completedItems = result.data.items.filter(
          (item) => item.trang_thai === "completed"
        );
        setData({ ...result.data, items: completedItems });
      } else {
        setData({ items: [] });
      }
    } catch (error) {
      console.error("Error fetching xuat data:", error);
      setData({ items: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const params = new URLSearchParams({
        tu_ngay: filters.tu_ngay,
        den_ngay: filters.den_ngay,
        timeFrame: filters.timeFrame,
      });

      if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
        params.append("phong_ban_id", filters.phong_ban_id);
      }

      const response = await fetch(
        `/api/bao-cao/export/nhap-xuat-xuat?${params}`,
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

  const calculateStats = () => {
    const items = data.items || [];
    const totalValue = items.reduce(
      (sum, item) => sum + (parseFloat(item.tong_tien) || 0),
      0
    );
    const totalItems = items.length;
    const avgValue = totalItems > 0 ? totalValue / totalItems : 0;

    return { totalValue, totalItems, avgValue };
  };

  const stats = calculateStats();

  // Quick date selections
  const handleQuickDate = (type) => {
    const today = new Date();
    let startDate,
      endDate = today;

    switch (type) {
      case "thisMonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        setFilters((prev) => ({ ...prev, timeFrame: "month" }));
        break;
      case "lastMonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        setFilters((prev) => ({ ...prev, timeFrame: "month" }));
        break;
      case "thisQuarter":
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        setFilters((prev) => ({ ...prev, timeFrame: "quarter" }));
        break;
      case "thisYear":
        startDate = new Date(today.getFullYear(), 0, 1);
        setFilters((prev) => ({ ...prev, timeFrame: "year" }));
        break;
      default:
        return;
    }

    setFilters((prev) => ({
      ...prev,
      tu_ngay: startDate.toISOString().split("T")[0],
      den_ngay: endDate.toISOString().split("T")[0],
    }));
  };

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = data.items.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-lg shadow-lg text-white">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Báo cáo phiếu xuất</h2>
              <p className="text-red-100 mb-4">
                Danh sách và thống kê các phiếu xuất theo thời gian
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(filters.tu_ngay)} - {formatDate(filters.den_ngay)}
                </div>
                <div className="flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  {stats.totalItems} phiếu xuất
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {formatCurrency(stats.totalValue)}
              </div>
              <div className="text-sm text-red-100">Tổng giá trị xuất</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Bộ lọc và tùy chọn
          </h3>
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

        {/* Quick Date Filters */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn nhanh thời gian
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "thisMonth", label: "Tháng này" },
              { key: "lastMonth", label: "Tháng trước" },
              { key: "thisQuarter", label: "Quý này" },
              { key: "thisYear", label: "Năm này" },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => handleQuickDate(option.key)}
                className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.tu_ngay}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, tu_ngay: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.den_ngay}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, den_ngay: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại báo cáo
            </label>
            <select
              value={filters.timeFrame}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, timeFrame: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="month">Theo tháng</option>
              <option value="quarter">Theo quý</option>
              <option value="year">Theo năm</option>
            </select>
          </div>

          {user?.role === "admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phòng ban
              </label>
              <select
                value={filters.phong_ban_id}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    phong_ban_id: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">Tất cả phòng ban</option>
                {phongBanList.map((pb) => (
                  <option key={pb.id} value={pb.id}>
                    {pb.ten_phong_ban}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Truck className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(stats.totalItems)}
              </div>
              <div className="text-sm text-gray-600">Tổng phiếu xuất</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(stats.totalValue)}
              </div>
              <div className="text-sm text-gray-600">Tổng giá trị</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-lg font-bold text-purple-600">
                {formatCurrency(stats.avgValue)}
              </div>
              <div className="text-sm text-gray-600">Giá trị TB/phiếu</div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Danh sách phiếu xuất ({formatNumber(data.items.length)} phiếu)
          </h3>
          {isLoading && (
            <div className="flex items-center text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Đang tải...</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Số phiếu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Ngày xuất
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Đơn vị nhận
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Lý do xuất
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedItems.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {item.so_phieu}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatDate(item.ngay_xuat)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {item.don_vi_nhan?.ten_don_vi || "Chưa xác định"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {item.ly_do_xuat || "Xuất kho"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-medium text-red-600">
                      {formatCurrency(item.tong_tien)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Hoàn thành
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedItems.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Truck className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có dữ liệu
            </h3>
            <p className="text-sm text-gray-600">
              Không tìm thấy phiếu xuất nào trong khoảng thời gian này
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {startIndex + 1} đến{" "}
              {Math.min(startIndex + itemsPerPage, data.items.length)} trong
              tổng số {data.items.length} kết quả
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
  );
};

export default BaoCaoXuatReport;
