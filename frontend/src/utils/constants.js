// // Trạng thái phiếu (dùng chung cho cả nhập và xuất)
// export const TRANG_THAI_PHIEU = {
//   draft: {
//     label: "Nháp",
//     color: "gray",
//   },
//   approved: {
//     label: "Đã duyệt",
//     color: "green",
//   },
//   cancelled: {
//     label: "Đã hủy",
//     color: "red",
//   },
//   completed: {
//     label: "Hoàn thành",
//     color: "blue",
//   },
// };

// export const LOAI_PHIEU_NHAP = {
//   tren_cap: "Trên cấp",
//   tu_mua: "Tự mua sắm",
// };

// export const LOAI_PHIEU_XUAT = {
//   don_vi_nhan: "Đơn vị nhận",
//   don_vi_su_dung: "Đơn vị sử dụng",
// };

// // Phẩm chất hàng hóa
// export const PHAM_CHAT = {
//   tot: {
//     label: "Tốt 100%",
//     color: "green",
//     description: "Hàng hóa còn tốt, sử dụng bình thường",
//   },
//   kem_pham_chat: {
//     label: "Kém phẩm chất",
//     color: "orange",
//     description: "Hàng hóa bị giảm chất lượng nhưng vẫn sử dụng được",
//   },
//   mat_pham_chat: {
//     label: "Mất phẩm chất",
//     color: "red",
//     description: "Hàng hóa không còn sử dụng được",
//   },
// };

// // Lý do chênh lệch trong kiểm kê
// export const LY_DO_CHENH_LECH = {
//   bao_cao_sai: "Báo cáo sai số liệu",
//   mat_cap: "Mất cắp",
//   hu_hong: "Hư hỏng trong quá trình sử dụng",
//   bay_hoi: "Bay hơi, thất thoát tự nhiên",
//   xuat_chua_ghi_so: "Xuất chưa ghi sổ",
//   nhap_chua_ghi_so: "Nhập chưa ghi sổ",
//   chuyen_kho: "Chuyển kho chưa ghi nhận",
//   kiem_ke_sai: "Kiểm kê sai sót",
//   khac: "Lý do khác",
// };

// // Đề nghị xử lý
// export const DE_NGHI_XU_LY = {
//   ghi_giam: "Ghi giảm tồn kho",
//   ghi_tang: "Ghi tăng tồn kho",
//   chuyen_phan_loai: "Chuyển phân loại phẩm chất",
//   thanh_ly: "Đề nghị thanh lý",
//   sua_chua: "Sửa chữa, bảo dưỡng",
//   kiem_tra_lai: "Kiểm tra lại",
//   bao_cao_cap_tren: "Báo cáo cấp trên",
//   khac: "Đề nghị khác",
// };

// // Vai trò trong tổ kiểm kê
// export const VAI_TRO_KIEM_KE = {
//   to_truong: "Tổ trưởng",
//   uy_vien: "Ủy viên",
//   thu_kho: "Thủ kho",
//   kiem_soan: "Kiểm soát - Soạn thảo",
//   chung_kien: "Chứng kiến",
// };

// // Loại hàng hóa
// export const LOAI_HANG_HOA = {
//   thiet_bi: "Thiết bị",
//   vat_tu: "Vật tư",
//   linh_kien: "Linh kiện",
//   khac: "Khác",
// };

// // Đơn vị tính
// export const DON_VI_TINH = [
//   "Cái",
//   "Chiếc",
//   "Bộ",
//   "Hộp",
//   "Thùng",
//   "Kg",
//   "Gram",
//   "Mét",
//   "Lít",
//   "Khác",
// ];

// // Vai trò người dùng
// export const VAI_TRO = {
//   admin: "Quản trị viên",
//   thu_kho: "Thủ kho",
//   ke_toan: "Kế toán",
//   user: "Người dùng",
// };

// // Trạng thái người dùng
// export const TRANG_THAI_USER = {
//   active: {
//     label: "Hoạt động",
//     color: "green",
//   },
//   inactive: {
//     label: "Ngừng hoạt động",
//     color: "red",
//   },
// };

// // Trạng thái kiểm kê
// export const TRANG_THAI_KIEM_KE = {
//   draft: {
//     label: "Nháp",
//     color: "gray",
//   },
//   in_progress: {
//     label: "Đang kiểm kê",
//     color: "blue",
//   },
//   completed: {
//     label: "Hoàn thành",
//     color: "green",
//   },
//   approved: {
//     label: "Đã duyệt",
//     color: "green",
//   },
//   cancelled: {
//     label: "Đã hủy",
//     color: "red",
//   },
// };

