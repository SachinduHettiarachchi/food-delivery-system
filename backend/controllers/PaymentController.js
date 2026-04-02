const PaymentRepository = require("../repositories/PaymentRepository");
const OrderRepository = require("../repositories/OrderRepository");

// Polymorphism: processPayment() behaves differently based on payment_method
class PaymentController {
  constructor() {
    this.processPayment = this.processPayment.bind(this);
    this.getByOrder     = this.getByOrder.bind(this);
    this.getAll         = this.getAll.bind(this);
  }

  // POST /api/payments
  async processPayment(req, res, next) {
    try {
      const { order_id, payment_method } = req.body;

      const order = await OrderRepository.findById(order_id);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found." });
      }
      if (order.customer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }

      const existingPayment = await PaymentRepository.findByOrderId(order_id);
      if (existingPayment && existingPayment.payment_status === "completed") {
        return res.status(409).json({ success: false, message: "Order is already paid." });
      }

      // Polymorphic payment processing based on method
      const result = await this._processByMethod(payment_method, order.total_amount);

      const payment = await PaymentRepository.create({
        order_id,
        amount: order.total_amount,
        payment_method,
        payment_status: result.status,
        transaction_id: result.transaction_id,
        paid_at: result.status === "completed" ? new Date() : null,
      });

      // If paid, confirm the order
      if (result.status === "completed") {
        await OrderRepository.updateStatus(order_id, "confirmed");
      }

      return res.status(201).json({
        success: true,
        message: `Payment ${result.status}.`,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  // Polymorphism in action — different implementations per payment type
  async _processByMethod(method, amount) {
    switch (method) {
      case "cash":
        return { status: "pending", transaction_id: null }; // Cash paid on delivery
      case "card":
        return {
          status: "completed",
          transaction_id: `CARD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        };
      case "online":
        return {
          status: "completed",
          transaction_id: `ONL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        };
      default:
        throw new Error("Unsupported payment method.");
    }
  }

  // GET /api/payments/:orderId
  async getByOrder(req, res, next) {
    try {
      const payment = await PaymentRepository.findByOrderId(req.params.orderId);
      if (!payment) {
        return res.status(404).json({ success: false, message: "Payment not found." });
      }
      return res.status(200).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/payments  (admin only)
  async getAll(req, res, next) {
    try {
      const payments = await PaymentRepository.findAll();
      return res.status(200).json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
