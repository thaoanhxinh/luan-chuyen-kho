const express = require("express");
const kiemKeController = require("../controllers/kiemKeController");
const printController = require("../controllers/printController");
const auth = require("../middleware/auth");
const { body } = require("express-validator");
const validate = require("../middleware/validation");

const router = express.Router();

// Validation rules
const createPhieuKiemKeValidation = [
  body("ngay_kiem_ke").isISO8601().withMessage("Ngày kiểm kê không hợp lệ"),
  body("gio_kiem_ke")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Giờ kiểm kê không hợp lệ"),
  body("don_vi_kiem_ke").notEmpty().withMessage("Đơn vị kiểm kê là bắt buộc"),
  body("nguoi_thuc_hien").notEmpty().withMessage("Người thực hiện là bắt buộc"),
  body("loai_kiem_ke")
    .optional()
    .isIn(["dinh_ky", "dot_xuat", "dac_biet"])
    .withMessage("Loại kiểm kê không hợp lệ"),
  body("to_kiem_ke")
    .optional()
    .isArray()
    .withMessage("Tổ kiểm kê phải là mảng"),
  body("to_kiem_ke.*.ho_ten")
    .optional()
    .notEmpty()
    .withMessage("Họ tên thành viên không được trống"),
  body("to_kiem_ke.*.chuc_vu")
    .optional()
    .notEmpty()
    .withMessage("Chức vụ không được trống"),
  body("to_kiem_ke.*.vai_tro")
    .optional()
    .isIn(["to_truong", "uy_vien", "thu_kho"])
    .withMessage("Vai trò không hợp lệ"),
];

const updateKiemKeValidation = [
  body("chi_tiet")
    .isArray({ min: 1 })
    .withMessage("Chi tiết kiểm kê không được trống"),
  body("chi_tiet.*.hang_hoa_id")
    .isInt({ min: 1 })
    .withMessage("ID hàng hóa không hợp lệ"),
  body("chi_tiet.*.so_luong_so_sach")
    .isFloat({ gte: 0 })
    .withMessage("Số lượng sổ sách không hợp lệ"),
  body("chi_tiet.*.sl_tot")
    .isFloat({ gte: 0 })
    .withMessage("Số lượng tốt không hợp lệ"),
  body("chi_tiet.*.sl_kem_pham_chat")
    .isFloat({ gte: 0 })
    .withMessage("Số lượng kém phẩm chất không hợp lệ"),
  body("chi_tiet.*.sl_mat_pham_chat")
    .isFloat({ gte: 0 })
    .withMessage("Số lượng mất phẩm chất không hợp lệ"),
  body("chi_tiet.*.sl_hong")
    .isFloat({ gte: 0 })
    .withMessage("Số lượng hỏng không hợp lệ"),
  body("chi_tiet.*.sl_can_thanh_ly")
    .isFloat({ gte: 0 })
    .withMessage("Số lượng cần thanh lý không hợp lệ"),
  body("chi_tiet.*.don_gia")
    .isFloat({ gte: 0 })
    .withMessage("Đơn giá không hợp lệ"),
  body("chi_tiet.*.danh_sach_seri_kiem_ke")
    .optional()
    .isArray()
    .withMessage("Danh sách số seri phải là mảng"),
];

const printKiemKeValidation = [
  body("to_truong")
    .optional()
    .isString()
    .withMessage("Tên tổ trưởng không hợp lệ"),
  body("uy_vien_1")
    .optional()
    .isString()
    .withMessage("Tên ủy viên 1 không hợp lệ"),
  body("uy_vien_2")
    .optional()
    .isString()
    .withMessage("Tên ủy viên 2 không hợp lệ"),
  body("uy_vien_3")
    .optional()
    .isString()
    .withMessage("Tên ủy viên 3 không hợp lệ"),
  body("uy_vien_4")
    .optional()
    .isString()
    .withMessage("Tên ủy viên 4 không hợp lệ"),
  body("thu_kho").optional().isString().withMessage("Tên thủ kho không hợp lệ"),
];

// Routes
router.get("/", auth, (req, res) => {
  kiemKeController.getList(req, res, req.query, req.user);
});

router.get("/:id", auth, (req, res) => {
  kiemKeController.getDetail(req, res, req.params, req.user);
});

router.post("/", auth, createPhieuKiemKeValidation, validate, (req, res) => {
  kiemKeController.create(req, res, req.body, req.user);
});

router.put("/:id", auth, updateKiemKeValidation, validate, (req, res) => {
  kiemKeController.updateResults(req, res, req.params, req.body, req.user);
});

router.patch("/:id/approve", auth, (req, res) => {
  kiemKeController.approve(req, res, req.params, req.user);
});

router.get("/:id/ton-kho-hien-tai", auth, (req, res) => {
  kiemKeController.getTonKhoHienTai(req, res, req.params, req.user);
});

// ROUTE MỚI: In biên bản kiểm kê
router.post("/:id/print", auth, printKiemKeValidation, validate, (req, res) => {
  printController.generatePhieuKiemKeExcel(
    req,
    res,
    req.params,
    req.body,
    req.user
  );
});

module.exports = router;
