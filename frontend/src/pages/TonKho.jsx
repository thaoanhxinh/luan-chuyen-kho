// pages/TonKho.jsx
import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  Filter,
  FileText,
  Download,
  Eye,
  Calendar,
  BarChart3,
} from "lucide-react";
import { baoCaoService } from "../services/baoCaoService";
import { formatCurrency, formatDate } from "../utils/helpers";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";
import Loading from "../components/common/Loading";
import toast from "react-hot-toast";

const TonKho = () => {
  const [tonKhoData, setTonKhoData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    loai_hang_id: "",
    ton_kho_duoi_muc_an_toan: false,
    sap_het_han: false,
    sort_by: "ten_vat_tu",
    sort_direction: "asc",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [statistics, setStatistics] = useState({
    total_items: 0,
    total_value: 0,
    low_stock_items: 0,
    expiring_items: 0,
  });

  // Load data
  useEffect(() => {
    loadTonKhoData();
  }, [currentPage, search, filters]);

  const loadTonKhoData = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        search: search.trim(),
        ...filters,
      };

      const response = await baoCaoService.getTonKhoReport(params);

      if (response.success) {
        setTonKhoData(response.data.items || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalItems(response.data.pagination?.total || 0);
        setStatistics(response.data.statistics || statistics);
      } else {
        toast.error("Lỗi khi tải dữ liệu tồn kho");
      }
    } catch (error) {
      console.error("Load ton kho data error:", error);
      toast.error("Lỗi khi tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      loadTonKhoData();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      loai_hang_id: "",
      ton_kho_duoi_muc_an_toan: false,
      sap_het_han: false,
      sort_by: "ten_vat_tu",
      sort_direction: "asc",
    });
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim(),
        ...filters,
        export: true,
      };

      const blob = await baoCaoService.exportExcel("ton-kho", params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ton-kho-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Xuất báo cáo thành công");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Lỗi khi xuất báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (item) => {
    if (item.so_luong_con_lai <= 0) return "text-red-600 bg-red-50";
    if (item.so_luong_con_lai <= item.so_luong_an_toan)
      return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getStockStatusText = (item) => {
    if (item.so_luong_con_lai <= 0) return "Hết hàng";
    if (item.so_luong_con_lai <= item.so_luong_an_toan)
      return "Dưới mức an toàn";
    return "Đủ hàng";
  };

  const formatExpiryDate = (date) => {
    if (!date) return "Không có";
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Đã hết hạn";
    if (diffDays <= 30) return `${diffDays} ngày nữa`;
    return formatDate(date);
  };

  const getExpiryColor = (date) => {
    if (!date) return "";
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "text-red-600";
    if (diffDays <= 30) return "text-orange-600";
    return "";
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tồn kho</h1>
          <p className="text-gray-600 mt-1">
            Quản lý và theo dõi tồn kho vật tư
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Bộ lọc</span>
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={loadTonKhoData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng vật tư</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.total_items}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng giá trị</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(statistics.total_value)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Dưới mức an toàn
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {statistics.low_stock_items}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sắp hết hạn</p>
              <p className="text-2xl font-bold text-red-600">
                {statistics.expiring_items}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sắp xếp theo
              </label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange("sort_by", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="ten_vat_tu">Tên vật tư</option>
                <option value="ma_vat_tu">Mã vật tư</option>
                <option value="so_luong_con_lai">Số lượng tồn</option>
                <option value="gia_tri_ton_kho">Giá trị tồn kho</option>
                <option value="han_su_dung">Hạn sử dụng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thứ tự
              </label>
              <select
                value={filters.sort_direction}
                onChange={(e) =>
                  handleFilterChange("sort_direction", e.target.value)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.ton_kho_duoi_muc_an_toan}
                  onChange={(e) =>
                    handleFilterChange(
                      "ton_kho_duoi_muc_an_toan",
                      e.target.checked
                    )
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Dưới mức an toàn
                </span>
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.sap_het_han}
                  onChange={(e) =>
                    handleFilterChange("sap_het_han", e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Sắp hết hạn</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Đặt lại
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã vật tư..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vật tư
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng tồn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mức an toàn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hạn sử dụng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá trị tồn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vị trí
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tonKhoData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.ten_vat_tu}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.ma_vat_tu}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {item.so_luong_con_lai?.toLocaleString() || 0}
                          </span>
                          <span className="ml-1 text-xs text-gray-500">
                            {item.don_vi_tinh}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.so_luong_an_toan?.toLocaleString() || 0}{" "}
                        {item.don_vi_tinh}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(
                            item
                          )}`}
                        >
                          {getStockStatusText(item)}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${getExpiryColor(
                          item.han_su_dung
                        )}`}
                      >
                        {formatExpiryDate(item.han_su_dung)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.gia_tri_ton_kho || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.vi_tri_kho || "Chưa xác định"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tonKhoData.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Không có dữ liệu
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Không tìm thấy vật tư nào với điều kiện đã chọn.
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  itemsPerPage={20}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TonKho;