// // Loại kiểm kê
// export const LOAI_KIEM_KE = {
//   dinh_ky: "Định kỳ",
//   dot_xuat: "Đột xuất",
//   theo_yeu_cau: "Theo yêu cầu",
//   cuoi_nam: "Cuối năm",
//   chuyen_giao: "Chuyển giao",
//   khac: "Khác",
// };

// // Loại báo cáo
// export const LOAI_BAO_CAO = {
//   ton_kho: "Báo cáo tồn kho",
//   nhap_xuat: "Báo cáo nhập xuất",
//   kiem_ke: "Báo cáo kiểm kê",
//   hang_het_han: "Báo cáo hàng hết hạn",
//   tinh_hinh_su_dung: "Báo cáo tình hình sử dụng",
//   so_sanh_ky_truoc: "Báo cáo so sánh kỳ trước",
// };

// // Định dạng xuất báo cáo
// export const DINH_DANG_BAO_CAO = {
//   excel: "Excel (.xlsx)",
//   pdf: "PDF (.pdf)",
//   csv: "CSV (.csv)",
// };

// // Chu kỳ báo cáo
// export const CHU_KY_BAO_CAO = {
//   ngay: "Hàng ngày",
//   tuan: "Hàng tuần",
//   thang: "Hàng tháng",
//   quy: "Hàng quý",
//   nam: "Hàng năm",
// };

// export const USER_ROLES = {
//   ADMIN: "admin",
//   USER: "user", // Chỉ có 2 role
// };

// export const PERMISSIONS = {
//   // Permissions cơ bản - tất cả user đều có
//   VIEW_DASHBOARD: "view_dashboard",
//   MANAGE_INVENTORY: "manage_inventory",
//   VIEW_REPORTS: "view_reports",
//   APPROVE_TRANSACTIONS: "approve_transactions",

//   // Permissions đặc biệt - chỉ admin mới có
//   MANAGE_USERS: "manage_users",
//   MANAGE_DEPARTMENTS: "manage_departments",
// };

// export const ROLE_PERMISSIONS = {
//   [USER_ROLES.ADMIN]: [
//     // Admin có tất cả quyền
//     PERMISSIONS.VIEW_DASHBOARD,
//     PERMISSIONS.MANAGE_INVENTORY,
//     PERMISSIONS.VIEW_REPORTS,
//     PERMISSIONS.APPROVE_TRANSACTIONS,
//     PERMISSIONS.MANAGE_USERS, // Chỉ admin
//     PERMISSIONS.MANAGE_DEPARTMENTS, // Chỉ admin
//   ],
//   [USER_ROLES.USER]: [
//     // User có tất cả quyền trừ quản lý user/phòng ban
//     PERMISSIONS.VIEW_DASHBOARD,
//     PERMISSIONS.MANAGE_INVENTORY,
//     PERMISSIONS.VIEW_REPORTS,
//     PERMISSIONS.APPROVE_TRANSACTIONS,
//     // Không có MANAGE_USERS và MANAGE_DEPARTMENTS
//   ],
// };

// utils/constants.js

// Trạng thái phiếu (dùng chung cho cả nhập và xuất)
export const TRANG_THAI_PHIEU = {
  draft: {
    label: "Nháp",
    color: "gray",
  },
  approved: {
    label: "Đã duyệt",
    color: "blue",
  },
  completed: {
    label: "Hoàn thành",
    color: "green",
  },
  cancelled: {
    label: "Đã hủy",
    color: "red",
  },
};

// Trạng thái kiểm kê (CẬP NHẬT)
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

// Loại kiểm kê (CẬP NHẬT VÀ BỔ SUNG)
export const LOAI_KIEM_KE = {
  dinh_ky: "Định kỳ",
  dot_xuat: "Đột xuất",
  dac_biet: "Đặc biệt",
  chuyen_giao: "Chuyển giao",
  thanh_ly: "Thanh lý",
  theo_yeu_cau: "Theo yêu cầu",
  cuoi_nam: "Cuối năm",
};

// Phẩm chất hàng hóa (CẬP NHẬT VÀ BỔ SUNG)
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

// Lý do chênh lệch trong kiểm kê (GIỮ NGUYÊN VÀ BỔ SUNG)
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

// Đề nghị xử lý (GIỮ NGUYÊN VÀ BỔ SUNG)
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

// Vai trò trong tổ kiểm kê (GIỮ NGUYÊN)
export const VAI_TRO_KIEM_KE = {
  to_truong: "Tổ trưởng",
  uy_vien: "Ủy viên",
  thu_kho: "Thủ kho",
  kiem_soan: "Kiểm soát - Soạn thảo",
  chung_kien: "Chứng kiến",
};

