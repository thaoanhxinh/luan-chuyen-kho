// // middleware/workflowMiddleware.js
// const {
//   requireWorkflowPermission,
//   workflowRateLimit,
//   validateWorkflowState,
// } = require("../utils/auth");
// const { auditLogger } = require("./auditLogger");

// /**
//  * Tập hợp middleware cho các workflow actions
//  * Kết hợp authentication, authorization, rate limiting và audit logging
//  */
// const workflowMiddleware = {
//   /**
//    * Middleware cho việc tạo yêu cầu mới
//    */
//   createRequest: [
//     workflowRateLimit,
//     requireWorkflowPermission("create"),
//     auditLogger.logWorkflowAction("CREATE_REQUEST"),
//   ],

//   /**
//    * Middleware cho việc xem yêu cầu
//    */
//   viewRequest: [
//     requireWorkflowPermission("view", "id"),
//     auditLogger.logWorkflowAction("VIEW_REQUEST"),
//   ],

//   /**
//    * Middleware cho việc cập nhật yêu cầu
//    */
//   updateRequest: [
//     workflowRateLimit,
//     requireWorkflowPermission("create", "id"), // Chỉ người tạo hoặc admin mới được update
//     validateWorkflowState(["draft", "confirmed"]), // Chỉ update được khi còn draft hoặc confirmed
//     auditLogger.logWorkflowAction("UPDATE_REQUEST"),
//   ],

//   /**
//    * Middleware cho việc gửi yêu cầu (submit)
//    */
//   submitRequest: [
//     workflowRateLimit,
//     requireWorkflowPermission("create", "id"),
//     validateWorkflowState(["draft"], "confirmed"), // Chỉ submit từ draft
//     auditLogger.logWorkflowAction("SUBMIT_REQUEST"),
//   ],

//   /**
//    * Middleware cho việc hủy yêu cầu
//    */
//   cancelRequest: [
//     workflowRateLimit,
//     requireWorkflowPermission("create", "id"),
//     validateWorkflowState(["draft", "confirmed", "under_review"]), // Không hủy được khi đã approved
//     auditLogger.logWorkflowAction("CANCEL_REQUEST"),
//   ],

//   /**
//    * Middleware cho việc xóa yêu cầu
//    */
//   deleteRequest: [
//     workflowRateLimit,
//     requireWorkflowPermission("create", "id"),
//     validateWorkflowState(["draft"]), // Chỉ xóa được khi còn draft
//     auditLogger.logWorkflowAction("DELETE_REQUEST"),
//   ],

//   /**
//    * Middleware cho việc phê duyệt yêu cầu
//    */
//   approveRequest: [
//     workflowRateLimit,
//     requireWorkflowPermission("approve", "id"),
//     validateWorkflowState(["confirmed", "under_review"], "approved"),
//     auditLogger.logWorkflowAction("APPROVE_REQUEST"),
//   ],

//   /**
//    * Middleware cho việc từ chối yêu cầu
//    */
//   rejectRequest: [
//     workflowRateLimit,
//     requireWorkflowPermission("approve", "id"),
//     validateWorkflowState(["confirmed", "under_review"], "rejected"),
//     auditLogger.logWorkflowAction("REJECT_REQUEST"),
//   ],

//   /**
//    * Middleware cho việc chuyển đổi yêu cầu thành phiếu
//    */
//   convertToPhieu: [
//     workflowRateLimit,
//     requireWorkflowPermission("approve", "id"),
//     validateWorkflowState(["approved"], "completed"),
//     auditLogger.logWorkflowAction("CONVERT_TO_PHIEU"),
//   ],

//   /**
//    * Middleware cho việc xem thống kê workflow
//    */
//   viewStatistics: [
//     requireWorkflowPermission("view"),
//     auditLogger.logWorkflowAction("VIEW_STATISTICS"),
//   ],

//   /**
//    * Middleware cho việc xem danh sách chờ phê duyệt
//    */
//   viewPendingApprovals: [
//     requireWorkflowPermission("approve"),
//     auditLogger.logWorkflowAction("VIEW_PENDING_APPROVALS"),
//   ],

//   /**
//    * Middleware cho việc quản lý thông báo
//    */
//   manageNotifications: [
//     requireWorkflowPermission("view"),
//     auditLogger.logWorkflowAction("MANAGE_NOTIFICATIONS"),
//   ],

//   /**
//    * Middleware cho việc tạo thông báo hệ thống (admin only)
//    */
//   createSystemNotification: [
//     workflowRateLimit,
//     requireWorkflowPermission("approve"), // Cần quyền approve để tạo system notification
//     auditLogger.logWorkflowAction("CREATE_SYSTEM_NOTIFICATION"),
//     // Additional admin check
//     (req, res, next) => {
//       if (req.user.role !== "admin") {
//         return res.status(403).json({
//           success: false,
//           message: "Only administrators can create system notifications",
//         });
//       }
//       next();
//     },
//   ],

