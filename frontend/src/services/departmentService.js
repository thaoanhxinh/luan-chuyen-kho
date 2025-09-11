import api from "./api";

export const departmentService = {
  getList: async (params = {}) => {
    try {
      const response = await api.get("/departments", { params });
      return response.data; // API returns {success: true, data: {items, pagination}}
    } catch (error) {
      console.error("Get departments error:", error);
      throw error;
    }
  },

  // Lấy danh sách phòng ban theo quyền truy cập của user hiện tại
  getAccessibleList: async () => {
    try {
      const response = await api.get("/departments/list/accessible");
      return response.data; // API returns {success: true, data: Department[]}
    } catch (error) {
      console.error("Get accessible departments error:", error);
      throw error;
    }
  },

  // Lấy cấu trúc tổ chức 3 cấp
  getOrganizationStructure: async () => {
    try {
      const response = await api.get("/departments/organization-structure");
      return response.data;
    } catch (error) {
      console.error("Get organization structure error:", error);
      throw error;
    }
  },

  // Lấy danh sách phòng ban có thể cung cấp cho phòng ban hiện tại
  getPhongBanCungCap: async (params = {}) => {
    try {
      const response = await api.get("/departments/phong-ban-cung-cap", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Get phong ban cung cap error:", error);
      throw error;
    }
  },

  // Lấy danh sách phòng ban có thể nhận hàng từ phòng ban hiện tại
  getPhongBanCoTheNhan: async (params = {}) => {
    try {
      const response = await api.get("/departments/phong-ban-co-the-nhan", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Get phong ban co the nhan error:", error);
      throw error;
    }
  },

  // Kiểm tra quyền thao tác với phòng ban khác
  checkPermission: async (phongBanId, action) => {
    try {
      const response = await api.post("/departments/check-permission", {
        phong_ban_id: phongBanId,
        action: action,
      });
      return response.data;
    } catch (error) {
      console.error("Check permission error:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post("/departments", data);
      return response.data;
    } catch (error) {
      console.error("Create department error:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/departments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Update department error:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/departments/${id}`);
      return response.data;
    } catch (error) {
      console.error("Delete department error:", error);
      throw error;
    }
  },

  assignUsers: async (id, userIds) => {
    try {
      const response = await api.post(`/departments/${id}/assign-users`, {
        userIds,
      });
      return response.data;
    } catch (error) {
      console.error("Assign users error:", error);
      throw error;
    }
  },
};