// LOẠI PHIẾU (GIỮ NGUYÊN)
export const LOAI_PHIEU_NHAP = {
  tren_cap: "Trên cấp",
  tu_mua: "Tự mua sắm",
};

export const LOAI_PHIEU_XUAT = {
  don_vi_nhan: "Đơn vị nhận",
  don_vi_su_dung: "Đơn vị sử dụng",
};

// LOẠI HÀNG HÓA (GIỮ NGUYÊN VÀ BỔ SUNG)
export const LOAI_HANG_HOA = {
  thiet_bi: "Thiết bị",
  vat_tu: "Vật tư",
  linh_kien: "Linh kiện",
  phu_tung: "Phụ tung",
  dung_cu: "Dụng cụ",
  van_phong_pham: "Văn phòng phẩm",
  khac: "Khác",
};

// ĐƠN VỊ TÍNH (GIỮ NGUYÊN VÀ BỔ SUNG)
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

// VAI TRÒ NGƯỜI DÙNG (GIỮ NGUYÊN)
export const VAI_TRO = {
  admin: "Quản trị viên",
  thu_kho: "Thủ kho",
  ke_toan: "Kế toán",
  user: "Người dùng",
};

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
};

// TRẠNG THÁI NGƯỜI DÙNG (GIỮ NGUYÊN)
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

// LOẠI BÁO CÁO (CẬP NHẬT VÀ BỔ SUNG)
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

// ĐỊNH DẠNG BÁO CÁO (GIỮ NGUYÊN)
export const DINH_DANG_BAO_CAO = {
  excel: "Excel (.xlsx)",
  pdf: "PDF (.pdf)",
  csv: "CSV (.csv)",
};

// CHU KỲ BÁO CÁO (GIỮ NGUYÊN VÀ BỔ SUNG)
export const CHU_KY_BAO_CAO = {
  ngay: "Hàng ngày",
  tuan: "Hàng tuần",
  thang: "Hàng tháng",
  quy: "Hàng quý",
  nam: "Hàng năm",
  tuy_chon: "Tùy chọn",
};

// QUYỀN HẠN (GIỮ NGUYÊN VÀ BỔ SUNG)
export const PERMISSIONS = {
  // Permissions cơ bản - tất cả user đều có
  VIEW_DASHBOARD: "view_dashboard",
  MANAGE_INVENTORY: "manage_inventory",
  VIEW_REPORTS: "view_reports",
  APPROVE_TRANSACTIONS: "approve_transactions",

  // Permissions kiểm kê
  CREATE_KIEM_KE: "create_kiem_ke",
  APPROVE_KIEM_KE: "approve_kiem_ke",
  VIEW_KIEM_KE: "view_kiem_ke",
  PRINT_KIEM_KE: "print_kiem_ke",
  EXPORT_KIEM_KE: "export_kiem_ke",

  // Permissions đặc biệt - chỉ admin mới có
  MANAGE_USERS: "manage_users",
  MANAGE_DEPARTMENTS: "manage_departments",
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    // Admin có tất cả quyền
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
    // User có tất cả quyền trừ quản lý user/phòng ban
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

// === THÊM CÁC CONSTANTS MỚI CHO KIỂM KÊ ===

// Loại nhà cung cấp
export const LOAI_NCC = {
  ca_nhan: "Cá nhân",
  doanh_nghiep: "Doanh nghiệp",
  hop_tac_xa: "Hợp tác xã",
  don_vi_su_nghiep: "Đơn vị sự nghiệp",
  co_quan_nha_nuoc: "Cơ quan nhà nước",
};

// Loại đơn vị nhận
export const LOAI_DON_VI_NHAN = {
  noi_bo: "Nội bộ",
  ben_ngoai: "Bên ngoài",
  ca_nhan: "Cá nhân",
  don_vi_cap_tren: "Đơn vị cấp trên",
  don_vi_cap_duoi: "Đơn vị cấp dưới",
  don_vi_cung_cap: "Đơn vị cùng cấp",
};

// Trạng thái hàng hóa
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

// Chu kỳ kiểm kê
export const CHU_KY_KIEM_KE = {
  thang: "Hàng tháng",
  quy: "Hàng quý",
  nam: "Hàng năm",
  theo_yeu_cau: "Theo yêu cầu",
};

// Mức độ ưu tiên kiểm kê
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

// Trạng thái xử lý chênh lệch
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

// Format số và tiền tệ
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

// Màu sắc cho biểu đồ
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

// Kích thước file upload
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

// Cảnh báo kiểm kê
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

// Template kiểm kê
export const LOAI_TEMPLATE = {
  dinh_ky: "Template định kỳ",
  dac_biet: "Template đặc biệt",
  theo_loai: "Template theo loại hàng",
  tuy_chinh: "Template tùy chỉnh",
};
