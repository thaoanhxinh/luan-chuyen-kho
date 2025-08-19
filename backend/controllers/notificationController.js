// const { sendResponse } = require("../utils/response");
// const notificationService = require("../services/notificationService");

// /**
//  * Lấy danh sách thông báo của user
//  * GET /api/notifications
//  */
// const getList = async (req, res, query, user) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       trang_thai,
//       loai_thong_bao,
//       unread_only = false,
//     } = query;

//     const filters = {
//       page: parseInt(page),
//       limit: parseInt(limit),
//       trang_thai,
//       loai_thong_bao,
//       unread_only: unread_only === "true",
//     };

//     const result = await notificationService.getUserNotifications(
//       user.id,
//       filters
//     );

//     sendResponse(res, 200, true, "Lấy danh sách thông báo thành công", {
//       items: result.items,
//       pagination: {
//         page: filters.page,
//         limit: filters.limit,
//         total: result.total,
//         pages: result.pages,
//       },
//     });
//   } catch (error) {
//     console.error("Get notifications error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// /**
//  * Đánh dấu thông báo đã đọc
//  * PATCH /api/notifications/:id/read
//  */
// const markAsRead = async (req, res, params, user) => {
//   try {
//     const { id } = params;

//     const updatedCount = await notificationService.markAsRead([id], user.id);

//     if (updatedCount === 0) {
//       return sendResponse(
//         res,
//         404,
//         false,
//         "Không tìm thấy thông báo hoặc đã được đọc"
//       );
//     }

//     sendResponse(res, 200, true, "Đánh dấu đã đọc thành công");
//   } catch (error) {
//     console.error("Mark notification as read error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// /**
//  * Đánh dấu nhiều thông báo đã đọc
//  * PATCH /api/notifications/bulk-read
//  */
// const bulkMarkAsRead = async (req, res, body, user) => {
//   try {
//     const { notification_ids } = body;

//     if (
//       !notification_ids ||
//       !Array.isArray(notification_ids) ||
//       notification_ids.length === 0
//     ) {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Danh sách ID thông báo không hợp lệ"
//       );
//     }

//     const updatedCount = await notificationService.markAsRead(
//       notification_ids,
//       user.id
//     );

//     sendResponse(
//       res,
//       200,
//       true,
//       `Đã đánh dấu ${updatedCount} thông báo là đã đọc`
//     );
//   } catch (error) {
//     console.error("Bulk mark as read error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// /**
//  * Đánh dấu tất cả thông báo đã đọc
//  * PATCH /api/notifications/mark-all-read
//  */
// const markAllAsRead = async (req, res, body, user) => {
//   try {
//     const updatedCount = await notificationService.markAllAsRead(user.id);

//     sendResponse(
//       res,
//       200,
//       true,
//       `Đã đánh dấu tất cả ${updatedCount} thông báo là đã đọc`
//     );
//   } catch (error) {
//     console.error("Mark all as read error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// /**
//  * Lấy số lượng thông báo chưa đọc
//  * GET /api/notifications/unread-count
//  */
// const getUnreadCount = async (req, res, query, user) => {
//   try {
//     const count = await notificationService.getUnreadCount(user.id);

//     sendResponse(res, 200, true, "Lấy số thông báo chưa đọc thành công", {
//       unread_count: count,
//     });
//   } catch (error) {
//     console.error("Get unread count error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// /**
//  * Lấy thống kê thông báo
//  * GET /api/notifications/statistics
//  */
// const getStatistics = async (req, res, query, user) => {
//   try {
//     const stats = await notificationService.getNotificationStats(user.id);

//     const enhancedStats = {
//       ...stats,
//       engagement_rate:
//         stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0,
//       recent_activity: {
//         this_week: parseInt(stats.this_week),
//         this_month: parseInt(stats.this_month),
//       },
//       breakdown_by_type: {
//         new_requests: parseInt(stats.new_requests),
//         approvals: parseInt(stats.approvals),
//         rejections: parseInt(stats.rejections),
//         completions: parseInt(stats.completions),
//       },
//     };

