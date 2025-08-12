// services/emailService.js
const pool = require("../config/database");

/**
 * Service xử lý email notifications cho workflow
 */
const emailService = {
  /**
   * Gửi email thông báo yêu cầu mới
   */
  async sendNewRequestNotification(yeuCauData, recipients) {
    try {
      // Trong môi trường thực tế, sử dụng nodemailer hoặc service email khác
      console.log("📧 [EMAIL SIMULATION] Sending new request notification");
      console.log("📧 To:", recipients.map((r) => r.email).join(", "));
      console.log(
        "📧 Subject: Yêu cầu mới cần phê duyệt -",
        yeuCauData.so_yeu_cau
      );

      const emailContent = this.generateNewRequestEmailContent(yeuCauData);
      console.log("📧 Content:", emailContent);

      // Lưu log email vào database
      await this.logEmailActivity({
        type: "new_request",
        recipients: recipients.map((r) => r.email),
        subject: `Yêu cầu mới cần phê duyệt - ${yeuCauData.so_yeu_cau}`,
        content: emailContent,
        yeu_cau_id: yeuCauData.id,
        loai_yeu_cau: yeuCauData.loai_yeu_cau,
        status: "sent",
      });

      return { success: true, sent_count: recipients.length };
    } catch (error) {
      console.error("Send new request email error:", error);
      throw new Error("Lỗi gửi email thông báo yêu cầu mới");
    }
  },

  /**
   * Gửi email thông báo phê duyệt
   */
  async sendApprovalNotification(yeuCauData, approvalData, recipient) {
    try {
      console.log("📧 [EMAIL SIMULATION] Sending approval notification");
      console.log("📧 To:", recipient.email);
      console.log(
        "📧 Subject: Yêu cầu đã được phê duyệt -",
        yeuCauData.so_yeu_cau
      );

      const emailContent = this.generateApprovalEmailContent(
        yeuCauData,
        approvalData
      );
      console.log("📧 Content:", emailContent);

      await this.logEmailActivity({
        type: "approval",
        recipients: [recipient.email],
        subject: `Yêu cầu đã được phê duyệt - ${yeuCauData.so_yeu_cau}`,
        content: emailContent,
        yeu_cau_id: yeuCauData.id,
        loai_yeu_cau: yeuCauData.loai_yeu_cau,
        status: "sent",
      });

      return { success: true };
    } catch (error) {
      console.error("Send approval email error:", error);
      throw new Error("Lỗi gửi email thông báo phê duyệt");
    }
  },

  /**
   * Gửi email thông báo từ chối
   */
  async sendRejectionNotification(yeuCauData, rejectionData, recipient) {
    try {
      console.log("📧 [EMAIL SIMULATION] Sending rejection notification");
      console.log("📧 To:", recipient.email);
      console.log("📧 Subject: Yêu cầu bị từ chối -", yeuCauData.so_yeu_cau);

      const emailContent = this.generateRejectionEmailContent(
        yeuCauData,
        rejectionData
      );
      console.log("📧 Content:", emailContent);

      await this.logEmailActivity({
        type: "rejection",
        recipients: [recipient.email],
        subject: `Yêu cầu bị từ chối - ${yeuCauData.so_yeu_cau}`,
        content: emailContent,
        yeu_cau_id: yeuCauData.id,
        loai_yeu_cau: yeuCauData.loai_yeu_cau,
        status: "sent",
      });

      return { success: true };
    } catch (error) {
      console.error("Send rejection email error:", error);
      throw new Error("Lỗi gửi email thông báo từ chối");
    }
  },

  /**
   * Gửi email thông báo hoàn thành
   */
  async sendCompletionNotification(yeuCauData, completionData, recipient) {
    try {
      console.log("📧 [EMAIL SIMULATION] Sending completion notification");
      console.log("📧 To:", recipient.email);
      console.log("📧 Subject: Yêu cầu đã hoàn thành -", yeuCauData.so_yeu_cau);

      const emailContent = this.generateCompletionEmailContent(
        yeuCauData,
        completionData
      );
      console.log("📧 Content:", emailContent);

      await this.logEmailActivity({
        type: "completion",
        recipients: [recipient.email],
        subject: `Yêu cầu đã hoàn thành - ${yeuCauData.so_yeu_cau}`,
        content: emailContent,
        yeu_cau_id: yeuCauData.id,
        loai_yeu_cau: yeuCauData.loai_yeu_cau,
        status: "sent",
      });

      return { success: true };
    } catch (error) {
      console.error("Send completion email error:", error);
      throw new Error("Lỗi gửi email thông báo hoàn thành");
    }
  },

  /**
   * Gửi email nhắc nhở deadline
   */
  async sendDeadlineReminder(yeuCauData, recipients, daysLeft) {
    try {
      console.log("📧 [EMAIL SIMULATION] Sending deadline reminder");
      console.log("📧 To:", recipients.map((r) => r.email).join(", "));
      console.log("📧 Subject: Nhắc nhở deadline -", yeuCauData.so_yeu_cau);

      const emailContent = this.generateDeadlineReminderContent(
        yeuCauData,
        daysLeft
      );
      console.log("📧 Content:", emailContent);

      await this.logEmailActivity({
        type: "deadline_reminder",
        recipients: recipients.map((r) => r.email),
        subject: `Nhắc nhở deadline - ${yeuCauData.so_yeu_cau}`,
        content: emailContent,
        yeu_cau_id: yeuCauData.id,
        loai_yeu_cau: yeuCauData.loai_yeu_cau,
        status: "sent",
      });

      return { success: true, sent_count: recipients.length };
    } catch (error) {
      console.error("Send deadline reminder error:", error);
      throw new Error("Lỗi gửi email nhắc nhở deadline");
    }
  },

  /**
   * Tạo nội dung email cho yêu cầu mới
   */
  generateNewRequestEmailContent(yeuCauData) {
    const loaiYeuCauText =
      yeuCauData.loai_yeu_cau === "nhap_kho" ? "nhập kho" : "xuất kho";
    const mucDoText = this.getMucDoUuTienText(yeuCauData.muc_do_uu_tien);

    return `
Kính gửi Anh/Chị,

Có yêu cầu ${loaiYeuCauText} mới cần được xem xét và phê duyệt:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 THÔNG TIN YÊU CẦU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Số yêu cầu: ${yeuCauData.so_yeu_cau}
📅 Ngày yêu cầu: ${this.formatDate(yeuCauData.ngay_yeu_cau)}
🏢 Đơn vị yêu cầu: ${yeuCauData.don_vi_yeu_cau}
👤 Người yêu cầu: ${yeuCauData.nguoi_yeu_cau}
⚡ Mức độ ưu tiên: ${mucDoText}
💰 Tổng giá trị ước tính: ${this.formatCurrency(
      yeuCauData.tong_gia_tri_uoc_tinh || 0
    )}
📦 Số mặt hàng: ${yeuCauData.so_mat_hang || 0}

📝 Lý do yêu cầu:
${yeuCauData.ly_do_yeu_cau}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vui lòng truy cập hệ thống để xem chi tiết và thực hiện phê duyệt.

Trân trọng,
Hệ thống quản lý kho
    `.trim();
  },

  /**
   * Tạo nội dung email cho phê duyệt
   */
  generateApprovalEmailContent(yeuCauData, approvalData) {
    const loaiYeuCauText =
      yeuCauData.loai_yeu_cau === "nhap_kho" ? "nhập kho" : "xuất kho";

    return `
Kính gửi Anh/Chị,

Yêu cầu ${loaiYeuCauText} của Anh/Chị đã được phê duyệt:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ YÊU CẦU ĐÃ ĐƯỢC PHÊ DUYỆT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Số yêu cầu: ${yeuCauData.so_yeu_cau}
📅 Ngày phê duyệt: ${this.formatDate(new Date())}
👤 Người phê duyệt: ${approvalData.nguoi_duyet}
🏢 Phòng ban phê duyệt: ${approvalData.phong_ban_duyet}

${
  approvalData.ghi_chu_duyet
    ? `📝 Ghi chú phê duyệt:\n${approvalData.ghi_chu_duyet}\n`
    : ""
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Yêu cầu sẽ được xử lý trong thời gian sớm nhất. 
Vui lòng theo dõi hệ thống để cập nhật tình trạng xử lý.

Trân trọng,
Hệ thống quản lý kho
    `.trim();
  },

  /**
   * Tạo nội dung email cho từ chối
   */
  generateRejectionEmailContent(yeuCauData, rejectionData) {
    const loaiYeuCauText =
      yeuCauData.loai_yeu_cau === "nhap_kho" ? "nhập kho" : "xuất kho";

    return `
Kính gửi Anh/Chị,

Yêu cầu ${loaiYeuCauText} của Anh/Chị đã bị từ chối:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ YÊU CẦU BỊ TỪ CHỐI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Số yêu cầu: ${yeuCauData.so_yeu_cau}
📅 Ngày từ chối: ${this.formatDate(new Date())}
👤 Người từ chối: ${rejectionData.nguoi_duyet}

📝 Lý do từ chối:
${rejectionData.ly_do_tu_choi}

${
  rejectionData.ghi_chu_duyet
    ? `💬 Ghi chú thêm:\n${rejectionData.ghi_chu_duyet}\n`
    : ""
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vui lòng xem xét lại yêu cầu và tạo yêu cầu mới nếu cần thiết.

Trân trọng,
Hệ thống quản lý kho
    `.trim();
  },

  /**
   * Tạo nội dung email cho hoàn thành
   */
  generateCompletionEmailContent(yeuCauData, completionData) {
    const loaiYeuCauText =
      yeuCauData.loai_yeu_cau === "nhap_kho" ? "nhập kho" : "xuất kho";

    return `
Kính gửi Anh/Chị,

Yêu cầu ${loaiYeuCauText} của Anh/Chị đã được xử lý hoàn tất:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 YÊU CẦU ĐÃ HOÀN THÀNH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Số yêu cầu: ${yeuCauData.so_yeu_cau}
📄 Số phiếu: ${completionData.so_phieu || "Đang cập nhật"}
📅 Ngày hoàn thành: ${this.formatDate(new Date())}
💰 Tổng giá trị thực tế: ${this.formatCurrency(completionData.tong_tien || 0)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cảm ơn Anh/Chị đã sử dụng hệ thống quản lý kho.

Trân trọng,
Hệ thống quản lý kho
    `.trim();
  },

  /**
   * Tạo nội dung email nhắc nhở deadline
   */
  generateDeadlineReminderContent(yeuCauData, daysLeft) {
    const loaiYeuCauText =
      yeuCauData.loai_yeu_cau === "nhap_kho" ? "nhập kho" : "xuất kho";
    const urgencyIcon = daysLeft <= 1 ? "🚨" : daysLeft <= 3 ? "⚠️" : "📅";

    return `
Kính gửi Anh/Chị,

${urgencyIcon} Nhắc nhở về deadline yêu cầu ${loaiYeuCauText} cần xử lý:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ NHẮC NHỞ DEADLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Số yêu cầu: ${yeuCauData.so_yeu_cau}
📅 Ngày yêu cầu: ${this.formatDate(yeuCauData.ngay_yeu_cau)}
⏳ Thời gian còn lại: ${daysLeft} ngày
🏢 Đơn vị yêu cầu: ${yeuCauData.don_vi_yeu_cau}
⚡ Mức độ ưu tiên: ${this.getMucDoUuTienText(yeuCauData.muc_do_uu_tien)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vui lòng ưu tiên xử lý yêu cầu này để đảm bảo tiến độ công việc.

Trân trọng,
Hệ thống quản lý kho
    `.trim();
  },

  /**
   * Lưu log hoạt động email
   */
  async logEmailActivity(emailData) {
    try {
      // Trong thực tế, có thể tạo bảng email_logs để track
      const query = `
        INSERT INTO notifications (
          nguoi_nhan, loai_thong_bao, tieu_de, noi_dung,
          yeu_cau_id, loai_yeu_cau, metadata, created_at
        ) VALUES ($1, 'system', $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      `;

      // Log cho từng recipient
      for (const email of emailData.recipients) {
        // Tìm user theo email để lưu notification
        const userResult = await pool.query(
          "SELECT id FROM users WHERE email = $1",
          [email]
        );

        if (userResult.rows.length > 0) {
          await pool.query(query, [
            userResult.rows[0].id,
            emailData.subject,
            emailData.content,
            emailData.yeu_cau_id,
            emailData.loai_yeu_cau,
            JSON.stringify({
              email_type: emailData.type,
              email_status: emailData.status,
              sent_at: new Date().toISOString(),
            }),
          ]);
        }
      }

      console.log(
        `📧 Email log saved for ${emailData.recipients.length} recipients`
      );
    } catch (error) {
      console.error("Log email activity error:", error);
      // Không throw error để không làm gián đoạn workflow chính
    }
  },

  /**
   * Utility functions
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  },

  getMucDoUuTienText(mucDo) {
    const mapping = {
      khan_cap: "🔴 Khẩn cấp",
      cao: "🟡 Cao",
      binh_thuong: "🟢 Bình thường",
      thap: "🔵 Thấp",
    };
    return mapping[mucDo] || mucDo;
  },

  /**
   * Gửi email hàng loạt với template
   */
  async sendBulkEmail(template, recipients, data) {
    try {
      const promises = recipients.map((recipient) => {
        const personalizedData = { ...data, recipient };
        return this.sendTemplatedEmail(template, recipient, personalizedData);
      });

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failureCount = results.filter(
        (r) => r.status === "rejected"
      ).length;

      return {
        success: true,
        sent_count: successCount,
        failed_count: failureCount,
        total_count: recipients.length,
      };
    } catch (error) {
      console.error("Send bulk email error:", error);
      throw new Error("Lỗi gửi email hàng loạt");
    }
  },

  /**
   * Gửi email theo template
   */
  async sendTemplatedEmail(template, recipient, data) {
    // Implementation sẽ depend vào email service provider
    console.log(`📧 Sending ${template} email to ${recipient.email}`);
    return { success: true };
  },
};

module.exports = emailService;
