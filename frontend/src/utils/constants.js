export const TRANG_THAI_PHIEU = {
  draft: {
    label: "Nháp",
    color: "gray",
    description: "Phiếu đang được soạn thảo",
  },
  confirmed: {
    label: "Chờ duyệt",
    color: "blue",
    description: "Phiếu đã gửi lên chờ cấp trên duyệt",
  },
  approved: {
    label: "Đã duyệt",
    color: "green",
    description: "Phiếu đã được cấp trên phê duyệt, có thể thực hiện nhập/xuất",
  },
  revision_required: {
    label: "Cần sửa",
    color: "orange",
    description: "Phiếu bị yêu cầu chỉnh sửa bởi cấp trên",
  },
  ready_to_execute: {
    label: "Sẵn sàng thực hiện",
    color: "green",
    description: "Phiếu đã có quyết định, sẵn sàng thực hiện nhập/xuất",
  },
  in_progress: {
    label: "Đang thực hiện",
    color: "blue",
    description: "Đang tiến hành nhập/xuất thực tế",
  },
  completed: {
    label: "Hoàn thành",
    color: "green",
    description: "Đã hoàn thành nhập/xuất, tồn kho đã được cập nhật",
  },
  cancelled: {
    label: "Đã hủy",
    color: "red",
    description: "Phiếu đã bị hủy bỏ",
  },
};

// Updated LOAI_PHIEU_NHAP - Chỉ 3 loại theo yêu cầu
export const LOAI_PHIEU_NHAP = {
  tren_cap: "Từ cấp trên",
  tu_mua: "Tự mua sắm",
  khac: "Khác",
};

// Updated LOAI_PHIEU_XUAT - Chỉ 3 loại theo yêu cầu
export const LOAI_PHIEU_XUAT = {
  su_dung: "Xuất sử dụng",
  don_vi_nhan: "Xuất cho đơn vị",
  khac: "Khác",
};

// Enhanced getActionPermissions function với logic số lượng duyệt vs thực tế
// export const getActionPermissions = (trangThai, userRole) => {
//   const isAdmin = userRole === "admin";
//   const isUser = userRole === "user";

//   const permissions = {
//     canView: true, // Tất cả đều có thể xem
//     canEdit: false,
//     canEditActualQuantity: false, // Cho phép sửa số lượng thực tế
//     canSubmit: false,
//     canApprove: false,
//     canRequestRevision: false,
//     canUploadDecision: false,
//     canComplete: false,
//     canCancel: false,
//     canPrint: true, // Tất cả đều có thể in
//   };

//   switch (trangThai) {
//     case "draft":
//       // Nháp - chỉ người tạo (user) có thể sửa, gửi duyệt, hủy
//       permissions.canEdit = isUser;
//       permissions.canSubmit = isUser;
//       permissions.canCancel = isUser;
//       break;

//     case "confirmed":
//       // Chờ duyệt - chỉ admin có thể duyệt hoặc yêu cầu sửa
//       permissions.canApprove = isAdmin;
//       permissions.canRequestRevision = isAdmin;
//       permissions.canCancel = isAdmin;
//       break;

//     case "revision_required":
//       // Cần sửa - người tạo có thể sửa và gửi lại
//       permissions.canEdit = isUser;
//       permissions.canSubmit = isUser;
//       permissions.canCancel = isUser;
//       break;

//     case "approved":
//       // Đã duyệt - admin có thể upload quyết định, user có thể sửa số lượng thực tế
//       permissions.canUploadDecision = isAdmin;
//       permissions.canEditActualQuantity = true; // Cho phép sửa số lượng thực tế
//       permissions.canComplete = true; // Có thể hoàn thành luôn sau khi duyệt
//       permissions.canCancel = isAdmin;
//       break;

//     case "ready_to_execute":
//       // Sẵn sàng thực hiện - có thể sửa số lượng thực tế và hoàn thành
//       permissions.canEditActualQuantity = true; // Vẫn cho phép sửa số lượng thực tế
//       permissions.canComplete = true;
//       permissions.canCancel = isAdmin;
//       break;

//     case "in_progress":
//       // Đang thực hiện - có thể sửa số lượng thực tế và hoàn thành
//       permissions.canEditActualQuantity = true;
//       permissions.canComplete = true;
//       break;

//     case "completed":
//       // Hoàn thành - chỉ xem và in
//       break;

//     case "cancelled":
//       // Đã hủy - chỉ xem
//       break;

//     default:
//       break;
//   }

//   return permissions;
// };

