const express = require("express");
const nhapKhoController = require("../controllers/nhapKhoController");
const auth = require("../middleware/auth");
const { body } = require("express-validator");
const validate = require("../middleware/validation");

const router = express.Router();

// Validation rules
const createPhieuNhapValidation = [
  body("ngay_nhap").isISO8601().withMessage("Ngày nhập không hợp lệ"),
  body("chi_tiet")
    .isArray({ min: 1 })
    .withMessage("Chi tiết nhập không được trống"),
  body("chi_tiet.*.hang_hoa_id").custom((value) => {
    if (!value) {
      throw new Error("Chưa chọn hàng hóa");
    }
    if (!Number.isInteger(Number(value))) {
      throw new Error("ID hàng hóa không hợp lệ");
    }
    return true;
  }),
  body("chi_tiet.*.so_luong").custom((value) => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      throw new Error("Số lượng phải lớn hơn 0");
    }
    return true;
  }),
  body("chi_tiet.*.don_gia").custom((value) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      throw new Error("Đơn giá không hợp lệ");
    }
    return true;
  }),
];

// Routes
router.get("/", auth, nhapKhoController.getList);
router.get("/:id", auth, nhapKhoController.getDetail);
router.post(
  "/",
  auth,
  createPhieuNhapValidation,
  validate,
  nhapKhoController.create
);
router.patch("/:id/approve", auth, nhapKhoController.approve);

module.exports = router;
