import React, { useState, useEffect } from "react";
import {
  Truck,
  Calendar,
  TrendingUp,
  Package,
  BarChart3,
  RefreshCw,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ThongKeNhaCungCapReport = ({ user }) => {
  const [filters, setFilters] = useState({
    tu_ngay: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    den_ngay: new Date().toISOString().split("T")[0],
    timeFrame: "month",
    phong_ban_id: user?.role === "admin" ? "all" : user?.phong_ban_id,
    nha_cung_cap_id: "",
    loai_phieu: "all", // all, tu_mua, tren_cap, dieu_chuyen
  });

  const [data, setData] = useState([]);
  const [detailData, setDetailData] = useState([]);
  const [phongBanList, setPhongBanList] = useState([]);
  const [nhaCungCapList, setNhaCungCapList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNhaCungCap, setSelectedNhaCungCap] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPhongBanList();
    }
    fetchNhaCungCapList();
  }, [user]);

  useEffect(() => {
    fetchThongKeData();
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

  const fetchNhaCungCapList = async () => {
    try {
      const response = await fetch("/api/nha-cung-cap/list", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success && result.data && result.data.items) {
        setNhaCungCapList(result.data.items);
      }
    } catch (error) {
      console.error("Error fetching nha cung cap:", error);
    }
  };

  const fetchThongKeData = async () => {
    try {
      setIsLoading(true);

      // Fetch phiếu nhập data
      const params = new URLSearchParams({
        tu_ngay: filters.tu_ngay,
        den_ngay: filters.den_ngay,
        page: 1,
        limit: 1000,
      });

      if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
        params.append("phong_ban_id", filters.phong_ban_id);
      }

      // Lọc theo loại phiếu nếu có chọn
      if (filters.loai_phieu && filters.loai_phieu !== "all") {
        params.append("loai_phieu", filters.loai_phieu);
      }

      // Nếu có chọn NCC cụ thể → gửi filter xuống backend
      if (filters.nha_cung_cap_id) {
        params.append("nha_cung_cap_id", filters.nha_cung_cap_id);
      }

      const response = await fetch(`/api/nhap-kho?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        // Chỉ lấy phiếu đã hoàn thành; loại phiếu được điều khiển bởi filter
        const completedItems = result.data.items.filter(
          (item) => item.trang_thai === "completed"
        );
        processThongKeData(completedItems);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching thong ke data:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const processThongKeData = (items) => {
    // Lọc thêm: chỉ giữ phiếu có nhà cung cấp hợp lệ (tránh gộp vào 'unknown')
    const validItems = items.filter(
      (it) => it.nha_cung_cap && it.nha_cung_cap.id
    );

    const grouped = validItems.reduce((acc, item) => {
      const nhaCungCapId = item.nha_cung_cap?.id || "unknown";
      const nhaCungCapName = item.nha_cung_cap?.ten_ncc || "Chưa xác định";

      if (!acc[nhaCungCapId]) {
        acc[nhaCungCapId] = {
          id: nhaCungCapId,
          ten_ncc: nhaCungCapName,
          so_phieu: 0,
          tong_gia_tri: 0,
          phieu_list: [],
        };
      }

      acc[nhaCungCapId].so_phieu += 1;
      acc[nhaCungCapId].tong_gia_tri += parseFloat(item.tong_tien) || 0;
      acc[nhaCungCapId].phieu_list.push(item);

      return acc;
    }, {});

    // Sắp xếp nhưng KHÔNG cắt bớt: hiển thị toàn bộ NCC có trong phiếu nhập
    const processedData = Object.values(grouped).sort(
      (a, b) => b.tong_gia_tri - a.tong_gia_tri
    );

    setData(processedData);
  };

  const handleViewDetail = async (nhaCungCap) => {
    setSelectedNhaCungCap(nhaCungCap);
    setDetailData(nhaCungCap.phieu_list);
    setShowDetailModal(true);
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

  const calculateTotalStats = () => {
    const totalPhieu = data.reduce((sum, item) => sum + item.so_phieu, 0);
    const totalGiaTri = data.reduce((sum, item) => sum + item.tong_gia_tri, 0);
    const avgGiaTri = data.length > 0 ? totalGiaTri / data.length : 0;

    return { totalPhieu, totalGiaTri, avgGiaTri, totalNhaCungCap: data.length };
  };

  const stats = calculateTotalStats();

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

  const colors = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f97316",
    "#84cc16",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Thống kê nhà cung cấp
            </h2>
            <div className="text-sm text-gray-600">
              <Calendar className="h-4 w-4 inline mr-2" />
              {formatDate(filters.tu_ngay)} - {formatDate(filters.den_ngay)} •{" "}
              {stats.totalNhaCungCap} nhà cung cấp
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bộ lọc thống kê
        </h3>

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
                className="px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              Loại phiếu
            </label>
            <select
              value={filters.loai_phieu}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, loai_phieu: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">Tất cả</option>
              <option value="tu_mua">Tự mua</option>
              <option value="tren_cap">Trên cấp</option>
              <option value="dieu_chuyen">Điều chuyển</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhà cung cấp cụ thể
            </label>
            <select
              value={filters.nha_cung_cap_id}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  nha_cung_cap_id: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Tất cả nhà cung cấp</option>
              {nhaCungCapList.map((ncc) => (
                <option key={ncc.id} value={ncc.id}>
                  {ncc.ten_ncc}
                </option>
              ))}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Truck className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(stats.totalNhaCungCap)}
              </div>
              <div className="text-sm text-gray-600">Tổng NCC</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(stats.totalPhieu)}
              </div>
              <div className="text-sm text-gray-600">Tổng phiếu nhập</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(stats.totalGiaTri)}
              </div>
              <div className="text-sm text-gray-600">Tổng giá trị</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-lg font-bold text-purple-600">
                {formatCurrency(stats.avgGiaTri)}
              </div>
              <div className="text-sm text-gray-600">TB/NCC</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Giá trị theo nhà cung cấp
          </h3>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="ten_ncc"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Giá trị"]}
                  contentStyle={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="tong_gia_tri"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Phân bố theo số phiếu
          </h3>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="so_phieu"
                  label={({ name, percent }) =>
                    percent > 5 ? `${percent.toFixed(0)}%` : ""
                  }
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [formatNumber(value), "Số phiếu"]}
                  contentStyle={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Danh sách nhà cung cấp ({formatNumber(data.length)} NCC)
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
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Tên nhà cung cấp
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Số phiếu nhập
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Tổng giá trị
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Giá trị TB/Phiếu
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {item.ten_ncc}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {formatNumber(item.so_phieu)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(item.tong_gia_tri)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(item.tong_gia_tri / item.so_phieu)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleViewDetail(item)}
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

        {data.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Truck className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có dữ liệu
            </h3>
            <p className="text-sm text-gray-600">
              Không tìm thấy hoạt động của nhà cung cấp nào trong khoảng thời
              gian này
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedNhaCungCap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Chi tiết: {selectedNhaCungCap.ten_ncc}
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(selectedNhaCungCap.so_phieu)}
                  </div>
                  <div className="text-sm text-green-700">Tổng phiếu nhập</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(selectedNhaCungCap.tong_gia_tri)}
                  </div>
                  <div className="text-sm text-blue-700">Tổng giá trị</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(
                      selectedNhaCungCap.tong_gia_tri /
                        selectedNhaCungCap.so_phieu
                    )}
                  </div>
                  <div className="text-sm text-orange-700">
                    Giá trị TB/Phiếu
                  </div>
                </div>
              </div>

              {/* Detail Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Số phiếu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Ngày nhập
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Lý do nhập
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                        Số tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detailData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.so_phieu}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(item.ngay_nhap)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.ly_do_nhap || "Nhập kho"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right text-green-600">
                          {formatCurrency(item.tong_tien)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThongKeNhaCungCapReport;
