import React, { useState, useEffect } from "react";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  ChartColumnBig,
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
import { baoCaoService } from "../services/baoCaoService";
import { formatCurrency, formatNumber } from "../utils/helpers";
import Loading from "../components/common/Loading";
import PageHeader from "../components/common/PageHeader";

const Dashboard = () => {
  const [thongKe, setThongKe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("6months"); // 6months, 1year, 2years

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setIsLoading(true);

        // Fetch all dashboard data in parallel
        const [dashboardStats, chartData, phamChatStats] = await Promise.all([
          baoCaoService.getDashboardStats(),
          baoCaoService.getChartData({ period: timeFilter }),
          baoCaoService.getPhamChatStats(),
        ]);

        setThongKe({
          dashboard: dashboardStats,
          chart: chartData,
          phamChat: phamChatStats,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStats();
  }, [timeFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="large" />
      </div>
    );
  }

  const stats = thongKe?.dashboard?.data || {};
  const chartData = thongKe?.chart?.data || [];
  const phamChatData = thongKe?.phamChat?.data || [];

  const statCards = [
    {
      title: "Tổng hàng hóa",
      value: formatNumber(stats.tong_hang_hoa || 0),
      icon: Package,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      change: stats.tong_hang_hoa_change || "0%",
    },
    {
      title: "Phiếu nhập tháng này",
      value: formatNumber(stats.phieu_nhap_thang || 0),
      icon: ArrowDownToLine,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      change: stats.phieu_nhap_thang_change || "0%",
    },
    {
      title: "Phiếu xuất tháng này",
      value: formatNumber(stats.phieu_xuat_thang || 0),
      icon: ArrowUpFromLine,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      change: stats.phieu_xuat_thang_change || "0%",
    },
    {
      title: "Tồn kho thấp",
      value: formatNumber(stats.ton_kho_thap || 0),
      icon: AlertTriangle,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      change: stats.ton_kho_thap_change || "0%",
    },
  ];

  // Transform chart data from API
  const transformedChartData = chartData.map((item) => ({
    name: item.ten_thang || `T${item.thang}`,
    nhap: item.nhap || 0,
    xuat: item.xuat || 0,
    nhap_value: item.nhap_value || 0,
    xuat_value: item.xuat_value || 0,
  }));

  // Transform pham chat data for pie chart
  const pieData = phamChatData.map((item, index) => ({
    name: item.pham_chat || `Phẩm chất ${index + 1}`,
    value: parseInt(item.so_luong) || 0,
    color: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"][index % 5],
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                  <p className={`text-sm mt-1 ${card.textColor}`}>
                    {card.change} so với tháng trước
                  </p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-full`}>
                  <Icon className={`h-6 w-6 ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Biểu đồ nhập xuất
            </h3>
            <div className="flex items-center space-x-2">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="6months">6 tháng gần đây</option>
                <option value="1year">1 năm gần đây</option>
                <option value="2years">2 năm gần đây</option>
              </select>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transformedChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  value,
                  name === "nhap" ? "Nhập" : "Xuất",
                ]}
                labelFormatter={(label) => `Tháng ${label}`}
              />
              <Bar
                dataKey="nhap"
                fill="#10B981"
                name="Nhập"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="xuat"
                fill="#F59E0B"
                name="Xuất"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Phân bố hàng hóa
            </h3>
            <ChartColumnBig className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, "Số lượng"]}
                labelFormatter={(label) => `Phẩm chất: ${label}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Hoạt động gần đây
        </h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Phiếu nhập #PN001 đã được tạo
              </p>
              <p className="text-xs text-gray-500">2 giờ trước</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Phiếu xuất #PX002 đã được duyệt
              </p>
              <p className="text-xs text-gray-500">4 giờ trước</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Kiểm kê kho đã hoàn thành
              </p>
              <p className="text-xs text-gray-500">1 ngày trước</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
