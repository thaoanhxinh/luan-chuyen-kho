import React from "react";
import { formatCurrency, formatDate } from "../../utils/helpers";
import {
  TRANG_THAI_PHIEU,
  LOAI_PHIEU_XUAT,
  PHAM_CHAT,
} from "../../utils/constants";

const PhieuXuatDetail = ({ phieu }) => {
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
                <span className="text-gray-600">Ngày xuất:</span>
                <span className="font-medium">
                  {formatDate(phieu.ngay_xuat)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Loại phiếu:</span>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                  {LOAI_PHIEU_XUAT[phieu.loai_xuat] || "Cấp phát"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Trạng thái:</span>
                <span className={getTrangThaiColor(phieu.trang_thai)}>
                  {TRANG_THAI_PHIEU[phieu.trang_thai]?.label}
                </span>
              </div>
            </div>

            {/* Cột 2: Thông tin đơn vị nhận */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Đơn vị nhận:</span>
                <span className="font-medium">
                  {phieu.don_vi_nhan?.ten_don_vi || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Mã đơn vị:</span>
                <span className="font-medium">
                  {phieu.don_vi_nhan?.ma_don_vi || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Người nhận:</span>
                <span className="font-medium">
                  {phieu.nguoi_nhan || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(phieu.tong_tien)}
                </span>
              </div>
            </div>

            {/* Cột 3: Thông tin thời gian & người xử lý */}
            <div className="space-y-3">
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
              {phieu.user_duyet && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Người duyệt:</span>
                  <span className="font-medium">{phieu.user_duyet.ho_ten}</span>
                </div>
              )}
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
                <span className="text-gray-600">Loại đơn vị:</span>
                <span className="font-medium text-xs">
                  {phieu.don_vi_nhan?.loai_don_vi || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Lý do xuất:</span>
                <span className="font-medium text-xs">
                  {phieu.ly_do_xuat || "Không có"}
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                  Tên hàng hóa
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-16">
                  ĐVT
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-20">
                  SL yêu cầu
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-20">
                  SL thực xuất
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-24">
                  Đơn giá
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-20">
                  Phẩm chất
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase w-20">
                  Số seri
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
                  <td className="px-3 py-2 text-right font-medium">
                    {item.so_luong_yeu_cau?.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    <span className="text-blue-600">
                      {item.so_luong_thuc_xuat?.toLocaleString()}
                    </span>
                    {item.so_luong_thuc_xuat !== item.so_luong_yeu_cau && (
                      <div className="text-xs text-orange-600 mt-1">
                        Chênh lệch:{" "}
                        {(
                          (item.so_luong_thuc_xuat || 0) -
                          (item.so_luong_yeu_cau || 0)
                        ).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-red-600 font-medium">
                    {formatCurrency(item.don_gia)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={getPhamChatColor(item.pham_chat)}>
                      {PHAM_CHAT[item.pham_chat]?.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {item.so_seri_xuat && item.so_seri_xuat.length > 0 ? (
                      <div className="text-xs text-gray-600">
                        {item.so_seri_xuat.slice(0, 2).join(", ")}
                        {item.so_seri_xuat.length > 2 && (
                          <span className="text-gray-400">
                            ... +{item.so_seri_xuat.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-bold">
                    {formatCurrency(item.thanh_tien)}
                  </td>
                </tr>
              ))}
              {phieu.chi_tiet?.length > 0 && (
                <tr className="bg-red-50 font-bold">
                  <td
                    colSpan="9"
                    className="px-3 py-3 text-right text-gray-900"
                  >
                    TỔNG CỘNG:
                  </td>
                  <td className="px-3 py-3 text-right text-red-600 text-lg">
                    {formatCurrency(phieu.tong_tien)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thông tin quyết định xác nhận - nếu có */}
      {phieu.ghi_chu_xac_nhan && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                💬 Ghi chú xác nhận:
              </p>
              <p className="text-sm text-blue-700">{phieu.ghi_chu_xac_nhan}</p>
            </div>
          </div>
        </div>
      )}

      {/* Thông tin quyết định PDF - nếu có */}
      {phieu.decision_pdf_url && (
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                📄 {phieu.decision_pdf_filename || "quyet_dinh_xuat.pdf"}
              </p>
              <p className="text-xs text-green-700 mt-1">
                File quyết định xuất kho đã được upload
              </p>
            </div>
            <a
              href={`http://localhost:5000${phieu.decision_pdf_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 transition-colors"
            >
              Xem file
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhieuXuatDetail;
