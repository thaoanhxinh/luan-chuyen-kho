import React, { useState, useEffect } from "react";
import {
  Building2,
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

const ThongKeDonViNhanReport = ({ user }) => {
  const [filters, setFilters] = useState({
    tu_ngay: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    den_ngay: new Date().toISOString().split("T")[0],
    timeFrame: "month",
    phong_ban_id: user?.role === "admin" ? "all" : user?.phong_ban_id,
    don_vi_nhan_id: "",
    loai_phieu: "all", // all, noi_bo, ben_ngoai, dieu_chuyen (tùy backend)
  });

  const [data, setData] = useState([]);
  const [detailData, setDetailData] = useState([]);
  const [phongBanList, setPhongBanList] = useState([]);
  const [donViNhanList, setDonViNhanList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDonVi, setSelectedDonVi] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPhongBanList();
    }
    fetchDonViNhanList();
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

  const fetchDonViNhanList = async () => {
    try {
      // Chỉ lấy danh sách đơn vị nhận thực thể (bên ngoài) cho dropdown này
      // Các đơn vị cấp 3 nội bộ sẽ lấy từ phòng ban khi cần xuất nội bộ
      const response = await fetch("/api/don-vi-nhan", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success && result.data && result.data.items) {
        setDonViNhanList(result.data.items);
      }
    } catch (error) {
      console.error("Error fetching don vi nhan:", error);
    }
  };

  const fetchThongKeData = async () => {
    try {
      setIsLoading(true);

      // Fetch phiếu xuất data
      const params = new URLSearchParams({
        tu_ngay: filters.tu_ngay,
        den_ngay: filters.den_ngay,
        page: 1,
        limit: 1000,
      });

      if (filters.phong_ban_id && filters.phong_ban_id !== "all") {
        params.append("phong_ban_id", filters.phong_ban_id);
      }

      // Nếu chọn loại phiếu cụ thể
      if (filters.loai_phieu && filters.loai_phieu !== "all") {
        params.append("loai_phieu", filters.loai_phieu);
      }

      // Nếu có chọn đơn vị nhận cụ thể (ngoài) -> dùng filter don_vi_nhan_id
      if (filters.don_vi_nhan_id) {
        params.append("don_vi_nhan_id", filters.don_vi_nhan_id);
      }

      const response = await fetch(`/api/xuat-kho?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      console.log("🔍 API Response:", result);
      if (result.success) {
        // Chỉ lấy phiếu hoàn thành
        const completedItems = result.data.items.filter(
          (item) => item.trang_thai === "completed"
        );
        console.log("🔍 Completed items:", completedItems.length);
        processThongKeData(completedItems);
      } else {
        console.log("❌ API Error:", result.message);
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
    console.log("🔍 Processing items:", items.length, "items");
    console.log("🔍 Sample item:", items[0]);
    console.log("🔍 Sample item keys:", Object.keys(items[0] || {}));

    const grouped = items.reduce((acc, item) => {
      // Xác định đơn vị nhận: ưu tiên phòng ban nhận (nội bộ), sau đó đơn vị nhận (bên ngoài)
      let groupKey, displayName;

      // Kiểm tra phòng ban nhận (xuất nội bộ)
      if (item.ten_phong_ban_nhan) {
        groupKey = `phong_ban_${item.ten_phong_ban_nhan}`;
        displayName = item.ten_phong_ban_nhan;
        console.log("✅ Phòng ban nhận:", item.ten_phong_ban_nhan);
      }
      // Kiểm tra đơn vị nhận (xuất bên ngoài)
      else if (
        item.don_vi_nhan &&
        item.don_vi_nhan.id &&
        item.don_vi_nhan.ten_don_vi
      ) {
        groupKey = `don_vi_${item.don_vi_nhan.id}`;
        displayName = item.don_vi_nhan.ten_don_vi;
        console.log("✅ Đơn vị nhận:", item.don_vi_nhan.ten_don_vi);
      }
      // Fallback - debug để xem cấu trúc dữ liệu
      else {
        groupKey = "unknown";
        displayName = "Chưa xác định";
        console.log("⚠️ Item without clear recipient:", {
          phong_ban_nhan_id: item.phong_ban_nhan_id,
          ten_phong_ban_nhan: item.ten_phong_ban_nhan,
          don_vi_nhan: item.don_vi_nhan,
          so_phieu: item.so_phieu,
        });
      }

      if (!acc[groupKey]) {
        acc[groupKey] = {
          id: groupKey,
          ten_don_vi: displayName,
          so_phieu: 0,
          tong_gia_tri: 0,
          phieu_list: [],
        };
      }

      acc[groupKey].so_phieu += 1;
      acc[groupKey].tong_gia_tri += parseFloat(item.tong_tien) || 0;
      acc[groupKey].phieu_list.push(item);

      return acc;
    }, {});

    console.log("🔍 Grouped data:", Object.keys(grouped).length, "groups");
    console.log(
      "🔍 Groups:",
      Object.values(grouped).map((g) => ({
        name: g.ten_don_vi,
        count: g.so_phieu,
      }))
    );

    // Sắp xếp nhưng KHÔNG cắt bớt: hiển thị toàn bộ đơn vị nhận có trong phiếu xuất
    const processedData = Object.values(grouped).sort(
      (a, b) => b.tong_gia_tri - a.tong_gia_tri
    );

    console.log("🔍 Final processed data:", processedData.length, "items");
    setData(processedData);
  };

  const handleViewDetail = async (donVi) => {
    setSelectedDonVi(donVi);
    setDetailData(donVi.phieu_list);
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

    return { totalPhieu, totalGiaTri, avgGiaTri, totalDonVi: data.length };
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
              Thống kê đơn vị nhận
            </h2>
            <div className="text-sm text-gray-600">
              <Calendar className="h-4 w-4 inline mr-2" />
              {formatDate(filters.tu_ngay)} - {formatDate(filters.den_ngay)} •{" "}
              {stats.totalDonVi} đơn vị
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
                className="px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
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
              <option value="noi_bo">Nội bộ</option>
              <option value="ben_ngoai">Bên ngoài</option>
              <option value="dieu_chuyen">Điều chuyển</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đơn vị nhận cụ thể
            </label>
            <select
              value={filters.don_vi_nhan_id}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  don_vi_nhan_id: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Tất cả đơn vị</option>
              {donViNhanList.map((dvn) => (
                <option key={dvn.id} value={dvn.id}>
                  {dvn.ten_don_vi}
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
            <Building2 className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(stats.totalDonVi)}
              </div>
              <div className="text-sm text-gray-600">Tổng đơn vị</div>
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
              <div className="text-sm text-gray-600">Tổng phiếu xuất</div>
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
            <BarChart3 className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(stats.avgGiaTri)}
              </div>
              <div className="text-sm text-gray-600">TB/Đơn vị</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Giá trị theo đơn vị nhận
          </h3>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="ten_don_vi"
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
                  fill="#8b5cf6"
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
            Danh sách đơn vị nhận ({formatNumber(data.length)} đơn vị)
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
                  Tên đơn vị
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Số phiếu xuất
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
                      {item.ten_don_vi}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
            <Building2 className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có dữ liệu
            </h3>
            <p className="text-sm text-gray-600">
              Không tìm thấy hoạt động của đơn vị nhận nào trong khoảng thời
              gian này
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDonVi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Chi tiết: {selectedDonVi.ten_don_vi}
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
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(selectedDonVi.so_phieu)}
                  </div>
                  <div className="text-sm text-blue-700">Tổng phiếu xuất</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedDonVi.tong_gia_tri)}
                  </div>
                  <div className="text-sm text-green-700">Tổng giá trị</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      selectedDonVi.tong_gia_tri / selectedDonVi.so_phieu
                    )}
                  </div>
                  <div className="text-sm text-purple-700">
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
                        Ngày xuất
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Lý do xuất
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
                          {formatDate(item.ngay_xuat)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.ly_do_xuat || "Xuất kho"}
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

export default ThongKeDonViNhanReport;
