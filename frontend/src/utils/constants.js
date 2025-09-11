export const LOAI_PHIEU_NHAP = {
  tu_mua: "Tự mua sắm",
  tren_cap: "Cấp trên cấp",
  dieu_chuyen: "Điều chuyển",
};

// Loại xuất - CHỈ 2 LOẠI theo database
export const LOAI_PHIEU_XUAT = {
  don_vi_su_dung: {
    label: "Sử dụng nội bộ",
    description: "Xuất cho đơn vị sử dụng nội bộ",
  },
  don_vi_nhan: {
    label: "Xuất cho đơn vị",
    description: "Xuất cho đơn vị khác (luân chuyển)",
  },
};

// Trạng thái phiếu - CHÍNH XÁC theo database enum trang_thai_phieu
export const TRANG_THAI_PHIEU = {
  draft: {
    label: "Nháp",
    color: "gray",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
    description: "Phiếu đang được soạn thảo (chỉ cấp 3 thấy)",
  },
  confirmed: {
    label: "Đã gửi",
    color: "blue",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    description: "Đã gửi, chờ xử lý (admin/manager thấy)",
  },
  pending_approval: {
    label: "Chờ duyệt",
    color: "yellow",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    description: "Chờ cấp 1/2 duyệt (admin/manager thấy)",
  },
  pending_level3_approval: {
    label: "Chờ cấp 3 duyệt",
    color: "orange",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    description: "Chờ cấp 3 đích duyệt điều chuyển",
  },
  approved: {
    label: "Đã duyệt",
    color: "green",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    description: "Đã được duyệt, chờ hoàn thành",
  },
  completed: {
    label: "Hoàn thành",
    color: "emerald",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-800",
    description: "Đã hoàn thành toàn bộ quy trình",
  },
  cancelled: {
    label: "Đã hủy",
    color: "red",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    description: "Phiếu đã bị hủy",
  },
  revision_required: {
    label: "Cần chỉnh sửa",
    color: "purple",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    description: "Yêu cầu chỉnh sửa từ cấp duyệt (về cho cấp 3 sửa)",
  },
};

// Workflow types - CHÍNH XÁC theo database enum workflow_type
export const WORKFLOW_TYPES = {
  cap3_tu_mua: {
    label: "Cấp 3 tự mua",
    description: "Cấp 3 tự mua → Cấp 2 duyệt → Cấp 1 duyệt cuối",
    flow: ["draft", "confirmed", "pending_approval", "approved", "completed"],
  },
  cap3_tu_cap_tren: {
    label: "Cấp 3 từ cấp trên",
    description: "Cấp 3 từ cấp trên → Cấp 1 duyệt trực tiếp",
    flow: ["draft", "confirmed", "pending_approval", "approved", "completed"],
  },
  cap3_dieu_chuyen: {
    label: "Cấp 3 điều chuyển",
    description: "Cấp 3 điều chuyển → Cấp 2 → Cấp 3B duyệt xuất",
    flow: [
      "draft",
      "confirmed",
      "pending_approval",
      "pending_level3_approval",
      "approved",
      "completed",
    ],
  },
  cap1_tu_duyet: {
    label: "Cấp 1 tự duyệt",
    description: "Cấp 1 tự duyệt ngay",
    flow: ["draft", "approved", "completed"],
  },
};

// Phẩm chất hàng hóa - CHÍNH XÁC theo database enum pham_chat
export const PHAM_CHAT = {
  tot: {
    label: "Tốt",
    color: "green",
    description: "Hàng hóa tốt",
  },
  kem_pham_chat: {
    label: "Kém phẩm chất",
    color: "yellow",
    description: "Hàng hóa kém phẩm chất",
  },
  mat_pham_chat: {
    label: "Mất phẩm chất",
    color: "orange",
    description: "Hàng hóa mất phẩm chất",
  },
  hong: {
    label: "Hỏng",
    color: "red",
    description: "Hàng hóa hỏng",
  },
  can_thanh_ly: {
    label: "Cần thanh lý",
    color: "gray",
    description: "Hàng hóa cần thanh lý",
  },
};

