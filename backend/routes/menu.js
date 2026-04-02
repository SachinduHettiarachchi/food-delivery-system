const express = require("express");
const router = express.Router();
const MenuItemController = require("../controllers/MenuItemController");
const { authenticate, authorize } = require("../middleware/auth");

// Public
router.get("/:id", MenuItemController.getById);

// Protected
router.put("/:id", authenticate, authorize("restaurant_admin", "system_admin"), MenuItemController.update);
router.delete("/:id", authenticate, authorize("restaurant_admin", "system_admin"), MenuItemController.delete);

module.exports = router;
