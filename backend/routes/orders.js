const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const OrderController = require("../controllers/OrderController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

// All order routes require authentication
router.use(authenticate);

// Customer: place order
router.post(
  "/",
  authorize("customer"),
  [
    body("restaurant_id").isInt().withMessage("Restaurant ID is required."),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required."),
    body("items.*.menu_item_id").isInt().withMessage("Menu item ID is required."),
    body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1."),
    body("delivery_address").trim().notEmpty().withMessage("Delivery address is required."),
  ],
  validate,
  OrderController.placeOrder
);

// Customer: view own orders
router.get("/my", authorize("customer"), OrderController.getMyOrders);

// Restaurant admin: view orders for their restaurant
router.get(
  "/restaurant/:restaurantId",
  authorize("restaurant_admin", "system_admin"),
  OrderController.getRestaurantOrders
);

// Get order by ID (all authenticated roles)
router.get("/:id", OrderController.getById);

// Restaurant admin / system admin: update order status
router.patch(
  "/:id/status",
  authorize("restaurant_admin", "system_admin"),
  [body("status").notEmpty().withMessage("Status is required.")],
  validate,
  OrderController.updateStatus
);

// Customer: cancel their own pending order
router.post("/:id/cancel", authorize("customer"), OrderController.cancelOrder);

module.exports = router;
