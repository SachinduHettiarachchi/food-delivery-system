const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("Valid email is required.").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
    body("role")
      .optional()
      .isIn(["customer", "restaurant_admin"])
      .withMessage("Invalid role."),
  ],
  validate,
  AuthController.register
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required.").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validate,
  AuthController.login
);

// GET /api/auth/me  (protected)
router.get("/me", authenticate, AuthController.getMe);

// PUT /api/auth/me  (protected)
router.put("/me", authenticate, AuthController.updateMe);

// PUT /api/auth/change-password  (protected)
router.put(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters."),
  ],
  validate,
  AuthController.changePassword
);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required.").normalizeEmail()],
  validate,
  AuthController.forgotPassword
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  validate,
  AuthController.resetPassword
);

// POST /api/auth/google
router.post(
  "/google",
  [body("credential").notEmpty().withMessage("Google credential is required.")],
  validate,
  AuthController.googleAuth
);

// POST /api/auth/facebook
router.post(
  "/facebook",
  [body("accessToken").notEmpty().withMessage("Facebook access token is required.")],
  validate,
  AuthController.facebookAuth
);

module.exports = router;
