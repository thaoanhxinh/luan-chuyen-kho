import api from "./api";

const BASE_URL = "/don-vi-nhan";

export const donViNhanService = {
  // Lấy danh sách đơn vị nhận
  getList: async (params = {}) => {
    try {
      const response = await api.get(BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error("Get don vi nhan list error:", error);
      throw error;
    }
  },

  // Lấy chi tiết đơn vị nhận
  getDetail: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get don vi nhan detail error:", error);
      throw error;
    }
  },

  // Tạo đơn vị nhận mới
  create: async (data) => {
    try {
      const response = await api.post(BASE_URL, data);
      return response.data;
    } catch (error) {
      console.error("Create don vi nhan error:", error);
      throw error;
    }
  },

  // Cập nhật đơn vị nhận
  update: async (id, data) => {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Update don vi nhan error:", error);
      throw error;
    }
  },

  // Xóa đơn vị nhận
  delete: async (id) => {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Delete don vi nhan error:", error);
      throw error;
    }
  },

  // Lấy gợi ý đơn vị nhận
  getSuggestions: async (params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/suggestions`, { params });
      return response.data;
    } catch (error) {
      console.error("Get don vi nhan suggestions error:", error);
      throw error;
    }
  },

  // Kiểm tra đơn vị nhận có đang được sử dụng không
  checkUsage: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}/usage`);
      return response.data;
    } catch (error) {
      console.error("Check don vi nhan usage error:", error);
      throw error;
    }
  },

  // Lấy thống kê đơn vị nhận
  getStats: async (params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/stats`, { params });
      return response.data;
    } catch (error) {
      console.error("Get don vi nhan stats error:", error);
      throw error;
    }
  },
};
