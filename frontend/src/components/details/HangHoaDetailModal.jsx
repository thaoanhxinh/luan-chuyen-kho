import React, { useState, useEffect } from "react";
import {
  Package,
  BarChart3,
  DollarSign,
  Building,
  Tag,
  Download,
  Upload,
  Network,
  MapPin,
} from "lucide-react";
import { hangHoaService } from "../../services/hangHoaService";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { PHAM_CHAT, TRANG_THAI_PHIEU } from "../../utils/constants";
import Modal from "../common/Modal";
import Loading from "../common/Loading";
import toast from "react-hot-toast";

const HangHoaDetailModal = ({ hangHoaId, isOpen, onClose }) => {
  const [hangHoa, setHangHoa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("statistics");
  const [timePeriod, setTimePeriod] = useState("thang");

  useEffect(() => {
    if (isOpen && hangHoaId) {
      loadHangHoaDetail();
    }
  }, [isOpen, hangHoaId]);

  const loadHangHoaDetail = async () => {
    try {
      setLoading(true);
      const response = await hangHoaService.getDetail(hangHoaId);
      setHangHoa(response.data);
    } catch (error) {
      console.error("Error loading hang hoa detail:", error);
      toast.error("Không thể tải chi tiết hàng hóa");
    } finally {
      setLoading(false);
    }
  };

  const getPhamChatColor = (phamChat) => {
    const config = PHAM_CHAT[phamChat] || {};
    const colorMap = {
      green: "bg-green-100 text-green-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      red: "bg-red-100 text-red-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return `inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
  };

  const getTrangThaiColor = (trangThai) => {
    const config = TRANG_THAI_PHIEU[trangThai] || {};
    const colorMap = {
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      yellow: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return `inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
  };

  const formatInteger = (value) => {
    if (!value) return "0";
    return Math.floor(value).toLocaleString();
  };

  const getInventorySerials = () => {
    if (!hangHoa?.danh_sach_seri) return [];
    return hangHoa.danh_sach_seri
      .filter((seri) => seri.trang_thai === "ton_kho")
      .map((seri) => ({
        so_seri: seri.so_seri,
        ngay_nhap: seri.ngay_nhap,
        don_gia: seri.don_gia,
        pham_chat: seri.pham_chat,
        so_phieu: seri.so_phieu,
      }));
  };

  const getStatsByPeriod = () => {
    if (!hangHoa?.thong_ke) return { nhap: [], xuat: [] };

    switch (timePeriod) {
      case "thang":
        return {
          nhap: hangHoa.thong_ke.nhap_theo_thang || [],
          xuat: hangHoa.thong_ke.xuat_theo_thang || [],
        };
      case "quy":
        return {
          nhap: hangHoa.thong_ke.nhap_theo_quy || [],
          xuat: hangHoa.thong_ke.xuat_theo_quy || [],
        };
      case "nam":
        return {
          nhap: hangHoa.thong_ke.nhap_theo_nam || [],
          xuat: hangHoa.thong_ke.xuat_theo_nam || [],
        };
      default:
        return { nhap: [], xuat: [] };
    }
  };

  const formatPeriodLabel = (item) => {
    switch (timePeriod) {
      case "thang":
        return `${item.thang}/${item.nam}`;
      case "quy":
        return `Q${item.quy}/${item.nam}`;
      case "nam":
        return `${item.nam}`;
      default:
        return "";
    }
  };

  // Lấy lịch sử nhập của phòng ban hiện tại
  const getImportHistory = () => {
    return hangHoa?.lich_su_nhap || [];
  };

  // Lấy lịch sử xuất của phòng ban hiện tại
  const getExportHistory = () => {
    return hangHoa?.lich_su_xuat || [];
  };

  // Lấy lịch sử giá của phòng ban hiện tại
  const getPriceHistory = () => {
    return hangHoa?.lich_su_gia || [];
  };

  // Tính tổng tồn kho từ tất cả các cấp (từ ton_kho_chi_tiet)
  const getTotalInventoryFromLevels = () => {
    if (!hangHoa?.ton_kho_chi_tiet) return 0;
    return hangHoa.ton_kho_chi_tiet.reduce(
      (total, item) => total + (item.tong_ton || 0),
      0
    );
  };

  // Nhóm tồn kho theo cấp bậc
  const getInventoryByCapBac = () => {
    if (!hangHoa?.ton_kho_chi_tiet) return {};

    const grouped = hangHoa.ton_kho_chi_tiet.reduce((acc, item) => {
      const capBac = item.cap_bac || 0;
      if (!acc[capBac]) {
        acc[capBac] = [];
      }
      acc[capBac].push(item);
      return acc;
    }, {});
    return grouped;
  };

  if (loading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết hàng hóa"
        size="xl"
      >
        <div className="flex items-center justify-center py-12">
          <Loading size="large" />
        </div>
      </Modal>
    );
  }

  if (!hangHoa) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Chi tiết hàng hóa"
        size="xl"
      >
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy dữ liệu hàng hóa</p>
        </div>
      </Modal>
    );
  }

  const inventorySerials = getInventorySerials();
  const statsData = getStatsByPeriod();
  const importHistory = getImportHistory();
  const exportHistory = getExportHistory();
  const priceHistory = getPriceHistory();
  const totalInventoryFromLevels = getTotalInventoryFromLevels();
  const inventoryByCapBac = getInventoryByCapBac();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết: ${hangHoa.ten_hang_hoa}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {hangHoa.ten_hang_hoa}
                </h2>
                <p className="text-gray-600">Mã: {hangHoa.ma_hang_hoa}</p>
                <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Building className="h-3 w-3 mr-1" />
                    {hangHoa.ten_phong_ban_goc}
                  </span>
                  <span className="flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    {hangHoa.ten_loai}
                  </span>
                  <span>Đơn vị: {hangHoa.don_vi_tinh}</span>
                  {hangHoa.la_tai_san_co_dinh && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                      Tài sản cố định
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Giá nhập gần nhất</div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(hangHoa.gia_nhap_gan_nhat || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-green-600 font-medium">
                  Tồn kho (Phòng ban)
                </div>
                <div className="text-lg font-bold text-green-800">
                  {formatInteger(hangHoa.so_luong_ton_current || 0)}
                </div>
                {hangHoa.permissions?.can_view_system_stats &&
                  totalInventoryFromLevels > 0 &&
                  totalInventoryFromLevels !==
                    (hangHoa.so_luong_ton_current || 0) && (
                    <div className="text-xs text-green-600">
                      Tổng hệ thống: {formatInteger(totalInventoryFromLevels)}
                    </div>
                  )}
              </div>
              <Package className="h-5 w-5 text-green-600" />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-600 font-medium">
                  Đã nhập (Phòng ban)
                </div>
                <div className="text-lg font-bold text-blue-800">
                  {formatInteger(hangHoa.thong_ke?.tong_da_nhap || 0)}
                </div>
              </div>
              <Download className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-orange-600 font-medium">
                  Đã xuất (Phòng ban)
                </div>
                <div className="text-lg font-bold text-orange-800">
                  {formatInteger(hangHoa.thong_ke?.tong_da_xuat || 0)}
                </div>
              </div>
              <Upload className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Quality breakdown */}
        {hangHoa.so_luong_ton_current && hangHoa.so_luong_ton_current > 0 && (
          <div className="flex flex-wrap gap-2">
            {[
              { key: "sl_tot", label: "Tốt", color: "green" },
              { key: "sl_kem_pham_chat", label: "Kém", color: "yellow" },
              { key: "sl_mat_pham_chat", label: "Mất", color: "orange" },
            ].map(
              ({ key, label, color }) =>
                hangHoa[key] > 0 && (
                  <div
                    key={key}
                    className={`inline-flex items-center px-2 py-1 rounded-md bg-${color}-50 border border-${color}-200`}
                  >
                    <span className={`text-xs text-${color}-600 mr-1`}>
                      {label}:
                    </span>
                    <span className={`text-xs font-semibold text-${color}-800`}>
                      {formatInteger(hangHoa[key])}
                    </span>
                  </div>
                )
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            {[
              { id: "statistics", label: "Thống kê", icon: BarChart3 },
              {
                id: "distribution",
                label: `Phân bố (${
                  hangHoa.ton_kho_chi_tiet?.length || 0
                } đơn vị)`,
                icon: Network,
              },
              {
                id: "import-history",
                label: `Lịch sử nhập (${importHistory.length})`,
                icon: Download,
              },
              {
                id: "export-history",
                label: `Lịch sử xuất (${exportHistory.length})`,
                icon: Upload,
              },
              {
                id: "price-history",
                label: `Lịch sử giá (${priceHistory.length})`,
                icon: DollarSign,
              },
              ...(hangHoa.co_so_seri
                ? [
                    {
                      id: "serial",
                      label: `Số seri (${inventorySerials.length})`,
                      icon: Tag,
                    },
                  ]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon && <tab.icon className="h-4 w-4 mr-1" />}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "distribution" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-semibold text-gray-900">
                  Phân bố tồn kho theo cấu trúc 3 cấp
                </h3>
                <div className="text-sm text-gray-600">
                  Tổng: {formatInteger(totalInventoryFromLevels)}{" "}
                  {hangHoa.don_vi_tinh}
                </div>
              </div>

              {hangHoa.ton_kho_chi_tiet &&
              hangHoa.ton_kho_chi_tiet.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(inventoryByCapBac)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([capBac, items]) => (
                      <div key={capBac} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <MapPin className="h-4 w-4 text-gray-600 mr-2" />
                          <h4 className="font-medium text-gray-900">
                            Cấp {capBac} ({items.length} đơn vị)
                          </h4>
                          <div className="ml-auto text-sm text-gray-600">
                            Tổng:{" "}
                            {formatInteger(
                              items.reduce(
                                (sum, item) => sum + (item.tong_ton || 0),
                                0
                              )
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {items.map((item, index) => (
                            <div
                              key={index}
                              className="bg-white rounded border p-3"
                            >
                              <div className="font-medium text-gray-900 text-sm">
                                {item.ten_phong_ban}
                              </div>
                              <div className="text-xs text-gray-600">
                                {item.ma_phong_ban}
                              </div>
                              <div className="mt-2 flex justify-between items-center">
                                <span className="text-xs text-gray-500">
                                  Tồn kho:
                                </span>
                                <span className="font-semibold text-green-600">
                                  {formatInteger(item.tong_ton || 0)}
                                </span>
                              </div>
                              {item.gia_tri_ton > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">
                                    Giá trị:
                                  </span>
                                  <span className="text-xs text-blue-600">
                                    {formatCurrency(item.gia_tri_ton)}
                                  </span>
                                </div>
                              )}
                              {item.nguon_goc && (
                                <div className="mt-1">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      item.nguon_goc === "Hàng hóa gốc"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {item.nguon_goc}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có phân bố tồn kho</p>
                  <p className="text-sm text-gray-400">
                    Hàng hóa chưa được phân phối đến các đơn vị khác
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "statistics" && (
            <div className="space-y-4">
              {/* Time Period Selector */}
              <div className="flex justify-between items-center">
                <h3 className="text-md font-semibold text-gray-900">
                  Thống kê nhập xuất của phòng ban (chỉ phiếu hoàn thành)
                </h3>
                <div className="flex space-x-1">
                  {[
                    { value: "thang", label: "Tháng" },
                    { value: "quy", label: "Quý" },
                    { value: "nam", label: "Năm" },
                  ].map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setTimePeriod(period.value)}
                      className={`px-3 py-1 text-xs rounded-md ${
                        timePeriod === period.value
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statistics Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Import Statistics */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-blue-50 border-b">
                    <h4 className="font-medium text-blue-900 flex items-center text-sm">
                      <Download className="h-4 w-4 mr-1" />
                      Thống kê nhập
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">
                            Thời gian
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            SL nhập
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            Phiếu
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            Giá trị
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {statsData.nhap.length > 0 ? (
                          statsData.nhap.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium">
                                {formatPeriodLabel(item)}
                              </td>
                              <td className="px-3 py-2 text-right text-blue-600 font-medium">
                                {formatInteger(item.so_luong_nhap)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.so_phieu_nhap || 0}
                              </td>
                              <td className="px-3 py-2 text-right text-green-600 font-medium">
                                {formatCurrency(item.gia_tri_nhap)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-3 py-6 text-center text-gray-500"
                            >
                              Chưa có dữ liệu
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Export Statistics */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-orange-50 border-b">
                    <h4 className="font-medium text-orange-900 flex items-center text-sm">
                      <Upload className="h-4 w-4 mr-1" />
                      Thống kê xuất
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">
                            Thời gian
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            SL xuất
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            Phiếu
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                            Giá trị
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {statsData.xuat.length > 0 ? (
                          statsData.xuat.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium">
                                {formatPeriodLabel(item)}
                              </td>
                              <td className="px-3 py-2 text-right text-orange-600 font-medium">
                                {formatInteger(item.so_luong_xuat)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {item.so_phieu_xuat || 0}
                              </td>
                              <td className="px-3 py-2 text-right text-green-600 font-medium">
                                {formatCurrency(item.gia_tri_xuat)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-3 py-6 text-center text-gray-500"
                            >
                              Chưa có dữ liệu
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "import-history" && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 flex items-center">
                  <Download className="h-4 w-4 mr-2 text-blue-600" />
                  Lịch sử nhập hàng của phòng ban (chỉ phiếu hoàn thành)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Số phiếu
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Ngày nhập
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Loại phiếu
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Nhà cung cấp/Đơn vị
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Số lượng
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Đơn giá
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        Phẩm chất
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {importHistory.map((batch, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {batch.so_phieu}
                        </td>
                        <td className="px-4 py-2">
                          {formatDate(batch.ngay_nhap)}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              batch.loai_phieu === "tu_mua"
                                ? "bg-blue-100 text-blue-800"
                                : batch.loai_phieu === "tren_cap"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {batch.loai_phieu === "tu_mua"
                              ? "Tự mua"
                              : batch.loai_phieu === "tren_cap"
                              ? "Từ cấp trên"
                              : batch.loai_phieu === "dieu_chuyen"
                              ? "Điều chuyển"
                              : batch.loai_phieu}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {batch.ten_ncc ||
                            batch.ten_don_vi_cung_cap ||
                            "Chưa có"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatInteger(batch.so_luong)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">
                          {formatCurrency(batch.don_gia)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={getPhamChatColor(batch.pham_chat)}>
                            {PHAM_CHAT[batch.pham_chat]?.label ||
                              batch.pham_chat}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          {formatCurrency(batch.thanh_tien)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importHistory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Chưa có lịch sử nhập hàng hoàn thành
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "export-history" && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 flex items-center">
                  <Upload className="h-4 w-4 mr-2 text-orange-600" />
                  Lịch sử xuất hàng của phòng ban (chỉ phiếu hoàn thành)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Số phiếu
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Ngày xuất
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Loại xuất
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Đơn vị nhận
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        SL yêu cầu
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        SL thực xuất
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Đơn giá
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        Phẩm chất
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {exportHistory.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {record.so_phieu}
                        </td>
                        <td className="px-4 py-2">
                          {formatDate(record.ngay_xuat)}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              record.loai_xuat === "chuyen_noi_bo"
                                ? "bg-purple-100 text-purple-800"
                                : record.loai_xuat === "don_vi_nhan"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {record.loai_xuat === "chuyen_noi_bo"
                              ? "Chuyển nội bộ"
                              : record.loai_xuat === "don_vi_nhan"
                              ? "Đơn vị nhận"
                              : record.loai_xuat}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {record.ten_phong_ban_nhan || "Chưa có"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatInteger(record.so_luong_yeu_cau)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-orange-600">
                          {formatInteger(record.so_luong_thuc_xuat)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">
                          {formatCurrency(record.don_gia)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={getPhamChatColor(record.pham_chat)}>
                            {PHAM_CHAT[record.pham_chat]?.label ||
                              record.pham_chat}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          {formatCurrency(record.thanh_tien)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {exportHistory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Chưa có lịch sử xuất hàng hoàn thành
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "price-history" && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-900">
                  Lịch sử giá của phòng ban
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Ngày áp dụng
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Số phiếu
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Loại phiếu
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Nhà cung cấp
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Đơn giá
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {priceHistory.map((price, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {formatDate(price.ngay_ap_dung)}
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {price.so_phieu}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              price.loai_phieu === "tu_mua"
                                ? "bg-blue-100 text-blue-800"
                                : price.loai_phieu === "tren_cap"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {price.loai_phieu === "tu_mua"
                              ? "Tự mua"
                              : price.loai_phieu === "tren_cap"
                              ? "Từ cấp trên"
                              : price.loai_phieu === "dieu_chuyen"
                              ? "Điều chuyển"
                              : price.loai_phieu}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {price.ten_ncc || "Chưa có"}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">
                          {formatCurrency(price.don_gia)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={getTrangThaiColor(price.trang_thai)}>
                            {TRANG_THAI_PHIEU[price.trang_thai]?.label ||
                              price.trang_thai}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {priceHistory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Chưa có lịch sử giá</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "serial" && hangHoa.co_so_seri && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-blue-600" />
                  Danh sách số seri tồn kho
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Số seri
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Số phiếu
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        Ngày nhập
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        Đơn giá
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        Phẩm chất
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventorySerials.map((seri, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {seri.so_seri}
                        </td>
                        <td className="px-4 py-2">{seri.so_phieu}</td>
                        <td className="px-4 py-2">
                          {formatDate(seri.ngay_nhap)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">
                          {formatCurrency(seri.don_gia)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={getPhamChatColor(seri.pham_chat)}>
                            {PHAM_CHAT[seri.pham_chat]?.label || seri.pham_chat}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                            Tồn kho
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {inventorySerials.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Không có số seri nào đang tồn kho
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default HangHoaDetailModal;
