import api from "./api";

export const notificationService = {
  // =============================================
  // BASIC NOTIFICATION OPERATIONS
  // =============================================

  // Lấy danh sách thông báo
  getNotifications: async (params = {}) => {
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
  archiveNotification: async (notificationId) => {
    try {
      const response = await api.delete(
        `/notifications/${notificationId}/archive`
      );
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
  getNotificationStatistics: async () => {
    try {
      const response = await api.get("/notifications/statistics");
      return response.data;
    } catch (error) {
      console.error("Error fetching notification statistics:", error);
      throw error;
    }
  },

  // Lấy thống kê chi tiết theo loại thông báo
  getDetailedStatistics: async (params = {}) => {
    try {
      const response = await api.get("/notifications/detailed-statistics", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching detailed notification statistics:", error);
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

  // Gửi thông báo broadcast tới tất cả users
  sendBroadcastNotification: async (broadcastData) => {
    try {
      const response = await api.post(
        "/notifications/broadcast",
        broadcastData
      );
      return response.data;
    } catch (error) {
      console.error("Error sending broadcast notification:", error);
      throw error;
    }
  },

  // Gửi thông báo theo nhóm người dùng
  sendGroupNotification: async (groupData) => {
    try {
      const response = await api.post("/notifications/group", groupData);
      return response.data;
    } catch (error) {
      console.error("Error sending group notification:", error);
      throw error;
    }
  },

  // =============================================
  // NOTIFICATION PREFERENCES
  // =============================================

  // Lấy cài đặt thông báo
  getNotificationPreferences: async () => {
    try {
      const response = await api.get("/notifications/preferences");
      return response.data;
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      throw error;
    }
  },

  // Cập nhật cài đặt thông báo
  updateNotificationPreferences: async (preferences) => {
    try {
      const response = await api.put("/notifications/preferences", preferences);
      return response.data;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  },

  // Reset cài đặt thông báo về mặc định
  resetNotificationPreferences: async () => {
    try {
      const response = await api.post("/notifications/preferences/reset");
      return response.data;
    } catch (error) {
      console.error("Error resetting notification preferences:", error);
      throw error;
    }
  },

  // =============================================
  // REAL-TIME NOTIFICATION HELPERS
  // =============================================

  // Subscribe tới real-time notifications (WebSocket)
  subscribeToRealTime: (onNotification, onError) => {
    try {
      // Sẽ được implement trong realtimeService.js
      // Đây chỉ là placeholder cho integration
      console.log("Real-time subscription will be handled by realtimeService");

      // Return cleanup function
      return () => {
        console.log("Cleaning up real-time subscription");
      };
    } catch (error) {
      console.error("Error subscribing to real-time notifications:", error);
      if (onError) onError(error);
    }
  },

  // Kiểm tra connection status của real-time notifications
  checkRealTimeStatus: async () => {
    try {
      const response = await api.get("/notifications/realtime-status");
      return response.data;
    } catch (error) {
      console.error("Error checking real-time status:", error);
      throw error;
    }
  },

  // =============================================
  // NOTIFICATION TEMPLATES
  // =============================================

  // Lấy danh sách template thông báo
  getNotificationTemplates: async () => {
    try {
      const response = await api.get("/notifications/templates");
      return response.data;
    } catch (error) {
      console.error("Error fetching notification templates:", error);
      throw error;
    }
  },

  // Tạo template thông báo mới
  createNotificationTemplate: async (templateData) => {
    try {
      const response = await api.post("/notifications/templates", templateData);
      return response.data;
    } catch (error) {
      console.error("Error creating notification template:", error);
      throw error;
    }
  },

  // Sử dụng template để gửi thông báo
  sendFromTemplate: async (templateId, templateVariables) => {
    try {
      const response = await api.post(
        `/notifications/templates/${templateId}/send`,
        {
          variables: templateVariables,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error sending notification from template:", error);
      throw error;
    }
  },

  // =============================================
  // NOTIFICATION SCHEDULING
  // =============================================

  // Lên lịch gửi thông báo
  scheduleNotification: async (scheduleData) => {
    try {
      const response = await api.post("/notifications/schedule", scheduleData);
      return response.data;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      throw error;
    }
  },

  // Lấy danh sách thông báo đã lên lịch
  getScheduledNotifications: async (params = {}) => {
    try {
      const response = await api.get("/notifications/scheduled", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching scheduled notifications:", error);
      throw error;
    }
  },

  // Hủy thông báo đã lên lịch
  cancelScheduledNotification: async (scheduleId) => {
    try {
      const response = await api.delete(
        `/notifications/scheduled/${scheduleId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error canceling scheduled notification:", error);
      throw error;
    }
  },

  // =============================================
  // NOTIFICATION FILTERING AND SEARCH
  // =============================================

  // Tìm kiếm thông báo nâng cao
  searchNotifications: async (searchCriteria) => {
    try {
      const response = await api.post("/notifications/search", searchCriteria);
      return response.data;
    } catch (error) {
      console.error("Error searching notifications:", error);
      throw error;
    }
  },

  // Lọc thông báo theo loại
  filterNotificationsByType: async (type, params = {}) => {
    try {
      const response = await api.get(`/notifications/filter/${type}`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error(`Error filtering notifications by type ${type}:`, error);
      throw error;
    }
  },

  // Lấy thông báo theo mức độ ưu tiên
  getNotificationsByPriority: async (priority, params = {}) => {
    try {
      const response = await api.get(`/notifications/priority/${priority}`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching notifications by priority ${priority}:`,
        error
      );
      throw error;
    }
  },

  // =============================================
  // NOTIFICATION ANALYTICS
  // =============================================

  // Lấy analytics về hiệu quả thông báo
  getNotificationAnalytics: async (params = {}) => {
    try {
      const response = await api.get("/notifications/analytics", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching notification analytics:", error);
      throw error;
    }
  },

  // Lấy thống kê tương tác với thông báo
  getInteractionStats: async (params = {}) => {
    try {
      const response = await api.get("/notifications/interaction-stats", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching notification interaction stats:", error);
      throw error;
    }
  },

  // Lấy báo cáo delivery success rate
  getDeliveryReport: async (params = {}) => {
    try {
      const response = await api.get("/notifications/delivery-report", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching notification delivery report:", error);
      throw error;
    }
  },

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  // Format notification cho display
  formatNotificationForDisplay: (notification) => {
    return {
      id: notification.id,
      title: notification.tieu_de,
      content: notification.noi_dung,
      type: notification.loai_thong_bao,
      status: notification.trang_thai,
      createdAt: new Date(notification.created_at),
      readAt: notification.ngay_doc ? new Date(notification.ngay_doc) : null,
      isRead: notification.trang_thai === "read",
      isImportant:
        notification.loai_thong_bao === "system" ||
        notification.metadata?.priority === "high",
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

      // System notifications trước
      if (a.loai_thong_bao !== b.loai_thong_bao) {
        if (a.loai_thong_bao === "system") return -1;
        if (b.loai_thong_bao === "system") return 1;
      }

      // Mới nhất trước
      return new Date(b.created_at) - new Date(a.created_at);
    });
  },
};
