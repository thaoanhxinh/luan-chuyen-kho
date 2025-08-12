const express = require("express");
const baoCaoController = require("../controllers/baoCaoController");
const auth = require("../middleware/auth");

const router = express.Router();

// Dashboard stats
router.get("/dashboard-stats", auth, baoCaoController.getDashboardStats);

// Báo cáo tồn kho
router.get("/ton-kho", auth, baoCaoController.getTonKhoReport);
router.get("/ton-kho-theo-loai", auth, baoCaoController.getTonKhoTheoLoai);
router.get(
  "/ton-kho-theo-phong-ban",
  auth,
  baoCaoController.getTonKhoTheoPhongBan
);
router.get(
  "/ton-kho-theo-pham-chat",
  auth,
  baoCaoController.getTonKhoTheoPhamChat
);

// Báo cáo nhập xuất
router.get("/nhap-xuat", auth, baoCaoController.getNhapXuatReport);
router.get("/thong-ke-thang", auth, baoCaoController.getThongKeTheoThang);
router.get("/top-hang-hoa", auth, baoCaoController.getTopHangHoa);

// Báo cáo kiểm kê
router.get("/kiem-ke", auth, baoCaoController.getKiemKeReport);
router.get("/chenh-lech-kiem-ke", auth, baoCaoController.getChenhLechKiemKe);

// Export Excel
router.get("/export-ton-kho", auth, baoCaoController.exportTonKho);
router.get("/export-nhap-xuat", auth, baoCaoController.exportNhapXuat);
router.get("/export-kiem-ke", auth, baoCaoController.exportKiemKe);

// Báo cáo tùy chỉnh
router.post("/custom", auth, baoCaoController.getCustomReport);

module.exports = router;
