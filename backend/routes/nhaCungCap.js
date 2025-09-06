const express = require("express");
const nhaCungCapSearchController = require("../controllers/nhaCungCapSearchController");
const auth = require("../middleware/auth");

const router = express.Router();

// Routes cho search và auto-create nhà cung cấp
router.get(
  "/search/suggestions",
  auth,
  nhaCungCapSearchController.searchNhaCungCap
);
router.get(
  "/search/searchNhaCungCapByType",
  auth,
  nhaCungCapSearchController.searchNhaCungCapByType
);
router.post(
  "/auto-create",
  auth,
  nhaCungCapSearchController.createNhaCungCapAuto
);

module.exports = router;
