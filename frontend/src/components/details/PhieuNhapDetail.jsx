import React from "react";
import {
  FileText,
  Building,
  Package,
  CreditCard,
  Calendar,
  User,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import {
  TRANG_THAI_PHIEU,
  LOAI_PHIEU_NHAP,
  PHAM_CHAT,
} from "../../utils/constants";

const PhieuNhapDetail = ({ phieu }) => {
  const getTrangThaiColor = (trangThai) => {
    const config = TRANG_THAI_PHIEU[trangThai] || {};
    const colorMap = {
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      yellow: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return `inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
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
    return `inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
      colorMap[config.color] || colorMap.gray
    }`;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Thông tin tổng quan dạng bảng 4 cột */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Cột 1: Thông tin phiếu */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Số phiếu:</span>
                <span className="font-bold">{phieu.so_phieu}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Số QĐ:</span>
                <span className="font-medium">
                  {phieu.so_quyet_dinh || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Loại phiếu:</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                  {LOAI_PHIEU_NHAP[phieu.loai_phieu]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Trạng thái:</span>
                <span className={getTrangThaiColor(phieu.trang_thai)}>
                  {TRANG_THAI_PHIEU[phieu.trang_thai]?.label}
                </span>
              </div>
            </div>

            {/* Cột 2: Thông tin nhà cung cấp */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Tên NCC:</span>
                <span className="font-medium">
                  {phieu.nha_cung_cap?.ten_ncc || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">MST:</span>
                <span className="font-medium">
                  {phieu.nha_cung_cap?.ma_so_thue || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Số HĐ:</span>
                <span className="font-medium">
                  {phieu.so_hoa_don || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(phieu.tong_tien)}
                </span>
              </div>
            </div>

            {/* Cột 3: Thông tin thời gian */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Ngày nhập:</span>
                <span className="font-medium">
                  {formatDate(phieu.ngay_nhap)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Người tạo:</span>
                <span className="font-medium">
                  {phieu.user_tao?.ho_ten || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Ngày tạo:</span>
                <span className="font-medium text-xs">
                  {formatDate(phieu.created_at)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Cập nhật:</span>
                <span className="font-medium text-xs">
                  {formatDate(phieu.updated_at)}
                </span>
              </div>
            </div>

            {/* Cột 4: Thông tin khác */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Địa chỉ:</span>
                <span className="font-medium text-xs">
                  {phieu.nha_cung_cap?.dia_chi || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Lý do nhập:</span>
                <span className="font-medium text-xs">
                  {phieu.ly_do_nhap || "Không có"}
                </span>
              </div>
              {phieu.decision_pdf_url && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Quyết định:</span>
                  <a
                    href={`http://localhost:5000${phieu.decision_pdf_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                  >
                    Xem PDF
                  </a>
                </div>
              )}
              {phieu.ghi_chu && (
                <div className="col-span-2 text-sm">
                  <span className="text-gray-600">Ghi chú:</span>
                  <p className="text-xs text-gray-700 mt-1 p-2 bg-gray-50 rounded">
                    {phieu.ghi_chu}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bảng chi tiết hàng hóa */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h4 className="font-semibold text-gray-900">
            Chi tiết hàng hóa ({phieu.chi_tiet?.length || 0} mặt hàng)
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase w-12">
                  STT
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                  Mã HH
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-24">
                  Danh điểm
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                  Tên hàng hóa
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-16">
                  ĐVT
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-20">
                  SL
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-24">
                  Đơn giá
                </th>

                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-20">
                  Phẩm chất
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-24">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {phieu.chi_tiet?.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-center text-gray-900 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-900">
                    {item.hang_hoa?.ma_hang_hoa}
                  </td>

                  <td className="px-3 py-2 text-center">
                    {item.danh_diem ? (
                      <span
                        className="text-blue-600 font-medium text-xs"
                        title={item.danh_diem}
                      >
                        {item.danh_diem.length > 15
                          ? `${item.danh_diem.substring(0, 15)}...`
                          : item.danh_diem}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    <div className="text-gray-900 font-medium">
                      {item.hang_hoa?.ten_hang_hoa}
                    </div>
                    {item.hang_hoa?.mo_ta && (
                      <div className="text-xs text-gray-500 mt-1">
                        {item.hang_hoa.mo_ta}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700">
                    {item.hang_hoa?.don_vi_tinh}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {item.so_luong?.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-green-600 font-medium">
                    {formatCurrency(item.don_gia)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={getPhamChatColor(item.pham_chat)}>
                      {PHAM_CHAT[item.pham_chat]?.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-bold">
                    {formatCurrency(item.thanh_tien)}
                  </td>
                </tr>
              ))}
              {phieu.chi_tiet?.length > 0 && (
                <tr className="bg-green-50 font-bold">
                  <td
                    colSpan="7"
                    className="px-3 py-3 text-right text-gray-900"
                  >
                    TỔNG CỘNG:
                  </td>
                  <td className="px-3 py-3 text-right text-green-600 text-lg">
                    {formatCurrency(phieu.tong_tien)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thông tin quyết định - nếu có */}
      {phieu.decision_pdf_url && phieu.ghi_chu_hoan_thanh && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                📄 {phieu.decision_pdf_filename || "quyet_dinh.pdf"}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                💬 {phieu.ghi_chu_hoan_thanh}
              </p>
            </div>
            <a
              href={`http://localhost:5000${phieu.decision_pdf_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              Xem file
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhieuNhapDetail;
