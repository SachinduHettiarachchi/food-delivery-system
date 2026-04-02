const { Order, OrderItem, MenuItem, Restaurant, User, Payment } = require("../models");

class OrderRepository {
  async findAll() {
    return await Order.findAll({
      include: this._defaultIncludes(),
      order: [["created_at", "DESC"]],
    });
  }

  async findById(id) {
    return await Order.findOne({
      where: { id },
      include: this._defaultIncludes(),
    });
  }

  async findByCustomerId(customer_id) {
    return await Order.findAll({
      where: { customer_id },
      include: this._defaultIncludes(),
      order: [["created_at", "DESC"]],
    });
  }

  async findByRestaurantId(restaurant_id) {
    return await Order.findAll({
      where: { restaurant_id },
      include: this._defaultIncludes(),
      order: [["created_at", "DESC"]],
    });
  }

  async create(orderData, orderItems) {
    const order = await Order.create(orderData);
    const items = orderItems.map((item) => ({ ...item, order_id: order.id }));
    await OrderItem.bulkCreate(items);
    return await this.findById(order.id);
  }

  async updateStatus(id, status) {
    const [updated] = await Order.update({ status }, { where: { id } });
    if (!updated) return null;
    return await this.findById(id);
  }

  _defaultIncludes() {
    return [
      { model: User, as: "customer", attributes: ["id", "name", "email", "phone"] },
      { model: Restaurant, as: "restaurant", attributes: ["id", "name", "phone"] },
      {
        model: OrderItem,
        as: "orderItems",
        include: [{ model: MenuItem, as: "menuItem", attributes: ["id", "name", "price"] }],
      },
      { model: Payment, as: "payment" },
    ];
  }
}

module.exports = new OrderRepository();
