import React, { useState } from "react";
import { FileText, Download, User, X } from "lucide-react";
import { xuatKhoService } from "../../services/xuatKhoService";
import toast from "react-hot-toast";

const PrintPhieuXuatForm = ({ phieuId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    tieu_doi_truong_kho: "",
    nguoi_giao: "",
    nguoi_nhan: "",
    nguoi_viet_lenh: "",
    pho_tu_lenh: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await xuatKhoService.printPhieu(phieuId, formData);

      if (response.success) {
        // Tạo link download file Excel
        const downloadUrl = `http://localhost:5000${response.data.downloadUrl}`;

        // Tự động tải file
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = response.data.fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Đang tải file Excel...");
        onSuccess();
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Không thể tạo file in phiếu");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetFill = () => {
    setFormData({
      tieu_doi_truong_kho: "Thiếu tá Nguyễn Văn A",
      nguoi_giao: "Đại úy Trần Văn B",
      nguoi_nhan: "Thượng úy Lê Văn C",
      nguoi_viet_lenh: "Thiếu tướng Phạm Văn D",
      pho_tu_lenh: "Đại tá Hoàng Văn E",
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Thông tin in phiếu xuất kho
          </h3>
        </div>
        <button
          onClick={handlePresetFill}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          title="Điền mẫu"
        >
          Điền mẫu
        </button>
      </div>

      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Lưu ý:</strong> Các thông tin bên dưới sẽ được điền vào phiếu
          xuất. Nếu để trống, phiếu sẽ chỉ hiển thị tiêu đề mục để ghi tay sau
          này.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tiểu đội trưởng kho */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Tiểu đội trưởng kho
            </label>
            <input
              type="text"
              name="tieu_doi_truong_kho"
              value={formData.tieu_doi_truong_kho}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="Ví dụ: Thiếu tá Nguyễn Văn A"
            />
          </div>

          {/* Người giao */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Người giao
            </label>
            <input
              type="text"
              name="nguoi_giao"
              value={formData.nguoi_giao}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="Ví dụ: Đại úy Trần Văn B"
            />
          </div>

          {/* Người nhận */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Người nhận
            </label>
            <input
              type="text"
              name="nguoi_nhan"
              value={formData.nguoi_nhan}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="Ví dụ: Thượng úy Lê Văn C"
            />
          </div>

          {/* Người viết lệnh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Người viết lệnh
            </label>
            <input
              type="text"
              name="nguoi_viet_lenh"
              value={formData.nguoi_viet_lenh}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="Ví dụ: Thiếu tướng Phạm Văn D"
            />
          </div>
        </div>

        {/* Phó tư lệnh */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Phó Tư lệnh
          </label>
          <input
            type="text"
            name="pho_tu_lenh"
            value={formData.pho_tu_lenh}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            placeholder="Ví dụ: Đại tá Hoàng Văn E"
          />
        </div>

        {/* Preview thông tin */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Preview thông tin in:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="font-medium">Tiểu đội trưởng kho:</span>
              <div className="text-gray-600 mt-1">
                {formData.tieu_doi_truong_kho || "(Trống - sẽ in tiêu đề)"}
              </div>
            </div>
            <div>
              <span className="font-medium">Người giao:</span>
              <div className="text-gray-600 mt-1">
                {formData.nguoi_giao || "(Trống - sẽ in tiêu đề)"}
              </div>
            </div>
            <div>
              <span className="font-medium">Người nhận:</span>
              <div className="text-gray-600 mt-1">
                {formData.nguoi_nhan || "(Trống - sẽ in tiêu đề)"}
              </div>
            </div>
            <div>
              <span className="font-medium">Người viết lệnh:</span>
              <div className="text-gray-600 mt-1">
                {formData.nguoi_viet_lenh || "(Trống - sẽ in tiêu đề)"}
              </div>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium">Phó Tư lệnh:</span>
              <div className="text-gray-600 mt-1">
                {formData.pho_tu_lenh || "(Trống - sẽ in tiêu đề)"}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <X size={16} />
            <span>Hủy</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Đang tạo file...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Tạo file Excel</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrintPhieuXuatForm;
