// middleware/workflowAuth.js
const pool = require("../config/database");
const { sendResponse } = require("../utils/response");

/**
 * Middleware kiểm tra quyền trong workflow
 */
const workflowAuth = {
  /**
   * Kiểm tra quyền phê duyệt yêu cầu
   */
  checkApprovalPermission: async (req, res, next) => {
    try {
      const user = req.user; // Đã được set từ authenticate middleware

      if (!user) {
        return sendResponse(res, 401, false, "Unauthorized");
      }

      // Admin có toàn quyền
      if (user.role === "admin") {
        req.approvalLevel = "admin";
        return next();
      }

      // Kiểm tra phòng ban có quyền phê duyệt
      const phongQuanLyKho = await pool.query(
        "SELECT id FROM phong_ban WHERE ma_phong_ban IN ('HCK', 'TMKH')"
      );

      const phongQuanLyIds = phongQuanLyKho.rows.map((row) => row.id);

      if (phongQuanLyIds.includes(user.phong_ban_id)) {
        req.approvalLevel = "manager";
        return next();
      }

      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền phê duyệt yêu cầu này"
      );
    } catch (error) {
      console.error("Workflow auth error:", error);
      return sendResponse(res, 500, false, "Lỗi kiểm tra quyền");
    }
  },

  /**
   * Kiểm tra quyền tạo yêu cầu
   */
  checkCreateRequestPermission: async (req, res, next) => {
    try {
      const user = req.user;
      const { don_vi_yeu_cau_id } = req.body;

      if (!user) {
        return sendResponse(res, 401, false, "Unauthorized");
      }

      // Admin có thể tạo yêu cầu cho bất kỳ phòng ban nào
      if (user.role === "admin") {
        return next();
      }

      // User thường chỉ có thể tạo yêu cầu cho phòng ban của mình
      const targetDepartment = don_vi_yeu_cau_id || user.phong_ban_id;

      if (targetDepartment !== user.phong_ban_id) {
        return sendResponse(
          res,
          403,
          false,
          "Bạn chỉ có thể tạo yêu cầu cho phòng ban của mình"
        );
      }

      return next();
    } catch (error) {
      console.error("Create request auth error:", error);
      return sendResponse(res, 500, false, "Lỗi kiểm tra quyền tạo yêu cầu");
    }
  },

  /**
   * Kiểm tra quyền xem yêu cầu
   */
  checkViewRequestPermission: async (req, res, next) => {
    try {
      const user = req.user;
      const { id } = req.params;

      if (!user) {
        return sendResponse(res, 401, false, "Unauthorized");
      }

      // Admin có toàn quyền
      if (user.role === "admin") {
        return next();
      }

      // Kiểm tra yêu cầu có thuộc quyền của user không
      const nhapKhoResult = await pool.query(
        `SELECT don_vi_yeu_cau_id, nguoi_yeu_cau 
         FROM yeu_cau_nhap_kho 
         WHERE id = $1`,
        [id]
      );

      const xuatKhoResult = await pool.query(
        `SELECT don_vi_yeu_cau_id, nguoi_yeu_cau 
         FROM yeu_cau_xuat_kho 
         WHERE id = $1`,
        [id]
      );

      const yeuCau = nhapKhoResult.rows[0] || xuatKhoResult.rows[0];

      if (!yeuCau) {
        return sendResponse(res, 404, false, "Không tìm thấy yêu cầu");
      }

      // User có thể xem nếu là người tạo hoặc cùng phòng ban
      const hasPermission =
        yeuCau.nguoi_yeu_cau === user.id ||
        yeuCau.don_vi_yeu_cau_id === user.phong_ban_id;

      // Hoặc nếu thuộc phòng quản lý kho
      const phongQuanLyKho = await pool.query(
        "SELECT id FROM phong_ban WHERE ma_phong_ban IN ('HCK', 'TMKH')"
      );
      const phongQuanLyIds = phongQuanLyKho.rows.map((row) => row.id);
      const isManager = phongQuanLyIds.includes(user.phong_ban_id);

      if (hasPermission || isManager) {
        req.yeuCauData = yeuCau;
        return next();
      }

      return sendResponse(
        res,
        403,
        false,
        "Bạn không có quyền xem yêu cầu này"
      );
    } catch (error) {
      console.error("View request auth error:", error);
      return sendResponse(res, 500, false, "Lỗi kiểm tra quyền xem");
    }
  },

  /**
   * Rate limiting cho workflow actions
   */
  rateLimitWorkflowActions: (maxActions = 10, windowMinutes = 5) => {
    const actionCounts = new Map();

    return (req, res, next) => {
      const user = req.user;
      if (!user) {
        return sendResponse(res, 401, false, "Unauthorized");
      }

      const userKey = `workflow_${user.id}`;
      const now = Date.now();
      const windowMs = windowMinutes * 60 * 1000;

      // Lấy hoặc tạo record cho user
      const userRecord = actionCounts.get(userKey) || {
        count: 0,
        windowStart: now,
      };

      // Reset nếu hết window
      if (now - userRecord.windowStart > windowMs) {
        userRecord.count = 0;
        userRecord.windowStart = now;
      }

      // Kiểm tra limit
      if (userRecord.count >= maxActions) {
        const timeLeft = Math.ceil(
          (windowMs - (now - userRecord.windowStart)) / 1000 / 60
        );
        return sendResponse(
          res,
          429,
          false,
          `Bạn đã thực hiện quá nhiều thao tác. Vui lòng đợi ${timeLeft} phút.`
        );
      }

      // Tăng counter
      userRecord.count++;
      actionCounts.set(userKey, userRecord);

      // Cleanup old records periodically
      if (Math.random() < 0.1) {
        // 10% chance
        const cutoff = now - windowMs;
        for (const [key, record] of actionCounts.entries()) {
          if (record.windowStart < cutoff) {
            actionCounts.delete(key);
          }
        }
      }

      next();
    };
  },

  /**
   * Validate workflow state transitions
   */
  validateStateTransition: (fromStates, toState) => {
    return async (req, res, next) => {
      try {
        const { id } = req.params;
        const user = req.user;

        // Tìm yêu cầu và kiểm tra trạng thái hiện tại
        let currentState = null;
        let tableName = "";

        // Check yêu cầu nhập kho
        if (req.path.includes("yeu-cau-nhap")) {
          const result = await pool.query(
            "SELECT trang_thai FROM yeu_cau_nhap_kho WHERE id = $1",
            [id]
          );
          if (result.rows.length > 0) {
            currentState = result.rows[0].trang_thai;
            tableName = "yeu_cau_nhap_kho";
          }
        }

        // Check yêu cầu xuất kho
        if (req.path.includes("yeu-cau-xuat") && !currentState) {
          const result = await pool.query(
            "SELECT trang_thai FROM yeu_cau_xuat_kho WHERE id = $1",
            [id]
          );
          if (result.rows.length > 0) {
            currentState = result.rows[0].trang_thai;
            tableName = "yeu_cau_xuat_kho";
          }
        }

        if (!currentState) {
          return sendResponse(res, 404, false, "Không tìm thấy yêu cầu");
        }

        // Kiểm tra transition hợp lệ
        if (!fromStates.includes(currentState)) {
          return sendResponse(
            res,
            400,
            false,
            `Không thể chuyển từ trạng thái '${currentState}' sang '${toState}'`
          );
        }

        // Lưu thông tin để sử dụng trong controller
        req.currentState = currentState;
        req.targetState = toState;
        req.tableName = tableName;

        next();
      } catch (error) {
        console.error("State transition validation error:", error);
        return sendResponse(res, 500, false, "Lỗi kiểm tra trạng thái");
      }
    };
  },
};

module.exports = { workflowAuth };