// Role người dùng - CHÍNH XÁC theo database enum user_role
export const USER_ROLES = {
  admin: "Quản trị viên (Cấp 1)",
  manager: "Quản lý (Cấp 2)",
  user: "Người dùng (Cấp 3)",
};

// Cấp bậc phòng ban - CHÍNH XÁC theo database
export const CAP_BAC = {
  1: {
    label: "Cấp 1",
    description: "Ban Tổ chức - Lãnh đạo",
    permissions: ["approve_all", "manage_all", "view_all"],
  },
  2: {
    label: "Cấp 2",
    description: "Phòng ban trung gian",
    permissions: [
      "approve_subordinate",
      "manage_department",
      "view_department",
    ],
  },
  3: {
    label: "Cấp 3",
    description: "Đơn vị trực tiếp - Có kho",
    permissions: ["create_request", "manage_inventory", "view_own"],
  },
};

// Loại thông báo - CHÍNH XÁC theo database enum loai_thong_bao
export const LOAI_THONG_BAO = {
  phieu_nhap_can_duyet: {
    label: "Phiếu nhập cần duyệt",
    color: "blue",
    icon: "📝",
  },
  phieu_nhap_duyet: {
    label: "Phiếu nhập đã duyệt",
    color: "green",
    icon: "✅",
  },
  phieu_nhap_can_sua: {
    label: "Phiếu nhập cần sửa",
    color: "orange",
    icon: "⚠️",
  },
  phieu_xuat_can_duyet: {
    label: "Phiếu xuất cần duyệt",
    color: "blue",
    icon: "📤",
  },
  phieu_xuat_duyet: {
    label: "Phiếu xuất đã duyệt",
    color: "green",
    icon: "✅",
  },
  phieu_xuat_can_sua: {
    label: "Phiếu xuất cần sửa",
    color: "orange",
    icon: "⚠️",
  },
  system: {
    label: "Hệ thống",
    color: "gray",
    icon: "🔧",
  },
};

// Trạng thái thông báo - CHÍNH XÁC theo database enum trang_thai_thong_bao
export const TRANG_THAI_THONG_BAO = {
  unread: "Chưa đọc",
  read: "Đã đọc",
  archived: "Đã lưu trữ",
};

// QUY TRÌNH DUYỆT - CHỈ CẤP 1, 2 ĐƯỢC DUYỆT (theo backend controller)
export const WORKFLOW_RULES = {
  // Quyền tạo phiếu
  CAN_CREATE: {
    admin: true, // Cấp 1 có thể tạo và tự duyệt
    manager: false, // Cấp 2 không tạo, chỉ duyệt
    user: true, // Cấp 3 tạo phiếu
  },

  // Quyền duyệt phiếu
  CAN_APPROVE: {
    admin: true, // Cấp 1 duyệt tất cả
    manager: true, // Cấp 2 duyệt phiếu từ cấp 3 thuộc quyền
    user: false, // Cấp 3 KHÔNG được duyệt (trừ trường hợp đặc biệt điều chuyển)
  },

  // Quyền xem - THEO BACKEND CONTROLLER LOGIC
  CAN_VIEW: {
    admin: "all", // Xem tất cả (trừ draft của cấp 3)
    manager: "department", // Xem phiếu thuộc phòng ban quản lý (trừ draft)
    user: "own", // Chỉ xem phiếu của mình
  },
};

