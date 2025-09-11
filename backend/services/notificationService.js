const pool = require("../config/database");

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
const notifyPhieuNhapCanDuyet = async (phieuData, nguoiDuyetIds) => {
  const title = `Phiếu nhập ${phieuData.so_phieu} cần duyệt`;
  // Chuẩn hóa lấy tên phòng ban từ nhiều kiểu dữ liệu đầu vào
  const tenPhongBan =
    (typeof phieuData.phong_ban === "string"
      ? phieuData.phong_ban
      : phieuData.phong_ban?.ten_phong_ban) ||
    phieuData.ten_phong_ban ||
    "N/A";
  const content = `Phiếu nhập kho từ ${tenPhongBan} đang chờ phê duyệt`;

  return await createNotificationsWithDynamicURL(
    Array.isArray(nguoiDuyetIds) ? nguoiDuyetIds : [nguoiDuyetIds],
    title,
    content,
    "phieu_nhap_can_duyet",
    phieuData,
    { priority: "high", action: "can_duyet" }
  );
};

/**
 * PHIẾU NHẬP - ĐÃ DUYỆT
 */
const notifyPhieuNhapDuyet = async (phieuData, nguoiTaoIds) => {
  const title = `Phiếu nhập ${phieuData.so_phieu} đã được duyệt`;
  const content = `Phiếu nhập kho của bạn đã được phê duyệt và có thể thực hiện`;

  return await createNotificationsWithDynamicURL(
    Array.isArray(nguoiTaoIds) ? nguoiTaoIds : [nguoiTaoIds],
    title,
    content,
    "phieu_nhap_duyet",
    phieuData,
    { priority: "normal", action: "duyet" }
  );
};

const notifyPhieuNhapCanSua = async (phieuData, nguoiTaoId, ghiChuPhanHoi) => {
  const title = `Phiếu nhập ${phieuData.so_phieu} cần chỉnh sửa`;
  const content = `Phiếu nhập kho của bạn cần được chỉnh sửa. Lý do: ${ghiChuPhanHoi}`;

  return await createNotificationsWithDynamicURL(
    [nguoiTaoId],
    title,
    content,
    "phieu_nhap_can_sua",
    phieuData,
    {
      priority: "high",
      action: "can_sua",
      ghi_chu_phan_hoi: ghiChuPhanHoi,
    }
  );
};

const notifyPhieuXuatCanDuyet = async (phieuData, nguoiDuyetIds) => {
  let title, content;

  // Xác định người duyệt dựa trên loại xuất
  if (phieuData.loai_xuat === "don_vi_su_dung") {
    title = `Phiếu xuất ${phieuData.so_phieu} cần duyệt (Sử dụng)`;
    content = `Phiếu xuất cho đơn vị sử dụng từ ${
      phieuData.phong_ban?.ten_phong_ban || "N/A"
    } cần được cấp trên duyệt`;
  } else if (phieuData.loai_xuat === "don_vi_nhan") {
    title = `Phiếu xuất ${phieuData.so_phieu} cần xác nhận (Đơn vị nhận)`;
    content = `Phiếu xuất giao cho đơn vị ${
      phieuData.don_vi_nhan?.ten || "N/A"
    } cần xác nhận nhận hàng`;
  }

  return await createNotificationsWithDynamicURL(
    Array.isArray(nguoiDuyetIds) ? nguoiDuyetIds : [nguoiDuyetIds],
    title,
    content,
    "phieu_xuat_can_duyet",
    phieuData,
    { priority: "high", action: "can_duyet" }
  );
};
const notifyPhieuXuatDuyet = async (phieuData, nguoiTaoId) => {
  const title = `Phiếu xuất ${phieuData.so_phieu} đã được duyệt`;
  const content = `Phiếu xuất kho của bạn đã được phê duyệt và có thể thực hiện`;

  return await createNotificationsWithDynamicURL(
    [nguoiTaoId],
    title,
    content,
    "phieu_xuat_duyet",
    phieuData,
    { priority: "normal", action: "duyet" }
  );
};

const notifyPhieuXuatCanSua = async (phieuData, nguoiTaoId, ghiChuPhanHoi) => {
  const title = `Phiếu xuất ${phieuData.so_phieu} cần chỉnh sửa`;
  const content = `Phiếu xuất kho của bạn cần được chỉnh sửa. Lý do: ${ghiChuPhanHoi}`;

  return await createNotificationsWithDynamicURL(
    [nguoiTaoId],
    title,
    content,
    "phieu_xuat_can_sua",
    phieuData,
    {
      priority: "high",
      action: "can_sua",
      ghi_chu_phan_hoi: ghiChuPhanHoi,
    }
  );
};