export const getActionPermissions = (
  trangThai,
  userRole,
  loaiPhieu = "nhap"
) => {
  const isAdmin = userRole === "admin";
  const isUser = userRole !== "admin";

  const permissions = {
    canView: true,
    canEdit: false,
    canEditPlan: false,
    canEditActual: false,
    canSubmit: false,
    canApprove: false,
    canRequestRevision: false,
    canUploadDecision: false,
    canComplete: false,
    canCancel: false,
    canPrint: true,
  };

  switch (trangThai) {
    case "draft":
      if (loaiPhieu === "xuat") {
        // PHIẾU XUẤT: Admin tạo và gửi
        permissions.canEdit = isAdmin;
        permissions.canEditPlan = isAdmin;
        permissions.canSubmit = isAdmin;
        permissions.canCancel = isAdmin;
      } else {
        // PHIẾU NHẬP: User tạo và gửi
        permissions.canEdit = isUser;
        permissions.canEditPlan = isUser;
        permissions.canSubmit = isUser;
        permissions.canCancel = isUser;
      }
      break;

    case "confirmed":
      permissions.canApprove = isAdmin;
      permissions.canRequestRevision = isAdmin;
      permissions.canCancel = isAdmin;
      break;

    case "revision_required":
      if (loaiPhieu === "xuat") {
        permissions.canEdit = isAdmin;
        permissions.canEditPlan = isAdmin;
        permissions.canSubmit = isAdmin;
        permissions.canCancel = isAdmin;
      } else {
        permissions.canEdit = isUser;
        permissions.canEditPlan = isUser;
        permissions.canSubmit = isUser;
        permissions.canCancel = isUser;
      }
      break;

    case "approved":
      permissions.canUploadDecision = isAdmin;
      permissions.canEditActual = true;
      permissions.canComplete = true;
      permissions.canCancel = isAdmin;
      break;

    case "completed":
      break;

    case "cancelled":
      break;
  }

  return permissions;
};

// Tab configurations for different pages
export const TAB_CONFIGS = {
  nhap_kho: {
    "tat-ca": {
      label: "Tất cả",
      filter: {},
      color: "text-gray-600 border-gray-300",
      activeColor: "text-blue-600 border-blue-500 bg-blue-50",
    },
    "can-duyet": {
      label: "Cần duyệt",
      filter: { trang_thai: "confirmed" },
      adminOnly: true,
      color: "text-blue-600 border-blue-300",
      activeColor: "text-blue-600 border-blue-500 bg-blue-50",
    },
    "da-duyet": {
      label: "Đã duyệt",
      filter: { trang_thai: "approved" },
      color: "text-green-600 border-green-300",
      activeColor: "text-green-600 border-green-500 bg-green-50",
    },
    "can-sua": {
      label: "Cần sửa",
      filter: { trang_thai: "revision_required" },
      color: "text-orange-600 border-orange-300",
      activeColor: "text-orange-600 border-orange-500 bg-orange-50",
    },
    "hoan-thanh": {
      label: "Hoàn thành",
      filter: { trang_thai: "completed" },
      color: "text-green-600 border-green-300",
      activeColor: "text-green-600 border-green-500 bg-green-50",
    },
    "da-huy": {
      label: "Đã hủy",
      filter: { trang_thai: "cancelled" },
      color: "text-red-600 border-red-300",
      activeColor: "text-red-600 border-red-500 bg-red-50",
    },
  },
  xuat_kho: {
    "tat-ca": {
      label: "Tất cả",
      filter: {},
      color: "text-gray-600 border-gray-300",
      activeColor: "text-red-600 border-red-500 bg-red-50",
    },
    "can-duyet": {
      label: "Cần duyệt",
      filter: { trang_thai: "confirmed" },
      adminOnly: true,
      color: "text-blue-600 border-blue-300",
      activeColor: "text-blue-600 border-blue-500 bg-blue-50",
    },
    "da-duyet": {
      label: "Đã duyệt",
      filter: { trang_thai: "approved" },
      color: "text-green-600 border-green-300",
      activeColor: "text-green-600 border-green-500 bg-green-50",
    },
    "can-sua": {
      label: "Cần sửa",
      filter: { trang_thai: "revision_required" },
      color: "text-orange-600 border-orange-300",
      activeColor: "text-orange-600 border-orange-500 bg-orange-50",
    },
    "hoan-thanh": {
      label: "Hoàn thành",
      filter: { trang_thai: "completed" },
      color: "text-green-600 border-green-300",
      activeColor: "text-green-600 border-green-500 bg-green-50",
    },
    "da-huy": {
      label: "Đã hủy",
      filter: { trang_thai: "cancelled" },
      color: "text-red-600 border-red-300",
      activeColor: "text-red-600 border-red-500 bg-red-50",
    },
  },
};

