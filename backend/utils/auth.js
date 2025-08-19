const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "your-secret-key-change-this";
const JWT_EXPIRES_IN = "24h";
const pool = require("../config/database");

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
};

const checkWorkflowPermission = async (user, actionType = "view") => {
  try {
    if (!user) {
      return { hasPermission: false, reason: "User not authenticated" };
    }

    // Admin cÃ³ toÃ n quyá»n
    if (user.role === "admin") {
      return {
        hasPermission: true,
        level: "admin",
        scope: "all_departments",
      };
    }

    // Kiá»ƒm tra quyá»n theo action type
    switch (actionType) {
      case "approve":
      case "reject":
        return await checkApprovalPermission(user);

      case "create":
        return await checkCreateRequestPermission(user);

      case "view":
        return await checkViewPermission(user);

      default:
        return { hasPermission: false, reason: "Invalid action type" };
    }
  } catch (error) {
    console.error("Check workflow permission error:", error);
    return { hasPermission: false, reason: "Permission check failed" };
  }
};

/**
 * Kiá»ƒm tra quyá»n phÃª duyá»‡t
 */
const checkApprovalPermission = async (user) => {
  try {
    // Láº¥y danh sÃ¡ch phÃ²ng ban cÃ³ quyá»n phÃª duyá»‡t
    const approvalDepartments = await pool.query(
      "SELECT id, ma_phong_ban, ten_phong_ban FROM phong_ban WHERE ma_phong_ban IN ('HCK', 'TMKH')"
    );

    const approvalDeptIds = approvalDepartments.rows.map((dept) => dept.id);

    if (approvalDeptIds.includes(user.phong_ban_id)) {
      return {
        hasPermission: true,
        level: "department_manager",
        scope: "approval_workflow",
        department: approvalDepartments.rows.find(
          (d) => d.id === user.phong_ban_id
        ),
      };
    }

    return {
      hasPermission: false,
      reason: "User department does not have approval permission",
    };
  } catch (error) {
    console.error("Check approval permission error:", error);
    return { hasPermission: false, reason: "Approval permission check failed" };
  }
};

/**
 * Kiá»ƒm tra quyá»n táº¡o yÃªu cáº§u
 */
const checkCreateRequestPermission = async (user) => {
  try {
    // Táº¥t cáº£ user Ä‘Ã£ authenticated Ä‘á»u cÃ³ thá»ƒ táº¡o yÃªu cáº§u cho phÃ²ng ban cá»§a mÃ¬nh
    const userDepartment = await pool.query(
      "SELECT id, ma_phong_ban, ten_phong_ban FROM phong_ban WHERE id = $1",
      [user.phong_ban_id]
    );

    if (userDepartment.rows.length === 0) {
      return { hasPermission: false, reason: "User department not found" };
    }

    return {
      hasPermission: true,
      level: "department_user",
      scope: "own_department",
      department: userDepartment.rows[0],
    };
  } catch (error) {
    console.error("Check create permission error:", error);
    return { hasPermission: false, reason: "Create permission check failed" };
  }
};

/**
 * Kiá»ƒm tra quyá»n xem
 */
const checkViewPermission = async (user) => {
  try {
    // User cÃ³ thá»ƒ xem yÃªu cáº§u cá»§a phÃ²ng ban mÃ¬nh vÃ  yÃªu cáº§u mÃ¬nh táº¡o
    const userDepartment = await pool.query(
      "SELECT id, ma_phong_ban, ten_phong_ban FROM phong_ban WHERE id = $1",
      [user.phong_ban_id]
    );

    // Kiá»ƒm tra cÃ³ pháº£i lÃ  phÃ²ng quáº£n lÃ½ kho khÃ´ng
    const isManagementDept = await pool.query(
      "SELECT id FROM phong_ban WHERE id = $1 AND ma_phong_ban IN ('HCK', 'TMKH')",
      [user.phong_ban_id]
    );

    const scope =
      isManagementDept.rows.length > 0 ? "all_requests" : "own_department";

    return {
      hasPermission: true,
      level:
        scope === "all_requests" ? "department_manager" : "department_user",
      scope: scope,
      department: userDepartment.rows[0],
    };
  } catch (error) {
    console.error("Check view permission error:", error);
    return { hasPermission: false, reason: "View permission check failed" };
  }
};

