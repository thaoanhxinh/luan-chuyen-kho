// import api from "./api";

// export const xuatKhoService = {
//   async getList(params = {}) {
//     const response = await api.get("/xuat-kho", { params });
//     return response.data;
//   },

//   async getDetail(id) {
//     const response = await api.get(`/xuat-kho/${id}`);
//     return response.data;
//   },

//   async create(data) {
//     const response = await api.post("/xuat-kho", data);
//     return response.data;
//   },

//   async update(id, data) {
//     const response = await api.put(`/xuat-kho/${id}`, data);
//     return response.data;
//   },

//   async delete(id) {
//     const response = await api.delete(`/xuat-kho/${id}`);
//     return response.data;
//   },

//   // New workflow methods
//   async submit(id) {
//     const response = await api.patch(`/xuat-kho/${id}/submit`);
//     return response.data;
//   },

//   async approve(id) {
//     const response = await api.patch(`/xuat-kho/${id}/approve`);
//     return response.data;
//   },

//   async requestRevision(id, data) {
//     const response = await api.patch(`/xuat-kho/${id}/request-revision`, data);
//     return response.data;
//   },

//   async complete(id, data = {}) {
//     const response = await api.patch(`/xuat-kho/${id}/complete`, data);
//     return response.data;
//   },

//   async cancel(id) {
//     const response = await api.patch(`/xuat-kho/${id}/cancel`);
//     return response.data;
//   },

//   async uploadDecision(id, formData) {
//     const response = await api.post(
//       `/xuat-kho/${id}/upload-decision`,
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
//     const response = await api.get(`/xuat-kho/${id}/download-decision`);
//     return response.data;
//   },

//   async printPhieu(id, printData) {
//     const response = await api.post(`/xuat-kho/${id}/print`, printData);
//     return response.data;
//   },

//   // Inventory checking methods
//   async checkTonKho(data) {
//     const response = await api.post("/xuat-kho/check-ton-kho", data);
//     return response.data;
//   },

//   async checkTonKhoThucTe(data) {
//     const response = await api.post("/xuat-kho/check-ton-kho-thuc-te", data);
//     return response.data;
//   },

//   // Department and unit related methods
//   async getDonViNhanList(params = {}) {
//     const response = await api.get("/don-vi-nhan", { params });
//     return response.data;
//   },

//   // Legacy methods for backward compatibility
//   async updateSoLuongThucXuat(id, data) {
//     const response = await api.put(
//       `/xuat-kho/${id}/update-so-luong-thuc-xuat`,
//       data
//     );
//     return response.data;
//   },

//   async confirmPhieu(id, data) {
//     const response = await api.post(`/xuat-kho/${id}/confirm`, data);
//     return response.data;
//   },

//   // Statistics and reporting methods
//   async getStatistics(params = {}) {
//     const response = await api.get("/xuat-kho/statistics", { params });
//     return response.data;
//   },

//   async getReportByPeriod(params = {}) {
//     const response = await api.get("/xuat-kho/report-by-period", { params });
//     return response.data;
//   },

//   // History tracking methods
//   async getHistoryByHangHoa(hangHoaId, params = {}) {
//     const response = await api.get(`/xuat-kho/history/hang-hoa/${hangHoaId}`, {
//       params,
//     });
//     return response.data;
//   },

//   async getHistoryBySeri(seri, params = {}) {
//     const response = await api.get(
//       `/xuat-kho/history/seri/${encodeURIComponent(seri)}`,
//       { params }
//     );
//     return response.data;
//   },

//   // Workflow support methods
//   async getWorkflowStatus(id) {
//     const response = await api.get(`/xuat-kho/${id}/workflow-status`);
//     return response.data;
//   },

//   async validateBeforeApprove(id) {
//     const response = await api.post(`/xuat-kho/${id}/validate-before-approve`);
//     return response.data;
//   },
// };

import api from "./api";

export const xuatKhoService = {
  async getList(params = {}) {
    const response = await api.get("/xuat-kho", { params });
    return response.data;
  },

  async getDetail(id) {
    const response = await api.get(`/xuat-kho/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post("/xuat-kho", data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/xuat-kho/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/xuat-kho/${id}`);
    return response.data;
  },

  // New workflow methods
  async submit(id) {
    const response = await api.patch(`/xuat-kho/${id}/submit`);
    return response.data;
  },

  async approve(id) {
    const response = await api.patch(`/xuat-kho/${id}/approve`);
    return response.data;
  },

  async requestRevision(id, data) {
    const response = await api.patch(`/xuat-kho/${id}/request-revision`, data);
    return response.data;
  },

  async complete(id, data = {}) {
    const response = await api.patch(`/xuat-kho/${id}/complete`, data);
    return response.data;
  },

  async cancel(id) {
    const response = await api.patch(`/xuat-kho/${id}/cancel`);
    return response.data;
  },

  // Thêm method mới cho cập nhật số lượng thực tế
  async updateActualQuantity(id, data) {
    const response = await api.put(`/xuat-kho/${id}/actual-quantity`, data);
    return response.data;
  },

  async uploadDecision(id, formData) {
    const response = await api.post(
      `/xuat-kho/${id}/upload-decision`,
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
    const response = await api.get(`/xuat-kho/${id}/download-decision`);
    return response.data;
  },

  async printPhieu(id, printData) {
    const response = await api.post(`/xuat-kho/${id}/print`, printData);
    return response.data;
  },

  // Inventory checking methods
  async checkTonKho(data) {
    const response = await api.post("/xuat-kho/check-ton-kho", data);
    return response.data;
  },

  async checkTonKhoThucTe(data) {
    const response = await api.post("/xuat-kho/check-ton-kho-thuc-te", data);
    return response.data;
  },

  // Department and unit related methods
  async getDonViNhanList(params = {}) {
    const response = await api.get("/don-vi-nhan", { params });
    return response.data;
  },

  // Legacy methods for backward compatibility
  async updateSoLuongThucXuat(id, data) {
    const response = await api.put(
      `/xuat-kho/${id}/update-so-luong-thuc-xuat`,
      data
    );
    return response.data;
  },

  async confirmPhieu(id, data) {
    const response = await api.post(`/xuat-kho/${id}/confirm`, data);
    return response.data;
  },

  // Statistics and reporting methods
  async getStatistics(params = {}) {
    const response = await api.get("/xuat-kho/statistics", { params });
    return response.data;
  },

  async getReportByPeriod(params = {}) {
    const response = await api.get("/xuat-kho/report-by-period", { params });
    return response.data;
  },

  // History tracking methods
  async getHistoryByHangHoa(hangHoaId, params = {}) {
    const response = await api.get(`/xuat-kho/history/hang-hoa/${hangHoaId}`, {
      params,
    });
    return response.data;
  },

  async getHistoryBySeri(seri, params = {}) {
    const response = await api.get(
      `/xuat-kho/history/seri/${encodeURIComponent(seri)}`,
      { params }
    );
    return response.data;
  },

  // Workflow support methods
  async getWorkflowStatus(id) {
    const response = await api.get(`/xuat-kho/${id}/workflow-status`);
    return response.data;
  },

  async validateBeforeApprove(id) {
    const response = await api.post(`/xuat-kho/${id}/validate-before-approve`);
    return response.data;
  },

  // Thêm sau dòng updateActualQuantity

  // API lấy phòng ban nhận hàng
  async getPhongBanNhanHang() {
    const response = await api.get("/xuat-kho/phong-ban-nhan-hang");
    return response.data;
  },

  async getPhongBanList() {
    const response = await api.get("/departments/list");
    return response.data;
  },
};
