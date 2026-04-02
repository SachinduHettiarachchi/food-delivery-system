const { Payment, Order } = require("../models");

class PaymentRepository {
  async findById(id) {
    return await Payment.findByPk(id, {
      include: [{ model: Order, as: "order" }],
    });
  }

  async findByOrderId(order_id) {
    return await Payment.findOne({ where: { order_id } });
  }

  async create(paymentData) {
    return await Payment.create(paymentData);
  }

  async updateStatus(id, status, transaction_id = null) {
    const data = { payment_status: status };
    if (status === "completed") data.paid_at = new Date();
    if (transaction_id) data.transaction_id = transaction_id;
    const [updated] = await Payment.update(data, { where: { id } });
    if (!updated) return null;
    return await this.findById(id);
  }

  async findAll() {
    return await Payment.findAll({
      include: [{ model: Order, as: "order" }],
      order: [["created_at", "DESC"]],
    });
  }
}

module.exports = new PaymentRepository();