//     sendResponse(
//       res,
//       200,
//       true,
//       "Lấy thống kê thông báo thành công",
//       enhancedStats
//     );
//   } catch (error) {
//     console.error("Get notification statistics error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// /**
//  * Tạo thông báo hệ thống (chỉ admin)
//  * POST /api/notifications/system
//  */
// const createSystemNotification = async (req, res, body, user) => {
//   try {
//     if (user.role !== "admin") {
//       return sendResponse(
//         res,
//         403,
//         false,
//         "Chỉ admin mới có quyền tạo thông báo hệ thống"
//       );
//     }

//     const {
//       target_users, // 'all', 'department', hoặc array user IDs
//       phong_ban_ids, // Nếu target_users = 'department'
//       title,
//       content,
//       url,
//       metadata = {},
//     } = body;

//     if (!title || !content) {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Thiếu tiêu đề hoặc nội dung thông báo"
//       );
//     }

//     let userIds = [];

//     if (target_users === "all") {
//       // Gửi cho tất cả users active
//       const allUsersResult = await pool.query(
//         "SELECT id FROM users WHERE trang_thai = 'active'"
//       );
//       userIds = allUsersResult.rows.map((row) => row.id);
//     } else if (target_users === "department" && phong_ban_ids) {
//       // Gửi cho users trong các phòng ban cụ thể
//       const deptUsersResult = await pool.query(
//         "SELECT id FROM users WHERE phong_ban_id = ANY($1) AND trang_thai = 'active'",
//         [phong_ban_ids]
//       );
//       userIds = deptUsersResult.rows.map((row) => row.id);
//     } else if (Array.isArray(target_users)) {
//       // Gửi cho danh sách users cụ thể
//       userIds = target_users;
//     } else {
//       return sendResponse(res, 400, false, "Target users không hợp lệ");
//     }

//     if (userIds.length === 0) {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Không có người dùng nào để gửi thông báo"
//       );
//     }

//     const notifications = await notificationService.notifySystemMessage(
//       userIds,
//       title,
//       content,
//       { url, ...metadata }
//     );

//     sendResponse(
//       res,
//       201,
//       true,
//       `Đã tạo thông báo hệ thống cho ${notifications.length} người dùng`,
//       {
//         notification_count: notifications.length,
//         target_count: userIds.length,
//       }
//     );
//   } catch (error) {
//     console.error("Create system notification error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// /**
//  * Xóa thông báo (archive)
//  * DELETE /api/notifications/:id
//  */
// const archiveNotification = async (req, res, params, user) => {
//   try {
//     const { id } = params;

//     const result = await pool.query(
//       `UPDATE notifications
//        SET trang_thai = 'archived'
//        WHERE id = $1 AND nguoi_nhan = $2 AND trang_thai != 'archived'
//        RETURNING id`,
//       [id, user.id]
//     );

//     if (result.rows.length === 0) {
//       return sendResponse(
//         res,
//         404,
//         false,
//         "Không tìm thấy thông báo hoặc đã được lưu trữ"
//       );
//     }

//     sendResponse(res, 200, true, "Lưu trữ thông báo thành công");
//   } catch (error) {
//     console.error("Archive notification error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// /**
//  * Lấy cài đặt thông báo của user
//  * GET /api/notifications/preferences
//  */
// const getNotificationPreferences = async (req, res, query, user) => {
//   try {
//     // Trong tương lai có thể lưu preferences trong database
//     // Hiện tại trả về default settings
//     const defaultPreferences = {
//       email_enabled: true,
//       in_app_enabled: true,
//       notification_types: {
//         yeu_cau_moi: true,
//         phe_duyet: true,
//         tu_choi: true,
//         hoan_thanh: true,
//         system: true,
//       },
//       quiet_hours: {
//         enabled: false,
//         start_time: "22:00",
//         end_time: "08:00",
//       },
//       digest_frequency: "daily", // "immediate", "daily", "weekly"
//     };

//     sendResponse(
//       res,
//       200,
//       true,
//       "Lấy cài đặt thông báo thành công",
//       defaultPreferences
//     );
//   } catch (error) {
//     console.error("Get notification preferences error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// /**
//  * Cập nhật cài đặt thông báo
//  * PUT /api/notifications/preferences
//  */
// const updateNotificationPreferences = async (req, res, body, user) => {
//   try {
//     const {
//       email_enabled,
//       in_app_enabled,
//       notification_types,
//       quiet_hours,
//       digest_frequency,
//     } = body;