// Supplier/Receiver type mapping for workflow validation
export const NHA_CUNG_CAP_TYPE = {
  tren_cap: "internal", // Từ cấp trên - phải là phòng ban cấp trên
  tu_mua: "external", // Tự mua - nhà cung cấp ngoài
  dieu_chuyen: "internal", // Điều chuyển - nội bộ
  tra_lai: "external", // Trả lại - bên ngoài
  khac: "both",
};

export const DON_VI_NHAN_TYPE = {
  don_vi_nhan: "internal", // Cấp phát cho đơn vị - nội bộ
  su_dung: "internal", // Xuất sử dụng - nội bộ
  thanh_ly: "external", // Thanh lý - bên ngoài
  chuyen_kho: "internal", // Chuyển kho - nội bộ
  tra_lai: "external", // Trả lại - bên ngoài
  khac: "both",
};

// Workflow validation rules - Updated theo yêu cầu mới
export const PHIEU_VALIDATION_RULES = {
  nhap_kho: {
    tren_cap: {
      requireSupplier: true,
      allowNewItems: false, // Không được tạo hàng hóa mới
      requireDecision: true,
      supplierType: "internal",
      description: "Nhập từ cấp trên - phải chọn phòng ban cấp trên",
    },
    tu_mua: {
      requireSupplier: true,
      allowNewItems: true, // Được tạo hàng hóa mới khi tự mua
      requireDecision: false,
      supplierType: "external",
      description: "Tự mua sắm - chọn nhà cung cấp bên ngoài",
    },
    khac: {
      requireSupplier: false,
      allowNewItems: true,
      requireDecision: false,
      supplierType: "both",
      description: "Loại khác - tùy chọn",
    },
  },
  xuat_kho: {
    su_dung: {
      requireReceiver: false,
      checkInventory: true,
      requireDecision: false,
      receiverType: "internal",
      description: "Xuất sử dụng - sử dụng nội bộ",
    },
    don_vi_nhan: {
      requireReceiver: true,
      checkInventory: true,
      requireDecision: true,
      receiverType: "internal",
      description: "Xuất cho đơn vị - phải chọn đơn vị nhận",
    },
    khac: {
      requireReceiver: false,
      checkInventory: true,
      requireDecision: false,
      receiverType: "both",
      description: "Loại khác - tùy chọn",
    },
  },
};

// Notification types cho hệ thống
export const NOTIFICATION_TYPES = {
  phieu_can_duyet: {
    label: "Cần duyệt",
    icon: "info",
    color: "blue",
    priority: "high",
  },
  phieu_duyet: {
    label: "Đã duyệt",
    icon: "check-circle",
    color: "green",
    priority: "normal",
  },
  phieu_can_sua: {
    label: "Cần sửa",
    icon: "alert-triangle",
    color: "orange",
    priority: "high",
  },
  phieu_hoan_thanh: {
    label: "Hoàn thành",
    icon: "check",
    color: "green",
    priority: "normal",
  },
  phieu_huy: {
    label: "Đã hủy",
    icon: "x",
    color: "red",
    priority: "normal",
  },
  quyet_dinh_upload: {
    label: "Quyết định",
    icon: "upload",
    color: "purple",
    priority: "normal",
  },
  canh_bao_ton_kho: {
    label: "Cảnh báo tồn kho",
    icon: "alert-triangle",
    color: "yellow",
    priority: "medium",
  },
  sap_den_han: {
    label: "Sắp hết hạn",
    icon: "clock",
    color: "red",
    priority: "urgent",
  },
  system: {
    label: "Hệ thống",
    icon: "info",
    color: "gray",
    priority: "low",
  },
};

