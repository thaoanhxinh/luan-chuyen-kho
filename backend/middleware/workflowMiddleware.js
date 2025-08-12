// middleware/workflowMiddleware.js
const {
  requireWorkflowPermission,
  workflowRateLimit,
  validateWorkflowState,
} = require("../utils/auth");
const { auditLogger } = require("./auditLogger");

/**
 * Tập hợp middleware cho các workflow actions
 * Kết hợp authentication, authorization, rate limiting và audit logging
 */
const workflowMiddleware = {
  /**
   * Middleware cho việc tạo yêu cầu mới
   */
  createRequest: [
    workflowRateLimit,
    requireWorkflowPermission("create"),
    auditLogger.logWorkflowAction("CREATE_REQUEST"),
  ],

  /**
   * Middleware cho việc xem yêu cầu
   */
  viewRequest: [
    requireWorkflowPermission("view", "id"),
    auditLogger.logWorkflowAction("VIEW_REQUEST"),
  ],

  /**
   * Middleware cho việc cập nhật yêu cầu
   */
  updateRequest: [
    workflowRateLimit,
    requireWorkflowPermission("create", "id"), // Chỉ người tạo hoặc admin mới được update
    validateWorkflowState(["draft", "submitted"]), // Chỉ update được khi còn draft hoặc submitted
    auditLogger.logWorkflowAction("UPDATE_REQUEST"),
  ],

  /**
   * Middleware cho việc gửi yêu cầu (submit)
   */
  submitRequest: [
    workflowRateLimit,
    requireWorkflowPermission("create", "id"),
    validateWorkflowState(["draft"], "submitted"), // Chỉ submit từ draft
    auditLogger.logWorkflowAction("SUBMIT_REQUEST"),
  ],

  /**
   * Middleware cho việc hủy yêu cầu
   */
  cancelRequest: [
    workflowRateLimit,
    requireWorkflowPermission("create", "id"),
    validateWorkflowState(["draft", "submitted", "under_review"]), // Không hủy được khi đã approved
    auditLogger.logWorkflowAction("CANCEL_REQUEST"),
  ],

  /**
   * Middleware cho việc xóa yêu cầu
   */
  deleteRequest: [
    workflowRateLimit,
    requireWorkflowPermission("create", "id"),
    validateWorkflowState(["draft"]), // Chỉ xóa được khi còn draft
    auditLogger.logWorkflowAction("DELETE_REQUEST"),
  ],

  /**
   * Middleware cho việc phê duyệt yêu cầu
   */
  approveRequest: [
    workflowRateLimit,
    requireWorkflowPermission("approve", "id"),
    validateWorkflowState(["submitted", "under_review"], "approved"),
    auditLogger.logWorkflowAction("APPROVE_REQUEST"),
  ],

  /**
   * Middleware cho việc từ chối yêu cầu
   */
  rejectRequest: [
    workflowRateLimit,
    requireWorkflowPermission("approve", "id"),
    validateWorkflowState(["submitted", "under_review"], "rejected"),
    auditLogger.logWorkflowAction("REJECT_REQUEST"),
  ],

  /**
   * Middleware cho việc chuyển đổi yêu cầu thành phiếu
   */
  convertToPhieu: [
    workflowRateLimit,
    requireWorkflowPermission("approve", "id"),
    validateWorkflowState(["approved"], "completed"),
    auditLogger.logWorkflowAction("CONVERT_TO_PHIEU"),
  ],

  /**
   * Middleware cho việc xem thống kê workflow
   */
  viewStatistics: [
    requireWorkflowPermission("view"),
    auditLogger.logWorkflowAction("VIEW_STATISTICS"),
  ],

  /**
   * Middleware cho việc xem danh sách chờ phê duyệt
   */
  viewPendingApprovals: [
    requireWorkflowPermission("approve"),
    auditLogger.logWorkflowAction("VIEW_PENDING_APPROVALS"),
  ],

  /**
   * Middleware cho việc quản lý thông báo
   */
  manageNotifications: [
    requireWorkflowPermission("view"),
    auditLogger.logWorkflowAction("MANAGE_NOTIFICATIONS"),
  ],

  /**
   * Middleware cho việc tạo thông báo hệ thống (admin only)
   */
  createSystemNotification: [
    workflowRateLimit,
    requireWorkflowPermission("approve"), // Cần quyền approve để tạo system notification
    auditLogger.logWorkflowAction("CREATE_SYSTEM_NOTIFICATION"),
    // Additional admin check
    (req, res, next) => {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can create system notifications",
        });
      }
      next();
    },
  ],

  /**
   * Middleware cho việc dọn dẹp dữ liệu (admin only)
   */
  adminCleanup: [
    workflowRateLimit,
    auditLogger.logWorkflowAction("ADMIN_CLEANUP"),
    (req, res, next) => {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can perform cleanup operations",
        });
      }
      next();
    },
  ],
};

/**
 * Helper function để apply middleware array
 * @param {Array} middlewares - Array of middleware functions
 * @returns {Function} Combined middleware function
 */
const applyMiddlewares = (middlewares) => {
  return (req, res, next) => {
    const executeMiddleware = (index) => {
      if (index >= middlewares.length) {
        return next();
      }

      const middleware = middlewares[index];

      if (Array.isArray(middleware)) {
        // If middleware is an array, apply each one
        return applyMiddlewares(middleware)(req, res, () =>
          executeMiddleware(index + 1)
        );
      }

      // Execute single middleware
      middleware(req, res, (err) => {
        if (err) {
          return next(err);
        }
        executeMiddleware(index + 1);
      });
    };

    executeMiddleware(0);
  };
};

/**
 * Route-specific middleware configurations
 */
