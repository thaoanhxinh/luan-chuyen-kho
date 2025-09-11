import api from "./api";

export const nhapKhoService = {
  // Lấy danh sách phiếu nhập với đúng logic backend
  async getList(params = {}) {
    try {
      console.log("🔍 nhapKhoService.getList called with params:", params);

      // Xử lý trang_thai param - backend có thể nhận array hoặc string
      const queryParams = { ...params };

      // Convert array status to proper format for backend
      if (Array.isArray(queryParams.trang_thai)) {
        // Backend support array, nhưng cần serialize đúng cách
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

      const response = await api.get("/nhap-kho", { params: queryParams });

      console.log("📨 nhapKhoService.getList response:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ nhapKhoService.getList error:", error);
      throw error;
    }
  },

  async getDetail(id) {
    try {
      const response = await api.get(`/nhap-kho/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error getting phieu detail:", error);
      throw error;
    }
  },

  async create(data) {
    try {
      console.log("🆕 Creating phieu nhap with data:", data);
      const response = await api.post("/nhap-kho", data);
      console.log("✅ Create response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Create phieu error:", error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/nhap-kho/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating phieu:", error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/nhap-kho/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting phieu:", error);
      throw error;
    }
  },

  // Cấp 3 gửi phiếu lên để duyệt - CHÍNH XÁC theo backend
  async submit(id) {
    try {
      console.log("📤 Submitting phieu for approval:", id);
      const response = await api.patch(`/nhap-kho/${id}/submit`);
      console.log("✅ Submit response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Submit error:", error);
      throw error;
    }
  },

  // Manager (cấp 2) duyệt và gửi lên Admin (cấp 1) - CHÍNH XÁC theo backend
  async managerApprove(id) {
    try {
      console.log("✅ Manager approving phieu:", id);
      const response = await api.patch(`/nhap-kho/${id}/manager-approve`);
      console.log("✅ Manager approve response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Manager approve error:", error);
      throw error;
    }
  },

  // Cấp 3 duyệt điều chuyển (trường hợp đặc biệt) - CHÍNH XÁC theo backend
  async level3Approve(id) {
    try {
      console.log("✅ Level3 approving transfer phieu:", id);
      const response = await api.patch(`/nhap-kho/${id}/level3-approve`);
      console.log("✅ Level3 approve response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Level3 approve error:", error);
      throw error;
    }
  },

  // Admin (cấp 1) duyệt cuối - CHÍNH XÁC theo backend
  async approve(id) {
    try {
      console.log("✅ Admin final approving phieu:", id);
      const response = await api.patch(`/nhap-kho/${id}/approve`);
      console.log("✅ Admin approve response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Admin approve error:", error);
      throw error;
    }
  },

  // Yêu cầu chỉnh sửa - Admin/Manager gửi về cho cấp 3 sửa - CHÍNH XÁC theo backend
  async requestRevision(id, data) {
    try {
      console.log("📝 Requesting revision for phieu:", id, "with data:", data);
      const response = await api.patch(
        `/nhap-kho/${id}/request-revision`,
        data
      );
      console.log("✅ Request revision response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Request revision error:", error);
      throw error;
    }
  },

  // Hoàn thành phiếu - CHÍNH XÁC theo backend
  async complete(id, data = {}) {
    try {
      console.log("🎯 Completing phieu:", id);
      const response = await api.patch(`/nhap-kho/${id}/complete`, data);
      console.log("✅ Complete response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Complete error:", error);
      throw error;
    }
  },

  // Hủy phiếu - CHÍNH XÁC theo backend
  async cancel(id) {
    try {
      console.log("❌ Cancelling phieu:", id);
      const response = await api.patch(`/nhap-kho/${id}/cancel`);
      console.log("✅ Cancel response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Cancel error:", error);
      throw error;
    }
  },

  // Cập nhật số lượng thực tế - CHÍNH XÁC theo backend
  async updateActualQuantity(id, data) {
    try {
      const response = await api.put(`/nhap-kho/${id}/actual-quantity`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating actual quantity:", error);
      throw error;
    }
  },

  // Upload quyết định - CHÍNH XÁC theo backend
  async uploadDecision(id, formData) {
    try {
      console.log("📤 Uploading decision for phieu:", id);
      const response = await api.post(
        `/nhap-kho/${id}/upload-decision`,
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

  // Download quyết định - CHÍNH XÁC theo backend
  async downloadDecision(id) {
    try {
      const response = await api.get(`/nhap-kho/${id}/download-decision`);
      return response.data;
    } catch (error) {
      console.error("Error downloading decision:", error);
      throw error;
    }
  },

  // In phiếu - CHÍNH XÁC theo backend
  async printPhieu(id, printData) {
    try {
      const response = await api.post(`/nhap-kho/${id}/print`, printData);
      return response.data;
    } catch (error) {
      console.error("Error printing phieu:", error);
      throw error;
    }
  },

  // API lấy phòng ban cung cấp - CHÍNH XÁC theo backend endpoint
  async getPhongBanCungCap(loaiPhieu = "tren_cap") {
    try {
      const response = await api.get("/nhap-kho/phong-ban-cung-cap", {
        params: { loai_phieu: loaiPhieu },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting phong ban cung cap:", error);
      throw error;
    }
  },

  // API lấy hàng hóa có thể nhập - CHÍNH XÁC theo backend endpoint
  async getHangHoaCoTheNhap(phongBanCungCapId) {
    try {
      const response = await api.get("/nhap-kho/hang-hoa-co-the-nhap", {
        params: { phong_ban_cung_cap_id: phongBanCungCapId },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting hang hoa co the nhap:", error);
      throw error;
    }
  },

  // API lấy danh sách phòng ban - CHÍNH XÁC theo backend endpoint
  async getPhongBanList() {
    try {
      console.log("🏢 Getting phong ban list");
      const response = await api.get("/nhap-kho/phong-ban-list");
      console.log("✅ Phong ban list response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error getting phong ban list:", error);
      // Không throw error để tránh crash UI
      return { success: false, data: [] };
    }
  },

  // Helper method để kiểm tra quyền của user với phiếu
  canUserPerformAction(user, phieu, action) {
    const isAdmin = user.role === "admin";
    const isManager = user.role === "manager";
    const isOwner = phieu.nguoi_tao === user.id;
    const status = phieu.trang_thai;

    switch (action) {
      case "view":
        return true; // Tất cả đều có thể xem (theo quyền xem)

      case "edit":
        return isOwner && ["draft", "revision_required"].includes(status);

      case "submit":
        return isOwner && status === "draft";

      case "approve":
        return (
          (isAdmin || isManager) &&
          ["confirmed", "pending_approval", "pending_level3_approval"].includes(
            status
          )
        );

      case "request_revision":
        return (
          (isAdmin || isManager) &&
          ["confirmed", "pending_approval", "pending_level3_approval"].includes(
            status
          )
        );

      case "cancel":
        return (
          (isOwner || isAdmin) &&
          [
            "draft",
            "confirmed",
            "pending_approval",
            "revision_required",
          ].includes(status)
        );

      case "upload":
        return (isAdmin || isManager) && status === "approved";

      case "complete":
        return (
          (isAdmin || isManager) &&
          status === "approved" &&
          phieu.decision_pdf_url
        );

      default:
        return false;
    }
  },

  // Helper method để lấy proper API method cho approve dựa trên user role
  getApproveMethod(user, phieu) {
    if (user.role === "manager") {
      return "managerApprove";
    } else if (user.role === "admin") {
      return "approve";
    } else if (
      user.role === "user" &&
      phieu.workflow_type === "cap3_dieu_chuyen"
    ) {
      return "level3Approve";
    }
    return null;
  },

  async getPhongBanCap2List() {
    try {
      console.log("🔍 Getting phong ban cap 2 list");
      const response = await api.get("/departments/cap-2");
      console.log("✅ Cap 2 list response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching phong ban cap 2:", error);
      throw error;
    }
  },

  // API lấy danh sách cấp 3 thuộc cấp 2
  async getPhongBanCap3ByParent(parentId) {
    try {
      console.log("🔍 Getting phong ban cap 3 for parent:", parentId);
      const response = await api.get(`/departments/cap-3/${parentId}`);
      console.log("✅ Cap 3 list response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching phong ban cap 3:", error);
      throw error;
    }
  },

  async getById(id) {
    try {
      console.log("🔍 nhapKhoService.getById called with id:", id);
      const response = await api.get(`/nhap-kho/${id}`);

      console.log("📋 getById response:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ nhapKhoService.getById error:", error);
      throw error;
    }
  },
};
