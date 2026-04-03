/**
 * Jest globalSetup — runs ONCE in a separate process before any integration test.
 *
 * Responsibilities:
 *  1. Load .env.test so the DB connection uses the test database
 *  2. Connect, drop+recreate all tables (force sync), seed demo data
 *  3. Close the connection (this process's connection, not the test workers')
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.test"), override: true });

module.exports = async () => {
  const bcrypt  = require("bcryptjs");
  const db      = require("../config/database");
  require("../models/index");

  await db.connect();
  const sequelize = db.getSequelize();

  // Drop and recreate all tables for a clean slate
  await sequelize.sync({ force: true });
  console.log("[setup] Tables recreated.");

  const { User, Restaurant, MenuItem } = require("../models");
  const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 4;
  const hash   = (pw) => bcrypt.hash(pw, ROUNDS);

  // ── Users ──────────────────────────────────────────────────────────
  const [admin, restaurantAdmin, customer] = await Promise.all([
    User.create({ name: "System Admin",    email: "admin@demo.com",      password: await hash("password123"), role: "system_admin",    phone: "0771234567" }),
    User.create({ name: "Restaurant Owner",email: "restaurant@demo.com", password: await hash("password123"), role: "restaurant_admin", phone: "0777654321" }),
    User.create({ name: "John Customer",   email: "customer@demo.com",   password: await hash("password123"), role: "customer",        phone: "0770001111", address: "123 Main St" }),
  ]);

  // ── Restaurants ────────────────────────────────────────────────────
  const [pizza, burger] = await Promise.all([
    Restaurant.create({
      owner_id: restaurantAdmin.id, name: "Pizza Palace",
      address: "45 Galle Road, Colombo 3", phone: "0112345678",
      email: "pizza@palace.lk", cuisine_type: "Italian",
      opening_time: null, closing_time: null,   // null = always open
    }),
    Restaurant.create({
      owner_id: restaurantAdmin.id, name: "Burger Barn",
      address: "12 Duplication Road, Colombo 4", phone: "0119876543",
      email: "info@burgerbarn.lk", cuisine_type: "American",
      opening_time: null, closing_time: null,   // null = always open
    }),
  ]);

  // ── Menu items ─────────────────────────────────────────────────────
  await MenuItem.bulkCreate([
    { restaurant_id: pizza.id,  name: "Margherita Pizza",  price: 1200, category: "Pizza",    preparation_time: 20, is_available: true },
    { restaurant_id: pizza.id,  name: "Pepperoni Pizza",   price: 1500, category: "Pizza",    preparation_time: 20, is_available: true },
    { restaurant_id: pizza.id,  name: "Garlic Bread",      price: 350,  category: "Starters", preparation_time: 8,  is_available: true },
    { restaurant_id: burger.id, name: "Classic Beef Burger",price: 850, category: "Burgers",  preparation_time: 12, is_available: true },
    { restaurant_id: burger.id, name: "Loaded Fries",      price: 550,  category: "Sides",    preparation_time: 8,  is_available: true },
  ]);

  console.log("[setup] Seed complete.");
  await sequelize.close();
};