//   /**
//    * Middleware cho việc dọn dẹp dữ liệu (admin only)
//    */
//   adminCleanup: [
//     workflowRateLimit,
//     auditLogger.logWorkflowAction("ADMIN_CLEANUP"),
//     (req, res, next) => {
//       if (req.user.role !== "admin") {
//         return res.status(403).json({
//           success: false,
//           message: "Only administrators can perform cleanup operations",
//         });
//       }
//       next();
//     },
//   ],
// };

// /**
//  * Helper function để apply middleware array
//  * @param {Array} middlewares - Array of middleware functions
//  * @returns {Function} Combined middleware function
//  */
// const applyMiddlewares = (middlewares) => {
//   return (req, res, next) => {
//     const executeMiddleware = (index) => {
//       if (index >= middlewares.length) {
//         return next();
//       }

//       const middleware = middlewares[index];

//       if (Array.isArray(middleware)) {
//         // If middleware is an array, apply each one
//         return applyMiddlewares(middleware)(req, res, () =>
//           executeMiddleware(index + 1)
//         );
//       }

//       // Execute single middleware
//       middleware(req, res, (err) => {
//         if (err) {
//           return next(err);
//         }
//         executeMiddleware(index + 1);
//       });
//     };

//     executeMiddleware(0);
//   };
// };

// /**
//  * Route-specific middleware configurations
//  */
// const routeMiddleware = {
//   // Yêu cầu nhập kho
//   "POST /api/yeu-cau-nhap": workflowMiddleware.createRequest,
//   "GET /api/yeu-cau-nhap": workflowMiddleware.viewRequest,
//   "GET /api/yeu-cau-nhap/:id": workflowMiddleware.viewRequest,
//   "PUT /api/yeu-cau-nhap/:id": workflowMiddleware.updateRequest,
//   "DELETE /api/yeu-cau-nhap/:id": workflowMiddleware.deleteRequest,
//   "PATCH /api/yeu-cau-nhap/:id/submit": workflowMiddleware.submitRequest,
//   "PATCH /api/yeu-cau-nhap/:id/cancel": workflowMiddleware.cancelRequest,

//   // Yêu cầu xuất kho
//   "POST /api/yeu-cau-xuat": workflowMiddleware.createRequest,
//   "GET /api/yeu-cau-xuat": workflowMiddleware.viewRequest,
//   "GET /api/yeu-cau-xuat/:id": workflowMiddleware.viewRequest,
//   "PUT /api/yeu-cau-xuat/:id": workflowMiddleware.updateRequest,
//   "DELETE /api/yeu-cau-xuat/:id": workflowMiddleware.deleteRequest,
//   "PATCH /api/yeu-cau-xuat/:id/submit": workflowMiddleware.submitRequest,
//   "PATCH /api/yeu-cau-xuat/:id/cancel": workflowMiddleware.cancelRequest,
//   "GET /api/yeu-cau-xuat/:id/check-ton-kho": workflowMiddleware.viewRequest,

//   // Workflow approvals
//   "POST /api/workflow/yeu-cau-nhap/:id/approve":
//     workflowMiddleware.approveRequest,
//   "POST /api/workflow/yeu-cau-nhap/:id/reject":
//     workflowMiddleware.rejectRequest,
//   "POST /api/workflow/yeu-cau-nhap/:id/convert-to-phieu":
//     workflowMiddleware.convertToPhieu,
//   "POST /api/workflow/yeu-cau-xuat/:id/approve":
//     workflowMiddleware.approveRequest,
//   "POST /api/workflow/yeu-cau-xuat/:id/reject":
//     workflowMiddleware.rejectRequest,
//   "POST /api/workflow/yeu-cau-xuat/:id/convert-to-phieu":
//     workflowMiddleware.convertToPhieu,
//   "GET /api/workflow/statistics": workflowMiddleware.viewStatistics,
//   "GET /api/workflow/pending-approvals":
//     workflowMiddleware.viewPendingApprovals,

