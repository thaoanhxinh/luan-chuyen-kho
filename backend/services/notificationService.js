const pool = require("../config/database");

/**
 * Tạo thông báo mới
 */
const createNotification = async (notificationData) => {
  const {
    nguoi_nhan,
    loai_thong_bao,
    tieu_de,
    noi_dung,
    url_redirect,
    metadata = {},
    muc_do_uu_tien = "normal",
  } = notificationData;

  try {
    const result = await pool.query(
      `INSERT INTO notifications (
        nguoi_nhan, loai_thong_bao, tieu_de, noi_dung, 
        url_redirect, metadata, muc_do_uu_tien
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        nguoi_nhan,
        loai_thong_bao,
        tieu_de,
        noi_dung,
        url_redirect,
        JSON.stringify(metadata),
        muc_do_uu_tien,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Tạo thông báo cho nhiều users - HELPER FUNCTION
 */
const createNotifications = async (
  userIds,
  title,
  content,
  type,
  metadata = {}
) => {
  try {
    const notifications = [];

    for (const userId of userIds) {
      const notification = await createNotification({
        nguoi_nhan: userId,
        loai_thong_bao: type,
        tieu_de: title,
        noi_dung: content,
        url_redirect: metadata.url,
        metadata,
        muc_do_uu_tien: metadata.priority || "normal",
      });
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error("Error creating notifications:", error);
    throw error;
  }
};

/**
 * Lấy danh sách thông báo của user với phân trang
 */
const getUserNotifications = async (userId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    trang_thai,
    loai_thong_bao,
    unread_only = false,
  } = filters;

  const offset = (page - 1) * limit;
  let whereConditions = ["nguoi_nhan = $1"];
  let queryParams = [userId];
  let paramCount = 1;

  // Add filters
  if (trang_thai) {
    paramCount++;
    whereConditions.push(`trang_thai = $${paramCount}`);
    queryParams.push(trang_thai);
  }

  if (loai_thong_bao) {
    paramCount++;
    whereConditions.push(`loai_thong_bao = $${paramCount}`);
    queryParams.push(loai_thong_bao);
  }

  if (unread_only) {
    whereConditions.push("trang_thai = 'unread'");
  }

  const whereClause = whereConditions.join(" AND ");

  try {
    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`,
      queryParams
    );

    const total = parseInt(countResult.rows[0].total);
    const pages = Math.ceil(total / limit);

    // Get notifications
    const result = await pool.query(
      `SELECT 
        id, nguoi_nhan, loai_thong_bao, tieu_de, noi_dung,
        url_redirect, metadata, muc_do_uu_tien, trang_thai,
        created_at, ngay_doc
      FROM notifications 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    return {
      items: result.rows,
      total,
      pages,
      currentPage: page,
    };
  } catch (error) {
    console.error("Error getting user notifications:", error);
    throw error;
  }
};

/**
 * Đánh dấu thông báo đã đọc
 */
const markAsRead = async (notificationIds, userId) => {
  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET trang_thai = 'read', ngay_doc = CURRENT_TIMESTAMP
       WHERE id = ANY($1) AND nguoi_nhan = $2 AND trang_thai = 'unread'
       RETURNING id`,
      [notificationIds, userId]
    );

    return result.rows.length;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await pool.query(
      `UPDATE notifications 
       SET trang_thai = 'read', ngay_doc = CURRENT_TIMESTAMP
       WHERE nguoi_nhan = $1 AND trang_thai = 'unread'
       RETURNING id`,
      [userId]
    );

    return result.rows.length;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Lấy số lượng thông báo chưa đọc
 */
const getUnreadCount = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE nguoi_nhan = $1 AND trang_thai = 'unread'`,
      [userId]
    );

    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
};

/**
 * Lấy thống kê thông báo
 */
const getNotificationStats = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN trang_thai = 'unread' THEN 1 END) as unread,
        COUNT(CASE WHEN trang_thai = 'read' THEN 1 END) as read,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as this_week,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as this_month,
        COUNT(CASE WHEN loai_thong_bao = 'phieu_nhap_can_duyet' THEN 1 END) as phieu_nhap_can_duyet,
        COUNT(CASE WHEN loai_thong_bao = 'phieu_nhap_duyet' THEN 1 END) as phieu_nhap_duyet,
        COUNT(CASE WHEN loai_thong_bao = 'phieu_nhap_can_sua' THEN 1 END) as phieu_nhap_can_sua,
        COUNT(CASE WHEN loai_thong_bao = 'phieu_xuat_can_duyet' THEN 1 END) as phieu_xuat_can_duyet,
        COUNT(CASE WHEN loai_thong_bao = 'phieu_xuat_duyet' THEN 1 END) as phieu_xuat_duyet,
        COUNT(CASE WHEN loai_thong_bao = 'phieu_xuat_can_sua' THEN 1 END) as phieu_xuat_can_sua,
        COUNT(CASE WHEN loai_thong_bao = 'system' THEN 1 END) as system
       FROM notifications 
       WHERE nguoi_nhan = $1`,
      [userId]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error getting notification stats:", error);
    throw error;
  }
};

