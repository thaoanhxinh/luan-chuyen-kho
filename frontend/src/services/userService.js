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

  getDetail: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get user detail error:", error);
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

  updateStatus: async (id, isActive) => {
    try {
      const response = await api.patch(`/users/${id}/status`, {
        is_active: isActive,
      });
      return response.data;
    } catch (error) {
      console.error("Update user status error:", error);
      throw error;
    }
  },

  changeOwnPassword: async (current_password, new_password) => {
    try {
      const response = await api.post(`/account/change-password`, {
        current_password,
        new_password,
      });
      return response.data;
    } catch (error) {
      // Surface backend error message to the UI
      if (error.response && error.response.data) {
        return error.response.data;
      }
      console.error("Change password error:", error);
      return { success: false, message: "Lỗi khi đổi mật khẩu" };
    }
  },

  changeOwnUsername: async (username) => {
    try {
      const response = await api.post(`/account/change-username`, { username });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return error.response.data;
      }
      console.error("Change username error:", error);
      return { success: false, message: "Lỗi khi cập nhật tên đăng nhập" };
    }
  },
};