//   // Notifications
//   "GET /api/notifications": workflowMiddleware.manageNotifications,
//   "PATCH /api/notifications/:id/read": workflowMiddleware.manageNotifications,
//   "PATCH /api/notifications/bulk-read": workflowMiddleware.manageNotifications,
//   "PATCH /api/notifications/mark-all-read":
//     workflowMiddleware.manageNotifications,
//   "GET /api/notifications/unread-count": workflowMiddleware.manageNotifications,
//   "GET /api/notifications/statistics": workflowMiddleware.manageNotifications,
//   "POST /api/notifications/system": workflowMiddleware.createSystemNotification,
//   "DELETE /api/notifications/:id/archive":
//     workflowMiddleware.manageNotifications,
//   "GET /api/notifications/preferences": workflowMiddleware.manageNotifications,
//   "PUT /api/notifications/preferences": workflowMiddleware.manageNotifications,
//   "POST /api/notifications/cleanup": workflowMiddleware.adminCleanup,
// };

// /**
//  * Function để lấy middleware cho route cụ thể
//  * @param {string} method - HTTP method
//  * @param {string} path - Route path
//  * @returns {Array} Array of middleware functions
//  */
// const getRouteMiddleware = (method, path) => {
//   // Normalize path by removing query params and trailing slash
//   const normalizedPath = path.split("?")[0].replace(/\/$/, "");
//   const routeKey = `${method} ${normalizedPath}`;

//   // Try exact match first
//   if (routeMiddleware[routeKey]) {
//     return routeMiddleware[routeKey];
//   }

//   // Try pattern matching for parameterized routes
//   for (const [pattern, middleware] of Object.entries(routeMiddleware)) {
//     const [patternMethod, patternPath] = pattern.split(" ");

//     if (patternMethod === method) {
//       // Convert route pattern to regex
//       const regexPattern = patternPath
//         .replace(/:\w+/g, "([^/]+)") // Replace :param with capture group
//         .replace(/\//g, "\\/"); // Escape forward slashes

//       const regex = new RegExp(`^${regexPattern}$`);

//       if (regex.test(normalizedPath)) {
//         return middleware;
//       }
//     }
//   }

//   // Default middleware for workflow routes
//   if (
//     normalizedPath.startsWith("/api/yeu-cau-") ||
//     normalizedPath.startsWith("/api/workflow/") ||
//     normalizedPath.startsWith("/api/notifications/")
//   ) {
//     return [
//       (req, res, next) => {
//         // Simple middleware that checks if user exists and passes through
//         if (!req.user) {
//           return res.status(401).json({
//             success: false,
//             message: "Authentication required",
//           });
//         }
//         next();
//       },
//       auditLogger.logWorkflowAction("WORKFLOW_ACTION"),
//     ];
//   }

//   return [];
// };

// /**
//  * Express middleware để tự động apply workflow middleware
//  */
// const autoApplyWorkflowMiddleware = (req, res, next) => {
//   const method = req.method;
//   const path = req.path;

//   // Skip if not a workflow route
//   if (
//     !path.startsWith("/api/yeu-cau-") &&
//     !path.startsWith("/api/workflow/") &&
//     !path.startsWith("/api/notifications/")
//   ) {
//     return next();
//   }

//   const middlewares = getRouteMiddleware(method, path);

//   if (middlewares.length === 0) {
//     return next();
//   }

//   // Apply middlewares
//   applyMiddlewares(middlewares)(req, res, next);
// };

// module.exports = {
//   workflowMiddleware,
//   routeMiddleware,
//   getRouteMiddleware,
//   applyMiddlewares,
//   autoApplyWorkflowMiddleware,
// };

// middleware/workflowMiddleware.js
const {
  requireWorkflowPermission,
  workflowRateLimit,
  validateWorkflowState,
} = require("../utils/auth");
const { auditLogger } = require("./auditLogger");

/**
 * Táº­p há»£p middleware cho cÃ¡c workflow actions
 * Káº¿t há»£p authentication, authorization, rate limiting vÃ  audit logging
 */
