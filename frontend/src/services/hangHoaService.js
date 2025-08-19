import api from "./api";

export const hangHoaService = {
  // ===== API CƠ BẢN CHO HÀNG HÓA =====
  async getList(params = {}) {
    const response = await api.get("/hang-hoa", { params });
    return response.data;
  },

  async getDetail(id, phongBanId = null) {
    // THÊM: Cho phép admin xem chi tiết theo phòng ban cụ thể
    const params = phongBanId ? { phong_ban_id: phongBanId } : {};
    const response = await api.get(`/hang-hoa/${id}`, { params });
    return response.data;
  },

  async getSuggestions(search = "", limit = 10) {
    const response = await api.get("/hang-hoa/suggestions", {
      params: { search, limit },
    });
    return response.data;
  },

  async create(data) {
    const response = await api.post("/hang-hoa", data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/hang-hoa/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/hang-hoa/${id}`);
    return response.data;
  },

  // ===== API CHO LOẠI HÀNG HÓA =====
  async getLoaiHangHoa(params = {}) {
    const response = await api.get("/loai-hang-hoa", { params });
    return response.data;
  },

  async getLoaiHangHoaSuggestions(search = "", limit = 10) {
    const response = await api.get("/loai-hang-hoa/suggestions", {
      params: { search, limit },
    });
    return response.data;
  },

  async createLoaiHangHoa(data) {
    const response = await api.post("/loai-hang-hoa", data);
    return response.data;
  },

  async updateLoaiHangHoa(id, data) {
    const response = await api.put(`/loai-hang-hoa/${id}`, data);
    return response.data;
  },

  async deleteLoaiHangHoa(id) {
    const response = await api.delete(`/loai-hang-hoa/${id}`);
    return response.data;
  },

  // ===== API HỖ TRỢ LUÂN CHUYỂN =====
  async getPhongBanCungCap(loaiPhieu = "tren_cap") {
    const response = await api.get("/hang-hoa/phong-ban-cung-cap", {
      params: { loai_phieu: loaiPhieu },
    });
    return response.data;
  },

  async getPhongBanNhanHang() {
    const response = await api.get("/hang-hoa/phong-ban-nhan-hang");
    return response.data;
  },

  // ===== API THỐNG KÊ (CHỈ ADMIN) =====
  async getStatsByDepartment(params = {}) {
    const response = await api.get("/hang-hoa/stats-by-department", { params });
    return response.data;
  },

  // THÊM: Lấy danh sách phòng ban cho admin/manager
  async getPhongBanList() {
    const response = await api.get("departments/list");
    return response.data;
  },

  // THÊM: API lấy danh sách phòng ban có quyền quản lý
  async getAvailablePhongBan() {
    const response = await api.get("/phong-ban/available");
    return response.data;
  },

  // THÊM: API lấy thông tin phòng ban theo ID
  async getPhongBanDetail(id) {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  async getInventoryByLevel(hangHoaId) {
    const response = await api.get(`/hang-hoa/${hangHoaId}/inventory-by-level`);
    return response.data;
  },

  async checkHangHoaPermission(hangHoaId, action = "view") {
    const response = await api.get(`/hang-hoa/${hangHoaId}/permission`, {
      params: { action },
    });
    return response.data;
  },
};
