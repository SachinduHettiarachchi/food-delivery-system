const { Review, User, MenuItem, Order } = require("../models");

class ReviewRepository {
  /** Get all reviews for a menu item, newest first */
  async findByMenuItemId(menuItemId) {
    return Review.findAll({
      where: { menu_item_id: menuItemId },
      include: [{ model: User, as: "customer", attributes: ["id", "name"] }],
      order: [["created_at", "DESC"]],
    });
  }

  /** Check whether a customer already reviewed this item for this order */
  async findExisting(customerId, menuItemId, orderId) {
    return Review.findOne({
      where: { customer_id: customerId, menu_item_id: menuItemId, order_id: orderId },
    });
  }

  /** Get all review stubs for a specific order + customer (to know what's already reviewed) */
  async findByOrderAndCustomer(orderId, customerId) {
    return Review.findAll({
      where: { order_id: orderId, customer_id: customerId },
    });
  }

  async create(data) {
    return Review.create(data);
  }
}

module.exports = new ReviewRepository();