const workflowMiddleware = {
  /**
   * Middleware cho viá»‡c táº¡o yÃªu cáº§u má»›i
   */
  createRequest: [
    workflowRateLimit,
    requireWorkflowPermission("create"),
    auditLogger.logWorkflowAction("CREATE_REQUEST"),
  ],

  /**
   * Middleware cho viá»‡c xem yÃªu cáº§u
   */
  viewRequest: [
    requireWorkflowPermission("view", "id"),
    auditLogger.logWorkflowAction("VIEW_REQUEST"),
  ],

  /**
   * Middleware cho viá»‡c cáº­p nháº­t yÃªu cáº§u
   */
  updateRequest: [
    workflowRateLimit,
    requireWorkflowPermission("create", "id"), // Chá»‰ ngÆ°á»i táº¡o hoáº·c admin má»›i Ä‘Æ°á»£c update
    validateWorkflowState(["draft", "confirmed"]), // Chá»‰ update Ä‘Æ°á»£c khi cÃ²n draft hoáº·c confirmed
    auditLogger.logWorkflowAction("UPDATE_REQUEST"),
  ],

  /**
   * Middleware cho viá»‡c gá»­i yÃªu cáº§u (submit)
   */
  submitRequest: [
    workflowRateLimit,
    requireWorkflowPermission("create", "id"),
    validateWorkflowState(["draft"], "confirmed"), // Chá»‰ submit tá»« draft
    auditLogger.logWorkflowAction("SUBMIT_REQUEST"),
  ],

  /**
   * Middleware cho viá»‡c há»§y yÃªu cáº§u
   */
  cancelRequest: [
    workflowRateLimit,
    requireWorkflowPermission("create", "id"),
    validateWorkflowState(["draft", "confirmed", "under_review"]), // KhÃ´ng há»§y Ä‘Æ°á»£c khi Ä‘Ã£ approved
    auditLogger.logWorkflowAction("CANCEL_REQUEST"),
  ],

  /**
   * Middleware cho viá»‡c xÃ³a yÃªu cáº§u
   */
  deleteRequest: [
    workflowRateLimit,
    requireWorkflowPermission("create", "id"),
    validateWorkflowState(["draft"]), // Chá»‰ xÃ³a Ä‘Æ°á»£c khi cÃ²n draft
    auditLogger.logWorkflowAction("DELETE_REQUEST"),
  ],

  /**
   * Middleware cho viá»‡c phÃª duyá»‡t yÃªu cáº§u
   */
  approveRequest: [
    workflowRateLimit,
    requireWorkflowPermission("approve", "id"),
    validateWorkflowState(["confirmed", "under_review"], "approved"),
    auditLogger.logWorkflowAction("APPROVE_REQUEST"),
  ],

  /**
   * Middleware cho viá»‡c tá»« chá»‘i yÃªu cáº§u
   */
  rejectRequest: [
    workflowRateLimit,
    requireWorkflowPermission("approve", "id"),
    validateWorkflowState(["confirmed", "under_review"], "rejected"),
    auditLogger.logWorkflowAction("REJECT_REQUEST"),
  ],

  /**
   * Middleware cho viá»‡c chuyá»ƒn Ä‘á»•i yÃªu cáº§u thÃ nh phiáº¿u
   */
  convertToPhieu: [
    workflowRateLimit,
    requireWorkflowPermission("approve", "id"),
    validateWorkflowState(["approved"], "completed"),
    auditLogger.logWorkflowAction("CONVERT_TO_PHIEU"),
  ],

  /**
   * Middleware cho viá»‡c xem thá»‘ng kÃª workflow
   */
  viewStatistics: [
    requireWorkflowPermission("view"),
    auditLogger.logWorkflowAction("VIEW_STATISTICS"),
  ],

  /**
   * Middleware cho viá»‡c xem danh sÃ¡ch chá» phÃª duyá»‡t
   */
  viewPendingApprovals: [
    requireWorkflowPermission("approve"),
    auditLogger.logWorkflowAction("VIEW_PENDING_APPROVALS"),
  ],

  /**
   * Middleware cho viá»‡c quáº£n lÃ½ thÃ´ng bÃ¡o
   */
  manageNotifications: [
    requireWorkflowPermission("view"),
    auditLogger.logWorkflowAction("MANAGE_NOTIFICATIONS"),
  ],

  /**
   * Middleware cho viá»‡c táº¡o thÃ´ng bÃ¡o há»‡ thá»‘ng (admin only)
   */
  createSystemNotification: [
    workflowRateLimit,
    requireWorkflowPermission("approve"), // Cáº§n quyá»n approve Ä‘á»ƒ táº¡o system notification
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
   * Middleware cho viá»‡c dá»n dáº¹p dá»¯ liá»‡u (admin only)
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
 * Helper function Ä‘á»ƒ apply middleware array
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
  // YÃªu cáº§u nháº­p kho
  "POST /api/yeu-cau-nhap": workflowMiddleware.createRequest,
  "GET /api/yeu-cau-nhap": workflowMiddleware.viewRequest,
  "GET /api/yeu-cau-nhap/:id": workflowMiddleware.viewRequest,
  "PUT /api/yeu-cau-nhap/:id": workflowMiddleware.updateRequest,
  "DELETE /api/yeu-cau-nhap/:id": workflowMiddleware.deleteRequest,
  "PATCH /api/yeu-cau-nhap/:id/submit": workflowMiddleware.submitRequest,
  "PATCH /api/yeu-cau-nhap/:id/cancel": workflowMiddleware.cancelRequest,

  // YÃªu cáº§u xuáº¥t kho
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
 * Function Ä‘á»ƒ láº¥y middleware cho route cá»¥ thá»ƒ
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
 * Express middleware Ä‘á»ƒ tá»± Ä‘á»™ng apply workflow middleware
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
