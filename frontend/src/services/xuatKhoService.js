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

//   async approve(id) {
//     const response = await api.post(`/xuat-kho/${id}/approve`);
//     return response.data;
//   },

//   async cancel(id) {
//     const response = await api.patch(`/xuat-kho/${id}/cancel`);
//     return response.data;
//   },

//   async checkTonKho(data) {
//     const response = await api.post("/xuat-kho/check-ton-kho", data);
//     return response.data;
//   },

//   async printPhieu(id, printData) {
//     const response = await api.post(`/xuat-kho/${id}/print`, printData);
//     return response.data;
//   },

//   async getDonViNhanList(params = {}) {
//     const response = await api.get("/don-vi-nhan", { params });
//     return response.data;
//   },

//   // API mới: Cập nhật số lượng thực xuất
//   async updateSoLuongThucXuat(id, data) {
//     const response = await api.put(
//       `/xuat-kho/${id}/update-so-luong-thuc-xuat`,
//       data
//     );
//     return response.data;
//   },

//   // API mới: Upload quyết định và chuyển sang confirmed
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

//   // API mới: Download file quyết định
//   async downloadDecision(id) {
//     const response = await api.get(`/xuat-kho/${id}/download-decision`);
//     return response.data;
//   },

//   // API mới: Xác nhận phiếu (chuyển từ draft sang confirmed)
//   async confirmPhieu(id, data) {
//     const response = await api.post(`/xuat-kho/${id}/confirm`, data);
//     return response.data;
//   },

//   // API thống kê và báo cáo
//   async getStatistics(params = {}) {
//     const response = await api.get("/xuat-kho/statistics", { params });
//     return response.data;
//   },

//   async getReportByPeriod(params = {}) {
//     const response = await api.get("/xuat-kho/report-by-period", { params });
//     return response.data;
//   },

//   // API lịch sử xuất kho
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

//   // API hỗ trợ workflow
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

  async approve(id) {
    const response = await api.post(`/xuat-kho/${id}/approve`);
    return response.data;
  },

  async cancel(id) {
    const response = await api.patch(`/xuat-kho/${id}/cancel`);
    return response.data;
  },

  // API hoàn thành phiếu xuất
  async complete(id) {
    const response = await api.patch(`/xuat-kho/${id}/complete`);
    return response.data;
  },

  // CẢI TIẾN: Kiểm tra tồn kho có tính cả phiếu chưa hoàn thành
  async checkTonKho(data) {
    const response = await api.post("/xuat-kho/check-ton-kho", data);
    return response.data;
  },

  // API mới: Kiểm tra tồn kho thực tế có sẵn (bao gồm phiếu đang chờ)
  async checkTonKhoThucTe(data) {
    const response = await api.post("/xuat-kho/check-ton-kho-thuc-te", data);
    return response.data;
  },

  async printPhieu(id, printData) {
    const response = await api.post(`/xuat-kho/${id}/print`, printData);
    return response.data;
  },

  async getDonViNhanList(params = {}) {
    const response = await api.get("/don-vi-nhan", { params });
    return response.data;
  },

  // API mới: Cập nhật số lượng thực xuất
  async updateSoLuongThucXuat(id, data) {
    const response = await api.put(
      `/xuat-kho/${id}/update-so-luong-thuc-xuat`,
      data
    );
    return response.data;
  },

  // API mới: Upload quyết định và chuyển sang confirmed
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

  // API mới: Download file quyết định
  async downloadDecision(id) {
    const response = await api.get(`/xuat-kho/${id}/download-decision`);
    return response.data;
  },

  // API mới: Xác nhận phiếu (chuyển từ draft sang confirmed)
  async confirmPhieu(id, data) {
    const response = await api.post(`/xuat-kho/${id}/confirm`, data);
    return response.data;
  },

  // API thống kê và báo cáo
  async getStatistics(params = {}) {
    const response = await api.get("/xuat-kho/statistics", { params });
    return response.data;
  },

  async getReportByPeriod(params = {}) {
    const response = await api.get("/xuat-kho/report-by-period", { params });
    return response.data;
  },

  // API lịch sử xuất kho
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

  // API hỗ trợ workflow
  async getWorkflowStatus(id) {
    const response = await api.get(`/xuat-kho/${id}/workflow-status`);
    return response.data;
  },

  async validateBeforeApprove(id) {
    const response = await api.post(`/xuat-kho/${id}/validate-before-approve`);
    return response.data;
  },
};
