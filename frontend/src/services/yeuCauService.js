import api from "./api";

export const yeuCauService = {
  // =============================================
  // YÊU CẦU NHẬP KHO SERVICES
  // =============================================

  // Lấy danh sách yêu cầu nhập kho
  getYeuCauNhapList: async (params = {}) => {
    try {
      const response = await api.get("/yeu-cau-nhap", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching yeu cau nhap list:", error);
      throw error;
    }
  },

  // Lấy chi tiết yêu cầu nhập kho
  getYeuCauNhapDetail: async (id) => {
    try {
      const response = await api.get(`/yeu-cau-nhap/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching yeu cau nhap detail:", error);
      throw error;
    }
  },

  // Tạo yêu cầu nhập kho mới
  createYeuCauNhap: async (data) => {
    try {
      const response = await api.post("/yeu-cau-nhap", data);
      return response.data;
    } catch (error) {
      console.error("Error creating yeu cau nhap:", error);
      throw error;
    }
  },

  // Cập nhật yêu cầu nhập kho
  updateYeuCauNhap: async (id, data) => {
    try {
      const response = await api.put(`/yeu-cau-nhap/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating yeu cau nhap:", error);
      throw error;
    }
  },

  // Xóa yêu cầu nhập kho
  deleteYeuCauNhap: async (id) => {
    try {
      const response = await api.delete(`/yeu-cau-nhap/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting yeu cau nhap:", error);
      throw error;
    }
  },

  // Gửi yêu cầu nhập kho (chuyển từ draft -> confirmed)
  submitYeuCauNhap: async (id) => {
    try {
      const response = await api.patch(`/yeu-cau-nhap/${id}/submit`);
      return response.data;
    } catch (error) {
      console.error("Error submitting yeu cau nhap:", error);
      throw error;
    }
  },

  // Hủy yêu cầu nhập kho
  cancelYeuCauNhap: async (id, data = {}) => {
    try {
      const response = await api.patch(`/yeu-cau-nhap/${id}/cancel`, data);
      return response.data;
    } catch (error) {
      console.error("Error cancelling yeu cau nhap:", error);
      throw error;
    }
  },

  // =============================================
  // YÊU CẦU XUẤT KHO SERVICES
  // =============================================

  // Lấy danh sách yêu cầu xuất kho
  getYeuCauXuatList: async (params = {}) => {
    try {
      const response = await api.get("/yeu-cau-xuat", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching yeu cau xuat list:", error);
      throw error;
    }
  },

  // Lấy chi tiết yêu cầu xuất kho
  getYeuCauXuatDetail: async (id) => {
    try {
      const response = await api.get(`/yeu-cau-xuat/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching yeu cau xuat detail:", error);
      throw error;
    }
  },

  // Tạo yêu cầu xuất kho mới
  createYeuCauXuat: async (data) => {
    try {
      const response = await api.post("/yeu-cau-xuat", data);
      return response.data;
    } catch (error) {
      console.error("Error creating yeu cau xuat:", error);
      throw error;
    }
  },

  // Cập nhật yêu cầu xuất kho
  updateYeuCauXuat: async (id, data) => {
    try {
      const response = await api.put(`/yeu-cau-xuat/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating yeu cau xuat:", error);
      throw error;
    }
  },

  // Xóa yêu cầu xuất kho
  deleteYeuCauXuat: async (id) => {
    try {
      const response = await api.delete(`/yeu-cau-xuat/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting yeu cau xuat:", error);
      throw error;
    }
  },

  // Gửi yêu cầu xuất kho
  submitYeuCauXuat: async (id) => {
    try {
      const response = await api.patch(`/yeu-cau-xuat/${id}/submit`);
      return response.data;
    } catch (error) {
      console.error("Error submitting yeu cau xuat:", error);
      throw error;
    }
  },

  // Hủy yêu cầu xuất kho
  cancelYeuCauXuat: async (id, data = {}) => {
    try {
      const response = await api.patch(`/yeu-cau-xuat/${id}/cancel`, data);
      return response.data;
    } catch (error) {
      console.error("Error cancelling yeu cau xuat:", error);
      throw error;
    }
  },

  // Kiểm tra tồn kho cho yêu cầu xuất
  checkTonKhoYeuCauXuat: async (id) => {
    try {
      const response = await api.get(`/yeu-cau-xuat/${id}/check-ton-kho`);
      return response.data;
    } catch (error) {
      console.error("Error checking ton kho for yeu cau xuat:", error);
      throw error;
    }
  },

  // =============================================
  // SHARED UTILITIES
  // =============================================

  // Lấy danh sách yêu cầu chờ phê duyệt (cho workflow management)
  getPendingApprovals: async (params = {}) => {
    try {
      const response = await api.get("/workflow/pending-approvals", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      throw error;
    }
  },

  // Lấy thống kê workflow
  getWorkflowStatistics: async (params = {}) => {
    try {
      const response = await api.get("/workflow/statistics", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching workflow statistics:", error);
      throw error;
    }
  },

  // =============================================
  // TEMPLATE VÀ BULK OPERATIONS
  // =============================================

  // Export yêu cầu ra Excel template
  exportYeuCauTemplate: async (type, params = {}) => {
    try {
      const response = await api.get(`/yeu-cau-${type}/export-template`, {
        params,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error(`Error exporting ${type} template:`, error);
      throw error;
    }
  },

  // Import yêu cầu từ Excel
  importYeuCauFromExcel: async (type, file, additionalData = {}) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });

      const response = await api.post(`/yeu-cau-${type}/import`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error importing ${type} from Excel:`, error);
      throw error;
    }
  },

  // Bulk operations - tạo nhiều yêu cầu cùng lúc
  bulkCreateYeuCau: async (type, dataArray) => {
    try {
      const response = await api.post(`/yeu-cau-${type}/bulk-create`, {
        items: dataArray,
      });
      return response.data;
    } catch (error) {
      console.error(`Error bulk creating ${type}:`, error);
      throw error;
    }
  },

  // Bulk submit - gửi nhiều yêu cầu cùng lúc
  bulkSubmitYeuCau: async (type, ids) => {
    try {
      const response = await api.patch(`/yeu-cau-${type}/bulk-submit`, {
        ids: ids,
      });
      return response.data;
    } catch (error) {
      console.error(`Error bulk submitting ${type}:`, error);
      throw error;
    }
  },

  // =============================================
  // ADVANCED SEARCH VÀ FILTERING
  // =============================================

  // Tìm kiếm nâng cao
  advancedSearch: async (type, searchCriteria) => {
    try {
      const response = await api.post(
        `/yeu-cau-${type}/advanced-search`,
        searchCriteria
      );
      return response.data;
    } catch (error) {
      console.error(`Error advanced search ${type}:`, error);
      throw error;
    }
  },

  // Lưu bộ lọc tùy chỉnh
  saveCustomFilter: async (type, filterData) => {
    try {
      const response = await api.post(`/yeu-cau-${type}/filters`, filterData);
      return response.data;
    } catch (error) {
      console.error(`Error saving custom filter for ${type}:`, error);
      throw error;
    }
  },

  // Lấy danh sách bộ lọc đã lưu
  getSavedFilters: async (type) => {
    try {
      const response = await api.get(`/yeu-cau-${type}/filters`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching saved filters for ${type}:`, error);
      throw error;
    }
  },
};
