// services/yeuCauNhapService.js
import api from "./api";

// Deprecated: yêu cầu đã loại bỏ
export const yeuCauNhapService = {
  // Lấy danh sách yêu cầu nhập kho
  getList: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/yeu-cau-nhap?${queryString}`);
      return response.data;
    } catch (error) {
      console.error("Get yeu cau nhap list error:", error);
      throw error;
    }
  },

  // Lấy chi tiết yêu cầu nhập kho
  getDetail: async (id) => {
    try {
      const response = await api.get(`/yeu-cau-nhap/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get yeu cau nhap detail error:", error);
      throw error;
    }
  },

  // Tạo yêu cầu nhập kho mới
  create: async (data) => {
    try {
      const response = await api.post("/yeu-cau-nhap", data);
      return response.data;
    } catch (error) {
      console.error("Create yeu cau nhap error:", error);
      throw error;
    }
  },

  // Cập nhật yêu cầu nhập kho
  update: async (id, data) => {
    try {
      const response = await api.put(`/yeu-cau-nhap/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Update yeu cau nhap error:", error);
      throw error;
    }
  },

  // Xóa yêu cầu nhập kho
  delete: async (id) => {
    try {
      const response = await api.delete(`/yeu-cau-nhap/${id}`);
      return response.data;
    } catch (error) {
      console.error("Delete yeu cau nhap error:", error);
      throw error;
    }
  },

  // Gửi yêu cầu phê duyệt
  submit: async (id) => {
    try {
      const response = await api.patch(`/yeu-cau-nhap/${id}/submit`);
      return response.data;
    } catch (error) {
      console.error("Submit yeu cau nhap error:", error);
      throw error;
    }
  },

  // Hủy yêu cầu nhập kho
  cancel: async (id, lyDoHuy) => {
    try {
      const response = await api.patch(`/yeu-cau-nhap/${id}/cancel`, {
        ly_do_huy: lyDoHuy,
      });
      return response.data;
    } catch (error) {
      console.error("Cancel yeu cau nhap error:", error);
      throw error;
    }
  },

  // Lấy danh sách chờ phê duyệt
  getPendingApprovals: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(
        `/yeu-cau-nhap/pending-approvals?${queryString}`
      );
      return response.data;
    } catch (error) {
      console.error("Get pending approvals error:", error);
      throw error;
    }
  },

  // Thống kê yêu cầu nhập kho
  getStatistics: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(
        `/analytics/workflow-overview?${queryString}`
      );
      return response.data;
    } catch (error) {
      console.error("Get yeu cau nhap statistics error:", error);
      throw error;
    }
  },

  // Export dữ liệu
  exportData: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/yeu-cau-nhap/export?${queryString}`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Export yeu cau nhap error:", error);
      throw error;
    }
  },
};
