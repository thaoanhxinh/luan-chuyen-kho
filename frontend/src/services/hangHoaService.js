// import api from "./api";

// export const hangHoaService = {
//   async getList(params = {}) {
//     const response = await api.get("/hang-hoa", { params });
//     return response.data;
//   },

//   async getDetail(id) {
//     const response = await api.get(`/hang-hoa/${id}`);
//     return response.data;
//   },

//   async getSuggestions(search = "", limit = 10) {
//     const response = await api.get("/hang-hoa/suggestions", {
//       params: { search, limit },
//     });
//     return response.data;
//   },

//   async getAvailableSeri(hangHoaId, phamChat = "tot") {
//     const response = await api.get(`/hang-hoa/${hangHoaId}/seri`, {
//       params: { pham_chat: phamChat },
//     });
//     return response.data;
//   },

//   async getPriceHistory(hangHoaId) {
//     const response = await api.get(`/hang-hoa/${hangHoaId}/price-history`);
//     return response.data;
//   },

//   async getImportBatches(hangHoaId) {
//     const response = await api.get(`/hang-hoa/${hangHoaId}/import-batches`);
//     return response.data;
//   },

//   async create(data) {
//     const response = await api.post("/hang-hoa", data);
//     return response.data;
//   },

//   async update(id, data) {
//     const response = await api.put(`/hang-hoa/${id}`, data);
//     return response.data;
//   },

//   async delete(id) {
//     const response = await api.delete(`/hang-hoa/${id}`);
//     return response.data;
//   },

//   async getById(id) {
//     const response = await api.get(`/hang-hoa/${id}`);
//     return response.data;
//   },
// };

import api from "./api";

export const hangHoaService = {
  async getList(params = {}) {
    const response = await api.get("/hang-hoa", { params });
    return response.data;
  },

  async getDetail(id) {
    const response = await api.get(`/hang-hoa/${id}`);
    return response.data;
  },

  async getSuggestions(search = "", limit = 10) {
    const response = await api.get("/hang-hoa/suggestions", {
      params: { search, limit },
    });
    return response.data;
  },

  async getAvailableSeri(hangHoaId, phamChat = "tot") {
    const response = await api.get(`/hang-hoa/${hangHoaId}/seri`, {
      params: { pham_chat: phamChat },
    });
    return response.data;
  },

  async getPriceHistory(hangHoaId) {
    const response = await api.get(`/hang-hoa/${hangHoaId}/price-history`);
    return response.data;
  },

  async getImportBatches(hangHoaId) {
    const response = await api.get(`/hang-hoa/${hangHoaId}/import-batches`);
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

  async getById(id) {
    const response = await api.get(`/hang-hoa/${id}`);
    return response.data;
  },

  // API cho loại hàng hóa
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
};