/**
 * Dọn dẹp thông báo cũ
 */
const cleanupOldNotifications = async (daysToKeep) => {
  try {
    const result = await pool.query(
      `DELETE FROM notifications 
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
       RETURNING id`
    );

    return result.rows.length;
  } catch (error) {
    console.error("Error cleaning up old notifications:", error);
    throw error;
  }
};

/**
 * Tạo thông báo hệ thống cho nhiều users
 */
const notifySystemMessage = async (userIds, title, content, metadata = {}) => {
  try {
    return await createNotifications(
      userIds,
      title,
      content,
      "system",
      metadata
    );
  } catch (error) {
    console.error("Error creating system notifications:", error);
    throw error;
  }
};

// =============================================
// CÁC FUNCTIONS TẠO THÔNG BÁO CHO TỪNG WORKFLOW
// =============================================

/**
 * PHIẾU NHẬP - CẦN DUYỆT
 */
const notifyPhieuNhapCanDuyet = async (phieuData, nguoiDuyet) => {
  const metadata = {
    phieu_id: phieuData.id,
    loai_phieu: "nhap_kho",
    so_phieu: phieuData.so_phieu,
    action: "can_duyet",
  };

  // URL đúng với tab và highlight
  const url = `/nhap-kho?tab=can-duyet&highlight=${phieuData.id}`;

  return await createNotification({
    nguoi_nhan: nguoiDuyet,
    loai_thong_bao: "phieu_nhap_can_duyet",
    tieu_de: `Phiếu nhập ${phieuData.so_phieu} cần duyệt`,
    noi_dung: `Phiếu nhập kho từ ${
      phieuData.phong_ban?.ten_phong_ban || "N/A"
    } đang chờ phê duyệt`,
    url_redirect: url,
    metadata,
    muc_do_uu_tien: "high",
  });
};

/**
 * PHIẾU NHẬP - ĐÃ DUYỆT
 */
const notifyPhieuNhapDuyet = async (phieuData, nguoiTao) => {
  const metadata = {
    phieu_id: phieuData.id,
    loai_phieu: "nhap_kho",
    so_phieu: phieuData.so_phieu,
    action: "duyet",
  };

  // URL đúng với tab và highlight
  const url = `/nhap-kho?tab=da-duyet&highlight=${phieuData.id}`;

  return await createNotification({
    nguoi_nhan: nguoiTao,
    loai_thong_bao: "phieu_nhap_duyet",
    tieu_de: `Phiếu nhập ${phieuData.so_phieu} đã được duyệt`,
    noi_dung: `Phiếu nhập kho của bạn đã được phê duyệt và có thể thực hiện`,
    url_redirect: url,
    metadata,
    muc_do_uu_tien: "normal",
  });
};

/**
 * PHIẾU NHẬP - CẦN SỬA
 */
