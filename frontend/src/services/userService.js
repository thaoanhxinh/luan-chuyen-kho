import api from "./api";

export const userService = {
  getList: async (params = {}) => {
    try {
      const response = await api.get("/users", { params });
      return response.data; // API returns {success: true, data: {items, pagination}}
    } catch (error) {
      console.error("Get users error:", error);
      throw error;
    }
  },

  getDepartmentsList: async () => {
    try {
      const response = await api.get("/departments");
      return response.data; // API returns {success: true, data: [...]}
    } catch (error) {
      console.error("Get departments error:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post("/users", data);
      return response.data;
    } catch (error) {
      console.error("Create user error:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error("Delete user error:", error);
      throw error;
    }
  },

  resetPassword: async (id) => {
    try {
      const response = await api.post(`/users/${id}/reset-password`);
      return response.data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  },
};
