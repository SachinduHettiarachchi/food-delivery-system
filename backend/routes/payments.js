const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const PaymentController = require("../controllers/PaymentController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

router.use(authenticate);

// Process payment for an order
router.post(
  "/",
  authorize("customer"),
  [
    body("order_id").isInt().withMessage("Order ID is required."),
    body("payment_method")
      .isIn(["cash", "card", "online"])
      .withMessage("Payment method must be cash, card, or online."),
  ],
  validate,
  PaymentController.processPayment
);

// Get payment for a specific order
router.get("/order/:orderId", PaymentController.getByOrder);

// Admin: get all payments
router.get("/", authorize("system_admin"), PaymentController.getAll);

module.exports = router;