// Tab config - CẬP NHẬT theo logic backend
export const TAB_CONFIG = {
  NHAP_KHO: [
    {
      key: "tat_ca",
      label: "Tất cả",
      count: 0,
      description: "Tất cả phiếu (theo quyền xem)",
      // ❌ Không có filter cụ thể - sẽ hiển thị tất cả
    },
    {
      key: "nhap",
      label: "Nháp",
      count: 0,
      status: ["draft"],
      description: "Phiếu đang soạn thảo (chỉ cấp 3 thấy của mình)",
    },
    {
      key: "can_duyet",
      label: "Chờ duyệt",
      count: 0,
      // ✅ Đối với nhập kho, hiển thị phiếu đã gửi chờ xử lý
      // (controller sử dụng 'confirmed' trước khi duyệt)
      // Điều chuyển: sau cấp 2 duyệt sẽ sang 'pending_level3_approval' để cấp 3 duyệt
      status: ["confirmed", "pending_level3_approval"],
      description: "Tất cả phiếu đang chờ duyệt (mọi cấp)",
      // ✅ KHÔNG có roleFilter - tất cả role đều thấy
    },
    {
      key: "da_duyet",
      label: "Đã duyệt",
      count: 0,
      status: ["approved"],
      description: "Phiếu đã được duyệt",
    },
    {
      key: "hoan_thanh",
      label: "Hoàn thành",
      count: 0,
      status: ["completed"],
      description: "Phiếu đã hoàn thành",
    },
    {
      key: "can_sua",
      label: "Cần sửa",
      count: 0,
      status: ["revision_required"],
      description: "Phiếu cần chỉnh sửa (về cho cấp 3)",
    },
    {
      key: "da_huy",
      label: "Đã hủy",
      count: 0,
      status: ["cancelled"],
      description: "Phiếu đã bị hủy",
    },
  ],

  XUAT_KHO: [
    { key: "tat_ca", label: "Tất cả", count: 0 },
    { key: "nhap", label: "Nháp", count: 0, status: ["draft"] },
    {
      key: "cho_duyet",
      label: "Chờ duyệt",
      count: 0,
      // ✅ Cho luân chuyển: sau bước 1, trạng thái chuyển 'pending_level3_approval'
      // Hiển thị cả 'confirmed' (chờ cấp 1/2) và 'pending_level3_approval' (chờ cấp 3)
      status: ["confirmed", "pending_level3_approval"],
    },
    { key: "da_duyet", label: "Đã duyệt", count: 0, status: ["approved"] },
    { key: "hoan_thanh", label: "Hoàn thành", count: 0, status: ["completed"] },
    {
      key: "can_sua",
      label: "Cần sửa",
      count: 0,
      status: ["revision_required"],
    },
    { key: "da_huy", label: "Đã hủy", count: 0, status: ["cancelled"] },
  ],
};

// Map nhà cung cấp theo loại phiếu
export const NHA_CUNG_CAP_BY_LOAI = {
  tu_mua: "external", // Nhà cung cấp bên ngoài
  tren_cap: "internal", // Phòng ban cấp trên
  dieu_chuyen: "level3", // Phòng ban cấp 3 khác
};

// Map đơn vị nhận theo loại xuất
export const DON_VI_NHAN_BY_LOAI = {
  don_vi_su_dung: null, // Không cần đơn vị nhận
  don_vi_nhan: "level3_or_external", // Phòng ban cấp 3 hoặc bên ngoài
};

// Helper functions
export const getTrangThaiPhieuLabel = (trangThai) => {
  return TRANG_THAI_PHIEU[trangThai]?.label || "Không xác định";
};

export const getTrangThaiPhieuColor = (trangThai) => {
  return TRANG_THAI_PHIEU[trangThai]?.color || "gray";
};

export const getTrangThaiPhieuBgColor = (trangThai) => {
  return TRANG_THAI_PHIEU[trangThai]?.bgColor || "bg-gray-100";
};

export const getTrangThaiPhieuTextColor = (trangThai) => {
  return TRANG_THAI_PHIEU[trangThai]?.textColor || "text-gray-800";
};

// Format helpers
export const formatLoaiPhieuNhap = (loai) => {
  return LOAI_PHIEU_NHAP[loai] || "Không xác định";
};

export const formatLoaiPhieuXuat = (loai) => {
  return LOAI_PHIEU_XUAT[loai] || "Không xác định";
};

