const ReviewRepository = require("../repositories/ReviewRepository");
const OrderRepository = require("../repositories/OrderRepository");
const { computeAllInsights } = require("../services/itemInsightsService");

class ReviewController {
  // POST /api/reviews
  // Body: { order_id, menu_item_id, rating, comment }
  async create(req, res, next) {
    try {
      const { order_id, menu_item_id, rating, comment } = req.body;

      if (!order_id || !menu_item_id || !rating) {
        return res.status(400).json({ success: false, message: "order_id, menu_item_id and rating are required." });
      }
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
      }

      // Verify order belongs to this customer and is delivered
      const order = await OrderRepository.findById(order_id);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }
      if (order.customer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
      if (order.status !== "delivered") {
        return res.status(400).json({ success: false, message: "You can only review delivered orders." });
      }

      // Verify this menu item was actually in the order
      const ordered = order.orderItems?.some(oi => oi.menu_item_id === menu_item_id);
      if (!ordered) {
        return res.status(400).json({ success: false, message: "This item was not part of your order." });
      }

      // Prevent duplicate review
      const existing = await ReviewRepository.findExisting(req.user.id, menu_item_id, order_id);
      if (existing) {
        return res.status(409).json({ success: false, message: "You have already reviewed this item for this order." });
      }

      const review = await ReviewRepository.create({
        customer_id: req.user.id,
        menu_item_id,
        order_id,
        rating,
        comment: comment || null,
      });

      // Recompute insights after new review (non-blocking)
      computeAllInsights().catch(() => {});

      return res.status(201).json({ success: true, message: "Review submitted.", data: review });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reviews/menu/:menuItemId
  async getByMenuItem(req, res, next) {
    try {
      const reviews = await ReviewRepository.findByMenuItemId(req.params.menuItemId);
      return res.status(200).json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reviews/order/:orderId  — returns which items this customer already reviewed
  async getMyReviewsForOrder(req, res, next) {
    try {
      const reviews = await ReviewRepository.findByOrderAndCustomer(req.params.orderId, req.user.id);
      return res.status(200).json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();
