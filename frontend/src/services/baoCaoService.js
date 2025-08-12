import api from "./api";

export const baoCaoService = {
  // Báo cáo tồn kho
  getTonKhoReport: async (params = {}) => {
    try {
      const response = await api.get("/bao-cao/ton-kho", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching ton kho report:", error);
      throw error;
    }
  },

  // Báo cáo nhập xuất
  getNhapXuatReport: async (params = {}) => {
    try {
      const response = await api.get("/bao-cao/nhap-xuat", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching nhap xuat report:", error);
      throw error;
    }
  },

  // Báo cáo kiểm kê
  getKiemKeReport: async (params = {}) => {
    try {
      const response = await api.get("/bao-cao/kiem-ke", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching kiem ke report:", error);
      throw error;
    }
  },

  // Dashboard stats
  getDashboardStats: async (params = {}) => {
    try {
      const response = await api.get("/bao-cao/dashboard", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  // MỚI: Lấy dữ liệu luân chuyển kho cho giao diện
  getLuanChuyenKhoData: async (params = {}) => {
    try {
      const response = await api.get("/bao-cao/luan-chuyen-data", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching luan chuyen data:", error);
      throw error;
    }
  },

  // Xuất Excel báo cáo nhập
  exportBaoCaoNhap: async (params = {}) => {
    try {
      const response = await api.get("/bao-cao/export/nhap-xuat-nhap", {
        params,
        responseType: "json", // Changed from blob to json for data display
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching bao cao nhap:", error);
      throw error;
    }
  },

  // Xuất Excel báo cáo xuất
  exportBaoCaoXuat: async (params = {}) => {
    try {
      const response = await api.get("/bao-cao/export/nhap-xuat-xuat", {
        params,
        responseType: "json", // Changed from blob to json for data display
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching bao cao xuat:", error);
      throw error;
    }
  },

  // Export Excel
  exportExcel: async (reportType, params = {}) => {
    try {
      const response = await api.get(`/bao-cao/export/${reportType}`, {
        params,
        responseType: "blob", // Quan trọng để download file
      });

      return response.data;
    } catch (error) {
      console.error(`Error exporting ${reportType} report:`, error);
      throw error;
    }
  },

  // Export luân chuyển kho Excel (format cũ với 4 sheets)
  exportLuanChuyenKho: async (params = {}) => {
    try {
      const response = await api.get("/bao-cao/luan-chuyen-kho", {
        params,
        responseType: "blob", // Download file Excel
      });

      return response.data;
    } catch (error) {
      console.error("Error exporting luan chuyen kho report:", error);
      throw error;
    }
  },

  // Export PDF
  exportPDF: async (reportType, params = {}) => {
    try {
      const response = await api.get(`/bao-cao/export-pdf/${reportType}`, {
        params,
        responseType: "blob",
      });

      return response.data;
    } catch (error) {
      console.error(`Error exporting PDF ${reportType} report:`, error);
      throw error;
    }
  },

  // Báo cáo tùy chỉnh - có thể mở rộng sau
  getCustomReport: async (config) => {
    try {
      const response = await api.post("/bao-cao/custom", config);
      return response.data;
    } catch (error) {
      console.error("Error fetching custom report:", error);
      throw error;
    }
  },

  // Lấy thống kê nhanh
  getQuickStats: async (dateRange = {}) => {
    try {
      const response = await api.get("/bao-cao/quick-stats", {
        params: dateRange,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching quick stats:", error);
      throw error;
    }
  },

  // Báo cáo theo xu hướng
  getTrendReport: async (type, params = {}) => {
    try {
      const response = await api.get(`/bao-cao/trend/${type}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} trend report:`, error);
      throw error;
    }
  },

  // Báo cáo so sánh
  getComparisonReport: async (compareData) => {
    try {
      const response = await api.post("/bao-cao/comparison", compareData);
      return response.data;
    } catch (error) {
      console.error("Error fetching comparison report:", error);
      throw error;
    }
  },

  // Lưu template báo cáo
  saveReportTemplate: async (template) => {
    try {
      const response = await api.post("/bao-cao/templates", template);
      return response.data;
    } catch (error) {
      console.error("Error saving report template:", error);
      throw error;
    }
  },

  // Lấy danh sách template báo cáo
  getReportTemplates: async () => {
    try {
      const response = await api.get("/bao-cao/templates");
      return response.data;
    } catch (error) {
      console.error("Error fetching report templates:", error);
      throw error;
    }
  },

  // Xóa template báo cáo
  deleteReportTemplate: async (templateId) => {
    try {
      const response = await api.delete(`/bao-cao/templates/${templateId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting report template:", error);
      throw error;
    }
  },

  // Schedule báo cáo tự động
  scheduleReport: async (scheduleConfig) => {
    try {
      const response = await api.post("/bao-cao/schedule", scheduleConfig);
      return response.data;
    } catch (error) {
      console.error("Error scheduling report:", error);
      throw error;
    }
  },

  // Lấy lịch sử báo cáo
  getReportHistory: async (params = {}) => {
    try {
      const response = await api.get("/bao-cao/history", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching report history:", error);
      throw error;
    }
  },

  // Download báo cáo đã tạo từ lịch sử
  downloadReportFromHistory: async (historyId) => {
    try {
      const response = await api.get(`/bao-cao/history/${historyId}/download`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error downloading report from history:", error);
      throw error;
    }
  },

  getNhapDataByType: async (params = {}) => {
    try {
      const response = await api.get("/bao-cao/nhap-by-type", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching nhap data by type:", error);
      throw error;
    }
  },

  // MỚI: Export Excel với 2 tabs (tự mua sắm + trên cấp)
  exportNhapWithTabs: async (params = {}) => {
    try {
      const response = await api.get("/bao-cao/export/nhap-with-tabs", {
        params,
        responseType: "blob", // Quan trọng để download file
      });
      return response.data;
    } catch (error) {
      console.error("Error exporting nhap with tabs:", error);
      throw error;
    }
  },
};
