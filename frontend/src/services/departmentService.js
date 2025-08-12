import api from "./api";

export const departmentService = {
  // Lấy danh sách phòng ban
  getDepartments: (params = {}) => {
    return api.get("/departments", { params });
  },

  // Tạo phòng ban mới
  createDepartment: (data) => {
    return api.post("/departments", data);
  },

  // Cập nhật phòng ban
  updateDepartment: (id, data) => {
    return api.put(`/departments/${id}`, data);
  },

  // Xóa phòng ban
  deleteDepartment: (id) => {
    return api.delete(`/departments/${id}`);
  },

  // Gán nhân viên vào phòng ban
  assignUsers: (id, userIds) => {
    return api.post(`/departments/${id}/assign-users`, { userIds });
  },
};
