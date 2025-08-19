// services/yeuCauNhapKhoService.js
const pool = require("../config/database");

/**
 * Service xử lý business logic cho Yêu cầu nhập kho
 */
class YeuCauNhapKhoService {
  /**
   * Tạo số yêu cầu tự động
   */
  static async generateSoYeuCau() {
    try {
      const result = await pool.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(so_yeu_cau FROM 4) AS INTEGER)), 0) + 1 as next_number
        FROM yeu_cau_nhap_kho 
        WHERE so_yeu_cau ~ '^YCN[0-9]+$'
      `);

      const nextNumber = result.rows[0].next_number;
      return `YCN${nextNumber.toString().padStart(6, "0")}`;
    } catch (error) {
      console.error("Generate so yeu cau error:", error);
      throw new Error("Lỗi tạo số yêu cầu");
    }
  }

  /**
   * Validate dữ liệu yêu cầu nhập kho
   */
  static validateYeuCauData(data) {
    const {
      ngay_yeu_cau,
      don_vi_yeu_cau_id,
      ly_do_yeu_cau,
      muc_do_uu_tien,
      chi_tiet_vat_tu,
    } = data;

    const errors = [];

    // Validate required fields
    if (!ngay_yeu_cau) errors.push("Ngày yêu cầu là bắt buộc");
    if (!don_vi_yeu_cau_id) errors.push("Đơn vị yêu cầu là bắt buộc");
    if (!ly_do_yeu_cau || ly_do_yeu_cau.trim().length === 0) {
      errors.push("Lý do yêu cầu là bắt buộc");
    }
    if (!muc_do_uu_tien) errors.push("Mức độ ưu tiên là bắt buộc");

    // Validate mức độ ưu tiên
    const validPriorities = ["thap", "binh_thuong", "cao", "khan_cap"];
    if (muc_do_uu_tien && !validPriorities.includes(muc_do_uu_tien)) {
      errors.push("Mức độ ưu tiên không hợp lệ");
    }

    // Validate chi tiết vật tư nếu có
    if (chi_tiet_vat_tu && Array.isArray(chi_tiet_vat_tu)) {
      chi_tiet_vat_tu.forEach((item, index) => {
        if (!item.vat_tu_id) {
          errors.push(`Vật tư thứ ${index + 1}: ID vật tư là bắt buộc`);
        }
        if (!item.so_luong_yeu_cau || item.so_luong_yeu_cau <= 0) {
          errors.push(
            `Vật tư thứ ${index + 1}: Số lượng yêu cầu phải lớn hơn 0`
          );
        }
        if (item.gia_du_kien && item.gia_du_kien < 0) {
          errors.push(`Vật tư thứ ${index + 1}: Giá dự kiến không được âm`);
        }
      });
    }

    return errors;
  }

  /**
   * Kiểm tra quyền truy cập yêu cầu
   */
  static async checkAccessPermission(yeuCauId, userId, userRole) {
    try {
      const result = await pool.query(
        `
        SELECT ycn.*, pb.ten_phong_ban, u.ho_ten as nguoi_yeu_cau_ten
        FROM yeu_cau_nhap_kho ycn
        LEFT JOIN phong_ban pb ON ycn.don_vi_yeu_cau_id = pb.id
        LEFT JOIN users u ON ycn.nguoi_yeu_cau = u.id
        WHERE ycn.id = $1
      `,
        [yeuCauId]
      );

      if (result.rows.length === 0) {
        return { hasAccess: false, reason: "Yêu cầu không tồn tại" };
      }

      const yeuCau = result.rows[0];

      // Admin có quyền truy cập tất cả
      if (userRole === "admin") {
        return { hasAccess: true, yeuCau };
      }

      // User chỉ truy cập được yêu cầu của mình hoặc phòng ban mình
      const userInfo = await pool.query(
        "SELECT phong_ban_id FROM users WHERE id = $1",
        [userId]
      );
      const userPhongBanId = userInfo.rows[0]?.phong_ban_id;

      if (
        yeuCau.nguoi_yeu_cau === userId ||
        yeuCau.don_vi_yeu_cau_id === userPhongBanId
      ) {
        return { hasAccess: true, yeuCau };
      }

      return {
        hasAccess: false,
        reason: "Không có quyền truy cập yêu cầu này",
      };
    } catch (error) {
      console.error("Check access permission error:", error);
      throw new Error("Lỗi kiểm tra quyền truy cập");
    }
  }

  /**
   * Tính tổng giá trị ước tính
   */
  static async calculateTotalEstimatedValue(chiTietVatTu) {
    try {
      let total = 0;

      for (const item of chiTietVatTu) {
        let giaSuDung = item.gia_du_kien;

        // Nếu không có giá dự kiến, lấy giá tham khảo từ vật tư
        if (!giaSuDung) {
          const vatTuResult = await pool.query(
            "SELECT gia_tham_khao FROM vat_tu WHERE id = $1",
            [item.vat_tu_id]
          );
          giaSuDung = vatTuResult.rows[0]?.gia_tham_khao || 0;
        }

        total += giaSuDung * item.so_luong_yeu_cau;
      }

      return total;
    } catch (error) {
      console.error("Calculate total estimated value error:", error);
      throw new Error("Lỗi tính tổng giá trị ước tính");
    }
  }

  /**
   * Kiểm tra điều kiện submit yêu cầu
   */
  static async validateSubmitConditions(yeuCauId) {
    try {
      // Kiểm tra trạng thái hiện tại
      const yeuCauResult = await pool.query(
        "SELECT trang_thai FROM yeu_cau_nhap_kho WHERE id = $1",
        [yeuCauId]
      );

      if (yeuCauResult.rows.length === 0) {
        return { canSubmit: false, reason: "Yêu cầu không tồn tại" };
      }

      const currentStatus = yeuCauResult.rows[0].trang_thai;

      // Chỉ cho phép submit khi ở trạng thái draft
      if (currentStatus !== "draft") {
        return {
          canSubmit: false,
          reason: `Không thể gửi yêu cầu ở trạng thái '${currentStatus}'`,
        };
      }

      // Kiểm tra có chi tiết vật tư hay không
      const chiTietResult = await pool.query(
        "SELECT COUNT(*) as count FROM chi_tiet_yeu_cau_nhap WHERE yeu_cau_nhap_id = $1",
        [yeuCauId]
      );

      if (parseInt(chiTietResult.rows[0].count) === 0) {
        return {
          canSubmit: false,
          reason: "Yêu cầu phải có ít nhất một vật tư",
        };
      }

      return { canSubmit: true };
    } catch (error) {
      console.error("Validate submit conditions error:", error);
      throw new Error("Lỗi kiểm tra điều kiện gửi yêu cầu");
    }
  }

  /**
   * Xử lý workflow sau khi submit
   */
  static async processWorkflowAfterSubmit(yeuCauId, userId) {
    try {
      // Lấy thông tin yêu cầu và người yêu cầu
      const yeuCauResult = await pool.query(
        `
        SELECT ycn.*, u.ho_ten, pb.ten_phong_ban, pb.quan_ly_id
        FROM yeu_cau_nhap_kho ycn
        JOIN users u ON ycn.nguoi_yeu_cau = u.id
        JOIN phong_ban pb ON ycn.don_vi_yeu_cau_id = pb.id
        WHERE ycn.id = $1
      `,
        [yeuCauId]
      );

      if (yeuCauResult.rows.length === 0) {
        throw new Error("Không tìm thấy yêu cầu");
      }

      const yeuCau = yeuCauResult.rows[0];

      // Tạo workflow approval record
      await pool.query(
        `
        INSERT INTO workflow_approvals (
          reference_type, reference_id, current_step, current_approver_id,
          status, created_by, created_at
        ) VALUES (
          'yeu_cau_nhap', $1, 'manager_review', $2, 'pending', $3, NOW()
        )
      `,
        [yeuCauId, yeuCau.quan_ly_id, userId]
      );

      // Tạo thông báo cho manager
      const notificationService = require("./notificationService");
      await notificationService.createNotification({
        nguoi_nhan_id: yeuCau.quan_ly_id,
        tieu_de: "Yêu cầu nhập kho mới cần phê duyệt",
        noi_dung: `Yêu cầu nhập kho ${yeuCau.so_yeu_cau} từ ${yeuCau.ho_ten} (${yeuCau.ten_phong_ban}) cần được phê duyệt.`,
        loai_thong_bao: "workflow",
        lien_ket: `/yeu-cau-nhap/${yeuCauId}`,
        metadata: {
          yeu_cau_id: yeuCauId,
          yeu_cau_type: "nhap_kho",
          action_required: "approve",
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Process workflow after submit error:", error);
      throw new Error("Lỗi xử lý workflow sau khi gửi yêu cầu");
    }
  }

  /**
   * Kiểm tra điều kiện hủy yêu cầu
   */
  static async validateCancelConditions(yeuCauId, userId, userRole) {
    try {
      const result = await pool.query(
        "SELECT trang_thai, nguoi_yeu_cau FROM yeu_cau_nhap_kho WHERE id = $1",
        [yeuCauId]
      );

      if (result.rows.length === 0) {
        return { canCancel: false, reason: "Yêu cầu không tồn tại" };
      }

      const { trang_thai, nguoi_yeu_cau } = result.rows[0];

      // Chỉ người tạo hoặc admin mới có thể hủy
      if (userRole !== "admin" && nguoi_yeu_cau !== userId) {
        return { canCancel: false, reason: "Không có quyền hủy yêu cầu này" };
      }

      // Chỉ có thể hủy khi ở trạng thái draft hoặc confirmed
      const cancelableStatuses = ["draft", "confirmed"];
      if (!cancelableStatuses.includes(trang_thai)) {
        return {
          canCancel: false,
          reason: `Không thể hủy yêu cầu ở trạng thái '${trang_thai}'`,
        };
      }

      return { canCancel: true };
    } catch (error) {
      console.error("Validate cancel conditions error:", error);
      throw new Error("Lỗi kiểm tra điều kiện hủy yêu cầu");
    }
  }

  /**
   * Xử lý workflow sau khi hủy yêu cầu
   */
  static async processWorkflowAfterCancel(yeuCauId, userId, lyDoHuy) {
    try {
      // Cập nhật trạng thái workflow approval
      await pool.query(
        `
        UPDATE workflow_approvals 
        SET status = 'cancelled', 
            completed_at = NOW(),
            notes = $1
        WHERE reference_type = 'yeu_cau_nhap' 
          AND reference_id = $2 
          AND status = 'pending'
      `,
        [lyDoHuy, yeuCauId]
      );

      // Tạo thông báo cho những người liên quan
      const notificationService = require("./notificationService");

      // Lấy danh sách người cần thông báo
      const stakeholders = await pool.query(
        `
        SELECT DISTINCT wa.current_approver_id as user_id
        FROM workflow_approvals wa
        WHERE wa.reference_type = 'yeu_cau_nhap' 
          AND wa.reference_id = $1
          AND wa.current_approver_id IS NOT NULL
          AND wa.current_approver_id != $2
      `,
        [yeuCauId, userId]
      );

      // Lấy thông tin yêu cầu để tạo thông báo
      const yeuCauInfo = await pool.query(
        `
        SELECT so_yeu_cau, u.ho_ten
        FROM yeu_cau_nhap_kho ycn
        JOIN users u ON ycn.nguoi_yeu_cau = u.id
        WHERE ycn.id = $1
      `,
        [yeuCauId]
      );

      if (yeuCauInfo.rows.length > 0) {
        const { so_yeu_cau, ho_ten } = yeuCauInfo.rows[0];

        for (const stakeholder of stakeholders.rows) {
          await notificationService.createNotification({
            nguoi_nhan_id: stakeholder.user_id,
            tieu_de: "Yêu cầu nhập kho đã bị hủy",
            noi_dung: `Yêu cầu nhập kho ${so_yeu_cau} của ${ho_ten} đã bị hủy. Lý do: ${lyDoHuy}`,
            loai_thong_bao: "workflow",
            lien_ket: `/yeu-cau-nhap/${yeuCauId}`,
            metadata: {
              yeu_cau_id: yeuCauId,
              yeu_cau_type: "nhap_kho",
              action: "cancelled",
            },
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Process workflow after cancel error:", error);
      throw new Error("Lỗi xử lý workflow sau khi hủy yêu cầu");
    }
  }

  /**
   * Lấy lịch sử thay đổi của yêu cầu
   */
  static async getChangeHistory(yeuCauId) {
    try {
      const result = await pool.query(
        `
        SELECT 
          al.id,
          al.action,
          al.old_values,
          al.new_values,
          al.created_at,
          u.ho_ten as performed_by
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.table_name = 'yeu_cau_nhap_kho' 
          AND al.record_id = $1
        ORDER BY al.created_at DESC
      `,
        [yeuCauId]
      );

      return result.rows;
    } catch (error) {
      console.error("Get change history error:", error);
      throw new Error("Lỗi lấy lịch sử thay đổi");
    }
  }

  /**
   * Lấy thống kê yêu cầu theo phòng ban
   */
  static async getStatisticsByDepartment(departmentId, startDate, endDate) {
    try {
      const result = await pool.query(
        `
        SELECT 
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE trang_thai = 'draft') as draft_count,
          COUNT(*) FILTER (WHERE trang_thai = 'confirmed') as confirmed_count,
          COUNT(*) FILTER (WHERE trang_thai = 'approved') as approved_count,
          COUNT(*) FILTER (WHERE trang_thai = 'rejected') as rejected_count,
          COUNT(*) FILTER (WHERE trang_thai = 'cancelled') as cancelled_count,
          COUNT(*) FILTER (WHERE trang_thai = 'completed') as completed_count,
          SUM(tong_gia_tri_uoc_tinh) as total_estimated_value,
          AVG(tong_gia_tri_uoc_tinh) as avg_estimated_value
        FROM yeu_cau_nhap_kho
        WHERE don_vi_yeu_cau_id = $1
          AND ($2::date IS NULL OR ngay_yeu_cau >= $2)
          AND ($3::date IS NULL OR ngay_yeu_cau <= $3)
      `,
        [departmentId, startDate, endDate]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Get statistics by department error:", error);
      throw new Error("Lỗi lấy thống kê theo phòng ban");
    }
  }
}

module.exports = YeuCauNhapKhoService;
