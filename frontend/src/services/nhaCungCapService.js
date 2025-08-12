import api from "./api";

const BASE_URL = "/api/nha-cung-cap";

export const nhaCungCapService = {
  // Lấy danh sách nhà cung cấp
  getList: async (params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/list`, { params });
      return response.data;
    } catch (error) {
      console.error("Get nha cung cap list error:", error);
      throw error;
    }
  },

  // Lấy chi tiết nhà cung cấp
  getDetail: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get nha cung cap detail error:", error);
      throw error;
    }
  },

  // Tạo nhà cung cấp mới
  create: async (data) => {
    try {
      const response = await api.post(BASE_URL, data);
      return response.data;
    } catch (error) {
      console.error("Create nha cung cap error:", error);
      throw error;
    }
  },

  // Cập nhật nhà cung cấp
  update: async (id, data) => {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Update nha cung cap error:", error);
      throw error;
    }
  },

  // Xóa nhà cung cấp
  delete: async (id) => {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Delete nha cung cap error:", error);
      throw error;
    }
  },

  // Lấy gợi ý nhà cung cấp
  getSuggestions: async (params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/suggestions`, { params });
      return response.data;
    } catch (error) {
      console.error("Get nha cung cap suggestions error:", error);
      throw error;
    }
  },

  // Lấy gợi ý cho search (sử dụng endpoint hiện tại)
  getSearchSuggestions: async (params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/search/suggestions`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Get nha cung cap search suggestions error:", error);
      throw error;
    }
  },

  // Tự động tạo nhà cung cấp
  autoCreate: async (data) => {
    try {
      const response = await api.post(`${BASE_URL}/auto-create`, data);
      return response.data;
    } catch (error) {
      console.error("Auto create nha cung cap error:", error);
      throw error;
    }
  },

  // Kiểm tra nhà cung cấp có đang được sử dụng không
  checkUsage: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}/usage`);
      return response.data;
    } catch (error) {
      console.error("Check nha cung cap usage error:", error);
      throw error;
    }
  },

  // Lấy thống kê nhà cung cấp
  getStats: async (params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/stats`, { params });
      return response.data;
    } catch (error) {
      console.error("Get nha cung cap stats error:", error);
      throw error;
    }
  },

  // Lấy top nhà cung cấp theo giá trị
  getTopSuppliers: async (params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/top-suppliers`, { params });
      return response.data;
    } catch (error) {
      console.error("Get top suppliers error:", error);
      throw error;
    }
  },
};
