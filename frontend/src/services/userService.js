import api from "./api";

export const userService = {
  // Lấy danh sách nhân viên
  getUsers: (params = {}) => {
    return api.get("/users", { params });
  },

  // Tạo nhân viên mới
  createUser: (data) => {
    return api.post("/users", data);
  },

  // Cập nhật nhân viên
  updateUser: (id, data) => {
    return api.put(`/users/${id}`, data);
  },

  // Xóa nhân viên
  deleteUser: (id) => {
    return api.delete(`/users/${id}`);
  },

  // Phân quyền
  updateUserRole: (id, role) => {
    return api.put(`/users/${id}/role`, { role });
  },

  // Reset password
  resetPassword: (id) => {
    return api.post(`/users/${id}/reset-password`);
  },
};
