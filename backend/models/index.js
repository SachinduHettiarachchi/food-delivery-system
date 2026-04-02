const User = require("./User");
const Restaurant = require("./Restaurant");
const MenuItem = require("./MenuItem");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Payment = require("./Payment");
const Review = require("./Review");

// ─── Associations (ER Relationships from proposal) ───────────────────────────
// Users → Orders → Order_Items → Menu_Items → Restaurants
// Orders → Payments

// User (restaurant_admin) owns many Restaurants
User.hasMany(Restaurant, { foreignKey: "owner_id", as: "restaurants" });
Restaurant.belongsTo(User, { foreignKey: "owner_id", as: "owner" });

// Restaurant has many MenuItems
Restaurant.hasMany(MenuItem, { foreignKey: "restaurant_id", as: "menuItems" });
MenuItem.belongsTo(Restaurant, { foreignKey: "restaurant_id", as: "restaurant" });

// Customer (User) places many Orders
User.hasMany(Order, { foreignKey: "customer_id", as: "orders" });
Order.belongsTo(User, { foreignKey: "customer_id", as: "customer" });

// Restaurant receives many Orders
Restaurant.hasMany(Order, { foreignKey: "restaurant_id", as: "orders" });
Order.belongsTo(Restaurant, { foreignKey: "restaurant_id", as: "restaurant" });

// Order has many OrderItems
Order.hasMany(OrderItem, { foreignKey: "order_id", as: "orderItems" });
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// MenuItem appears in many OrderItems
MenuItem.hasMany(OrderItem, { foreignKey: "menu_item_id", as: "orderItems" });
OrderItem.belongsTo(MenuItem, { foreignKey: "menu_item_id", as: "menuItem" });

// Order has one Payment
Order.hasOne(Payment, { foreignKey: "order_id", as: "payment" });
Payment.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// Customer can review many MenuItems (per order)
User.hasMany(Review, { foreignKey: "customer_id", as: "reviews" });
Review.belongsTo(User, { foreignKey: "customer_id", as: "customer" });

MenuItem.hasMany(Review, { foreignKey: "menu_item_id", as: "reviews" });
Review.belongsTo(MenuItem, { foreignKey: "menu_item_id", as: "menuItem" });

Order.hasMany(Review, { foreignKey: "order_id", as: "reviews" });
Review.belongsTo(Order, { foreignKey: "order_id", as: "order" });

module.exports = { User, Restaurant, MenuItem, Order, OrderItem, Payment, Review };