const routeMiddleware = {
  // Yêu cầu nhập kho
  "POST /api/yeu-cau-nhap": workflowMiddleware.createRequest,
  "GET /api/yeu-cau-nhap": workflowMiddleware.viewRequest,
  "GET /api/yeu-cau-nhap/:id": workflowMiddleware.viewRequest,
  "PUT /api/yeu-cau-nhap/:id": workflowMiddleware.updateRequest,
  "DELETE /api/yeu-cau-nhap/:id": workflowMiddleware.deleteRequest,
  "PATCH /api/yeu-cau-nhap/:id/submit": workflowMiddleware.submitRequest,
  "PATCH /api/yeu-cau-nhap/:id/cancel": workflowMiddleware.cancelRequest,

  // Yêu cầu xuất kho
  "POST /api/yeu-cau-xuat": workflowMiddleware.createRequest,
  "GET /api/yeu-cau-xuat": workflowMiddleware.viewRequest,
  "GET /api/yeu-cau-xuat/:id": workflowMiddleware.viewRequest,
  "PUT /api/yeu-cau-xuat/:id": workflowMiddleware.updateRequest,
  "DELETE /api/yeu-cau-xuat/:id": workflowMiddleware.deleteRequest,
  "PATCH /api/yeu-cau-xuat/:id/submit": workflowMiddleware.submitRequest,
  "PATCH /api/yeu-cau-xuat/:id/cancel": workflowMiddleware.cancelRequest,
  "GET /api/yeu-cau-xuat/:id/check-ton-kho": workflowMiddleware.viewRequest,

  // Workflow approvals
  "POST /api/workflow/yeu-cau-nhap/:id/approve":
    workflowMiddleware.approveRequest,
  "POST /api/workflow/yeu-cau-nhap/:id/reject":
    workflowMiddleware.rejectRequest,
  "POST /api/workflow/yeu-cau-nhap/:id/convert-to-phieu":
    workflowMiddleware.convertToPhieu,
  "POST /api/workflow/yeu-cau-xuat/:id/approve":
    workflowMiddleware.approveRequest,
  "POST /api/workflow/yeu-cau-xuat/:id/reject":
    workflowMiddleware.rejectRequest,
  "POST /api/workflow/yeu-cau-xuat/:id/convert-to-phieu":
    workflowMiddleware.convertToPhieu,
  "GET /api/workflow/statistics": workflowMiddleware.viewStatistics,
  "GET /api/workflow/pending-approvals":
    workflowMiddleware.viewPendingApprovals,

  // Notifications
  "GET /api/notifications": workflowMiddleware.manageNotifications,
  "PATCH /api/notifications/:id/read": workflowMiddleware.manageNotifications,
  "PATCH /api/notifications/bulk-read": workflowMiddleware.manageNotifications,
  "PATCH /api/notifications/mark-all-read":
    workflowMiddleware.manageNotifications,
  "GET /api/notifications/unread-count": workflowMiddleware.manageNotifications,
  "GET /api/notifications/statistics": workflowMiddleware.manageNotifications,
  "POST /api/notifications/system": workflowMiddleware.createSystemNotification,
  "DELETE /api/notifications/:id/archive":
    workflowMiddleware.manageNotifications,
  "GET /api/notifications/preferences": workflowMiddleware.manageNotifications,
  "PUT /api/notifications/preferences": workflowMiddleware.manageNotifications,
  "POST /api/notifications/cleanup": workflowMiddleware.adminCleanup,
};

/**
 * Function để lấy middleware cho route cụ thể
 * @param {string} method - HTTP method
 * @param {string} path - Route path
 * @returns {Array} Array of middleware functions
 */
const getRouteMiddleware = (method, path) => {
  // Normalize path by removing query params and trailing slash
  const normalizedPath = path.split("?")[0].replace(/\/$/, "");
  const routeKey = `${method} ${normalizedPath}`;

  // Try exact match first
  if (routeMiddleware[routeKey]) {
    return routeMiddleware[routeKey];
  }

  // Try pattern matching for parameterized routes
  for (const [pattern, middleware] of Object.entries(routeMiddleware)) {
    const [patternMethod, patternPath] = pattern.split(" ");

    if (patternMethod === method) {
      // Convert route pattern to regex
      const regexPattern = patternPath
        .replace(/:\w+/g, "([^/]+)") // Replace :param with capture group
        .replace(/\//g, "\\/"); // Escape forward slashes

      const regex = new RegExp(`^${regexPattern}$`);

      if (regex.test(normalizedPath)) {
        return middleware;
      }
    }
  }

  // Default middleware for workflow routes
  if (
    normalizedPath.startsWith("/api/yeu-cau-") ||
    normalizedPath.startsWith("/api/workflow/") ||
    normalizedPath.startsWith("/api/notifications/")
  ) {
    return [
      requireWorkflowPermission("view"),
      auditLogger.logWorkflowAction("WORKFLOW_ACTION"),
    ];
  }

  return [];
};

/**
 * Express middleware để tự động apply workflow middleware
 */
const autoApplyWorkflowMiddleware = (req, res, next) => {
  const method = req.method;
  const path = req.path;

  // Skip if not a workflow route
  if (
    !path.startsWith("/api/yeu-cau-") &&
    !path.startsWith("/api/workflow/") &&
    !path.startsWith("/api/notifications/")
  ) {
    return next();
  }

  const middlewares = getRouteMiddleware(method, path);

  if (middlewares.length === 0) {
    return next();
  }

  // Apply middlewares
  applyMiddlewares(middlewares)(req, res, next);
};

module.exports = {
  workflowMiddleware,
  routeMiddleware,
  getRouteMiddleware,
  applyMiddlewares,
  autoApplyWorkflowMiddleware,
};
