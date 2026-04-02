const express = require("express");
const router = express.Router();
const ReviewController = require("../controllers/ReviewController");
const { authenticate, authorize } = require("../middleware/auth");

// Public — anyone can read reviews for a menu item
router.get("/menu/:menuItemId", ReviewController.getByMenuItem);

// Protected — customers only
router.post("/", authenticate, authorize("customer"), ReviewController.create);
router.get("/order/:orderId", authenticate, authorize("customer"), ReviewController.getMyReviewsForOrder);

module.exports = router;
