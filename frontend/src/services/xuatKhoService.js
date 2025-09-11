// File: services/xuatKhoService.js
// ✅ COMPLETE: Xuất kho service theo chuẩn nhập kho

import api from "./api";

export const xuatKhoService = {
  // ✅ Basic CRUD operations
  async getList(params = {}) {
    try {
      console.log("📋 Getting xuat kho list with params:", params);

      // Xử lý trang_thai param - backend có thể nhận array hoặc string
      const queryParams = { ...params };

      // Convert array status to proper format for backend
      if (Array.isArray(queryParams.trang_thai)) {
        if (queryParams.trang_thai.length === 1) {
          queryParams.trang_thai = queryParams.trang_thai[0];
        } else {
          // Multiple statuses - convert to comma-separated string for backend
          queryParams.trang_thai = queryParams.trang_thai.join(",");
        }
      }

      console.log("📤 Sending request with processed params:", queryParams);
      console.log(
        "🔍 DEBUG - trang_thai type:",
        typeof queryParams.trang_thai,
        "value:",
        queryParams.trang_thai
      );

      const response = await api.get("/xuat-kho", { params: queryParams });
      console.log("✅ Get xuat kho list response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get xuat kho list error:", error);
      throw error;
    }
  },

  async getDetail(id) {
    try {
      console.log("📄 Getting xuat kho detail:", id);
      const response = await api.get(`/xuat-kho/${id}`);
      console.log("✅ Get xuat kho detail response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get xuat kho detail error:", error);
      throw error;
    }
  },

  async create(data) {
    try {
      console.log("➕ Creating xuat kho:", data);
      const response = await api.post("/xuat-kho", data);
      console.log("✅ Create xuat kho response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Create xuat kho error:", error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      console.log("📝 Updating xuat kho:", id, data);
      const response = await api.put(`/xuat-kho/${id}`, data);
      console.log("✅ Update xuat kho response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Update xuat kho error:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      console.log("🗑️ Deleting xuat kho:", id);
      const response = await api.delete(`/xuat-kho/${id}`);
      console.log("✅ Delete xuat kho response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Delete xuat kho error:", error);
      throw error;
    }
  },

  async submit(id) {
    try {
      console.log("📤 Submitting xuat kho for approval:", id);
      const response = await api.patch(`/xuat-kho/${id}/submit`);
      console.log("✅ Submit xuat kho response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Submit xuat kho error:", error);
      throw error;
    }
  },

  // Manager (cấp 2) duyệt và gửi lên Admin (cấp 1) - CHÍNH XÁC theo backend
  async managerApprove(id) {
    try {
      console.log("✅ Manager approving xuat kho:", id);
      const response = await api.patch(`/xuat-kho/${id}/manager-approve`);
      console.log("✅ Manager approve xuat kho response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Manager approve xuat kho error:", error);
      throw error;
    }
  },

  // Admin (cấp 1) duyệt cuối HOẶC cấp 3A duyệt xuất đơn vị - CHÍNH XÁC theo backend
  async approve(id) {
    try {
      console.log("✅ Approving xuat kho:", id);
      const response = await api.patch(`/xuat-kho/${id}/approve`);
      console.log("✅ Approve xuat kho response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Approve xuat kho error:", error);
      throw error;
    }
  },

  // Yêu cầu chỉnh sửa - Admin/Manager gửi về cho cấp 3 sửa - CHÍNH XÁC theo backend
  async requestRevision(id, data) {
    try {
      console.log(
        "🔧 Requesting revision for xuat kho:",
        id,
        "with data:",
        data
      );
      const response = await api.patch(
        `/xuat-kho/${id}/request-revision`,
        data
      );
      console.log("✅ Request revision xuat kho response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Request revision xuat kho error:", error);
      throw error;
    }
  },

  // Hoàn thành phiếu - Admin/Manager - CHÍNH XÁC theo backend
  async complete(id, data = {}) {
    try {
      console.log("✅ Completing xuat kho:", id, "with data:", data);
      const response = await api.patch(`/xuat-kho/${id}/complete`, data);
      console.log("✅ Complete xuat kho response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Complete xuat kho error:", error);
      throw error;
    }
  },

  // Hủy phiếu - Owner hoặc Admin - CHÍNH XÁC theo backend
  async cancel(id) {
    try {
      console.log("❌ Cancelling xuat kho:", id);
      const response = await api.patch(`/xuat-kho/${id}/cancel`);
      console.log("✅ Cancel xuat kho response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Cancel xuat kho error:", error);
      throw error;
    }
  },
  async checkTonKho(data) {
    try {
      console.log("📊 Checking ton kho:", data);

      const requestData = {
        items: Array.isArray(data.items)
          ? data.items
          : [
              {
                hang_hoa_id: data.hang_hoa_id,
                so_luong: data.so_luong || 1,
              },
            ],
        phong_ban_id: data.phong_ban_id,
      };

      const response = await api.post("/xuat-kho/check-ton-kho", requestData);
      console.log("✅ Check ton kho response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Check ton kho error:", error);
      throw error;
    }
  },

  // Kiểm tra tồn kho thực tế
  async checkTonKhoThucTe(data) {
    try {
      console.log("📊 Checking ton kho thuc te:", data);
      const response = await api.post("/xuat-kho/check-ton-kho-thuc-te", data);
      console.log("✅ Check ton kho thuc te response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Check ton kho thuc te error:", error);
      throw error;
    }
  },

  // Cập nhật số lượng thực tế xuất
  async updateActualQuantity(id, data) {
    try {
      console.log("📝 Updating actual quantity for xuat kho:", id, data);
      const response = await api.put(`/xuat-kho/${id}/actual-quantity`, data);
      console.log("✅ Update actual quantity response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Update actual quantity error:", error);
      throw error;
    }
  },

  // ✅ DOCUMENT OPERATIONS

  // Upload quyết định
  async uploadDecision(id, formData) {
    try {
      console.log("📤 Uploading decision for xuat kho:", id);
      const response = await api.post(
        `/xuat-kho/${id}/upload-decision`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("✅ Upload decision response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Upload decision error:", error);
      throw error;
    }
  },

  // Download quyết định
  async downloadDecision(id) {
    try {
      console.log("📥 Downloading decision for xuat kho:", id);
      const response = await api.get(`/xuat-kho/${id}/download-decision`, {
        responseType: "blob",
      });
      console.log("✅ Download decision response received");
      return response.data;
    } catch (error) {
      console.error("❌ Download decision error:", error);
      throw error;
    }
  },

  // ✅ UTILITY OPERATIONS

  // API lấy danh sách phòng ban nhận hàng
  async getPhongBanNhanHang() {
    try {
      console.log("🏢 Getting phong ban nhan hang list");
      const response = await api.get("/xuat-kho/phong-ban-nhan-hang");
      console.log("✅ Get phong ban nhan hang response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get phong ban nhan hang error:", error);
      throw error;
    }
  },

  // API lấy danh sách phòng ban (cho admin filter)
  async getPhongBanList() {
    try {
      console.log("🏢 Getting phong ban list");
      const response = await api.get("/xuat-kho/phong-ban-list");
      console.log("✅ Get phong ban list response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get phong ban list error:", error);
      throw error;
    }
  },

  async confirmPhieu(id, data) {
    try {
      console.log("✅ Confirming xuat kho:", id, data);
      const response = await api.post(`/xuat-kho/${id}/confirm`, data);
      console.log("✅ Confirm xuat kho response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Confirm xuat kho error:", error);
      throw error;
    }
  },

  async getStatistics(params = {}) {
    try {
      console.log("📊 Getting xuat kho statistics:", params);
      const response = await api.get("/xuat-kho/statistics", { params });
      console.log("✅ Get statistics response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get statistics error:", error);
      throw error;
    }
  },

  // Báo cáo theo kỳ
  async getReportByPeriod(params = {}) {
    try {
      console.log("📈 Getting xuat kho report by period:", params);
      const response = await api.get("/xuat-kho/report-by-period", { params });
      console.log("✅ Get report by period response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get report by period error:", error);
      throw error;
    }
  },

  async getHistoryByHangHoa(hangHoaId, params = {}) {
    try {
      console.log("📚 Getting xuat history by hang hoa:", hangHoaId, params);
      const response = await api.get(
        `/xuat-kho/history/hang-hoa/${hangHoaId}`,
        { params }
      );
      console.log("✅ Get history by hang hoa response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get history by hang hoa error:", error);
      throw error;
    }
  },

  // Lịch sử theo số seri
  async getHistoryBySeri(seri, params = {}) {
    try {
      console.log("📚 Getting xuat history by seri:", seri, params);
      const response = await api.get(
        `/xuat-kho/history/seri/${encodeURIComponent(seri)}`,
        { params }
      );
      console.log("✅ Get history by seri response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get history by seri error:", error);
      throw error;
    }
  },

  // ✅ WORKFLOW SUPPORT

  // Lấy trạng thái workflow
  async getWorkflowStatus(id) {
    try {
      console.log("🔄 Getting workflow status for xuat kho:", id);
      const response = await api.get(`/xuat-kho/${id}/workflow-status`);
      console.log("✅ Get workflow status response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get workflow status error:", error);
      throw error;
    }
  },

  // Validate trước khi duyệt
  async validateBeforeApprove(id) {
    try {
      console.log("✅ Validating before approve xuat kho:", id);
      const response = await api.post(
        `/xuat-kho/${id}/validate-before-approve`
      );
      console.log("✅ Validate before approve response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Validate before approve error:", error);
      throw error;
    }
  },

  async printPhieu(id, options = {}) {
    try {
      console.log("🖨️ Printing xuat kho:", id, options);
      const response = await api.post(`/xuat-kho/${id}/print`, options, {
        responseType: "blob",
      });
      console.log("✅ Print phieu response received");
      return response.data;
    } catch (error) {
      console.error("❌ Print phieu error:", error);
      throw error;
    }
  },

  // Export Excel
  async exportExcel(params = {}) {
    try {
      console.log("📊 Exporting xuat kho to Excel:", params);
      const response = await api.get("/xuat-kho/export-excel", {
        params,
        responseType: "blob",
      });
      console.log("✅ Export Excel response received");
      return response.data;
    } catch (error) {
      console.error("❌ Export Excel error:", error);
      throw error;
    }
  },

  async getNextPhieuNumber() {
    try {
      console.log("🔢 Getting next phieu number");
      const response = await api.get("/xuat-kho/next-phieu-number");
      console.log("✅ Get next phieu number response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get next phieu number error:", error);
      throw error;
    }
  },

  // Duplicate phiếu
  async duplicatePhieu(id, data = {}) {
    try {
      console.log("📋 Duplicating xuat kho:", id, data);
      const response = await api.post(`/xuat-kho/${id}/duplicate`, data);
      console.log("✅ Duplicate phieu response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Duplicate phieu error:", error);
      throw error;
    }
  },

  // Batch operations
  async batchApprove(ids, data = {}) {
    try {
      console.log("✅ Batch approving xuat kho:", ids, data);
      const response = await api.post("/xuat-kho/batch-approve", {
        ids,
        ...data,
      });
      console.log("✅ Batch approve response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Batch approve error:", error);
      throw error;
    }
  },

  async batchCancel(ids, data = {}) {
    try {
      console.log("❌ Batch cancelling xuat kho:", ids, data);
      const response = await api.post("/xuat-kho/batch-cancel", {
        ids,
        ...data,
      });
      console.log("✅ Batch cancel response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Batch cancel error:", error);
      throw error;
    }
  },

  async getPhongBanCap2List() {
    try {
      console.log("🏢 Getting phong ban cap 2 list for xuat kho");
      const response = await api.get("/xuat-kho/phong-ban-cap2");
      console.log("✅ Get phong ban cap 2 response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get phong ban cap 2 error:", error);
      throw error;
    }
  },

  async getPhongBanCap3ByParent(cap2Id) {
    try {
      console.log("🏢 Getting phong ban cap 3 by parent:", cap2Id);
      const response = await api.get(`/xuat-kho/phong-ban-cap3/${cap2Id}`);
      console.log("✅ Get phong ban cap 3 response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get phong ban cap 3 error:", error);
      throw error;
    }
  },

  async getLotsForXuatKho(hangHoaId, phongBanId) {
    try {
      console.log("📦 Getting lots for xuat kho:", { hangHoaId, phongBanId });

      const response = await api.get(
        `/hang-hoa/${hangHoaId}/lots/${phongBanId}`
      );

      console.log("✅ Lots response:", response.data);
      return response.data; // ✅ SỬA: return response.data thay vì response
    } catch (error) {
      console.error("❌ Error getting lots:", error);
      return { success: false, data: [] };
    }
  },

  async getPhongBanParent(phongBanId) {
    try {
      console.log("🔍 Getting parent of phong ban:", phongBanId);
      const response = await api.get(`/departments/${phongBanId}/parent`);
      console.log("✅ Get parent response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Get parent error:", error);
      return { success: false, data: null };
    }
  },
};
