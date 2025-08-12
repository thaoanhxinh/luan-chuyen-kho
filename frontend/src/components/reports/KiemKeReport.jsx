import React, { useState } from "react";
import {
  ClipboardCheck,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
} from "lucide-react";
import { formatCurrency, formatNumber, formatDate } from "../../utils/helpers";
import { TRANG_THAI_KIEM_KE, LOAI_KIEM_KE } from "../../utils/constants";
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
  ComposedChart,
  Area,
} from "recharts";
import Modal from "../common/Modal";
import Pagination from "../common/Pagination";

const KiemKeReport = ({ data }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "ngay_kiem_ke",
    direction: "desc",
  });

  if (!data) {
    return (
      <div className="text-center py-8">
        <ClipboardCheck className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chưa có dữ liệu kiểm kê
        </h3>
        <p className="text-sm text-gray-600">
          Vui lòng thử lại hoặc điều chỉnh bộ lọc
        </p>
      </div>
    );
  }

  const items = data.items || [];
  const thongKe = data.thong_ke || {};

  // Tính toán thống kê tổng quan
  const calculateStats = () => {
    const soPhieuKiemKe = items.length;
    const soPhieuHoanThanh = items.filter(
      (item) => item.trang_thai === "confirmed"
    ).length;
    const soPhieuDangXuLy = items.filter(
      (item) => item.trang_thai === "draft"
    ).length;

    const tongHangHoaKiemKe = items.reduce(
      (sum, item) => sum + (parseInt(item.so_mat_hang) || 0),
      0
    );

    const tongChenhLechSoLuong = items.reduce(
      (sum, item) => sum + (parseFloat(item.so_luong_chenh_lech) || 0),
      0
    );

    const tongChenhLechGiaTri = items.reduce(
      (sum, item) => sum + (parseFloat(item.gia_tri_chenh_lech) || 0),
      0
    );

    const soHangHoaThieu = items.reduce(
      (sum, item) => sum + (parseInt(item.so_hang_hoa_thieu) || 0),
      0
    );

    const soHangHoaThua = items.reduce(
      (sum, item) => sum + (parseInt(item.so_hang_hoa_thua) || 0),
      0
    );

    return {
      soPhieuKiemKe,
      soPhieuHoanThanh,
      soPhieuDangXuLy,
      tongHangHoaKiemKe,
      tongChenhLechSoLuong,
      tongChenhLechGiaTri,
      soHangHoaThieu,
      soHangHoaThua,
    };
  };

  const stats = calculateStats();

  // Chuẩn bị dữ liệu cho biểu đồ xu hướng kiểm kê theo thời gian
  const prepareTimeSeriesData = () => {
    const grouped = items.reduce((acc, item) => {
      const month = new Date(item.ngay_kiem_ke).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          thang: month,
          so_phieu: 0,
          so_hang_hoa: 0,
          chenh_lech_duong: 0,
          chenh_lech_am: 0,
          gia_tri_chenh_lech: 0,
        };
      }

      acc[month].so_phieu += 1;
      acc[month].so_hang_hoa += parseInt(item.so_mat_hang) || 0;

      const chenhLech = parseFloat(item.so_luong_chenh_lech) || 0;
      if (chenhLech > 0) {
        acc[month].chenh_lech_duong += chenhLech;
      } else {
        acc[month].chenh_lech_am += Math.abs(chenhLech);
      }

      acc[month].gia_tri_chenh_lech += parseFloat(item.gia_tri_chenh_lech) || 0;

      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) => new Date(a.thang) - new Date(b.thang)
    );
  };

  // Chuẩn bị dữ liệu cho biểu đồ phân bố theo loại kiểm kê
  const prepareLoaiKiemKeData = () => {
    const grouped = items.reduce((acc, item) => {
      const loai = item.loai_kiem_ke || "dinh_ky";
      if (!acc[loai]) {
        acc[loai] = {
          name: LOAI_KIEM_KE[loai] || loai,
          value: 0,
          so_hang_hoa: 0,
          chenh_lech: 0,
        };
      }

      acc[loai].value += 1;
      acc[loai].so_hang_hoa += parseInt(item.so_mat_hang) || 0;
      acc[loai].chenh_lech += parseFloat(item.gia_tri_chenh_lech) || 0;

      return acc;
    }, {});

    return Object.values(grouped);
  };

  const timeSeriesData = prepareTimeSeriesData();
  const loaiKiemKeData = prepareLoaiKiemKeData();

  const handleViewDetail = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
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

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    let aVal, bVal;

    if (sortConfig.key === "ngay_kiem_ke") {
      aVal = new Date(a.ngay_kiem_ke);
      bVal = new Date(b.ngay_kiem_ke);
    } else if (
      ["so_mat_hang", "so_luong_chenh_lech", "gia_tri_chenh_lech"].includes(
        sortConfig.key
      )
    ) {
      aVal = parseFloat(a[sortConfig.key]) || 0;
      bVal = parseFloat(b[sortConfig.key]) || 0;
    } else {
      aVal = a[sortConfig.key] || "";
      bVal = b[sortConfig.key] || "";
    }

    if (sortConfig.direction === "asc") {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  // Paginate items
  const itemsPerPage = 15;
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="space-y-5">
      {/* Summary Cards - Compact Design */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                Số phiếu KK
              </p>
              <p className="text-lg font-bold text-blue-600 mt-0.5">
                {formatNumber(stats.soPhieuKiemKe)}
              </p>
            </div>
            <FileText className="h-6 w-6 text-blue-500 flex-shrink-0" />
          </div>
          <div className="mt-1">
            <span className="text-xs text-green-600">
              {stats.soPhieuHoanThanh} hoàn thành
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                T.HH kiểm kê
              </p>
              <p className="text-lg font-bold text-purple-600 mt-0.5">
                {formatNumber(stats.tongHangHoaKiemKe)}
              </p>
            </div>
            <ClipboardCheck className="h-6 w-6 text-purple-500 flex-shrink-0" />
          </div>
          <div className="mt-1">
            <span className="text-xs text-gray-600">
              TB:{" "}
              {stats.soPhieuKiemKe > 0
                ? formatNumber(
                    Math.round(stats.tongHangHoaKiemKe / stats.soPhieuKiemKe)
                  )
                : 0}{" "}
              HH/phiếu
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                CL số lượng
              </p>
              <p
                className={`text-lg font-bold mt-0.5 ${
                  stats.tongChenhLechSoLuong >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stats.tongChenhLechSoLuong > 0 ? "+" : ""}
                {formatNumber(stats.tongChenhLechSoLuong)}
              </p>
            </div>
            {stats.tongChenhLechSoLuong >= 0 ? (
              <TrendingUp className="h-6 w-6 text-green-500 flex-shrink-0" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-500 flex-shrink-0" />
            )}
          </div>
          <div className="mt-1">
            <span className="text-xs text-gray-600">
              {stats.tongChenhLechSoLuong >= 0 ? "Thừa" : "Thiếu"}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                CL giá trị
              </p>
              <p
                className={`text-sm font-bold mt-0.5 ${
                  stats.tongChenhLechGiaTri >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stats.tongChenhLechGiaTri > 0 ? "+" : ""}
                {formatCurrency(stats.tongChenhLechGiaTri)}
              </p>
            </div>
            <BarChart3
              className={`h-6 w-6 ${
                stats.tongChenhLechGiaTri >= 0
                  ? "text-green-500"
                  : "text-red-500"
              } flex-shrink-0`}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                HH thiếu
              </p>
              <p className="text-lg font-bold text-red-600 mt-0.5">
                {formatNumber(stats.soHangHoaThieu)}
              </p>
            </div>
            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                HH thừa
              </p>
              <p className="text-lg font-bold text-green-600 mt-0.5">
                {formatNumber(stats.soHangHoaThua)}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Charts - More Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Biểu đồ xu hướng kiểm kê theo tháng */}
        {timeSeriesData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Xu hướng kiểm kê theo tháng
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="thang"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(month) => {
                    const [year, monthNum] = month.split("-");
                    return `${monthNum}/${year}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(month) => {
                    const [year, monthNum] = month.split("-");
                    return `Tháng ${monthNum}/${year}`;
                  }}
                  formatter={(value, name) => [
                    name === "gia_tri_chenh_lech"
                      ? formatCurrency(value)
                      : formatNumber(value),
                    name === "so_phieu"
                      ? "Số phiếu"
                      : name === "so_hang_hoa"
                      ? "Số hàng hóa"
                      : name === "chenh_lech_duong"
                      ? "Thừa"
                      : name === "chenh_lech_am"
                      ? "Thiếu"
                      : "CL giá trị",
                  ]}
                  contentStyle={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="gia_tri_chenh_lech"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.1}
                />
                <Bar dataKey="so_phieu" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Biểu đồ phân bố theo loại kiểm kê */}
        {loaiKiemKeData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Phân bố theo loại kiểm kê
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={loaiKiemKeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    percent > 5 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {loaiKiemKeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"][index % 4]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} phiếu`,
                    `${props.payload.name}`,
                  ]}
                  contentStyle={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Thống kê tổng hợp từ backend nếu có */}
      {thongKe && Object.keys(thongKe).length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Thống kê tổng hợp (từ backend)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-600">
                {formatNumber(thongKe.tong_phieu_kiem_ke || 0)}
              </div>
              <div className="text-xs text-gray-600">Tổng phiếu KK</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {formatNumber(thongKe.tong_hang_hoa_kiem_ke || 0)}
              </div>
              <div className="text-xs text-gray-600">Tổng HH kiểm kê</div>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  (thongKe.tong_gia_tri_chenh_lech || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(thongKe.tong_gia_tri_chenh_lech || 0)}
              </div>
              <div className="text-xs text-gray-600">Tổng CL giá trị</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">
                {formatNumber(
                  (thongKe.so_hang_hoa_thieu || 0) +
                    (thongKe.so_hang_hoa_thua || 0)
                )}
              </div>
              <div className="text-xs text-gray-600">HH có CL</div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Table - Compact Design */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            Chi tiết phiếu kiểm kê ({formatNumber(sortedItems.length)} phiếu)
          </h3>
          <div className="text-xs text-gray-500">
            {startIndex + 1}-
            {Math.min(startIndex + itemsPerPage, sortedItems.length)} /{" "}
            {sortedItems.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Số phiếu
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("ngay_kiem_ke")}
                >
                  Ngày KK {getSortIcon("ngay_kiem_ke")}
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Loại KK
                </th>
                <th
                  className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("so_mat_hang")}
                >
                  Số MH {getSortIcon("so_mat_hang")}
                </th>
                <th
                  className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("so_luong_chenh_lech")}
                >
                  CL SL {getSortIcon("so_luong_chenh_lech")}
                </th>
                <th
                  className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("gia_tri_chenh_lech")}
                >
                  CL GT {getSortIcon("gia_tri_chenh_lech")}
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Người TH
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedItems.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="max-w-28">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {item.so_phieu}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {item.don_vi_kiem_ke}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div>
                      <div className="text-sm text-gray-900">
                        {formatDate(item.ngay_kiem_ke)}
                      </div>
                      {item.gio_kiem_ke && (
                        <div className="text-xs text-gray-500">
                          {item.gio_kiem_ke}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {LOAI_KIEM_KE[item.loai_kiem_ke] || item.loai_kiem_ke}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(item.so_mat_hang || 0)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {item.so_luong_chenh_lech > 0 ? (
                      <div className="flex flex-col items-center">
                        <span className="text-green-600 font-medium text-sm">
                          +{formatNumber(item.so_luong_chenh_lech)}
                        </span>
                        <span className="text-xs text-green-600">Thừa</span>
                      </div>
                    ) : item.so_luong_chenh_lech < 0 ? (
                      <div className="flex flex-col items-center">
                        <span className="text-red-600 font-medium text-sm">
                          {formatNumber(item.so_luong_chenh_lech)}
                        </span>
                        <span className="text-xs text-red-600">Thiếu</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">0</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {item.gia_tri_chenh_lech > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-green-600 font-medium text-sm">
                          +{formatCurrency(item.gia_tri_chenh_lech)}
                        </span>
                      </div>
                    ) : item.gia_tri_chenh_lech < 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-red-600 font-medium text-sm">
                          {formatCurrency(item.gia_tri_chenh_lech)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        {formatCurrency(0)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        TRANG_THAI_KIEM_KE[item.trang_thai]?.color === "green"
                          ? "bg-green-100 text-green-800"
                          : TRANG_THAI_KIEM_KE[item.trang_thai]?.color ===
                            "yellow"
                          ? "bg-yellow-100 text-yellow-800"
                          : TRANG_THAI_KIEM_KE[item.trang_thai]?.color === "red"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {TRANG_THAI_KIEM_KE[item.trang_thai]?.label ||
                        item.trang_thai}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="max-w-24">
                      <div className="text-sm text-gray-900 truncate">
                        {item.nguoi_thuc_hien}
                      </div>
                      {item.ly_do_kiem_ke && (
                        <div className="text-xs text-gray-500 truncate">
                          {item.ly_do_kiem_ke}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => handleViewDetail(item)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedItems.length === 0 && (
          <div className="text-center py-6">
            <ClipboardCheck className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Không có dữ liệu
            </h3>
            <p className="text-xs text-gray-500">
              Không tìm thấy phiếu kiểm kê phù hợp với bộ lọc
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-3 py-2 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Detail Modal - Compact */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Chi tiết phiếu kiểm kê"
        size="xl"
      >
        {selectedItem && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                  Thông tin phiếu
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số phiếu:</span>
                    <span className="font-medium">{selectedItem.so_phieu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày kiểm kê:</span>
                    <span className="font-medium">
                      {formatDate(selectedItem.ngay_kiem_ke)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giờ kiểm kê:</span>
                    <span className="font-medium">
                      {selectedItem.gio_kiem_ke}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Đơn vị:</span>
                    <span className="font-medium truncate ml-2">
                      {selectedItem.don_vi_kiem_ke}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loại:</span>
                    <span className="font-medium">
                      {LOAI_KIEM_KE[selectedItem.loai_kiem_ke] ||
                        selectedItem.loai_kiem_ke}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span
                      className={`font-medium px-2 py-0.5 rounded text-xs ${
                        TRANG_THAI_KIEM_KE[selectedItem.trang_thai]?.color ===
                        "green"
                          ? "bg-green-100 text-green-800"
                          : TRANG_THAI_KIEM_KE[selectedItem.trang_thai]
                              ?.color === "yellow"
                          ? "bg-yellow-100 text-yellow-800"
                          : TRANG_THAI_KIEM_KE[selectedItem.trang_thai]
                              ?.color === "red"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {TRANG_THAI_KIEM_KE[selectedItem.trang_thai]?.label ||
                        selectedItem.trang_thai}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                  Kết quả kiểm kê
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số mặt hàng:</span>
                    <span className="font-medium">
                      {formatNumber(selectedItem.so_mat_hang || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chênh lệch SL:</span>
                    <span
                      className={`font-medium ${
                        selectedItem.so_luong_chenh_lech > 0
                          ? "text-green-600"
                          : selectedItem.so_luong_chenh_lech < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {selectedItem.so_luong_chenh_lech > 0 ? "+" : ""}
                      {formatNumber(selectedItem.so_luong_chenh_lech || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chênh lệch GT:</span>
                    <span
                      className={`font-medium ${
                        selectedItem.gia_tri_chenh_lech > 0
                          ? "text-green-600"
                          : selectedItem.gia_tri_chenh_lech < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {selectedItem.gia_tri_chenh_lech > 0 ? "+" : ""}
                      {formatCurrency(selectedItem.gia_tri_chenh_lech || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Người thực hiện:</span>
                    <span className="font-medium truncate ml-2">
                      {selectedItem.nguoi_thuc_hien}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thống kê chi tiết - Compact */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                Phân tích chênh lệch
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {selectedItem.so_luong_chenh_lech > 0
                      ? formatNumber(selectedItem.so_luong_chenh_lech)
                      : "0"}
                  </div>
                  <div className="text-xs text-green-600 mt-1">SL thừa</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {selectedItem.so_luong_chenh_lech < 0
                      ? formatNumber(Math.abs(selectedItem.so_luong_chenh_lech))
                      : "0"}
                  </div>
                  <div className="text-xs text-red-600 mt-1">SL thiếu</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(
                      Math.abs(selectedItem.gia_tri_chenh_lech || 0)
                    )}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">GT tuyệt đối</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {selectedItem.so_mat_hang > 0
                      ? (
                          (Math.abs(selectedItem.so_luong_chenh_lech || 0) /
                            selectedItem.so_mat_hang) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %
                  </div>
                  <div className="text-xs text-purple-600 mt-1">Tỷ lệ CL</div>
                </div>
              </div>
            </div>

            {/* Lý do và đề xuất xử lý */}
            {(selectedItem.ly_do_kiem_ke || selectedItem.de_nghi_xu_ly) && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedItem.ly_do_kiem_ke && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                        Lý do kiểm kê
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-700">
                          {selectedItem.ly_do_kiem_ke}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedItem.de_nghi_xu_ly && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                        Đề nghị xử lý
                      </h4>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-xs text-gray-700">
                          {selectedItem.de_nghi_xu_ly}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KiemKeReport;
