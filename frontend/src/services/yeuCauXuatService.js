// services/yeuCauXuatService.js
import api from "./api";

// Deprecated: yêu cầu đã loại bỏ
export const yeuCauXuatService = {
  // Lấy danh sách yêu cầu xuất kho
  getList: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/yeu-cau-xuat?${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Get yeu cau xuat list error:", error);
      throw error;
    }
  },

  // Lấy chi tiết yêu cầu xuất kho
  getDetail: async (id) => {
    try {
      const response = await api.get(`/yeu-cau-xuat/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get yeu cau xuat detail error:", error);
      throw error;
    }
  },

  // Tạo yêu cầu xuất kho mới
  create: async (data) => {
    try {
      const response = await api.post("/yeu-cau-xuat", data);
      return response.data;
    } catch (error) {
      console.error("Create yeu cau xuat error:", error);
      throw error;
    }
  },

  // Cập nhật yêu cầu xuất kho
  update: async (id, data) => {
    try {
      const response = await api.put(`/yeu-cau-xuat/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Update yeu cau xuat error:", error);
      throw error;
    }
  },

  // Xóa yêu cầu xuất kho
  delete: async (id) => {
    try {
      const response = await api.delete(`/yeu-cau-xuat/${id}`);
      return response.data;
    } catch (error) {
      console.error("Delete yeu cau xuat error:", error);
      throw error;
    }
  },

  // Gửi yêu cầu phê duyệt
  submit: async (id) => {
    try {
      const response = await api.patch(`/yeu-cau-xuat/${id}/submit`);
      return response.data;
    } catch (error) {
      console.error("Submit yeu cau xuat error:", error);
      throw error;
    }
  },

  // Hủy yêu cầu xuất kho
  cancel: async (id, lyDoHuy) => {
    try {
      const response = await api.patch(`/yeu-cau-xuat/${id}/cancel`, {
        ly_do_huy: lyDoHuy,
      });
      return response.data;
    } catch (error) {
      console.error("Cancel yeu cau xuat error:", error);
      throw error;
    }
  },

  // Kiểm tra tồn kho cho yêu cầu xuất
  checkTonKho: async (id) => {
    try {
      const response = await api.get(`/yeu-cau-xuat/${id}/check-ton-kho`);
      return response.data;
    } catch (error) {
      console.error("Check ton kho error:", error);
      throw error;
    }
  },

  // Lấy danh sách chờ phê duyệt
  getPendingApprovals: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(
        `/yeu-cau-xuat/pending-approvals?${queryString}`
      );
      return response.data;
    } catch (error) {
      console.error("Get pending approvals error:", error);
      throw error;
    }
  },

  // Thống kê yêu cầu xuất kho
  getStatistics: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(
        `/analytics/workflow-overview?${queryString}`
      );
      return response.data;
    } catch (error) {
      console.error("Get yeu cau xuat statistics error:", error);
      throw error;
    }
  },

  // Thống kê theo đơn vị nhận
  getStatisticsByReceiver: async (donViNhanId, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(
        `/analytics/receiver-statistics/${donViNhanId}?${queryString}`
      );
      return response.data;
    } catch (error) {
      console.error("Get statistics by receiver error:", error);
      throw error;
    }
  },

  // Export dữ liệu
  exportData: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/yeu-cau-xuat/export?${queryString}`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Export yeu cau xuat error:", error);
      throw error;
    }
  },
};
