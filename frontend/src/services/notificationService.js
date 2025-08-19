import api from "./api";

export const notificationService = {
  // =============================================
  // BASIC NOTIFICATION OPERATIONS
  // =============================================

  // Lấy danh sách thông báo
  getList: async (params = {}) => {
    try {
      const response = await api.get("/notifications", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Đánh dấu thông báo đã đọc
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  // Đánh dấu nhiều thông báo đã đọc
  bulkMarkAsRead: async (notificationIds) => {
    try {
      const response = await api.patch("/notifications/bulk-read", {
        notification_ids: notificationIds,
      });
      return response.data;
    } catch (error) {
      console.error("Error bulk marking notifications as read:", error);
      throw error;
    }
  },

  // Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: async () => {
    try {
      const response = await api.patch("/notifications/mark-all-read");
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  // Lưu trữ thông báo (archive)
  archive: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error("Error archiving notification:", error);
      throw error;
    }
  },

  // =============================================
  // NOTIFICATION STATISTICS AND COUNTS
  // =============================================

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      return response.data;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  },

  // Lấy thống kê thông báo
  getStatistics: async () => {
    try {
      const response = await api.get("/notifications/statistics");
      return response.data;
    } catch (error) {
      console.error("Error fetching notification statistics:", error);
      throw error;
    }
  },

  // =============================================
  // ADMIN NOTIFICATION OPERATIONS
  // =============================================

  // Tạo thông báo hệ thống (chỉ admin)
  createSystemNotification: async (notificationData) => {
    try {
      const response = await api.post(
        "/notifications/system",
        notificationData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating system notification:", error);
      throw error;
    }
  },

  // Dọn dẹp thông báo cũ (chỉ admin)
  cleanupOldNotifications: async (daysToKeep = 90) => {
    try {
      const response = await api.post("/notifications/cleanup", {
        days_to_keep: daysToKeep,
      });
      return response.data;
    } catch (error) {
      console.error("Error cleaning up old notifications:", error);
      throw error;
    }
  },

  // =============================================
  // NOTIFICATION PREFERENCES
  // =============================================

  // Lấy cài đặt thông báo
  getPreferences: async () => {
    try {
      const response = await api.get("/notifications/preferences");
      return response.data;
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      throw error;
    }
  },

  // Cập nhật cài đặt thông báo
  updatePreferences: async (preferences) => {
    try {
      const response = await api.put("/notifications/preferences", preferences);
      return response.data;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  },

  // =============================================
  // WORKFLOW NOTIFICATION HELPERS
  // =============================================

  // Thông báo khi phiếu nhập cần duyệt
  notifyPhieuNhapCanDuyet: async (phieuData, nguoiDuyet) => {
    try {
      const response = await api.post("/notifications/phieu-nhap-can-duyet", {
        phieu_data: phieuData,
        nguoi_duyet: nguoiDuyet,
      });
      return response.data;
    } catch (error) {
      console.error("Error notifying phieu nhap can duyet:", error);
      throw error;
    }
  },

  // Thông báo khi phiếu nhập được duyệt
  notifyPhieuNhapDuyet: async (phieuData, nguoiTao) => {
    try {
      const response = await api.post("/notifications/phieu-nhap-duyet", {
        phieu_data: phieuData,
        nguoi_tao: nguoiTao,
      });
      return response.data;
    } catch (error) {
      console.error("Error notifying phieu nhap duyet:", error);
      throw error;
    }
  },

  // Thông báo khi phiếu nhập cần sửa
  notifyPhieuNhapCanSua: async (phieuData, nguoiTao, ghiChu) => {
    try {
      const response = await api.post("/notifications/phieu-nhap-can-sua", {
        phieu_data: phieuData,
        nguoi_tao: nguoiTao,
        ghi_chu_phan_hoi: ghiChu,
      });
      return response.data;
    } catch (error) {
      console.error("Error notifying phieu nhap can sua:", error);
      throw error;
    }
  },

  // Thông báo khi phiếu xuất cần duyệt
  notifyPhieuXuatCanDuyet: async (phieuData, nguoiDuyet) => {
    try {
      const response = await api.post("/notifications/phieu-xuat-can-duyet", {
        phieu_data: phieuData,
        nguoi_duyet: nguoiDuyet,
      });
      return response.data;
    } catch (error) {
      console.error("Error notifying phieu xuat can duyet:", error);
      throw error;
    }
  },

  // Thông báo khi phiếu xuất được duyệt
  notifyPhieuXuatDuyet: async (phieuData, nguoiTao) => {
    try {
      const response = await api.post("/notifications/phieu-xuat-duyet", {
        phieu_data: phieuData,
        nguoi_tao: nguoiTao,
      });
      return response.data;
    } catch (error) {
      console.error("Error notifying phieu xuat duyet:", error);
      throw error;
    }
  },

  // Thông báo khi phiếu xuất cần sửa
  notifyPhieuXuatCanSua: async (phieuData, nguoiTao, ghiChu) => {
    try {
      const response = await api.post("/notifications/phieu-xuat-can-sua", {
        phieu_data: phieuData,
        nguoi_tao: nguoiTao,
        ghi_chu_phan_hoi: ghiChu,
      });
      return response.data;
    } catch (error) {
      console.error("Error notifying phieu xuat can sua:", error);
      throw error;
    }
  },

  // =============================================
  // REAL-TIME NOTIFICATION HELPERS
  // =============================================

  // Subscribe tới real-time notifications (WebSocket)
  subscribeToRealTime: (onNotification, onError) => {
    try {
      // TODO: Implement WebSocket connection
      console.log("Real-time subscription will be handled by WebSocket");

      // Return cleanup function
      return () => {
        console.log("Cleaning up real-time subscription");
      };
    } catch (error) {
      console.error("Error subscribing to real-time notifications:", error);
      if (onError) onError(error);
    }
  },

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  // Format notification cho display
  formatNotificationForDisplay: (notification) => {
    const typeLabels = {
      phieu_nhap_can_duyet: "Phiếu nhập cần duyệt",
      phieu_nhap_duyet: "Phiếu nhập đã duyệt",
      phieu_nhap_can_sua: "Phiếu nhập cần sửa",
      phieu_xuat_can_duyet: "Phiếu xuất cần duyệt",
      phieu_xuat_duyet: "Phiếu xuất đã duyệt",
      phieu_xuat_can_sua: "Phiếu xuất cần sửa",
      system: "Hệ thống",
    };

    const priorityColors = {
      urgent: "text-red-600 bg-red-100",
      high: "text-orange-600 bg-orange-100",
      medium: "text-yellow-600 bg-yellow-100",
      normal: "text-blue-600 bg-blue-100",
      low: "text-gray-600 bg-gray-100",
    };

    return {
      id: notification.id,
      title: notification.tieu_de,
      content: notification.noi_dung,
      type: notification.loai_thong_bao,
      typeLabel: typeLabels[notification.loai_thong_bao] || "Thông báo",
      status: notification.trang_thai,
      createdAt: new Date(notification.created_at),
      readAt: notification.ngay_doc ? new Date(notification.ngay_doc) : null,
      isRead: notification.trang_thai === "read",
      isImportant:
        notification.metadata?.priority === "urgent" ||
        notification.metadata?.priority === "high",
      priority: notification.metadata?.priority || "normal",
      priorityClass:
        priorityColors[notification.metadata?.priority] ||
        priorityColors.normal,
      redirectUrl: notification.url_redirect,
      metadata: notification.metadata,
    };
  },

  // Tính toán badge count cho UI
  calculateBadgeCount: (notifications) => {
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter((n) => n.trang_thai === "unread").length;
  },

  // Group notifications theo loại
  groupNotificationsByType: (notifications) => {
    if (!Array.isArray(notifications)) return {};

    return notifications.reduce((groups, notification) => {
      const type = notification.loai_thong_bao;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(notification);
      return groups;
    }, {});
  },

  // Sort notifications theo mức độ quan trọng và thời gian
  sortNotificationsByImportance: (notifications) => {
    if (!Array.isArray(notifications)) return [];

    return [...notifications].sort((a, b) => {
      // Unread trước
      if (a.trang_thai !== b.trang_thai) {
        return a.trang_thai === "unread" ? -1 : 1;
      }

      // Priority trước (urgent > high > medium > normal > low)
      const priorityOrder = {
        urgent: 0,
        high: 1,
        medium: 2,
        normal: 3,
        low: 4,
      };
      const aPriority = priorityOrder[a.metadata?.priority] ?? 3;
      const bPriority = priorityOrder[b.metadata?.priority] ?? 3;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Mới nhất trước
      return new Date(b.created_at) - new Date(a.created_at);
    });
  },

  // Check có thông báo mới trong khoảng thời gian
  hasNewNotifications: (notifications, lastCheckTime) => {
    if (!Array.isArray(notifications) || !lastCheckTime) return false;

    return notifications.some(
      (n) =>
        new Date(n.created_at) > new Date(lastCheckTime) &&
        n.trang_thai === "unread"
    );
  },

  // Lấy thông báo có priority cao
  getHighPriorityNotifications: (notifications) => {
    if (!Array.isArray(notifications)) return [];

    return notifications.filter(
      (n) =>
        n.trang_thai === "unread" &&
        (n.metadata?.priority === "urgent" || n.metadata?.priority === "high")
    );
  },

  // Format relative time cho notification
  formatNotificationTime: (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    return created.toLocaleDateString("vi-VN");
  },

  // Tạo notification sound effect (nếu cần)
  playNotificationSound: (priority = "normal") => {
    try {
      // TODO: Implement sound notification
      console.log(`🔊 Playing notification sound for priority: ${priority}`);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  },

  // Local storage helpers cho notification state
  saveLastCheckTime: () => {
    try {
      localStorage.setItem("lastNotificationCheck", new Date().toISOString());
    } catch (error) {
      console.error("Error saving last check time:", error);
    }
  },

  getLastCheckTime: () => {
    try {
      return localStorage.getItem("lastNotificationCheck");
    } catch (error) {
      console.error("Error getting last check time:", error);
      return null;
    }
  },

  // Kiểm tra browser permission cho notifications
  requestBrowserNotificationPermission: async () => {
    try {
      if (!("Notification" in window)) {
        console.log("Browser không hỗ trợ notifications");
        return false;
      }

      if (Notification.permission === "granted") {
        return true;
      }

      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }

      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  },

  // Hiển thị browser notification
  showBrowserNotification: (notification) => {
    try {
      if (Notification.permission !== "granted") return;

      const browserNotif = new Notification(notification.tieu_de, {
        body: notification.noi_dung,
        icon: "/favicon.ico", // hoặc icon phù hợp
        tag: notification.id.toString(),
        requireInteraction: notification.metadata?.priority === "urgent",
      });

      browserNotif.onclick = () => {
        window.focus();
        if (notification.url_redirect) {
          window.location.href = notification.url_redirect;
        }
        browserNotif.close();
      };

      // Auto close sau 5 giây nếu không phải urgent
      if (notification.metadata?.priority !== "urgent") {
        setTimeout(() => browserNotif.close(), 5000);
      }
    } catch (error) {
      console.error("Error showing browser notification:", error);
    }
  },
};
