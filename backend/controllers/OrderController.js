const OrderRepository = require("../repositories/OrderRepository");
const MenuItemRepository = require("../repositories/MenuItemRepository");
const RestaurantRepository = require("../repositories/RestaurantRepository");
const { computeAllInsights } = require("../services/itemInsightsService");

/** Returns true if current server time is within the restaurant's opening hours. */
function isRestaurantOpen(opening_time, closing_time) {
  if (!opening_time || !closing_time) return true; // no hours set → always open
  const now = new Date();
  const [oh, om] = opening_time.split(":").map(Number);
  const [ch, cm] = closing_time.split(":").map(Number);
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  // Handle overnight restaurants (e.g. 22:00 – 02:00)
  if (openMins <= closeMins) return nowMins >= openMins && nowMins < closeMins;
  return nowMins >= openMins || nowMins < closeMins;
}

class OrderController {
  // POST /api/orders  — placeOrder() abstraction
  async placeOrder(req, res, next) {
    try {
      const { restaurant_id, items, delivery_address, delivery_notes, payment_method } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: "Order must contain at least one item." });
      }

      // Verify restaurant exists and is open
      const restaurant = await RestaurantRepository.findById(restaurant_id);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: "Restaurant not found." });
      }
      if (!isRestaurantOpen(restaurant.opening_time, restaurant.closing_time)) {
        return res.status(400).json({
          success: false,
          message: `Sorry, ${restaurant.name} is currently closed. Opening hours: ${restaurant.opening_time} – ${restaurant.closing_time}.`,
        });
      }

      // Validate items and calculate total
      let total_amount = 0;
      let maxPrepTime  = 0;
      const orderItems = [];

      for (const item of items) {
        const menuItem = await MenuItemRepository.findById(item.menu_item_id);
        if (!menuItem || !menuItem.is_available) {
          return res.status(400).json({
            success: false,
            message: `Menu item '${item.menu_item_id}' is not available.`,
          });
        }
        if (String(menuItem.restaurant.id) !== String(restaurant_id)) {
          return res.status(400).json({
            success: false,
            message: "All items must be from the same restaurant.",
          });
        }

        const subtotal = parseFloat(menuItem.price) * item.quantity;
        total_amount += subtotal;
        if (menuItem.preparation_time > maxPrepTime) maxPrepTime = menuItem.preparation_time;

        orderItems.push({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: menuItem.price,
          subtotal,
          special_instructions: item.special_instructions || null,
        });
      }

      // Estimated delivery = max prep time + 30 min delivery buffer
      const estimated_delivery_time = new Date(Date.now() + (maxPrepTime + 30) * 60 * 1000);

      const order = await OrderRepository.create(
        {
          customer_id: req.user.id,
          restaurant_id,
          total_amount,
          delivery_address,
          delivery_notes,
          estimated_delivery_time,
          status: "pending",
        },
        orderItems
      );

      // Fire-and-forget insights recompute (non-blocking)
      computeAllInsights().catch(() => {});

      return res.status(201).json({
        success: true,
        message: "Order placed successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/orders  — customer sees own orders, admin sees all
  async getAll(req, res, next) {
    try {
      let orders;
      if (req.user.role === "system_admin") {
        orders = await OrderRepository.findAll();
      } else if (req.user.role === "restaurant_admin") {
        // Scope to restaurants owned by this admin only
        const restaurants = await RestaurantRepository.findByOwnerId(req.user.id);
        const ids = restaurants.map(r => r.id);
        const settled = await Promise.all(ids.map(id => OrderRepository.findByRestaurantId(id)));
        orders = settled.flat();
      } else {
        orders = await OrderRepository.findByCustomerId(req.user.id);
      }
      return res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/orders/my
  async getMyOrders(req, res, next) {
    try {
      const orders = await OrderRepository.findByCustomerId(req.user.id);
      return res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/orders/restaurant/:restaurantId
  async getRestaurantOrders(req, res, next) {
    try {
      const orders = await OrderRepository.findByRestaurantId(req.params.restaurantId);
      return res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/orders/:id  — trackOrder() abstraction
  async getById(req, res, next) {
    try {
      const order = await OrderRepository.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }
      // Customer can only see their own
      if (req.user.role === "customer" && order.customer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
      return res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/orders/:id/status
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const validStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status." });
      }
      const order = await OrderRepository.updateStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }
      return res.status(200).json({ success: true, message: "Order status updated.", data: order });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/orders/:id/cancel  — customer cancels their own pending order
  async cancelOrder(req, res, next) {
    try {
      const order = await OrderRepository.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }
      if (order.customer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
      if (order.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending orders can be cancelled.",
        });
      }
      const cancelled = await OrderRepository.updateStatus(req.params.id, "cancelled");
      return res.status(200).json({ success: true, message: "Order cancelled.", data: cancelled });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