//     // Validate preferences
//     if (notification_types) {
//       const validTypes = [
//         "yeu_cau_moi",
//         "phe_duyet",
//         "tu_choi",
//         "hoan_thanh",
//         "system",
//       ];
//       const invalidTypes = Object.keys(notification_types).filter(
//         (type) => !validTypes.includes(type)
//       );

//       if (invalidTypes.length > 0) {
//         return sendResponse(
//           res,
//           400,
//           false,
//           `Loại thông báo không hợp lệ: ${invalidTypes.join(", ")}`
//         );
//       }
//     }

//     // Trong tương lai sẽ lưu vào database
//     // Hiện tại chỉ trả về success response
//     const updatedPreferences = {
//       email_enabled: email_enabled !== undefined ? email_enabled : true,
//       in_app_enabled: in_app_enabled !== undefined ? in_app_enabled : true,
//       notification_types: notification_types || {},
//       quiet_hours: quiet_hours || {},
//       digest_frequency: digest_frequency || "daily",
//     };

//     sendResponse(
//       res,
//       200,
//       true,
//       "Cập nhật cài đặt thông báo thành công",
//       updatedPreferences
//     );
//   } catch (error) {
//     console.error("Update notification preferences error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// /**
//  * Dọn dẹp thông báo cũ (admin only)
//  * POST /api/notifications/cleanup
//  */
// const cleanupNotifications = async (req, res, body, user) => {
//   try {
//     if (user.role !== "admin") {
//       return sendResponse(
//         res,
//         403,
//         false,
//         "Chỉ admin mới có quyền dọn dẹp thông báo"
//       );
//     }

//     const { days_to_keep = 90 } = body;

//     if (days_to_keep < 1 || days_to_keep > 365) {
//       return sendResponse(res, 400, false, "Số ngày giữ lại phải từ 1 đến 365");
//     }

//     const deletedCount = await notificationService.cleanupOldNotifications(
//       days_to_keep
//     );

//     sendResponse(res, 200, true, `Đã dọn dẹp ${deletedCount} thông báo cũ`, {
//       deleted_count: deletedCount,
//       days_kept: days_to_keep,
//     });
//   } catch (error) {
//     console.error("Cleanup notifications error:", error);
//     sendResponse(res, 500, false, "Lỗi server", { error: error.message });
//   }
// };

// module.exports = {
//   getList,
//   markAsRead,
//   bulkMarkAsRead,
//   markAllAsRead,
//   getUnreadCount,
//   getStatistics,
//   createSystemNotification,
//   archiveNotification,
//   getNotificationPreferences,
//   updateNotificationPreferences,
//   cleanupNotifications,
// };

const { sendResponse } = require("../utils/response");
const notificationService = require("../services/notificationService");

/**
 * Lấy danh sách thông báo của user
 * GET /api/notifications
 */
