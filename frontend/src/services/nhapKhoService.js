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

  async approve(id) {
    const response = await api.patch(`/nhap-kho/${id}/approve`);
    return response.data;
  },

  async cancel(id) {
    const response = await api.patch(`/nhap-kho/${id}/cancel`);
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
  async complete(id) {
    const response = await api.patch(`/nhap-kho/${id}/complete`);
    return response.data;
  },

  async printPhieu(id, printData) {
    const response = await api.post(`/nhap-kho/${id}/print`, printData);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/nhap-kho/${id}`, data);
    return response.data;
  },
};