export const formatUserRole = (role) => {
  return USER_ROLES[role] || "Không xác định";
};

export const formatWorkflowType = (workflowType) => {
  return WORKFLOW_TYPES[workflowType]?.label || "Không xác định";
};

export const getWorkflowDescription = (workflowType) => {
  return WORKFLOW_TYPES[workflowType]?.description || "Quy trình chuẩn";
};

export const getActionPermissions = (trangThai, userRole, phieu, user) => {
  const isAdmin = userRole === "admin";
  const isManager = userRole === "manager";
  const isOwner = user && phieu && phieu.nguoi_tao === user.id;

  const permissions = {
    canView: true,
    canEdit: false,
    canSubmit: false,
    canApprove: false,
    canRequestRevision: false,
    canCancel: false,
    canUpload: false,
    canComplete: false,
    canPrint: true,
  };

  // Edit permissions - CHỈ CHỦ SỞ HỮU VÀ PHIẾU Ở DRAFT/REVISION_REQUIRED
  if (isOwner && ["draft", "revision_required"].includes(trangThai)) {
    permissions.canEdit = true;
  }

  // Submit permissions - CHỈ CHỦ SỞ HỮU VÀ PHIẾU Ở DRAFT
  if (isOwner && trangThai === "draft") {
    permissions.canSubmit = true;
  }

  // Approve permissions - CHỈ ADMIN VÀ MANAGER VÀ PHIẾU ĐÃ GỬI
  if (
    (isAdmin || isManager) &&
    ["confirmed", "pending_approval", "pending_level3_approval"].includes(
      trangThai
    )
  ) {
    permissions.canApprove = true;
    permissions.canRequestRevision = true;
  }

  // Cancel permissions - CHỦ SỞ HỮU HOẶC ADMIN VÀ PHIẾU CHƯA HOÀN THÀNH
  if (
    (isOwner || isAdmin) &&
    ["draft", "confirmed", "pending_approval", "revision_required"].includes(
      trangThai
    )
  ) {
    permissions.canCancel = true;
  }

  // 🔥 FIX: Upload & Complete - CHỦ SỞ HỮU CŨNG CÓ THỂ UPLOAD VÀ HOÀN THÀNH
  if ((isAdmin || isManager || isOwner) && trangThai === "approved") {
    permissions.canUpload = true;
    permissions.canComplete = true; // Bỏ điều kiện phải có decision_pdf_url
  }

  // Thêm upload cho trạng thái completed (để cập nhật QĐ)
  if ((isAdmin || isManager || isOwner) && trangThai === "completed") {
    permissions.canUpload = true;
  }

  return permissions;
};

// API Endpoints - CHÍNH XÁC theo backend server.js
export const API_ENDPOINTS = {
  NHAP_KHO: "/api/nhap-kho",
  NHAP_KHO_SUBMIT: "/api/nhap-kho/:id/submit",
  NHAP_KHO_MANAGER_APPROVE: "/api/nhap-kho/:id/manager-approve",
  NHAP_KHO_APPROVE: "/api/nhap-kho/:id/approve",
  NHAP_KHO_REQUEST_REVISION: "/api/nhap-kho/:id/request-revision",
  NHAP_KHO_COMPLETE: "/api/nhap-kho/:id/complete",
  NHAP_KHO_UPLOAD: "/api/nhap-kho/:id/upload-decision",
  NHAP_KHO_PHONG_BAN_LIST: "/api/nhap-kho/phong-ban-list",

  XUAT_KHO: "/api/xuat-kho",
  HANG_HOA: "/api/hang-hoa",
  NHA_CUNG_CAP: "/api/nha-cung-cap",
  DON_VI_NHAN: "/api/don-vi-nhan",
  PHONG_BAN: "/api/phong-ban",
  NOTIFICATIONS: "/api/notifications",
  SEARCH_NHA_CUNG_CAP: "/api/search/nha-cung-cap",
  SEARCH_HANG_HOA: "/api/search/hang-hoa",
};

