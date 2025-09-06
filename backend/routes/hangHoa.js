const express = require("express");
const hangHoaController = require("../controllers/hangHoaController");
const hangHoaSearchController = require("../controllers/hangHoaSearchController");
const auth = require("../middleware/auth");
const { body } = require("express-validator");
const validate = require("../middleware/validation");

const router = express.Router();

// Validation rules
const createHangHoaValidation = [
  body("ma_hang_hoa").notEmpty().withMessage("Mã hàng hóa là bắt buộc"),
  body("ten_hang_hoa").notEmpty().withMessage("Tên hàng hóa là bắt buộc"),
  body("don_vi_tinh").notEmpty().withMessage("Đơn vị tính là bắt buộc"),
];

// Routes
router.get("/", auth, hangHoaController.getList);
router.get("/suggestions", auth, hangHoaController.getSuggestions);
router.get("/:hangHoaId/seri", auth, hangHoaController.getAvailableSeri);
router.post(
  "/",
  auth,
  createHangHoaValidation,
  validate,
  hangHoaController.create
);
router.put(
  "/:id",
  auth,
  createHangHoaValidation,
  validate,
  hangHoaController.update
);
// Routes mới cho search và auto-create
router.get("/search/suggestions", auth, hangHoaSearchController.searchHangHoa);
router.post("/auto-create", auth, hangHoaSearchController.createHangHoaAuto);
// Route để lấy chi tiết hàng hóa theo ID
router.get("/:id", auth, (req, res) => {
  hangHoaController.getById(req, res, req.params, req.user);
});

// Route để lấy chi tiết hàng hóa theo ID và phòng ban
router.get("/:id/phong-ban/:phongBanId", auth, (req, res) => {
  hangHoaController.getDetailByPhongBan(req, res, req.params, req.user);
});

// Route để lấy danh sách phòng ban cho filter
router.get("/departments/list", auth, (req, res) => {
  hangHoaController.getPhongBanForFilter(req, res, req.user);
});

module.exports = router;