// Rest of the constants remain the same...
export const TRANG_THAI_KIEM_KE = {
  draft: {
    label: "Nháp",
    color: "gray",
    description: "Phiếu kiểm kê đang được soạn thảo",
  },
  in_progress: {
    label: "Đang kiểm kê",
    color: "blue",
    description: "Đang thực hiện kiểm kê",
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

export const LOAI_KIEM_KE = {
  dinh_ky: "Định kỳ",
  dot_xuat: "Đột xuất",
  dac_biet: "Đặc biệt",
  chuyen_giao: "Chuyển giao",
  thanh_ly: "Thanh lý",
  theo_yeu_cau: "Theo yêu cầu",
  cuoi_nam: "Cuối năm",
};

export const PHAM_CHAT = {
  tot: {
    label: "Tốt 100%",
    color: "green",
    description: "Hàng hóa còn tốt, sử dụng bình thường",
  },
  kem_pham_chat: {
    label: "Kém phẩm chất",
    color: "orange",
    description: "Hàng hóa bị giảm chất lượng nhưng vẫn sử dụng được",
  },
  mat_pham_chat: {
    label: "Mất phẩm chất",
    color: "red",
    description: "Hàng hóa không còn sử dụng được",
  },
  hong: {
    label: "Hỏng",
    color: "red",
    description: "Hàng hóa bị hỏng hóc",
  },
  can_thanh_ly: {
    label: "Cần thanh lý",
    color: "yellow",
    description: "Hàng hóa cần được thanh lý",
  },
};

export const LY_DO_CHENH_LECH = {
  bao_cao_sai: "Báo cáo sai số liệu",
  mat_cap: "Mất cắp",
  hu_hong: "Hư hỏng trong quá trình sử dụng",
  bay_hoi: "Bay hơi, thất thoát tự nhiên",
  xuat_chua_ghi_so: "Xuất chưa ghi sổ",
  nhap_chua_ghi_so: "Nhập chưa ghi sổ",
  chuyen_kho: "Chuyển kho chưa ghi nhận",
  kiem_ke_sai: "Kiểm kê sai sót",
  bao_quan_kem: "Bảo quản kém",
  qua_han_su_dung: "Quá hạn sử dụng",
  dieu_kien_moi_truong: "Điều kiện môi trường",
  van_chuyen_hu_hong: "Vận chuyển hư hỏng",
  khac: "Lý do khác",
};

export const DE_NGHI_XU_LY = {
  ghi_giam: "Ghi giảm tồn kho",
  ghi_tang: "Ghi tăng tồn kho",
  chuyen_phan_loai: "Chuyển phân loại phẩm chất",
  thanh_ly: "Đề nghị thanh lý",
  sua_chua: "Sửa chữa, bảo dưỡng",
  kiem_tra_lai: "Kiểm tra lại",
  bao_cao_cap_tren: "Báo cáo cấp trên",
  cai_thien_bao_quan: "Cải thiện điều kiện bảo quản",
  thay_the_moi: "Thay thế mới",
  chuyen_kho_khac: "Chuyển kho khác",
  khac: "Đề nghị khác",
};

export const VAI_TRO_KIEM_KE = {
  to_truong: "Tổ trưởng",
  uy_vien: "Ủy viên",
  thu_kho: "Thủ kho",
  kiem_soan: "Kiểm soát - Soạn thảo",
  chung_kien: "Chứng kiến",
};

export const LOAI_HANG_HOA = {
  thiet_bi: "Thiết bị",
  vat_tu: "Vật tư",
  linh_kien: "Linh kiện",
  phu_tung: "Phụ tùng",
  dung_cu: "Dụng cụ",
  van_phong_pham: "Văn phòng phẩm",
  khac: "Khác",
};

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
  "Phần",
  "Suất",
  "Ngày",
  "Giờ",
  "Lần",
  "Khác",
];

export const VAI_TRO = {
  admin: "Quản trị viên",
  thu_kho: "Thủ kho",
  ke_toan: "Kế toán",
  user: "Người dùng",
};

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  approver: "Người duyệt",
};

export const TRANG_THAI_USER = {
  active: {
    label: "Hoạt động",
    color: "green",
  },
  inactive: {
    label: "Ngừng hoạt động",
    color: "red",
  },
};

export const LOAI_BAO_CAO = {
  ton_kho: "Báo cáo tồn kho",
  nhap_xuat: "Báo cáo nhập xuất",
  kiem_ke: "Báo cáo kiểm kê",
  pham_chat: "Báo cáo phẩm chất",
  chenh_lech: "Báo cáo chênh lệch",
  thong_ke_kiem_ke: "Thống kê kiểm kê",
  hieu_qua_kiem_ke: "Hiệu quả kiểm kê",
  hang_het_han: "Báo cáo hàng hết hạn",
  tinh_hinh_su_dung: "Báo cáo tình hình sử dụng",
  so_sanh_ky_truoc: "Báo cáo so sánh kỳ trước",
  tong_hop_kiem_ke: "Tổng hợp kiểm kê",
};

export const DINH_DANG_BAO_CAO = {
  excel: "Excel (.xlsx)",
  pdf: "PDF (.pdf)",
  csv: "CSV (.csv)",
};

export const CHU_KY_BAO_CAO = {
  ngay: "Hàng ngày",
  tuan: "Hàng tuần",
  thang: "Hàng tháng",
  quy: "Hàng quý",
  nam: "Hàng năm",
  tuy_chon: "Tùy chọn",
};