const generateNotificationURL = (
  phieuData,
  notificationType,
  recipientRole,
  recipientCapBac,
  recipientPhongBanId
) => {
  // Xác định base path theo loại thông báo
  const isNhap = notificationType.startsWith("phieu_nhap");
  const isXuat = notificationType.startsWith("phieu_xuat");
  const baseURL = isXuat ? "/xuat-kho" : "/nhap-kho";

  // Mặc định theo frontend là "tat_ca"
  let tab = "tat_ca";

  // Map tab phải khớp với TAB_CONFIG ở frontend (dùng underscores)
  switch (notificationType) {
    // ================= NHẬP KHO =================
    case "phieu_nhap_can_duyet": {
      // Cấp 2 (manager) nhận phiếu chờ duyệt → tab "can_duyet"
      if (recipientRole === "manager") {
        tab = "can_duyet";
      } else if (recipientRole === "admin") {
        tab = "can_duyet";
      } else {
        // Cấp 3 hoặc vai trò khác vẫn đưa về danh sách chờ duyệt
        tab = "can_duyet";
      }
      break;
    }
    case "phieu_nhap_duyet": {
      tab = "da_duyet";
      break;
    }
    case "phieu_nhap_can_sua": {
      tab = "can_sua";
      break;
    }

    // ================= XUẤT KHO =================
    case "phieu_xuat_can_duyet": {
      tab = "cho_duyet"; // Frontend XUAT_KHO dùng key "cho_duyet"
      break;
    }
    case "phieu_xuat_duyet": {
      tab = "da_duyet";
      break;
    }
    case "phieu_xuat_can_sua": {
      tab = "can_sua";
      break;
    }

    default: {
      tab = "tat_ca";
    }
  }

  // Sử dụng key tab nhất quán là dùng dấu gạch dưới theo frontend
  return `${baseURL}?tab=${tab}`;
};

const createNotificationsWithDynamicURL = async (
  userIds,
  title,
  content,
  type,
  phieuData,
  metadata = {}
) => {
  try {
    const notifications = [];

    for (const userId of userIds) {
      // 🔧 THÊM VALIDATION ĐÂY:
      const validUserId = parseInt(userId);

      if (isNaN(validUserId)) {
        console.error(`Invalid userId: ${userId}, skipping...`);
        continue;
      }

      const recipientInfo = await pool.query(
        `SELECT u.role, pb.cap_bac, u.phong_ban_id 
         FROM users u 
         LEFT JOIN phong_ban pb ON u.phong_ban_id = pb.id 
         WHERE u.id = $1`,
        [validUserId] // ← SỬA: dùng validUserId
      );

      // default fallback đúng key tab ("tat_ca") và đúng module theo loại thông báo
      let url =
        type && type.startsWith("phieu_xuat")
          ? "/xuat-kho?tab=tat_ca"
          : "/nhap-kho?tab=tat_ca";

      if (recipientInfo.rows.length > 0) {
        const recipient = recipientInfo.rows[0];
        url = generateNotificationURL(
          phieuData,
          type,
          recipient.role,
          recipient.cap_bac,
          recipient.phong_ban_id
        );
      }

      const notification = await createNotification({
        nguoi_nhan: userId,
        loai_thong_bao: type,
        tieu_de: title,
        noi_dung: content,
        url_redirect: url,
        metadata: {
          ...metadata,
          phieu_id: phieuData.id,
          workflow_type: phieuData.workflow_type,
          so_phieu: phieuData.so_phieu,
        },
        muc_do_uu_tien: metadata.priority || "normal",
      });

      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error("Error creating notifications with dynamic URL:", error);
    throw error;
  }
};

const notifyAutoLinkedPhieu = async (phieuGoc, phieuTuDong, action) => {
  let title,
    content,
    recipients = [];

  if (action === "created") {
    title = `Phiếu ${phieuTuDong.so_phieu} được tạo tự động`;
    content = `Hệ thống đã tự động tạo phiếu ${phieuTuDong.loai_phieu} liên kết với phiếu ${phieuGoc.so_phieu}`;

    // Thông báo cho người liên quan
    if (phieuTuDong.loai_phieu === "xuat") {
      recipients = [phieuTuDong.nguoi_tao]; // Thông báo cho phòng ban cung cấp
    } else if (phieuTuDong.loai_phieu === "nhap") {
      recipients = [phieuTuDong.nguoi_tao]; // Thông báo cho đơn vị nhận
    }
  } else if (action === "updated") {
    title = `Phiếu liên kết ${phieuTuDong.so_phieu} được cập nhật`;
    content = `Do phiếu ${phieuGoc.so_phieu} thay đổi, phiếu liên kết đã được tự động cập nhật`;
    recipients = [phieuTuDong.nguoi_tao];
  }

  if (recipients.length > 0) {
    return await createNotificationsWithDynamicURL(
      recipients,
      title,
      content,
      "system",
      phieuTuDong,
      { priority: "normal", action: "auto_linked" }
    );
  }
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
  generateNotificationURL,
  createNotificationsWithDynamicURL,
  createNotifications: createNotificationsWithDynamicURL,
  notifyAutoLinkedPhieu,
};
