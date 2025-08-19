// import api from "./api";

// export const nhapKhoService = {
//   async getList(params = {}) {
//     const response = await api.get("/nhap-kho", { params });
//     return response.data;
//   },

//   async getDetail(id) {
//     const response = await api.get(`/nhap-kho/${id}`);
//     return response.data;
//   },

//   async create(data) {
//     const response = await api.post("/nhap-kho", data);
//     return response.data;
//   },

//   async update(id, data) {
//     const response = await api.put(`/nhap-kho/${id}`, data);
//     return response.data;
//   },

//   async delete(id) {
//     const response = await api.delete(`/nhap-kho/${id}`);
//     return response.data;
//   },

//   // New workflow methods
//   async submit(id) {
//     const response = await api.patch(`/nhap-kho/${id}/submit`);
//     return response.data;
//   },

//   async approve(id) {
//     const response = await api.patch(`/nhap-kho/${id}/approve`);
//     return response.data;
//   },

//   async requestRevision(id, data) {
//     const response = await api.patch(`/nhap-kho/${id}/request-revision`, data);
//     return response.data;
//   },

//   async complete(id, data = {}) {
//     const response = await api.patch(`/nhap-kho/${id}/complete`, data);
//     return response.data;
//   },

//   async cancel(id) {
//     const response = await api.patch(`/nhap-kho/${id}/cancel`);
//     return response.data;
//   },

//   async uploadDecision(id, formData) {
//     const response = await api.post(
//       `/nhap-kho/${id}/upload-decision`,
//       formData,
//       {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       }
//     );
//     return response.data;
//   },

//   async downloadDecision(id) {
//     const response = await api.get(`/nhap-kho/${id}/download-decision`);
//     return response.data;
//   },

//   async printPhieu(id, printData) {
//     const response = await api.post(`/nhap-kho/${id}/print`, printData);
//     return response.data;
//   },
// };

import api from "./api";

export const nhapKhoService = {
  async getList(params = {}) {
    const response = await api.get("/nhap-kho", { params });
    return response.data;
  },

  async getDetail(id) {
    const response = await api.get(`/nhap-kho/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post("/nhap-kho", data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/nhap-kho/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/nhap-kho/${id}`);
    return response.data;
  },

  // New workflow methods
  async submit(id) {
    const response = await api.patch(`/nhap-kho/${id}/submit`);
    return response.data;
  },

  async approve(id) {
    const response = await api.patch(`/nhap-kho/${id}/approve`);
    return response.data;
  },

  async requestRevision(id, data) {
    const response = await api.patch(`/nhap-kho/${id}/request-revision`, data);
    return response.data;
  },

  async complete(id, data = {}) {
    const response = await api.patch(`/nhap-kho/${id}/complete`, data);
    return response.data;
  },

  async cancel(id) {
    const response = await api.patch(`/nhap-kho/${id}/cancel`);
    return response.data;
  },

  // Thêm method mới cho cập nhật số lượng thực tế
  async updateActualQuantity(id, data) {
    const response = await api.put(`/nhap-kho/${id}/actual-quantity`, data);
    return response.data;
  },

  async uploadDecision(id, formData) {
    const response = await api.post(
      `/nhap-kho/${id}/upload-decision`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async downloadDecision(id) {
    const response = await api.get(`/nhap-kho/${id}/download-decision`);
    return response.data;
  },

  async printPhieu(id, printData) {
    const response = await api.post(`/nhap-kho/${id}/print`, printData);
    return response.data;
  },

  // Thêm sau dòng updateActualQuantity

  // API lấy phòng ban cung cấp
  async getPhongBanCungCap(loaiPhieu = "tren_cap") {
    const response = await api.get("/nhap-kho/phong-ban-cung-cap", {
      params: { loai_phieu: loaiPhieu },
    });
    return response.data;
  },

  // API lấy hàng hóa có thể nhập
  async getHangHoaCoTheNhap(phongBanCungCapId) {
    const response = await api.get("/nhap-kho/hang-hoa-co-the-nhap", {
      params: { phong_ban_cung_cap_id: phongBanCungCapId },
    });
    return response.data;
  },

  async getPhongBanList() {
    const response = await api.get("/departments/list");
    return response.data;
  },
};
