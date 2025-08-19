// services/yeuCauXuatKhoService.js
const pool = require("../config/database");

/**
 * Service xử lý business logic cho Yêu cầu xuất kho
 */
class YeuCauXuatKhoService {
  /**
   * Tạo số yêu cầu tự động
   */
  static async generateSoYeuCau() {
    try {
      const result = await pool.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(so_yeu_cau FROM 4) AS INTEGER)), 0) + 1 as next_number
        FROM yeu_cau_xuat_kho 
        WHERE so_yeu_cau ~ '^YCX[0-9]+$'
      `);

      const nextNumber = result.rows[0].next_number;
      return `YCX${nextNumber.toString().padStart(6, "0")}`;
    } catch (error) {
      console.error("Generate so yeu cau error:", error);
      throw new Error("Lỗi tạo số yêu cầu");
    }
  }

  /**
   * Validate dữ liệu yêu cầu xuất kho
   */
  static validateYeuCauData(data) {
    const {
      ngay_yeu_cau,
      don_vi_yeu_cau_id,
      don_vi_nhan_id,
      ly_do_yeu_cau,
      muc_do_uu_tien,
      ngay_can_xuat,
      chi_tiet_vat_tu,
    } = data;

    const errors = [];

    // Validate required fields
    if (!ngay_yeu_cau) errors.push("Ngày yêu cầu là bắt buộc");
    if (!don_vi_yeu_cau_id) errors.push("Đơn vị yêu cầu là bắt buộc");
    if (!don_vi_nhan_id) errors.push("Đơn vị nhận là bắt buộc");
    if (!ly_do_yeu_cau || ly_do_yeu_cau.trim().length === 0) {
      errors.push("Lý do yêu cầu là bắt buộc");
    }
    if (!muc_do_uu_tien) errors.push("Mức độ ưu tiên là bắt buộc");
    if (!ngay_can_xuat) errors.push("Ngày cần xuất là bắt buộc");

    // Validate mức độ ưu tiên
    const validPriorities = ["thap", "binh_thuong", "cao", "khan_cap"];
    if (muc_do_uu_tien && !validPriorities.includes(muc_do_uu_tien)) {
      errors.push("Mức độ ưu tiên không hợp lệ");
    }

    // Validate ngày cần xuất phải >= ngày yêu cầu
    if (ngay_yeu_cau && ngay_can_xuat) {
      const ngayYeuCau = new Date(ngay_yeu_cau);
      const ngayCanXuat = new Date(ngay_can_xuat);

      if (ngayCanXuat < ngayYeuCau) {
        errors.push("Ngày cần xuất không được trước ngày yêu cầu");
      }
    }

    // Validate đơn vị yêu cầu khác đơn vị nhận
    if (
      don_vi_yeu_cau_id &&
      don_vi_nhan_id &&
      don_vi_yeu_cau_id === don_vi_nhan_id
    ) {
      errors.push("Đơn vị yêu cầu và đơn vị nhận phải khác nhau");
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
      });
    }

    return errors;
  }

  /**
   * Kiểm tra tồn kho cho danh sách vật tư
   */
  static async checkStockAvailability(chiTietVatTu) {
    try {
      const stockChecks = [];

      for (const item of chiTietVatTu) {
        const { vat_tu_id, so_luong_yeu_cau } = item;

        // Lấy thông tin tồn kho hiện tại
        const stockResult = await pool.query(
          `
          SELECT 
            vt.ma_vat_tu,
            vt.ten_vat_tu,
            vt.don_vi_tinh,
            tk.so_luong_con_lai,
            tk.so_luong_an_toan
          FROM vat_tu vt
          LEFT JOIN ton_kho tk ON vt.id = tk.vat_tu_id
          WHERE vt.id = $1
        `,
          [vat_tu_id]
        );

        if (stockResult.rows.length === 0) {
          stockChecks.push({
            vat_tu_id,
            so_luong_yeu_cau,
            available: false,
            reason: "Vật tư không tồn tại",
            current_stock: 0,
          });
          continue;
        }

        const vatTu = stockResult.rows[0];
        const currentStock = vatTu.so_luong_con_lai || 0;
        const safetyStock = vatTu.so_luong_an_toan || 0;

        // Kiểm tra đủ tồn kho
        const isAvailable = currentStock >= so_luong_yeu_cau;

        // Cảnh báo nếu sau xuất sẽ dưới mức an toàn
        const willBeBelowSafety = currentStock - so_luong_yeu_cau < safetyStock;

        stockChecks.push({
          vat_tu_id,
          ma_vat_tu: vatTu.ma_vat_tu,
          ten_vat_tu: vatTu.ten_vat_tu,
          don_vi_tinh: vatTu.don_vi_tinh,
          so_luong_yeu_cau,
          current_stock: currentStock,
          safety_stock: safetyStock,
          available: isAvailable,
          will_be_below_safety: willBeBelowSafety,
          remaining_after_export: currentStock - so_luong_yeu_cau,
          reason: !isAvailable
            ? `Không đủ tồn kho (hiện có: ${currentStock})`
            : null,
        });
      }

      return {
        all_available: stockChecks.every((check) => check.available),
        items: stockChecks,
        warnings: stockChecks.filter((check) => check.will_be_below_safety),
      };
    } catch (error) {
      console.error("Check stock availability error:", error);
      throw new Error("Lỗi kiểm tra tồn kho");
    }
  }

  /**
   * Kiểm tra quyền truy cập yêu cầu
   */
  static async checkAccessPermission(yeuCauId, userId, userRole) {
    try {
      const result = await pool.query(
        `
        SELECT 
          ycx.*,
          pb_yc.ten_phong_ban as ten_don_vi_yeu_cau,
          dvn.ten_don_vi as ten_don_vi_nhan,
          u.ho_ten as nguoi_yeu_cau_ten
        FROM yeu_cau_xuat_kho ycx
        LEFT JOIN phong_ban pb_yc ON ycx.don_vi_yeu_cau_id = pb_yc.id
        LEFT JOIN don_vi_nhan dvn ON ycx.don_vi_nhan_id = dvn.id
        LEFT JOIN users u ON ycx.nguoi_yeu_cau = u.id
        WHERE ycx.id = $1
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
   * Tính tổng giá trị ước tính cho yêu cầu xuất
   */
  static async calculateTotalEstimatedValue(chiTietVatTu) {
    try {
      let total = 0;

      for (const item of chiTietVatTu) {
        // Lấy giá tham khảo từ vật tư
        const vatTuResult = await pool.query(
          "SELECT gia_tham_khao FROM vat_tu WHERE id = $1",
          [item.vat_tu_id]
        );

        const giaThamKhao = vatTuResult.rows[0]?.gia_tham_khao || 0;
        total += giaThamKhao * item.so_luong_yeu_cau;
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
        "SELECT trang_thai FROM yeu_cau_xuat_kho WHERE id = $1",
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
        "SELECT COUNT(*) as count FROM chi_tiet_yeu_cau_xuat WHERE yeu_cau_xuat_id = $1",
        [yeuCauId]
      );

      if (parseInt(chiTietResult.rows[0].count) === 0) {
        return {
          canSubmit: false,
          reason: "Yêu cầu phải có ít nhất một vật tư",
        };
      }

      // Kiểm tra tồn kho cho tất cả vật tư
      const chiTietVatTu = await pool.query(
        `
        SELECT vat_tu_id, so_luong_yeu_cau
        FROM chi_tiet_yeu_cau_xuat
        WHERE yeu_cau_xuat_id = $1
      `,
        [yeuCauId]
      );

      const stockCheck = await this.checkStockAvailability(chiTietVatTu.rows);

      if (!stockCheck.all_available) {
        const unavailableItems = stockCheck.items
          .filter((item) => !item.available)
          .map((item) => `${item.ten_vat_tu} (${item.reason})`)
          .join(", ");

        return {
          canSubmit: false,
          reason: `Không đủ tồn kho cho: ${unavailableItems}`,
        };
      }

      return { canSubmit: true, warnings: stockCheck.warnings };
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
        SELECT 
          ycx.*, 
          u.ho_ten, 
          pb.ten_phong_ban, 
          pb.quan_ly_id,
          dvn.ten_don_vi as ten_don_vi_nhan
        FROM yeu_cau_xuat_kho ycx
        JOIN users u ON ycx.nguoi_yeu_cau = u.id
        JOIN phong_ban pb ON ycx.don_vi_yeu_cau_id = pb.id
        LEFT JOIN don_vi_nhan dvn ON ycx.don_vi_nhan_id = dvn.id
        WHERE ycx.id = $1
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
          'yeu_cau_xuat', $1, 'manager_review', $2, 'pending', $3, NOW()
        )
      `,
        [yeuCauId, yeuCau.quan_ly_id, userId]
      );

      // Tạo thông báo cho manager
      const notificationService = require("./notificationService");
      await notificationService.createNotification({
        nguoi_nhan_id: yeuCau.quan_ly_id,
        tieu_de: "Yêu cầu xuất kho mới cần phê duyệt",
        noi_dung: `Yêu cầu xuất kho ${yeuCau.so_yeu_cau} từ ${yeuCau.ho_ten} (${yeuCau.ten_phong_ban}) đến ${yeuCau.ten_don_vi_nhan} cần được phê duyệt.`,
        loai_thong_bao: "workflow",
        lien_ket: `/yeu-cau-xuat/${yeuCauId}`,
        metadata: {
          yeu_cau_id: yeuCauId,
          yeu_cau_type: "xuat_kho",
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
        "SELECT trang_thai, nguoi_yeu_cau FROM yeu_cau_xuat_kho WHERE id = $1",
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
   * Dự đoán ngày có thể xuất dựa trên lịch sử và workload
   */
  static async predictAvailableExportDate(chiTietVatTu, muc_do_uu_tien) {
    try {
      // Lấy thống kê thời gian xử lý trung bình
      const avgProcessingTime = await pool.query(
        `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (ngay_duyet - ngay_yeu_cau))/86400) as avg_processing_days
        FROM yeu_cau_xuat_kho 
        WHERE trang_thai = 'approved' 
          AND ngay_duyet IS NOT NULL
          AND muc_do_uu_tien = $1
          AND created_at >= NOW() - INTERVAL '3 months'
      `,
        [muc_do_uu_tien]
      );

      const processingDays =
        avgProcessingTime.rows[0]?.avg_processing_days || 3;

      // Kiểm tra workload hiện tại
      const pendingRequests = await pool.query(`
        SELECT COUNT(*) as pending_count
        FROM yeu_cau_xuat_kho
        WHERE trang_thai IN ('confirmed', 'approved')
          AND muc_do_uu_tien IN ('cao', 'khan_cap')
      `);

      const pendingCount = parseInt(pendingRequests.rows[0].pending_count);

      // Điều chỉnh thời gian dự kiến dựa trên workload và mức độ ưu tiên
      let adjustedDays = processingDays;

      if (muc_do_uu_tien === "khan_cap") {
        adjustedDays = Math.max(1, processingDays * 0.5);
      } else if (muc_do_uu_tien === "cao") {
        adjustedDays = processingDays * 0.8;
      } else if (pendingCount > 10) {
        adjustedDays = processingDays * 1.5;
      }

      const predictedDate = new Date();
      predictedDate.setDate(predictedDate.getDate() + Math.ceil(adjustedDays));

      return {
        predicted_date: predictedDate.toISOString().split("T")[0],
        estimated_processing_days: Math.ceil(adjustedDays),
        current_workload: pendingCount,
        confidence:
          pendingCount < 5 ? "high" : pendingCount < 15 ? "medium" : "low",
      };
    } catch (error) {
      console.error("Predict available export date error:", error);
      return {
        predicted_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        estimated_processing_days: 3,
        current_workload: 0,
        confidence: "low",
      };
    }
  }

  /**
   * Lấy thống kê yêu cầu xuất theo đơn vị nhận
   */
  static async getStatisticsByReceiver(donViNhanId, startDate, endDate) {
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
          AVG(tong_gia_tri_uoc_tinh) as avg_estimated_value,
          AVG(EXTRACT(EPOCH FROM (ngay_duyet - ngay_yeu_cau))/86400) as avg_approval_days
        FROM yeu_cau_xuat_kho
        WHERE don_vi_nhan_id = $1
          AND ($2::date IS NULL OR ngay_yeu_cau >= $2)
          AND ($3::date IS NULL OR ngay_yeu_cau <= $3)
      `,
        [donViNhanId, startDate, endDate]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Get statistics by receiver error:", error);
      throw new Error("Lỗi lấy thống kê theo đơn vị nhận");
    }
  }

  /**
   * Kiểm tra và cảnh báo vật tư sắp hết hạn trong yêu cầu
   */
  static async checkExpiringItems(yeuCauId) {
    try {
      const result = await pool.query(
        `
        SELECT 
          ct.vat_tu_id,
          ct.so_luong_yeu_cau,
          vt.ten_vat_tu,
          vt.ma_vat_tu,
          tk.han_su_dung,
          EXTRACT(EPOCH FROM (tk.han_su_dung - NOW()))/86400 as days_to_expire
        FROM chi_tiet_yeu_cau_xuat ct
        JOIN vat_tu vt ON ct.vat_tu_id = vt.id
        LEFT JOIN ton_kho tk ON ct.vat_tu_id = tk.vat_tu_id
        WHERE ct.yeu_cau_xuat_id = $1
          AND tk.han_su_dung IS NOT NULL
          AND tk.han_su_dung <= NOW() + INTERVAL '30 days'
        ORDER BY tk.han_su_dung ASC
      `,
        [yeuCauId]
      );

      return result.rows.map((item) => ({
        ...item,
        urgency:
          item.days_to_expire <= 7
            ? "critical"
            : item.days_to_expire <= 15
            ? "warning"
            : "notice",
      }));
    } catch (error) {
      console.error("Check expiring items error:", error);
      throw new Error("Lỗi kiểm tra vật tư sắp hết hạn");
    }
  }
}

module.exports = YeuCauXuatKhoService;
