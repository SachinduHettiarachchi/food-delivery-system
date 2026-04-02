const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const RestaurantController = require("../controllers/RestaurantController");
const MenuItemController = require("../controllers/MenuItemController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

// Public routes
router.get("/", RestaurantController.getAll);

// Protected — must be defined BEFORE /:id to avoid param capture
router.get("/my/restaurants", authenticate, authorize("restaurant_admin", "system_admin"), RestaurantController.getMine);

router.get("/:id", RestaurantController.getById);
router.get("/:restaurantId/menu", MenuItemController.getByRestaurant);
router.get("/:restaurantId/menu/manage", authenticate, authorize("restaurant_admin", "system_admin"), MenuItemController.getAllByRestaurant);

router.post(
  "/",
  authenticate,
  authorize("restaurant_admin", "system_admin"),
  [
    body("name").trim().notEmpty().withMessage("Restaurant name is required."),
    body("address").trim().notEmpty().withMessage("Address is required."),
    body("phone").trim().notEmpty().withMessage("Phone is required."),
  ],
  validate,
  RestaurantController.create
);

router.put(
  "/:id",
  authenticate,
  authorize("restaurant_admin", "system_admin"),
  RestaurantController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize("system_admin"),
  RestaurantController.delete
);

// Menu item routes under restaurants
router.post(
  "/:restaurantId/menu",
  authenticate,
  authorize("restaurant_admin", "system_admin"),
  [
    body("name").trim().notEmpty().withMessage("Item name is required."),
    body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number."),
  ],
  validate,
  MenuItemController.create
);

module.exports = router;