const notifyPhieuNhapCanSua = async (phieuData, nguoiTao, ghiChuPhanHoi) => {
  const metadata = {
    phieu_id: phieuData.id,
    loai_phieu: "nhap_kho",
    so_phieu: phieuData.so_phieu,
    action: "can_sua",
    ghi_chu_phan_hoi: ghiChuPhanHoi,
  };

  // URL đúng với tab và highlight
  const url = `/nhap-kho?tab=can-sua&highlight=${phieuData.id}`;

  return await createNotification({
    nguoi_nhan: nguoiTao,
    loai_thong_bao: "phieu_nhap_can_sua",
    tieu_de: `Phiếu nhập ${phieuData.so_phieu} cần chỉnh sửa`,
    noi_dung: `Phiếu nhập kho của bạn cần được chỉnh sửa. Lý do: ${ghiChuPhanHoi}`,
    url_redirect: url,
    metadata,
    muc_do_uu_tien: "high",
  });
};

/**
 * PHIẾU XUẤT - CẦN DUYỆT
 */
const notifyPhieuXuatCanDuyet = async (phieuData, nguoiDuyet) => {
  const metadata = {
    phieu_id: phieuData.id,
    loai_phieu: "xuat_kho",
    so_phieu: phieuData.so_phieu,
    action: "can_duyet",
  };

  // URL đúng với tab và highlight
  const url = `/xuat-kho?tab=can-duyet&highlight=${phieuData.id}`;

  return await createNotification({
    nguoi_nhan: nguoiDuyet,
    loai_thong_bao: "phieu_xuat_can_duyet",
    tieu_de: `Phiếu xuất ${phieuData.so_phieu} cần duyệt`,
    noi_dung: `Phiếu xuất kho từ ${
      phieuData.phong_ban?.ten_phong_ban || "N/A"
    } đang chờ phê duyệt`,
    url_redirect: url,
    metadata,
    muc_do_uu_tien: "high",
  });
};

/**
 * PHIẾU XUẤT - ĐÃ DUYỆT
 */
const notifyPhieuXuatDuyet = async (phieuData, nguoiTao) => {
  const metadata = {
    phieu_id: phieuData.id,
    loai_phieu: "xuat_kho",
    so_phieu: phieuData.so_phieu,
    action: "duyet",
  };

  // URL đúng với tab và highlight
  const url = `/xuat-kho?tab=da-duyet&highlight=${phieuData.id}`;

  return await createNotification({
    nguoi_nhan: nguoiTao,
    loai_thong_bao: "phieu_xuat_duyet",
    tieu_de: `Phiếu xuất ${phieuData.so_phieu} đã được duyệt`,
    noi_dung: `Phiếu xuất kho của bạn đã được phê duyệt và có thể thực hiện`,
    url_redirect: url,
    metadata,
    muc_do_uu_tien: "normal",
  });
};

/**
 * PHIẾU XUẤT - CẦN SỬA
 */
const notifyPhieuXuatCanSua = async (phieuData, nguoiTao, ghiChuPhanHoi) => {
  const metadata = {
    phieu_id: phieuData.id,
    loai_phieu: "xuat_kho",
    so_phieu: phieuData.so_phieu,
    action: "can_sua",
    ghi_chu_phan_hoi: ghiChuPhanHoi,
  };

  // URL đúng với tab và highlight
  const url = `/xuat-kho?tab=can-sua&highlight=${phieuData.id}`;

  return await createNotification({
    nguoi_nhan: nguoiTao,
    loai_thong_bao: "phieu_xuat_can_sua",
    tieu_de: `Phiếu xuất ${phieuData.so_phieu} cần chỉnh sửa`,
    noi_dung: `Phiếu xuất kho của bạn cần được chỉnh sửa. Lý do: ${ghiChuPhanHoi}`,
    url_redirect: url,
    metadata,
    muc_do_uu_tien: "high",
  });
};

module.exports = {
  createNotification,
  createNotifications, // Export helper function
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotificationStats,
  cleanupOldNotifications,
  notifySystemMessage,
  // Specific notification functions
  notifyPhieuNhapCanDuyet,
  notifyPhieuNhapDuyet,
  notifyPhieuNhapCanSua,
  notifyPhieuXuatCanDuyet,
  notifyPhieuXuatDuyet,
  notifyPhieuXuatCanSua,
};