/**
 * Kiá»ƒm tra quyá»n truy cáº­p resource cá»¥ thá»ƒ
 * @param {Object} user - User object
 * @param {string} resourceType - 'yeu_cau_nhap', 'yeu_cau_xuat', 'phieu_nhap', 'phieu_xuat'
 * @param {number} resourceId - ID cá»§a resource
 * @returns {Object} Access result
 */
const checkResourceAccess = async (user, resourceType, resourceId) => {
  try {
    if (!user || !resourceType || !resourceId) {
      return { hasAccess: false, reason: "Invalid parameters" };
    }

    // Admin cÃ³ toÃ n quyá»n
    if (user.role === "admin") {
      return { hasAccess: true, level: "admin" };
    }

    let query;
    let tableName;

    // XÃ¡c Ä‘á»‹nh table vÃ  query dá»±a trÃªn resource type
    switch (resourceType) {
      case "yeu_cau_nhap":
        tableName = "yeu_cau_nhap_kho";
        query = `
          SELECT don_vi_yeu_cau_id, nguoi_yeu_cau, trang_thai
          FROM yeu_cau_nhap_kho 
          WHERE id = $1
        `;
        break;

      case "yeu_cau_xuat":
        tableName = "yeu_cau_xuat_kho";
        query = `
          SELECT don_vi_yeu_cau_id, nguoi_yeu_cau, trang_thai
          FROM yeu_cau_xuat_kho 
          WHERE id = $1
        `;
        break;

      case "phieu_nhap":
        tableName = "phieu_nhap";
        query = `
          SELECT phong_ban_id as don_vi_yeu_cau_id, nguoi_tao as nguoi_yeu_cau, trang_thai
          FROM phieu_nhap 
          WHERE id = $1
        `;
        break;

      case "phieu_xuat":
        tableName = "phieu_xuat";
        query = `
          SELECT phong_ban_id as don_vi_yeu_cau_id, nguoi_tao as nguoi_yeu_cau, trang_thai
          FROM phieu_xuat 
          WHERE id = $1
        `;
        break;

      default:
        return { hasAccess: false, reason: "Unknown resource type" };
    }

    const result = await pool.query(query, [resourceId]);

    if (result.rows.length === 0) {
      return { hasAccess: false, reason: "Resource not found" };
    }

    const resource = result.rows[0];

    // Kiá»ƒm tra quyá»n truy cáº­p
    const isOwner = resource.nguoi_yeu_cau === user.id;
    const isSameDepartment = resource.don_vi_yeu_cau_id === user.phong_ban_id;

    // Kiá»ƒm tra cÃ³ pháº£i phÃ²ng quáº£n lÃ½ kho khÃ´ng
    const managementCheck = await pool.query(
      "SELECT id FROM phong_ban WHERE id = $1 AND ma_phong_ban IN ('HCK', 'TMKH')",
      [user.phong_ban_id]
    );
    const isManager = managementCheck.rows.length > 0;

    if (isOwner || isSameDepartment || isManager) {
      return {
        hasAccess: true,
        level: isManager ? "manager" : isOwner ? "owner" : "department",
        resource: resource,
      };
    }

    return {
      hasAccess: false,
      reason: "Insufficient permissions for this resource",
    };
  } catch (error) {
    console.error("Check resource access error:", error);
    return { hasAccess: false, reason: "Access check failed" };
  }
};

/**
 * Middleware factory cho workflow authentication
 * @param {string} actionType - Loáº¡i action cáº§n kiá»ƒm tra
 * @param {string} resourceParam - TÃªn parameter chá»©a resource ID (optional)
 */
