import api from "./api";

export const workflowService = {
  // =============================================
  // WORKFLOW APPROVAL SERVICES
  // =============================================

  // Phê duyệt yêu cầu nhập kho
  approveYeuCauNhap: async (id, approvalData) => {
    try {
      const response = await api.post(
        `/workflow/yeu-cau-nhap/${id}/approve`,
        approvalData
      );
      return response.data;
    } catch (error) {
      console.error("Error approving yeu cau nhap:", error);
      throw error;
    }
  },

  // Từ chối yêu cầu nhập kho
  rejectYeuCauNhap: async (id, rejectionData) => {
    try {
      const response = await api.post(
        `/workflow/yeu-cau-nhap/${id}/reject`,
        rejectionData
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting yeu cau nhap:", error);
      throw error;
    }
  },

  // Chuyển đổi yêu cầu nhập kho thành phiếu nhập
  convertYeuCauNhapToPhieu: async (id, conversionData) => {
    try {
      const response = await api.post(
        `/workflow/yeu-cau-nhap/${id}/convert-to-phieu`,
        conversionData
      );
      return response.data;
    } catch (error) {
      console.error("Error converting yeu cau nhap to phieu:", error);
      throw error;
    }
  },

  // Phê duyệt yêu cầu xuất kho
  approveYeuCauXuat: async (id, approvalData) => {
    try {
      const response = await api.post(
        `/workflow/yeu-cau-xuat/${id}/approve`,
        approvalData
      );
      return response.data;
    } catch (error) {
      console.error("Error approving yeu cau xuat:", error);
      throw error;
    }
  },

  // Từ chối yêu cầu xuất kho
  rejectYeuCauXuat: async (id, rejectionData) => {
    try {
      const response = await api.post(
        `/workflow/yeu-cau-xuat/${id}/reject`,
        rejectionData
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting yeu cau xuat:", error);
      throw error;
    }
  },

  // Chuyển đổi yêu cầu xuất kho thành phiếu xuất
  convertYeuCauXuatToPhieu: async (id, conversionData) => {
    try {
      const response = await api.post(
        `/workflow/yeu-cau-xuat/${id}/convert-to-phieu`,
        conversionData
      );
      return response.data;
    } catch (error) {
      console.error("Error converting yeu cau xuat to phieu:", error);
      throw error;
    }
  },

  // =============================================
  // WORKFLOW STATISTICS AND MONITORING
  // =============================================

  // Lấy thống kê workflow tổng quát
  getWorkflowStatistics: async (params = {}) => {
    try {
      const response = await api.get("/workflow/statistics", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching workflow statistics:", error);
      throw error;
    }
  },

  // Lấy danh sách yêu cầu chờ phê duyệt
  getPendingApprovals: async (params = {}) => {
    try {
      const response = await api.get("/workflow/pending-approvals", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      throw error;
    }
  },

  getPendingRequests: async (params = {}) => {
    try {
      const response = await api.get("/workflow/pending-approvals", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      throw error;
    }
  },

  // Thêm method getStatistics
  getStatistics: async (params = {}) => {
    try {
      const response = await api.get("/workflow/statistics", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching workflow statistics:", error);
      throw error;
    }
  },

  // Thêm các method alias để tương thích với WorkflowManagement.jsx
  convertToPhieuNhap: async (id, conversionData) => {
    return await workflowService.convertYeuCauNhapToPhieu(id, conversionData);
  },

  convertToPhieuXuat: async (id, conversionData) => {
    return await workflowService.convertYeuCauXuatToPhieu(id, conversionData);
  },

  // Lấy lịch sử workflow của một yêu cầu
  getWorkflowHistory: async (type, id) => {
    try {
      const response = await api.get(`/workflow/${type}/${id}/history`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflow history for ${type}:`, error);
      throw error;
    }
  },

  // Lấy timeline workflow
  getWorkflowTimeline: async (type, id) => {
    try {
      const response = await api.get(`/workflow/${type}/${id}/timeline`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflow timeline for ${type}:`, error);
      throw error;
    }
  },

  // =============================================
  // BATCH WORKFLOW OPERATIONS
  // =============================================

  // Phê duyệt hàng loạt
  batchApprove: async (type, requestIds, approvalData) => {
    try {
      const response = await api.post(`/workflow/batch-approve`, {
        type: type,
        request_ids: requestIds,
        approval_data: approvalData,
      });
      return response.data;
    } catch (error) {
      console.error(`Error batch approving ${type}:`, error);
      throw error;
    }
  },

  // Từ chối hàng loạt
  batchReject: async (type, requestIds, rejectionData) => {
    try {
      const response = await api.post(`/workflow/batch-reject`, {
        type: type,
        request_ids: requestIds,
        rejection_data: rejectionData,
      });
      return response.data;
    } catch (error) {
      console.error(`Error batch rejecting ${type}:`, error);
      throw error;
    }
  },

  // Chuyển tiếp hàng loạt (forward to another approver)
  batchForward: async (type, requestIds, forwardData) => {
    try {
      const response = await api.post(`/workflow/batch-forward`, {
        type: type,
        request_ids: requestIds,
        forward_data: forwardData,
      });
      return response.data;
    } catch (error) {
      console.error(`Error batch forwarding ${type}:`, error);
      throw error;
    }
  },

  // =============================================
  // WORKFLOW SETTINGS AND CONFIGURATION
  // =============================================

  // Lấy cấu hình workflow cho phòng ban
  getWorkflowSettings: async (departmentId, requestType) => {
    try {
      const response = await api.get(
        `/workflow/settings/${departmentId}/${requestType}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching workflow settings:", error);
      throw error;
    }
  },

  // Cập nhật cấu hình workflow
  updateWorkflowSettings: async (departmentId, requestType, settings) => {
    try {
      const response = await api.put(
        `/workflow/settings/${departmentId}/${requestType}`,
        settings
      );
      return response.data;
    } catch (error) {
      console.error("Error updating workflow settings:", error);
      throw error;
    }
  },

  // Lấy danh sách người có thể phê duyệt
  getApprovers: async (departmentId, requestType) => {
    try {
      const response = await api.get(
        `/workflow/approvers/${departmentId}/${requestType}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching approvers:", error);
      throw error;
    }
  },

  // Lấy ma trận phân quyền phê duyệt
  getApprovalMatrix: async (departmentId) => {
    try {
      const response = await api.get(
        `/workflow/approval-matrix/${departmentId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching approval matrix:", error);
      throw error;
    }
  },

  // =============================================
  // WORKFLOW TEMPLATES
  // =============================================

  // Lấy danh sách template workflow
  getWorkflowTemplates: async (type) => {
    try {
      const response = await api.get(`/workflow/templates/${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflow templates for ${type}:`, error);
      throw error;
    }
  },

  // Tạo template workflow mới
  createWorkflowTemplate: async (templateData) => {
    try {
      const response = await api.post("/workflow/templates", templateData);
      return response.data;
    } catch (error) {
      console.error("Error creating workflow template:", error);
      throw error;
    }
  },

  // Áp dụng template vào yêu cầu
  applyWorkflowTemplate: async (type, requestId, templateId) => {
    try {
      const response = await api.post(
        `/workflow/${type}/${requestId}/apply-template`,
        {
          template_id: templateId,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error applying workflow template:", error);
      throw error;
    }
  },

  // =============================================
  // DELEGATION AND SUBSTITUTION
  // =============================================

  // Ủy quyền phê duyệt
  delegateApproval: async (delegationData) => {
    try {
      const response = await api.post("/workflow/delegate", delegationData);
      return response.data;
    } catch (error) {
      console.error("Error delegating approval:", error);
      throw error;
    }
  },

  // Lấy danh sách ủy quyền hiện tại
  getCurrentDelegations: async (userId) => {
    try {
      const response = await api.get(`/workflow/delegations/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching current delegations:", error);
      throw error;
    }
  },

  // Hủy ủy quyền
  revokeDelegation: async (delegationId) => {
    try {
      const response = await api.delete(
        `/workflow/delegations/${delegationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error revoking delegation:", error);
      throw error;
    }
  },

  // =============================================
  // WORKFLOW ANALYTICS AND REPORTING
  // =============================================

  // Lấy báo cáo hiệu suất workflow
  getWorkflowPerformanceReport: async (params = {}) => {
    try {
      const response = await api.get("/workflow/performance-report", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching workflow performance report:", error);
      throw error;
    }
  },

  // Lấy báo cáo bottleneck trong workflow
  getWorkflowBottlenecks: async (params = {}) => {
    try {
      const response = await api.get("/workflow/bottlenecks", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching workflow bottlenecks:", error);
      throw error;
    }
  },

  // Lấy thống kê theo người phê duyệt
  getApproverStatistics: async (approverId, params = {}) => {
    try {
      const response = await api.get(`/workflow/approver-stats/${approverId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching approver statistics:", error);
      throw error;
    }
  },

  // Lấy xu hướng workflow theo thời gian
  getWorkflowTrends: async (params = {}) => {
    try {
      const response = await api.get("/workflow/trends", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching workflow trends:", error);
      throw error;
    }
  },

  // =============================================
  // ESCALATION AND SLA MANAGEMENT
  // =============================================

  // Lấy danh sách yêu cầu quá hạn SLA
  getOverdueTasks: async (params = {}) => {
    try {
      const response = await api.get("/workflow/overdue-tasks", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching overdue tasks:", error);
      throw error;
    }
  },

  // Escalate yêu cầu lên cấp trên
  escalateRequest: async (type, requestId, escalationData) => {
    try {
      const response = await api.post(
        `/workflow/${type}/${requestId}/escalate`,
        escalationData
      );
      return response.data;
    } catch (error) {
      console.error("Error escalating request:", error);
      throw error;
    }
  },

  // Cập nhật SLA cho loại yêu cầu
  updateSLASettings: async (requestType, slaData) => {
    try {
      const response = await api.put(`/workflow/sla/${requestType}`, slaData);
      return response.data;
    } catch (error) {
      console.error("Error updating SLA settings:", error);
      throw error;
    }
  },

  // =============================================
  // WORKFLOW AUDIT AND COMPLIANCE
  // =============================================

  // Lấy audit log của workflow
  getWorkflowAuditLog: async (params = {}) => {
    try {
      const response = await api.get("/workflow/audit-log", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching workflow audit log:", error);
      throw error;
    }
  },

  // Lấy báo cáo compliance
  getComplianceReport: async (params = {}) => {
    try {
      const response = await api.get("/workflow/compliance-report", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching compliance report:", error);
      throw error;
    }
  },

  // Export workflow data cho audit
  exportWorkflowData: async (params = {}) => {
    try {
      const response = await api.get("/workflow/export-audit", {
        params,
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error exporting workflow data:", error);
      throw error;
    }
  },
};