export const PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  MANAGE_INVENTORY: "manage_inventory",
  VIEW_REPORTS: "view_reports",
  APPROVE_TRANSACTIONS: "approve_transactions",
  CREATE_KIEM_KE: "create_kiem_ke",
  APPROVE_KIEM_KE: "approve_kiem_ke",
  VIEW_KIEM_KE: "view_kiem_ke",
  PRINT_KIEM_KE: "print_kiem_ke",
  EXPORT_KIEM_KE: "export_kiem_ke",
  MANAGE_USERS: "manage_users",
  MANAGE_DEPARTMENTS: "manage_departments",
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.APPROVE_TRANSACTIONS,
    PERMISSIONS.CREATE_KIEM_KE,
    PERMISSIONS.APPROVE_KIEM_KE,
    PERMISSIONS.VIEW_KIEM_KE,
    PERMISSIONS.PRINT_KIEM_KE,
    PERMISSIONS.EXPORT_KIEM_KE,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_DEPARTMENTS,
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.APPROVE_TRANSACTIONS,
    PERMISSIONS.CREATE_KIEM_KE,
    PERMISSIONS.APPROVE_KIEM_KE,
    PERMISSIONS.VIEW_KIEM_KE,
    PERMISSIONS.PRINT_KIEM_KE,
    PERMISSIONS.EXPORT_KIEM_KE,
  ],
};

export const LOAI_NCC = {
  ca_nhan: "Cá nhân",
  doanh_nghiep: "Doanh nghiệp",
  hop_tac_xa: "Hợp tác xã",
  don_vi_su_nghiep: "Đơn vị sự nghiệp",
  co_quan_nha_nuoc: "Cơ quan nhà nước",
};

export const LOAI_DON_VI_NHAN = {
  noi_bo: "Nội bộ",
  ben_ngoai: "Bên ngoài",
  ca_nhan: "Cá nhân",
  don_vi_cap_tren: "Đơn vị cấp trên",
  don_vi_cap_duoi: "Đơn vị cấp dưới",
  don_vi_cung_cap: "Đơn vị cùng cấp",
};

export const TRANG_THAI_HANG_HOA = {
  active: {
    label: "Đang sử dụng",
    color: "green",
  },
  inactive: {
    label: "Ngừng sử dụng",
    color: "yellow",
  },
  deleted: {
    label: "Đã xóa",
    color: "red",
  },
};

export const CHU_KY_KIEM_KE = {
  thang: "Hàng tháng",
  quy: "Hàng quý",
  nam: "Hàng năm",
  theo_yeu_cau: "Theo yêu cầu",
};

export const MUC_DO_UU_TIEN = {
  cao: {
    label: "Cao",
    color: "red",
    description: "Cần kiểm kê ngay",
  },
  trung_binh: {
    label: "Trung bình",
    color: "yellow",
    description: "Kiểm kê theo kế hoạch",
  },
  thap: {
    label: "Thấp",
    color: "green",
    description: "Có thể hoãn kiểm kê",
  },
};

export const TRANG_THAI_XU_LY = {
  cho_xu_ly: {
    label: "Chờ xử lý",
    color: "yellow",
  },
  dang_xu_ly: {
    label: "Đang xử lý",
    color: "blue",
  },
  hoan_thanh: {
    label: "Hoàn thành",
    color: "green",
  },
  tu_choi: {
    label: "Từ chối",
    color: "red",
  },
};

export const FORMAT_SETTINGS = {
  currency: {
    locale: "vi-VN",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  },
  number: {
    locale: "vi-VN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
  date: {
    locale: "vi-VN",
    format: "DD/MM/YYYY",
  },
};

export const CHART_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EC4899",
  "#6B7280",
];

export const FILE_LIMITS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/pdf",
    "image/jpeg",
    "image/png",
  ],
};

export const CANH_BAO_KIEM_KE = {
  qua_han: {
    label: "Quá hạn kiểm kê",
    color: "red",
    priority: "high",
  },
  sap_den_han: {
    label: "Sắp đến hạn",
    color: "yellow",
    priority: "medium",
  },
  can_kiem_ke: {
    label: "Cần kiểm kê",
    color: "blue",
    priority: "normal",
  },
};

export const LOAI_TEMPLATE = {
  dinh_ky: "Template định kỳ",
  dac_biet: "Template đặc biệt",
  theo_loai: "Template theo loại hàng",
  tuy_chinh: "Template tùy chỉnh",
};
