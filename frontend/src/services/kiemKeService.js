// services/kiemKeService.js
import api from "./api";

export const kiemKeService = {
  // Lấy danh sách phiếu kiểm kê
  getList: async (params = {}) => {
    const response = await api.get("/kiem-ke", { params });
    return response.data;
  },

  // Lấy chi tiết phiếu kiểm kê
  getDetail: async (id) => {
    const response = await api.get(`/kiem-ke/${id}`);
    return response.data;
  },

  // Lấy tồn kho hiện tại cho phiếu kiểm kê
  getTonKhoHienTai: async (id) => {
    const response = await api.get(`/kiem-ke/${id}/ton-kho-hien-tai`);
    return response.data;
  },

  // Tạo phiếu kiểm kê mới
  create: async (data) => {
    const response = await api.post("/kiem-ke", data);
    return response.data;
  },

  // Cập nhật kết quả kiểm kê (chỉ cho phiếu nháp)
  updateResults: async (id, data) => {
    const response = await api.put(`/kiem-ke/${id}`, data);
    return response.data;
  },

  // Duyệt phiếu kiểm kê - chỉ khi này mới cập nhật tồn kho
  approve: async (id) => {
    const response = await api.patch(`/kiem-ke/${id}/approve`);
    return response.data;
  },

  // Hủy phiếu kiểm kê
  cancel: async (id) => {
    const response = await api.patch(`/kiem-ke/${id}/cancel`);
    return response.data;
  },

  // Xóa phiếu kiểm kê
  delete: async (id) => {
    const response = await api.delete(`/kiem-ke/${id}`);
    return response.data;
  },

  // In biên bản kiểm kê
  print: async (id, data) => {
    const response = await api.post(`/kiem-ke/${id}/print`, data);
    return response.data;
  },

  // Thống kê kiểm kê theo thời gian
  getStatistics: async (params = {}) => {
    const response = await api.get("/kiem-ke/statistics", { params });
    return response.data;
  },

  // Xuất Excel danh sách phiếu kiểm kê
  exportList: async (params = {}) => {
    const response = await api.get("/kiem-ke/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // Import dữ liệu kiểm kê từ Excel
  importFromExcel: async (file, phieuId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("phieu_id", phieuId);

    const response = await api.post("/kiem-ke/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Tạo template Excel để nhập liệu
  getImportTemplate: async (phieuId) => {
    const response = await api.get(`/kiem-ke/${phieuId}/import-template`, {
      responseType: "blob",
    });
    return response.data;
  },

  // So sánh kết quả kiểm kê giữa các kỳ
  compareResults: async (phieuId1, phieuId2) => {
    const response = await api.get(
      `/kiem-ke/compare?phieu1=${phieuId1}&phieu2=${phieuId2}`
    );
    return response.data;
  },

  // === CÁC CHỨC NĂNG BỔ SUNG ===

  // Lấy lịch sử kiểm kê của một hàng hóa
  getHistoryByHangHoa: async (hangHoaId, params = {}) => {
    const response = await api.get(`/kiem-ke/history/hang-hoa/${hangHoaId}`, {
      params,
    });
    return response.data;
  },

  // Lấy báo cáo tổng hợp kiểm kê
  getReportSummary: async (params = {}) => {
    const response = await api.get("/kiem-ke/report/summary", { params });
    return response.data;
  },

  // Lấy danh sách phiếu kiểm kê chờ xử lý
  getPendingList: async (params = {}) => {
    const response = await api.get("/kiem-ke/pending", { params });
    return response.data;
  },

  // Cập nhật xử lý chênh lệch
  updateChenhLech: async (id, data) => {
    const response = await api.patch(`/kiem-ke/${id}/chenh-lech`, data);
    return response.data;
  },

  // Tạo phiếu kiểm kê từ template
  createFromTemplate: async (templateId, data) => {
    const response = await api.post(
      `/kiem-ke/create-from-template/${templateId}`,
      data
    );
    return response.data;
  },

  // Lưu template kiểm kê
  saveTemplate: async (data) => {
    const response = await api.post("/kiem-ke/templates", data);
    return response.data;
  },

  // Lấy danh sách template
  getTemplates: async () => {
    const response = await api.get("/kiem-ke/templates");
    return response.data;
  },

  // Xóa template
  deleteTemplate: async (templateId) => {
    const response = await api.delete(`/kiem-ke/templates/${templateId}`);
    return response.data;
  },

  // Tạo phiếu kiểm kê định kỳ tự động
  createAutomatic: async (params = {}) => {
    const response = await api.post("/kiem-ke/create-automatic", params);
    return response.data;
  },

  // Lấy cảnh báo kiểm kê
  getWarnings: async (params = {}) => {
    const response = await api.get("/kiem-ke/warnings", { params });
    return response.data;
  },

  // Lấy danh sách hàng hóa cần kiểm kê đặc biệt
  getSpecialItems: async (params = {}) => {
    const response = await api.get("/kiem-ke/special-items", { params });
    return response.data;
  },

  // Tạo báo cáo chênh lệch
  generateChenhLechReport: async (params = {}) => {
    const response = await api.get("/kiem-ke/report/chenh-lech", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // Tạo báo cáo phẩm chất
  generatePhamChatReport: async (params = {}) => {
    const response = await api.get("/kiem-ke/report/pham-chat", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // Lấy thống kê theo phòng ban
  getStatisticsByPhongBan: async (params = {}) => {
    const response = await api.get("/kiem-ke/statistics/phong-ban", { params });
    return response.data;
  },

  // Lấy thống kê theo loại hàng hóa
  getStatisticsByLoaiHang: async (params = {}) => {
    const response = await api.get("/kiem-ke/statistics/loai-hang", { params });
    return response.data;
  },

  // Lấy thống kê hiệu quả kiểm kê
  getEfficiencyStats: async (params = {}) => {
    const response = await api.get("/kiem-ke/statistics/efficiency", {
      params,
    });
    return response.data;
  },

  // Tạo lịch kiểm kê tự động
  createSchedule: async (data) => {
    const response = await api.post("/kiem-ke/schedule", data);
    return response.data;
  },

  // Lấy lịch kiểm kê
  getSchedule: async (params = {}) => {
    const response = await api.get("/kiem-ke/schedule", { params });
    return response.data;
  },

  // Cập nhật lịch kiểm kê
  updateSchedule: async (id, data) => {
    const response = await api.put(`/kiem-ke/schedule/${id}`, data);
    return response.data;
  },

  // Xóa lịch kiểm kê
  deleteSchedule: async (id) => {
    const response = await api.delete(`/kiem-ke/schedule/${id}`);
    return response.data;
  },

  // Backup dữ liệu kiểm kê
  backupData: async (params = {}) => {
    const response = await api.get("/kiem-ke/backup", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // Restore dữ liệu kiểm kê
  restoreData: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/kiem-ke/restore", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Validate dữ liệu kiểm kê
  validateData: async (id) => {
    const response = await api.post(`/kiem-ke/${id}/validate`);
    return response.data;
  },

  // Tạo QR code cho phiếu kiểm kê
  generateQRCode: async (id) => {
    const response = await api.get(`/kiem-ke/${id}/qr-code`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Tìm kiếm nâng cao
  advancedSearch: async (searchData) => {
    const response = await api.post("/kiem-ke/advanced-search", searchData);
    return response.data;
  },

  // === TƯƠNG THÍCH NGƯỢC ===

  // Lấy danh sách hàng hóa để kiểm kê (tương thích với code cũ)
  getHangHoaForKiemKe: async () => {
    const response = await api.get("/kiem-ke/hang-hoa");
    return response.data;
  },

  // Cập nhật kết quả kiểm kê (tương thích với code cũ)
  updateKetQua: async (id, data) => {
    const response = await api.patch(`/kiem-ke/${id}/ket-qua`, data);
    return response.data;
  },

  // Export excel phiếu kiểm kê (tương thích với code cũ)
  exportExcel: async (id) => {
    const response = await api.get(`/kiem-ke/${id}/export`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Update method cũ (tương thích với code cũ)
  update: async (id, data) => {
    const response = await api.put(`/kiem-ke/${id}`, data);
    return response.data;
  },
};
