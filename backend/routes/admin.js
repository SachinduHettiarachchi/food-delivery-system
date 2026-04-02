const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/AdminController");
const { authenticate, authorize } = require("../middleware/auth");

// All admin routes: must be authenticated + system_admin
router.use(authenticate, authorize("system_admin"));

router.get("/dashboard", AdminController.getDashboard);
router.get("/users", AdminController.getAllUsers);
router.get("/users/role/:role", AdminController.getUsersByRole);
router.delete("/users/:id", AdminController.deactivateUser);
router.get("/restaurants", AdminController.getAllRestaurants);
router.get("/orders", AdminController.getAllOrders);
router.post("/insights/recompute", AdminController.recomputeInsights);

module.exports = router;