const getList = async (req, res, query, user) => {
  try {
    const {
      page = 1,
      limit = 20,
      trang_thai,
      loai_thong_bao,
      unread_only = false,
    } = query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      trang_thai,
      loai_thong_bao,
      unread_only: unread_only === "true",
    };

    const result = await notificationService.getUserNotifications(
      user.id,
      filters
    );

    sendResponse(res, 200, true, "Lấy danh sách thông báo thành công", {
      items: result.items,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

/**
 * Đánh dấu thông báo đã đọc
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res, params, user) => {
  try {
    const { id } = params;

    const updatedCount = await notificationService.markAsRead([id], user.id);

    if (updatedCount === 0) {
      return sendResponse(
        res,
        404,
        false,
        "Không tìm thấy thông báo hoặc đã được đọc"
      );
    }

    sendResponse(res, 200, true, "Đánh dấu đã đọc thành công");
  } catch (error) {
    console.error("Mark notification as read error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

/**
 * Đánh dấu nhiều thông báo đã đọc
 * PATCH /api/notifications/bulk-read
 */
const bulkMarkAsRead = async (req, res, body, user) => {
  try {
    const { notification_ids } = body;

    if (
      !notification_ids ||
      !Array.isArray(notification_ids) ||
      notification_ids.length === 0
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Danh sách ID thông báo không hợp lệ"
      );
    }

    const updatedCount = await notificationService.markAsRead(
      notification_ids,
      user.id
    );

    sendResponse(
      res,
      200,
      true,
      `Đã đánh dấu ${updatedCount} thông báo là đã đọc`
    );
  } catch (error) {
    console.error("Bulk mark as read error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 * PATCH /api/notifications/mark-all-read
 */
const markAllAsRead = async (req, res, body, user) => {
  try {
    const updatedCount = await notificationService.markAllAsRead(user.id);

    sendResponse(
      res,
      200,
      true,
      `Đã đánh dấu tất cả ${updatedCount} thông báo là đã đọc`
    );
  } catch (error) {
    console.error("Mark all as read error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

/**
 * Lấy số lượng thông báo chưa đọc
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, query, user) => {
  try {
    const count = await notificationService.getUnreadCount(user.id);

    sendResponse(res, 200, true, "Lấy số thông báo chưa đọc thành công", {
      unread_count: count,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

/**
 * Lấy thống kê thông báo
 * GET /api/notifications/statistics
 */
const getStatistics = async (req, res, query, user) => {
  try {
    const stats = await notificationService.getNotificationStats(user.id);

    const enhancedStats = {
      ...stats,
      engagement_rate:
        stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0,
      recent_activity: {
        this_week: parseInt(stats.this_week),
        this_month: parseInt(stats.this_month),
      },
      breakdown_by_type: {
        phieu_nhap_can_duyet: parseInt(stats.phieu_nhap_can_duyet || 0),
        phieu_nhap_duyet: parseInt(stats.phieu_nhap_duyet || 0),
        phieu_nhap_can_sua: parseInt(stats.phieu_nhap_can_sua || 0),
        phieu_xuat_can_duyet: parseInt(stats.phieu_xuat_can_duyet || 0),
        phieu_xuat_duyet: parseInt(stats.phieu_xuat_duyet || 0),
        phieu_xuat_can_sua: parseInt(stats.phieu_xuat_can_sua || 0),
        system: parseInt(stats.system || 0),
      },
    };

    sendResponse(
      res,
      200,
      true,
      "Lấy thống kê thông báo thành công",
      enhancedStats
    );
  } catch (error) {
    console.error("Get notification statistics error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

/**
 * Tạo thông báo hệ thống (chỉ admin)
 * POST /api/notifications/system
 */
const createSystemNotification = async (req, res, body, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        "Chỉ admin mới có quyền tạo thông báo hệ thống"
      );
    }

    const {
      target_users, // 'all', 'department', hoặc array user IDs
      phong_ban_ids, // Nếu target_users = 'department'
      title,
      content,
      url,
      metadata = {},
    } = body;

    if (!title || !content) {
      return sendResponse(
        res,
        400,
        false,
        "Thiếu tiêu đề hoặc nội dung thông báo"
      );
    }

    let userIds = [];

    if (target_users === "all") {
      // Gửi cho tất cả users active
      const allUsersResult = await pool.query(
        "SELECT id FROM users WHERE trang_thai = 'active'"
      );
      userIds = allUsersResult.rows.map((row) => row.id);
    } else if (target_users === "department" && phong_ban_ids) {
      // Gửi cho users trong các phòng ban cụ thể
      const deptUsersResult = await pool.query(
        "SELECT id FROM users WHERE phong_ban_id = ANY($1) AND trang_thai = 'active'",
        [phong_ban_ids]
      );
      userIds = deptUsersResult.rows.map((row) => row.id);
    } else if (Array.isArray(target_users)) {
      // Gửi cho danh sách users cụ thể
      userIds = target_users;
    } else {
      return sendResponse(res, 400, false, "Target users không hợp lệ");
    }

    if (userIds.length === 0) {
      return sendResponse(
        res,
        400,
        false,
        "Không có người dùng nào để gửi thông báo"
      );
    }

    const notifications = await notificationService.notifySystemMessage(
      userIds,
      title,
      content,
      { url, ...metadata }
    );

    sendResponse(
      res,
      201,
      true,
      `Đã tạo thông báo hệ thống cho ${notifications.length} người dùng`,
      {
        notification_count: notifications.length,
        target_count: userIds.length,
      }
    );
  } catch (error) {
    console.error("Create system notification error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

/**
 * Xóa thông báo (archive)
 * DELETE /api/notifications/:id
 */
const archiveNotification = async (req, res, params, user) => {
  try {
    const { id } = params;

    const result = await pool.query(
      `UPDATE notifications 
       SET trang_thai = 'archived'
       WHERE id = $1 AND nguoi_nhan = $2 AND trang_thai != 'archived'
       RETURNING id`,
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return sendResponse(
        res,
        404,
        false,
        "Không tìm thấy thông báo hoặc đã được lưu trữ"
      );
    }

    sendResponse(res, 200, true, "Lưu trữ thông báo thành công");
  } catch (error) {
    console.error("Archive notification error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

/**
 * Lấy cài đặt thông báo của user
 * GET /api/notifications/preferences
 */
const getNotificationPreferences = async (req, res, query, user) => {
  try {
    // Trong tương lai có thể lưu preferences trong database
    // Hiện tại trả về default settings
    const defaultPreferences = {
      email_enabled: true,
      in_app_enabled: true,
      notification_types: {
        phieu_nhap_can_duyet: true,
        phieu_nhap_duyet: true,
        phieu_nhap_can_sua: true,
        phieu_xuat_can_duyet: true,
        phieu_xuat_duyet: true,
        phieu_xuat_can_sua: true,
        system: true,
      },
      quiet_hours: {
        enabled: false,
        start_time: "22:00",
        end_time: "08:00",
      },
      digest_frequency: "daily", // "immediate", "daily", "weekly"
    };

    sendResponse(
      res,
      200,
      true,
      "Lấy cài đặt thông báo thành công",
      defaultPreferences
    );
  } catch (error) {
    console.error("Get notification preferences error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

/**
 * Cập nhật cài đặt thông báo
 * PUT /api/notifications/preferences
 */
const updateNotificationPreferences = async (req, res, body, user) => {
  try {
    const {
      email_enabled,
      in_app_enabled,
      notification_types,
      quiet_hours,
      digest_frequency,
    } = body;

    // Validate preferences
    if (notification_types) {
      const validTypes = [
        "phieu_nhap_can_duyet",
        "phieu_nhap_duyet",
        "phieu_nhap_can_sua",
        "phieu_xuat_can_duyet",
        "phieu_xuat_duyet",
        "phieu_xuat_can_sua",
        "system",
      ];
      const invalidTypes = Object.keys(notification_types).filter(
        (type) => !validTypes.includes(type)
      );

      if (invalidTypes.length > 0) {
        return sendResponse(
          res,
          400,
          false,
          `Loại thông báo không hợp lệ: ${invalidTypes.join(", ")}`
        );
      }
    }

    // Trong tương lai sẽ lưu vào database
    // Hiện tại chỉ trả về success response
    const updatedPreferences = {
      email_enabled: email_enabled !== undefined ? email_enabled : true,
      in_app_enabled: in_app_enabled !== undefined ? in_app_enabled : true,
      notification_types: notification_types || {},
      quiet_hours: quiet_hours || {},
      digest_frequency: digest_frequency || "daily",
    };

    sendResponse(
      res,
      200,
      true,
      "Cập nhật cài đặt thông báo thành công",
      updatedPreferences
    );
  } catch (error) {
    console.error("Update notification preferences error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

/**
 * Dọn dẹp thông báo cũ (admin only)
 * POST /api/notifications/cleanup
 */
const cleanupNotifications = async (req, res, body, user) => {
  try {
    if (user.role !== "admin") {
      return sendResponse(
        res,
        403,
        false,
        "Chỉ admin mới có quyền dọn dẹp thông báo"
      );
    }

    const { days_to_keep = 90 } = body;

    if (days_to_keep < 1 || days_to_keep > 365) {
      return sendResponse(res, 400, false, "Số ngày giữ lại phải từ 1 đến 365");
    }

    const deletedCount = await notificationService.cleanupOldNotifications(
      days_to_keep
    );

    sendResponse(res, 200, true, `Đã dọn dẹp ${deletedCount} thông báo cũ`, {
      deleted_count: deletedCount,
      days_kept: days_to_keep,
    });
  } catch (error) {
    console.error("Cleanup notifications error:", error);
    sendResponse(res, 500, false, "Lỗi server", { error: error.message });
  }
};

module.exports = {
  getList,
  markAsRead,
  bulkMarkAsRead,
  markAllAsRead,
  getUnreadCount,
  getStatistics,
  createSystemNotification,
  archiveNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  cleanupNotifications,
};
