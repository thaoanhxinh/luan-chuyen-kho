const express = require("express");
const xuatKhoController = require("../controllers/xuatKhoController");
const auth = require("../middleware/auth");
const { body } = require("express-validator");
const validate = require("../middleware/validation");
const upload = require("../middleware/upload"); // Thêm nếu cần upload file

const router = express.Router();

// Validation rules
const createPhieuXuatValidation = [
  body("ngay_xuat").isISO8601().withMessage("Ngày xuất không hợp lệ"),
  body("chi_tiet")
    .isArray({ min: 1 })
    .withMessage("Chi tiết xuất không được trống"),
  body("chi_tiet.*.hang_hoa_id")
    .isInt()
    .withMessage("ID hàng hóa không hợp lệ"),
  body("chi_tiet.*.so_luong_yeu_cau")
    .isFloat({ gt: 0 })
    .withMessage("Số lượng yêu cầu phải lớn hơn 0"),
  body("chi_tiet.*.don_gia")
    .isFloat({ gte: 0 })
    .withMessage("Đơn giá không hợp lệ"),
  body("loai_xuat")
    .isIn(["don_vi_nhan", "cap_phat", "dieu_chuyen", "thanh_ly", "su_dung"])
    .withMessage("Loại xuất không hợp lệ"),
];

const updatePhieuXuatValidation = [
  body("ngay_xuat")
    .optional()
    .isISO8601()
    .withMessage("Ngày xuất không hợp lệ"),
  body("chi_tiet")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Chi tiết xuất không được trống"),
  body("chi_tiet.*.hang_hoa_id")
    .optional()
    .isInt()
    .withMessage("ID hàng hóa không hợp lệ"),
  body("chi_tiet.*.so_luong_yeu_cau")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Số lượng yêu cầu phải lớn hơn 0"),
  body("chi_tiet.*.don_gia")
    .optional()
    .isFloat({ gte: 0 })
    .withMessage("Đơn giá không hợp lệ"),
  body("loai_xuat")
    .optional()
    .isIn(["don_vi_nhan", "cap_phat", "dieu_chuyen", "thanh_ly", "su_dung"])
    .withMessage("Loại xuất không hợp lệ"),
];

const checkTonKhoValidation = [
  body("chi_tiet").isArray({ min: 1 }).withMessage("Chi tiết không được trống"),
  body("chi_tiet.*.hang_hoa_id")
    .isInt()
    .withMessage("ID hàng hóa không hợp lệ"),
  body("chi_tiet.*.so_luong_yeu_cau")
    .isFloat({ gt: 0 })
    .withMessage("Số lượng phải lớn hơn 0"),
];

// ================== MAIN CRUD ROUTES ==================
router.get("/", auth, (req, res) => {
  xuatKhoController.getList(req, res, req.query, req.user);
});

router.get("/:id", auth, (req, res) => {
  xuatKhoController.getDetail(req, res, req.params, req.user);
});

router.post("/", auth, createPhieuXuatValidation, validate, (req, res) => {
  xuatKhoController.create(req, res, req.body, req.user);
});

router.put("/:id", auth, updatePhieuXuatValidation, validate, (req, res) => {
  xuatKhoController.update(req, res, req.params, req.body, req.user);
});

router.delete("/:id", auth, (req, res) => {
  xuatKhoController.delete(req, res, req.params, req.user);
});

// ================== WORKFLOW ROUTES ==================
router.post("/:id/approve", auth, (req, res) => {
  xuatKhoController.approve(req, res, req.params, req.user);
});

router.patch("/:id/cancel", auth, (req, res) => {
  xuatKhoController.cancel(req, res, req.params, req.user);
});

// Cập nhật số lượng thực xuất
router.put("/:id/update-so-luong-thuc-xuat", auth, (req, res) => {
  xuatKhoController.updateSoLuongThucXuat(
    req,
    res,
    req.params,
    req.body,
    req.user
  );
});

// Upload quyết định PDF (cần middleware upload)
router.post(
  "/:id/upload-decision",
  auth,
  upload.single("decision_pdf"),
  (req, res) => {
    xuatKhoController.uploadDecision(
      req,
      res,
      req.params,
      req.body,
      req.user,
      req.file
    );
  }
);

// Download quyết định PDF
router.get("/:id/download-decision", auth, (req, res) => {
  xuatKhoController.downloadDecision(req, res, req.params, req.user);
});

// Hoàn thành phiếu xuất
router.post("/:id/complete", auth, (req, res) => {
  xuatKhoController.complete(req, res, req.params, req.body, req.user);
});

// ================== INVENTORY CHECK ROUTES ==================
// Kiểm tra tồn kho cơ bản
router.post(
  "/check-ton-kho",
  auth,
  checkTonKhoValidation,
  validate,
  (req, res) => {
    xuatKhoController.checkTonKho(req, res, req.body, req.user);
  }
);

// 🔥 FIX: Kiểm tra tồn kho thực tế (bao gồm phiếu chờ xuất)
router.post(
  "/check-ton-kho-thuc-te",
  auth,
  checkTonKhoValidation,
  validate,
  (req, res) => {
    xuatKhoController.checkTonKhoThucTe(req, res, req.body, req.user);
  }
);

// ================== STATISTICS & REPORTS ==================
router.get("/stats/overview", auth, (req, res) => {
  xuatKhoController.getOverviewStats(req, res, req.query, req.user);
});

router.get("/stats/by-period", auth, (req, res) => {
  xuatKhoController.getStatsByPeriod(req, res, req.query, req.user);
});

router.get("/reports/export", auth, (req, res) => {
  xuatKhoController.exportReport(req, res, req.query, req.user);
});

// ================== HISTORY ROUTES ==================
router.get("/history/hang-hoa/:hang_hoa_id", auth, (req, res) => {
  xuatKhoController.getHistoryByHangHoa(
    req,
    res,
    req.params,
    req.query,
    req.user
  );
});

router.get("/history/seri/:seri", auth, (req, res) => {
  xuatKhoController.getHistoryBySeri(req, res, req.params, req.query, req.user);
});

// ================== SUPPORT ROUTES ==================
router.get("/available-hang-hoa", auth, (req, res) => {
  xuatKhoController.getAvailableHangHoa(req, res, req.query, req.user);
});

router.get("/ton-kho/phong-ban/:phong_ban_id", auth, (req, res) => {
  xuatKhoController.getTonKhoByPhongBan(
    req,
    res,
    req.params,
    req.query,
    req.user
  );
});

module.exports = router;
