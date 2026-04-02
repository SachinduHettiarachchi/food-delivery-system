const UserRepository = require("../repositories/UserRepository");
const RestaurantRepository = require("../repositories/RestaurantRepository");
const OrderRepository = require("../repositories/OrderRepository");
const PaymentRepository = require("../repositories/PaymentRepository");
const { computeAllInsights } = require("../services/itemInsightsService");
const { User, Order, Restaurant, Payment } = require("../models");
const { Op } = require("sequelize");

class AdminController {
  // GET /api/admin/users
  async getAllUsers(req, res, next) {
    try {
      const users = await UserRepository.findAll();
      return res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/users/:role
  async getUsersByRole(req, res, next) {
    try {
      const users = await UserRepository.findByRole(req.params.role);
      return res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/admin/users/:id
  async deactivateUser(req, res, next) {
    try {
      await UserRepository.delete(req.params.id);
      return res.status(200).json({ success: true, message: "User deactivated." });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/restaurants
  async getAllRestaurants(req, res, next) {
    try {
      const restaurants = await RestaurantRepository.findAll();
      return res.status(200).json({ success: true, data: restaurants });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/orders
  async getAllOrders(req, res, next) {
    try {
      const orders = await OrderRepository.findAll();
      return res.status(200).json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/admin/dashboard  — summary statistics
  async getDashboard(req, res, next) {
    try {
      const totalUsers = await User.count({ where: { is_active: true } });
      const totalRestaurants = await Restaurant.count({ where: { is_active: true } });
      const totalOrders = await Order.count();
      const totalRevenue = await Payment.sum("amount", {
        where: { payment_status: "completed" },
      });

      const recentOrders = await OrderRepository.findAll();
      const ordersByStatus = await Order.findAll({
        attributes: [
          "status",
          [require("sequelize").fn("COUNT", require("sequelize").col("id")), "count"],
        ],
        group: ["status"],
        raw: true,
      });

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalUsers,
            totalRestaurants,
            totalOrders,
            totalRevenue: totalRevenue || 0,
          },
          ordersByStatus,
          recentOrders: recentOrders.slice(0, 10),
        },
      });
    } catch (error) {
      next(error);
    }
  }
  // POST /api/admin/insights/recompute
  async recomputeInsights(req, res, next) {
    try {
      await computeAllInsights();
      res.json({ success: true, message: "Insights recomputed." });
    } catch (err) { next(err); }
  }
}

module.exports = new AdminController();
