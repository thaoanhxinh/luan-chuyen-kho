import React from "react";
import {
  FileText,
  Building,
  Package,
  CreditCard,
  Calendar,
  User,
  ClipboardCheck,
} from "lucide-react";
import { formatCurrency, formatDate, formatNumber } from "../../utils/helpers";
import { TRANG_THAI_KIEM_KE, LOAI_KIEM_KE } from "../../utils/constants";

const PhieuKiemKeDetail = ({ phieu }) => {
  const getTrangThaiColor = (trangThai) => {
    const config = TRANG_THAI_KIEM_KE[trangThai] || {};
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
                <span className="text-gray-600">Loại kiểm kê:</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                  {LOAI_KIEM_KE[phieu.loai_kiem_ke]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Trạng thái:</span>
                <span className={getTrangThaiColor(phieu.trang_thai)}>
                  {TRANG_THAI_KIEM_KE[phieu.trang_thai]?.label}
                </span>
              </div>
            </div>

            {/* Cột 2: Thông tin kiểm kê */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Đơn vị KK:</span>
                <span className="font-medium">
                  {phieu.don_vi_kiem_ke || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Giờ KK:</span>
                <span className="font-medium">
                  {phieu.gio_kiem_ke || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Số MH:</span>
                <span className="font-medium">
                  {phieu.thong_ke?.so_mat_hang || phieu.so_mat_hang || 0}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Chênh lệch GT:</span>
                <span
                  className={`font-bold ${
                    (phieu.thong_ke?.gia_tri_chenh_lech ||
                      phieu.gia_tri_chenh_lech) > 0
                      ? "text-green-600"
                      : (phieu.thong_ke?.gia_tri_chenh_lech ||
                          phieu.gia_tri_chenh_lech) < 0
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {(phieu.thong_ke?.gia_tri_chenh_lech ||
                    phieu.gia_tri_chenh_lech) > 0
                    ? "+"
                    : ""}
                  {formatCurrency(
                    phieu.thong_ke?.gia_tri_chenh_lech ||
                      phieu.gia_tri_chenh_lech ||
                      0
                  )}
                </span>
              </div>
            </div>

            {/* Cột 3: Thông tin thời gian */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Ngày KK:</span>
                <span className="font-medium">
                  {formatDate(phieu.ngay_kiem_ke)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Người tạo:</span>
                <span className="font-medium">
                  {phieu.nguoi_tao_ten || "N/A"}
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
                <span className="text-gray-600">Chênh lệch SL:</span>
                <span
                  className={`font-bold ${
                    (phieu.thong_ke?.chenh_lech || phieu.chenh_lech) > 0
                      ? "text-green-600"
                      : (phieu.thong_ke?.chenh_lech || phieu.chenh_lech) < 0
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {(phieu.thong_ke?.chenh_lech || phieu.chenh_lech) > 0
                    ? "+"
                    : ""}
                  {formatNumber(
                    phieu.thong_ke?.chenh_lech || phieu.chenh_lech || 0
                  )}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Tổ trưởng:</span>
                <span className="font-medium text-xs">
                  {phieu.to_kiem_ke?.to_truong || "Chưa có"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Thủ kho:</span>
                <span className="font-medium text-xs">
                  {phieu.to_kiem_ke?.thu_kho || "Chưa có"}
                </span>
              </div>
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
      {phieu.chi_tiet && phieu.chi_tiet.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h4 className="font-semibold text-gray-900">
              Chi tiết kiểm kê ({phieu.chi_tiet?.length || 0} mặt hàng)
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
                    Tồn sổ
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-20">
                    Tồn thực
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-20">
                    Chênh lệch
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-16">
                    Tốt
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-16">
                    Kém PC
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase w-16">
                    Mất PC
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {phieu.chi_tiet.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-center text-gray-900 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-900">
                      {item.ma_hang_hoa}
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-gray-900 font-medium">
                        {item.ten_hang_hoa}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700">
                      {item.don_vi_tinh}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatNumber(item.so_luong_so_sach)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatNumber(item.so_luong_thuc_te)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`font-bold ${
                          item.so_luong_chenh_lech > 0
                            ? "text-green-600"
                            : item.so_luong_chenh_lech < 0
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {item.so_luong_chenh_lech > 0 ? "+" : ""}
                        {formatNumber(item.so_luong_chenh_lech)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-gray-900">
                      {formatNumber(item.sl_tot || 0)}
                    </td>
                    <td className="px-3 py-2 text-right text-orange-600">
                      {formatNumber(item.sl_kem_pham_chat || 0)}
                    </td>
                    <td className="px-3 py-2 text-right text-red-600">
                      {formatNumber(item.sl_mat_pham_chat || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Thông tin tổ kiểm kê - nếu có */}
      {phieu.to_kiem_ke && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-blue-900">
                👨‍💼 Tổ trưởng: {phieu.to_kiem_ke.to_truong || "Chưa có"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                🏪 Thủ kho: {phieu.to_kiem_ke.thu_kho || "Chưa có"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                👥 Ủy viên 1: {phieu.to_kiem_ke.uy_vien_1 || "Chưa có"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                👥 Ủy viên 2: {phieu.to_kiem_ke.uy_vien_2 || "Chưa có"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                👥 Ủy viên 3: {phieu.to_kiem_ke.uy_vien_3 || "Chưa có"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                👥 Ủy viên 4: {phieu.to_kiem_ke.uy_vien_4 || "Chưa có"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhieuKiemKeDetail;