// Đơn vị tính
export const DON_VI_TINH = [
  "Cái",
  "Chiếc",
  "Bộ",
  "Gói",
  "Hộp",
  "Thùng",
  "Bao",
  "Tấn",
  "Kg",
  "Gram",
  "Lít",
  "Mét",
  "Mét vuông",
  "Mét khối",
  "Quyển",
  "Tờ",
  "Cuộn",
  "Thanh",
  "Viên",
  "Ống",
  "Chai",
  "Lon",
];

// Message templates cho notifications
export const NOTIFICATION_MESSAGES = {
  PHIEU_NHAP_CAN_DUYET: {
    title: "Phiếu nhập cần duyệt",
    template: "Phiếu nhập {so_phieu} từ {phong_ban} cần được duyệt",
  },
  PHIEU_NHAP_DUYET: {
    title: "Phiếu nhập đã duyệt",
    template: "Phiếu nhập {so_phieu} đã được duyệt bởi {nguoi_duyet}",
  },
  PHIEU_NHAP_CAN_SUA: {
    title: "Phiếu nhập cần chỉnh sửa",
    template: "Phiếu nhập {so_phieu} cần chỉnh sửa: {ly_do}",
  },
};

// Status progression cho workflow tracking
export const STATUS_PROGRESSION = {
  draft: {
    next: ["confirmed", "cancelled"],
    allowedActions: ["edit", "submit", "cancel"],
  },
  confirmed: {
    next: [
      "pending_approval",
      "pending_level3_approval",
      "revision_required",
      "cancelled",
    ],
    allowedActions: ["approve", "request_revision", "cancel"],
  },
  pending_approval: {
    next: ["approved", "revision_required", "cancelled"],
    allowedActions: ["approve", "request_revision", "cancel"],
  },
  pending_level3_approval: {
    next: ["approved", "revision_required", "cancelled"],
    allowedActions: ["approve", "request_revision", "cancel"],
  },
  approved: {
    next: ["completed"],
    allowedActions: ["upload", "complete"],
  },
  completed: {
    next: [],
    allowedActions: ["view", "print"],
  },
  cancelled: {
    next: [],
    allowedActions: ["view", "print"],
  },
  revision_required: {
    next: ["confirmed", "cancelled"],
    allowedActions: ["edit", "submit", "cancel"],
  },
};

export const LOAI_KIEM_KE = {
  dinh_ky: "Định kỳ",
  dot_xuat: "Đột xuất",
  theo_yeu_cau: "Theo yêu cầu",
  cuoi_nam: "Cuối năm",
  chuyen_giao: "Chuyển giao",
  khac: "Khác",
};
export const TRANG_THAI_KIEM_KE = {
  draft: {
    label: "Nháp",
    color: "gray",
    description: "Phiếu kiểm kê đang được soạn thảo",
  },
  completed: {
    label: "Hoàn thành",
    color: "yellow",
    description: "Đã hoàn thành kiểm kê, chờ duyệt",
  },
  confirmed: {
    label: "Đã duyệt",
    color: "green",
    description: "Đã được duyệt và cập nhật vào hệ thống",
  },
  cancelled: {
    label: "Đã hủy",
    color: "red",
    description: "Phiếu kiểm kê bị hủy",
  },
};

export const XUAT_KHO_WORKFLOW = {
  // Loại xuất và quy trình duyệt
  LOAI_XUAT: {
    don_vi_su_dung: {
      label: "Đơn vị sử dụng",
      description: "Xuất cho đơn vị sử dụng nội bộ",
      duyet_boi: ["cap1", "cap2"], // Cấp 1 hoặc cấp 2 quản lý trực tiếp duyệt
    },
    don_vi_nhan: {
      label: "Đơn vị nhận",
      description: "Xuất cho đơn vị khác (đơn vị 3A)",
      duyet_boi: ["don_vi_nhan"], // Bên nhận (đơn vị 3A) sẽ duyệt
    },
  },

  // Workflow duyệt cho từng loại
  APPROVAL_WORKFLOW: {
    don_vi_su_dung: {
      steps: [
        {
          role: ["admin", "manager"],
          action: "approve",
          description: "Cấp 1 hoặc cấp 2 quản lý trực tiếp duyệt",
        },
      ],
    },
    don_vi_nhan: {
      steps: [
        {
          role: ["don_vi_nhan_user"],
          action: "approve",
          description: "Bên nhận (đơn vị 3A) duyệt",
        },
      ],
    },
  },
};

