const express = require("express");
const donViNhanSearchController = require("../controllers/donViNhanSearchController");
const auth = require("../middleware/auth");

const router = express.Router();

// Routes cho search và auto-create nhà cung cấp
router.get(
  "/search/suggestions",
  auth,
  donViNhanSearchController.searchdonViNhan
);
router.post(
  "/auto-create",
  auth,
  donViNhanSearchController.createdonViNhanAuto
);

module.exports = router;
