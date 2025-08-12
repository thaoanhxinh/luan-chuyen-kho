const express = require("express");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");
const { body } = require("express-validator");
const validate = require("../middleware/validation");

const router = express.Router();

// Validation rules
const loginValidation = [
  body("username").notEmpty().withMessage("Username is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

// Routes
router.post("/login", loginValidation, validate, authController.login);
router.get("/profile", auth, authController.getProfile);

module.exports = router;