const requireWorkflowPermission = (actionType, resourceParam = null) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // ÄÃ£ Ä‘Æ°á»£c set tá»« authenticate middleware trÆ°á»›c Ä‘Ã³

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Kiá»ƒm tra quyá»n workflow cÆ¡ báº£n
      const permission = await checkWorkflowPermission(user, actionType);

      if (!permission.hasPermission) {
        return res.status(403).json({
          success: false,
          message: permission.reason || "Access denied",
        });
      }

      // Náº¿u cÃ³ resourceParam, kiá»ƒm tra quyá»n truy cáº­p resource cá»¥ thá»ƒ
      if (resourceParam && req.params[resourceParam]) {
        const resourceType = req.path.includes("yeu-cau-nhap")
          ? "yeu_cau_nhap"
          : req.path.includes("yeu-cau-xuat")
          ? "yeu_cau_xuat"
          : req.path.includes("phieu-nhap")
          ? "phieu_nhap"
          : req.path.includes("phieu-xuat")
          ? "phieu_xuat"
          : null;

        if (resourceType) {
          const access = await checkResourceAccess(
            user,
            resourceType,
            req.params[resourceParam]
          );

          if (!access.hasAccess) {
            return res.status(403).json({
              success: false,
              message: access.reason || "Resource access denied",
            });
          }

          // Attach resource info to request
          req.resourceAccess = access;
        }
      }

      // Attach permission info to request
      req.workflowPermission = permission;
      next();
    } catch (error) {
      console.error("Workflow permission middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};

/**
 * Rate limiting cho workflow actions
 */
const workflowRateLimit = (() => {
  const actionCounts = new Map();
  const maxActions = 20; // Max actions per window
  const windowMinutes = 10; // Time window in minutes

  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Skip rate limiting for admins
    if (user.role === "admin") {
      return next();
    }

    const userKey = `workflow_${user.id}`;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    // Get or create user record
    const userRecord = actionCounts.get(userKey) || {
      count: 0,
      windowStart: now,
    };

    // Reset if window expired
    if (now - userRecord.windowStart > windowMs) {
      userRecord.count = 0;
      userRecord.windowStart = now;
    }

    // Check limit
    if (userRecord.count >= maxActions) {
      const timeLeft = Math.ceil(
        (windowMs - (now - userRecord.windowStart)) / 1000 / 60
      );
      return res.status(429).json({
        success: false,
        message: `Too many workflow actions. Please wait ${timeLeft} minutes.`,
        retryAfter: timeLeft * 60,
      });
    }

    // Increment counter
    userRecord.count++;
    actionCounts.set(userKey, userRecord);

    // Cleanup old records periodically
    if (Math.random() < 0.1) {
      const cutoff = now - windowMs;
      for (const [key, record] of actionCounts.entries()) {
        if (record.windowStart < cutoff) {
          actionCounts.delete(key);
        }
      }
    }

    next();
  };
})();

/**
 * Validate workflow state transitions
 */
const validateWorkflowState = (allowedStates, targetState = null) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Resource ID required",
        });
      }

      let currentState = null;
      let resourceType = null;

      // Determine resource type from path
      if (req.path.includes("yeu-cau-nhap")) {
        resourceType = "yeu_cau_nhap";
        const result = await pool.query(
          "SELECT trang_thai FROM yeu_cau_nhap_kho WHERE id = $1",
          [id]
        );
        currentState = result.rows[0]?.trang_thai;
      } else if (req.path.includes("yeu-cau-xuat")) {
        resourceType = "yeu_cau_xuat";
        const result = await pool.query(
          "SELECT trang_thai FROM yeu_cau_xuat_kho WHERE id = $1",
          [id]
        );
        currentState = result.rows[0]?.trang_thai;
      }

      if (!currentState) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
        });
      }

      // Check if current state allows the operation
      if (!allowedStates.includes(currentState)) {
        return res.status(400).json({
          success: false,
          message: `Cannot perform this action on resource in state: ${currentState}`,
          currentState,
          allowedStates,
        });
      }

      // Attach state info to request
      req.currentState = currentState;
      req.resourceType = resourceType;
      if (targetState) {
        req.targetState = targetState;
      }

      next();
    } catch (error) {
      console.error("Workflow state validation error:", error);
      return res.status(500).json({
        success: false,
        message: "State validation failed",
      });
    }
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  getTokenFromRequest,
  checkWorkflowPermission,
  checkApprovalPermission,
  checkCreateRequestPermission,
  checkViewPermission,
  checkResourceAccess,
  requireWorkflowPermission,
  workflowRateLimit,
  validateWorkflowState,
};