export const VALIDATION_RULES = {
  COMPLETE_PHIEU_NHAP: {
    required_fields: ["nguoi_giao_hang", "nguoi_nhap_hang"],
    messages: {
      nguoi_giao_hang: "Vui lòng nhập thông tin người giao hàng",
      nguoi_nhap_hang: "Vui lòng nhập thông tin người nhận hàng",
    },
  },

  COMPLETE_PHIEU_XUAT: {
    required_fields: ["nguoi_giao_hang", "nguoi_nhan"],
    messages: {
      nguoi_giao_hang: "Vui lòng nhập thông tin người giao hàng",
      nguoi_nhan: "Vui lòng nhập thông tin người nhận hàng",
    },
  },
};

// =============================================
// THÔNG BÁO WORKFLOW - FIX VẤN ĐỀ 5
// =============================================

export const NOTIFICATION_WORKFLOW = {
  // Khi phiếu tự động thì thông báo cho phiếu liên kết
  AUTO_LINKED_PHIEU: {
    description:
      "Khi có phiếu tự động, thông báo cho phiếu bên kia biết và tự động accept",
    rules: [
      "Phiếu nhập điều chuyển được duyệt → tự động tạo phiếu xuất → thông báo cho phòng ban cung cấp",
      "Phiếu xuất đơn vị nhận được duyệt → tự động tạo phiếu nhập → thông báo cho đơn vị nhận",
      "Khi chỉnh sửa phiếu gốc → thông báo và cập nhật phiếu tự động liên kết",
    ],
  },

  // Quy trình thông báo chính xác
  NOTIFICATION_FLOW: {
    phieu_nhap: {
      confirmed: ["manager", "admin"], // Gửi thông báo cho manager và admin
      approved: ["nguoi_tao"], // Thông báo cho người tạo
      revision_required: ["nguoi_tao"], // Thông báo cho người tạo
      completed: ["nguoi_tao"], // Thông báo hoàn thành
    },
    phieu_xuat: {
      confirmed: ["manager", "admin"], // Tùy theo loại xuất
      approved: ["nguoi_tao"],
      revision_required: ["nguoi_tao"],
      completed: ["nguoi_tao"],
    },
  },
};

// Default export
export default {
  LOAI_PHIEU_NHAP,
  LOAI_PHIEU_XUAT,
  TRANG_THAI_PHIEU,
  WORKFLOW_TYPES,
  PHAM_CHAT,
  USER_ROLES,
  CAP_BAC,
  LOAI_THONG_BAO,
  TRANG_THAI_THONG_BAO,
  WORKFLOW_RULES,
  getActionPermissions,
  TAB_CONFIG,
  NHA_CUNG_CAP_BY_LOAI,
  DON_VI_NHAN_BY_LOAI,
  getTrangThaiPhieuLabel,
  getTrangThaiPhieuColor,
  getTrangThaiPhieuBgColor,
  getTrangThaiPhieuTextColor,
  VALIDATION_RULES,
  formatLoaiPhieuNhap,
  formatLoaiPhieuXuat,
  formatUserRole,
  formatWorkflowType,
  getWorkflowDescription,
  API_ENDPOINTS,
  DON_VI_TINH,
  LOAI_KIEM_KE,
  TRANG_THAI_KIEM_KE,
  XUAT_KHO_WORKFLOW,
  NOTIFICATION_WORKFLOW,
};
