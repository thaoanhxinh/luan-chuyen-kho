// services/notificationService.js
const pool = require("../config/database");

/**
 * Service xử lý thông báo trong hệ thống workflow
 */
const notificationService = {
  /**
   * Tạo thông báo cho yêu cầu mới
   */
  async notifyNewRequest(yeuCauData, approvers) {
    try {
      const notifications = [];

      for (const approver of approvers) {
        const notification = await pool.query(
          `INSERT INTO notifications (
            nguoi_nhan, loai_thong_bao, tieu_de, noi_dung,
            yeu_cau_id, loai_yeu_cau, url_redirect, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [
            approver.id,
            "yeu_cau_moi",
            `Yêu cầu ${
              yeuCauData.loai_yeu_cau === "nhap_kho" ? "nhập kho" : "xuất kho"
            } mới: ${yeuCauData.so_yeu_cau}`,
            `Yêu cầu ${
              yeuCauData.loai_yeu_cau === "nhap_kho" ? "nhập kho" : "xuất kho"
            } từ đơn vị ${
              yeuCauData.don_vi_yeu_cau
            } cần được xem xét và phê duyệt.`,
            yeuCauData.id,
            yeuCauData.loai_yeu_cau,
            `/yeu-cau-${yeuCauData.loai_yeu_cau}/${yeuCauData.id}`,
            JSON.stringify({
              so_yeu_cau: yeuCauData.so_yeu_cau,
              don_vi_yeu_cau: yeuCauData.don_vi_yeu_cau,
              muc_do_uu_tien: yeuCauData.muc_do_uu_tien,
              tong_gia_tri: yeuCauData.tong_gia_tri_uoc_tinh,
              so_mat_hang: yeuCauData.so_mat_hang,
            }),
          ]
        );

        notifications.push(notification.rows[0]);
      }

      return {
        success: true,
        notifications,
        recipient_count: approvers.length,
      };
    } catch (error) {
      console.error("Notify new request error:", error);
      throw new Error("Lỗi tạo thông báo yêu cầu mới");
    }
  },

  /**
   * Thông báo kết quả phê duyệt
   */
  async notifyApprovalResult(yeuCauData, approvalData, isApproved) {
    try {
      const loaiThongBao = isApproved ? "phe_duyet" : "tu_choi";
      const action = isApproved ? "đã được phê duyệt" : "bị từ chối";

      const notification = await pool.query(
        `INSERT INTO notifications (
          nguoi_nhan, loai_thong_bao, tieu_de, noi_dung,
          yeu_cau_id, loai_yeu_cau, url_redirect, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          yeuCauData.nguoi_yeu_cau,
          loaiThongBao,
          `Yêu cầu ${yeuCauData.so_yeu_cau} ${action}`,
          isApproved
            ? `Yêu cầu ${
                yeuCauData.loai_yeu_cau === "nhap_kho" ? "nhập kho" : "xuất kho"
              } của bạn đã được phê duyệt và sẽ được xử lý sớm.`
            : `Yêu cầu ${
                yeuCauData.loai_yeu_cau === "nhap_kho" ? "nhập kho" : "xuất kho"
              } của bạn bị từ chối. Lý do: ${
                approvalData.ly_do_tu_choi || "Không được cung cấp"
              }`,
          yeuCauData.id,
          yeuCauData.loai_yeu_cau,
          `/yeu-cau-${yeuCauData.loai_yeu_cau}/${yeuCauData.id}`,
          JSON.stringify({
            so_yeu_cau: yeuCauData.so_yeu_cau,
            nguoi_duyet: approvalData.nguoi_duyet,
            ngay_duyet: new Date().toISOString(),
            ly_do_tu_choi: approvalData.ly_do_tu_choi,
            ghi_chu_duyet: approvalData.ghi_chu_duyet,
          }),
        ]
      );

      return {
        success: true,
        notification: notification.rows[0],
      };
    } catch (error) {
      console.error("Notify approval result error:", error);
      throw new Error("Lỗi tạo thông báo kết quả phê duyệt");
    }
  },

  /**
   * Thông báo hoàn thành yêu cầu
   */
  async notifyCompletion(yeuCauData, completionData) {
    try {
      const notification = await pool.query(
        `INSERT INTO notifications (
          nguoi_nhan, loai_thong_bao, tieu_de, noi_dung,
          yeu_cau_id, loai_yeu_cau, phieu_id, url_redirect, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          yeuCauData.nguoi_yeu_cau,
          "hoan_thanh",
          `Yêu cầu ${yeuCauData.so_yeu_cau} đã hoàn thành`,
          `Yêu cầu ${
            yeuCauData.loai_yeu_cau === "nhap_kho" ? "nhập kho" : "xuất kho"
          } của bạn đã được xử lý hoàn tất. Phiếu ${
            completionData.so_phieu || "đang cập nhật"
          } đã được tạo.`,
          yeuCauData.id,
          yeuCauData.loai_yeu_cau,
          completionData.phieu_id,
          `/phieu-${yeuCauData.loai_yeu_cau}/${completionData.phieu_id}`,
          JSON.stringify({
            so_yeu_cau: yeuCauData.so_yeu_cau,
            so_phieu: completionData.so_phieu,
            ngay_hoan_thanh: new Date().toISOString(),
            tong_tien: completionData.tong_tien,
          }),
        ]
      );

      return {
        success: true,
        notification: notification.rows[0],
      };
    } catch (error) {
      console.error("Notify completion error:", error);
      throw new Error("Lỗi tạo thông báo hoàn thành");
    }
  },

  /**
   * Thông báo hệ thống cho nhiều người dùng
   */
  async notifySystemMessage(userIds, title, content, metadata = {}) {
    try {
      const notifications = [];

      for (const userId of userIds) {
        const notification = await pool.query(
          `INSERT INTO notifications (
            nguoi_nhan, loai_thong_bao, tieu_de, noi_dung,
            url_redirect, metadata
          ) VALUES ($1, 'system', $2, $3, $4, $5)
          RETURNING *`,
          [
            userId,
            title,
            content,
            metadata.url || null,
            JSON.stringify({
              ...metadata,
              is_system_message: true,
              sent_at: new Date().toISOString(),
            }),
          ]
        );

        notifications.push(notification.rows[0]);
      }

      return {
        success: true,
        notifications,
        recipient_count: userIds.length,
      };
    } catch (error) {
      console.error("Notify system message error:", error);
      throw new Error("Lỗi tạo thông báo hệ thống");
    }
  },

  /**
   * Thông báo nhắc nhở deadline
   */
  async notifyDeadlineReminder(yeuCauData, approvers, daysLeft) {
    try {
      const notifications = [];
      const urgencyLevel =
        daysLeft <= 1 ? "Khẩn cấp" : daysLeft <= 3 ? "Ưu tiên" : "Nhắc nhở";

      for (const approver of approvers) {
        const notification = await pool.query(
          `INSERT INTO notifications (
            nguoi_nhan, loai_thong_bao, tieu_de, noi_dung,
            yeu_cau_id, loai_yeu_cau, url_redirect, metadata, ngay_het_han
          ) VALUES ($1, 'system', $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [
            approver.id,
            `${urgencyLevel}: Yêu cầu ${yeuCauData.so_yeu_cau} cần xử lý`,
            `Yêu cầu ${
              yeuCauData.loai_yeu_cau === "nhap_kho" ? "nhập kho" : "xuất kho"
            } ${
              yeuCauData.so_yeu_cau
            } cần được xử lý trong ${daysLeft} ngày tới.`,
            yeuCauData.id,
            yeuCauData.loai_yeu_cau,
            `/yeu-cau-${yeuCauData.loai_yeu_cau}/${yeuCauData.id}`,
            JSON.stringify({
              so_yeu_cau: yeuCauData.so_yeu_cau,
              days_left: daysLeft,
              urgency_level: urgencyLevel,
              muc_do_uu_tien: yeuCauData.muc_do_uu_tien,
              is_deadline_reminder: true,
            }),
            new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000), // Hết hạn sau daysLeft ngày
          ]
        );

        notifications.push(notification.rows[0]);
      }

      return {
        success: true,
        notifications,
        recipient_count: approvers.length,
      };
    } catch (error) {
      console.error("Notify deadline reminder error:", error);
      throw new Error("Lỗi tạo thông báo nhắc nhở deadline");
    }
  },

  /**
   * Lấy thông báo của user với phân trang
   */
  async getUserNotifications(userId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        trang_thai,
        loai_thong_bao,
        unread_only = false,
      } = filters;

      const offset = (page - 1) * limit;
      let whereClause = "WHERE nguoi_nhan = $1";
      const params = [userId];
      let paramCount = 1;

      if (trang_thai) {
        paramCount++;
        whereClause += ` AND trang_thai = $${paramCount}`;
        params.push(trang_thai);
      }

      if (loai_thong_bao) {
        paramCount++;
        whereClause += ` AND loai_thong_bao = $${paramCount}`;
        params.push(loai_thong_bao);
      }

      if (unread_only) {
        whereClause += " AND trang_thai = 'unread'";
      }

      // Query đếm tổng số
      const countQuery = `SELECT COUNT(*) FROM notifications ${whereClause}`;

      // Query lấy dữ liệu với join để lấy thêm thông tin
      const dataQuery = `
        SELECT 
          n.*,
          CASE 
            WHEN n.loai_yeu_cau = 'nhap_kho' THEN ycn.so_yeu_cau
            WHEN n.loai_yeu_cau = 'xuat_kho' THEN ycx.so_yeu_cau
            ELSE NULL
          END as so_yeu_cau_ref,
          CASE 
            WHEN n.loai_yeu_cau = 'nhap_kho' THEN ycn.trang_thai
            WHEN n.loai_yeu_cau = 'xuat_kho' THEN ycx.trang_thai
            ELSE NULL
          END as trang_thai_yeu_cau
        FROM notifications n
        LEFT JOIN yeu_cau_nhap_kho ycn ON n.yeu_cau_id = ycn.id AND n.loai_yeu_cau = 'nhap_kho'
        LEFT JOIN yeu_cau_xuat_kho ycx ON n.yeu_cau_id = ycx.id AND n.loai_yeu_cau = 'xuat_kho'
        ${whereClause}
        ORDER BY n.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      params.push(limit, offset);

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, -2)),
        pool.query(dataQuery, params),
      ]);

      const total = parseInt(countResult.rows[0].count);
      const pages = Math.ceil(total / limit);

      return {
        items: dataResult.rows.map((item) => ({
          ...item,
          metadata:
            typeof item.metadata === "string"
              ? JSON.parse(item.metadata)
              : item.metadata,
        })),
        total,
        pages,
      };
    } catch (error) {
      console.error("Get user notifications error:", error);
      throw new Error("Lỗi lấy danh sách thông báo");
    }
  },

  /**
   * Đánh dấu thông báo đã đọc
   */
  async markAsRead(notificationIds, userId) {
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
      console.error("Mark as read error:", error);
      throw new Error("Lỗi đánh dấu đã đọc");
    }
  },

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  async markAllAsRead(userId) {
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
      console.error("Mark all as read error:", error);
      throw new Error("Lỗi đánh dấu tất cả đã đọc");
    }
  },

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        "SELECT COUNT(*) FROM notifications WHERE nguoi_nhan = $1 AND trang_thai = 'unread'",
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error("Get unread count error:", error);
      throw new Error("Lỗi lấy số thông báo chưa đọc");
    }
  },

  /**
   * Lấy thống kê thông báo của user
   */
  async getNotificationStats(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE trang_thai = 'unread') as unread,
          COUNT(*) FILTER (WHERE trang_thai = 'read') as read,
          COUNT(*) FILTER (WHERE trang_thai = 'archived') as archived,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as this_week,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as this_month,
          COUNT(*) FILTER (WHERE loai_thong_bao = 'yeu_cau_moi') as new_requests,
          COUNT(*) FILTER (WHERE loai_thong_bao = 'phe_duyet') as approvals,
          COUNT(*) FILTER (WHERE loai_thong_bao = 'tu_choi') as rejections,
          COUNT(*) FILTER (WHERE loai_thong_bao = 'hoan_thanh') as completions
        FROM notifications 
        WHERE nguoi_nhan = $1`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Get notification stats error:", error);
      throw new Error("Lỗi lấy thống kê thông báo");
    }
  },

  /**
   * Xóa thông báo cũ (cleanup job)
   */
  async cleanupOldNotifications(daysToKeep = 90) {
    try {
      const result = await pool.query(
        `DELETE FROM notifications 
         WHERE created_at < CURRENT_DATE - INTERVAL '$1 days'
         AND trang_thai IN ('read', 'archived')
         RETURNING id`,
        [daysToKeep]
      );

      return result.rows.length;
    } catch (error) {
      console.error("Cleanup old notifications error:", error);
      throw new Error("Lỗi dọn dẹp thông báo cũ");
    }
  },

  /**
   * Cập nhật URL redirect khi có thay đổi
   */
  async updateRedirectUrl(yeuCauId, loaiYeuCau, newUrl) {
    try {
      const result = await pool.query(
        `UPDATE notifications 
         SET url_redirect = $1
         WHERE yeu_cau_id = $2 AND loai_yeu_cau = $3
         RETURNING id`,
        [newUrl, yeuCauId, loaiYeuCau]
      );

      return result.rows.length;
    } catch (error) {
      console.error("Update redirect URL error:", error);
      throw new Error("Lỗi cập nhật URL chuyển hướng");
    }
  },

  /**
   * Thông báo theo batch với template
   */
  async sendBatchNotifications(templateType, recipients, data) {
    try {
      const notifications = [];

      for (const recipient of recipients) {
        const personalizedData = { ...data, recipient };
        const { title, content, url } = this.generateNotificationContent(
          templateType,
          personalizedData
        );

        const notification = await pool.query(
          `INSERT INTO notifications (
            nguoi_nhan, loai_thong_bao, tieu_de, noi_dung,
            url_redirect, metadata
          ) VALUES ($1, 'system', $2, $3, $4, $5)
          RETURNING *`,
          [
            recipient.id,
            title,
            content,
            url,
            JSON.stringify({
              template_type: templateType,
              batch_id: data.batchId || Date.now(),
              sent_at: new Date().toISOString(),
            }),
          ]
        );

        notifications.push(notification.rows[0]);
      }

      return {
        success: true,
        notifications,
        recipient_count: recipients.length,
      };
    } catch (error) {
      console.error("Send batch notifications error:", error);
      throw new Error("Lỗi gửi thông báo hàng loạt");
    }
  },

  /**
   * Tạo nội dung thông báo theo template
   */
  generateNotificationContent(templateType, data) {
    const templates = {
      maintenance: {
        title: "Thông báo bảo trì hệ thống",
        content: `Hệ thống sẽ được bảo trì từ ${data.startTime} đến ${data.endTime}. Vui lòng lưu công việc và đăng xuất trước thời gian này.`,
        url: "/thong-bao/bao-tri",
      },
      policy_update: {
        title: "Cập nhật quy định mới",
        content: `Quy định ${data.policyName} đã được cập nhật. Vui lòng xem chi tiết và tuân thủ quy định mới.`,
        url: `/quy-dinh/${data.policyId}`,
      },
      inventory_alert: {
        title: "Cảnh báo tồn kho thấp",
        content: `Hàng hóa ${data.itemName} sắp hết (còn ${data.quantity} ${data.unit}). Vui lòng xem xét nhập thêm.`,
        url: `/hang-hoa/${data.itemId}`,
      },
      deadline_approaching: {
        title: "Sắp đến hạn xử lý",
        content: `Yêu cầu ${data.requestNumber} sẽ đến hạn trong ${data.daysLeft} ngày. Vui lòng ưu tiên xử lý.`,
        url: `/yeu-cau/${data.requestType}/${data.requestId}`,
      },
    };

    return (
      templates[templateType] || {
        title: "Thông báo hệ thống",
        content: "Có thông báo mới từ hệ thống",
        url: "/thong-bao",
      }
    );
  },

  /**
   * Lấy thông báo theo priority (urgent, high, normal, low)
   */
  async getNotificationsByPriority(userId, priority = "all") {
    try {
      let whereClause = "WHERE nguoi_nhan = $1";
      const params = [userId];

      if (priority !== "all") {
        const priorityMapping = {
          urgent: ["khan_cap"],
          high: ["cao", "khan_cap"],
          normal: ["binh_thuong"],
          low: ["thap"],
        };

        if (priorityMapping[priority]) {
          whereClause += ` AND (
            metadata->>'muc_do_uu_tien' = ANY($2) OR
            loai_thong_bao = 'system'
          )`;
          params.push(priorityMapping[priority]);
        }
      }

      const result = await pool.query(
        `SELECT *
         FROM notifications 
         ${whereClause}
         AND trang_thai = 'unread'
         ORDER BY 
           CASE 
             WHEN metadata->>'muc_do_uu_tien' = 'khan_cap' THEN 1
             WHEN metadata->>'muc_do_uu_tien' = 'cao' THEN 2
             WHEN metadata->>'muc_do_uu_tien' = 'binh_thuong' THEN 3
             ELSE 4
           END,
           created_at DESC
         LIMIT 50`,
        params
      );

      return {
        items: result.rows.map((item) => ({
          ...item,
          metadata:
            typeof item.metadata === "string"
              ? JSON.parse(item.metadata)
              : item.metadata,
        })),
        count: result.rows.length,
      };
    } catch (error) {
      console.error("Get notifications by priority error:", error);
      throw new Error("Lỗi lấy thông báo theo độ ưu tiên");
    }
  },

  /**
   * Scheduler để gửi thông báo định kỳ
   */
  async processScheduledNotifications() {
    try {
      // Tìm các yêu cầu sắp đến deadline
      const approachingDeadlines = await pool.query(
        `SELECT 
          ycn.id, ycn.so_yeu_cau, ycn.ngay_yeu_cau, ycn.don_vi_yeu_cau_id,
          ycn.muc_do_uu_tien, 'nhap_kho' as loai_yeu_cau,
          pb.ten_phong_ban as don_vi_yeu_cau,
          EXTRACT(DAYS FROM (ycn.ngay_yeu_cau + INTERVAL '7 days' - CURRENT_DATE)) as days_left
        FROM yeu_cau_nhap_kho ycn
        JOIN phong_ban pb ON ycn.don_vi_yeu_cau_id = pb.id
        WHERE ycn.trang_thai IN ('submitted', 'under_review')
        AND ycn.ngay_yeu_cau + INTERVAL '7 days' - CURRENT_DATE <= INTERVAL '3 days'
        AND ycn.ngay_yeu_cau + INTERVAL '7 days' > CURRENT_DATE
        
        UNION ALL
        
        SELECT 
          ycx.id, ycx.so_yeu_cau, ycx.ngay_yeu_cau, ycx.don_vi_yeu_cau_id,
          ycx.muc_do_uu_tien, 'xuat_kho' as loai_yeu_cau,
          pb.ten_phong_ban as don_vi_yeu_cau,
          EXTRACT(DAYS FROM (ycx.ngay_yeu_cau + INTERVAL '7 days' - CURRENT_DATE)) as days_left
        FROM yeu_cau_xuat_kho ycx
        JOIN phong_ban pb ON ycx.don_vi_yeu_cau_id = pb.id
        WHERE ycx.trang_thai IN ('submitted', 'under_review')
        AND ycx.ngay_yeu_cau + INTERVAL '7 days' - CURRENT_DATE <= INTERVAL '3 days'
        AND ycx.ngay_yeu_cau + INTERVAL '7 days' > CURRENT_DATE`
      );

      // Lấy danh sách approvers
      const approvers = await pool.query(
        `SELECT u.id, u.ho_ten, u.email, pb.ten_phong_ban
         FROM users u
         JOIN phong_ban pb ON u.phong_ban_id = pb.id
         WHERE pb.ma_phong_ban IN ('HCK', 'TMKH') 
         AND u.trang_thai = 'active'`
      );

      const results = [];

      // Gửi thông báo cho từng yêu cầu sắp deadline
      for (const yeuCau of approachingDeadlines.rows) {
        const result = await this.notifyDeadlineReminder(
          yeuCau,
          approvers.rows,
          Math.ceil(yeuCau.days_left)
        );
        results.push(result);
      }

      return {
        success: true,
        processed_requests: approachingDeadlines.rows.length,
        sent_notifications: results.reduce(
          (sum, r) => sum + (r.recipient_count || 0),
          0
        ),
      };
    } catch (error) {
      console.error("Process scheduled notifications error:", error);
      throw new Error("Lỗi xử lý thông báo định kỳ");
    }
  },

  /**
   * Real-time notification broadcast (WebSocket support)
   */
  async broadcastNotification(userId, notification) {
    try {
      // Trong thực tế sẽ integrate với WebSocket server
      console.log(`🔔 [REALTIME] Broadcasting to user ${userId}:`, {
        id: notification.id,
        title: notification.tieu_de,
        type: notification.loai_thong_bao,
        timestamp: new Date().toISOString(),
      });

      // Emit event for WebSocket clients
      // io.to(`user_${userId}`).emit('new_notification', notification);

      return { success: true, broadcasted: true };
    } catch (error) {
      console.error("Broadcast notification error:", error);
      // Không throw error để không ảnh hưởng workflow chính
      return { success: false, broadcasted: false };
    }
  },

  /**
   * Aggregate notifications để giảm spam
   */
  async aggregateNotifications(userId, timeWindow = 5) {
    try {
      // Tìm các thông báo cùng loại trong khoảng thời gian gần đây
      const duplicates = await pool.query(
        `SELECT loai_thong_bao, yeu_cau_id, loai_yeu_cau, COUNT(*) as count
         FROM notifications 
         WHERE nguoi_nhan = $1 
         AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${timeWindow} minutes'
         AND trang_thai = 'unread'
         GROUP BY loai_thong_bao, yeu_cau_id, loai_yeu_cau
         HAVING COUNT(*) > 1`,
        [userId]
      );

      const aggregatedCount = duplicates.rows.length;

      // Trong thực tế có thể merge các notification trùng lặp
      for (const group of duplicates.rows) {
        console.log(
          `📊 Found ${group.count} duplicate notifications of type ${group.loai_thong_bao}`
        );
      }

      return {
        success: true,
        aggregated_groups: aggregatedCount,
        total_duplicates: duplicates.rows.reduce(
          (sum, g) => sum + parseInt(g.count),
          0
        ),
      };
    } catch (error) {
      console.error("Aggregate notifications error:", error);
      throw new Error("Lỗi tổng hợp thông báo");
    }
  },
};

module.exports = notificationService;
