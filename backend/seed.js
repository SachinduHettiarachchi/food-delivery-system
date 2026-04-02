/**
 * Seed Script — creates demo users, restaurants, and menu items
 * Run: node seed.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./config/database");
require("./models/index");

const { User, Restaurant, MenuItem } = require("./models");

const seed = async () => {
  await db.connect();
  const sequelize = db.getSequelize();
  await sequelize.sync({ force: true }); // ⚠️ DROPS AND RECREATES all tables
  console.log("✅ Tables synced (force)");

  const ROUNDS = 12;
  const hash = (pw) => bcrypt.hash(pw, ROUNDS);

  // ── Users ──────────────────────────────────────────────────────────
  const [admin, restaurantAdmin, customer] = await Promise.all([
    User.create({ name: "System Admin", email: "admin@demo.com", password: await hash("password123"), role: "system_admin", phone: "0771234567" }),
    User.create({ name: "Restaurant Owner", email: "restaurant@demo.com", password: await hash("password123"), role: "restaurant_admin", phone: "0777654321" }),
    User.create({ name: "John Customer", email: "customer@demo.com", password: await hash("password123"), role: "customer", phone: "0770001111", address: "123 Main Street, Colombo 3" }),
  ]);
  console.log("✅ Users created");

  // ── Restaurants ────────────────────────────────────────────────────
  const [pizzaPlace, burgerJoint] = await Promise.all([
    Restaurant.create({
      owner_id: restaurantAdmin.id,
      name: "Pizza Palace",
      description: "Authentic Italian pizza and pasta since 1995",
      address: "45 Galle Road, Colombo 3",
      phone: "0112345678",
      email: "pizza@palace.lk",
      cuisine_type: "Italian",
      opening_time: "10:00:00",
      closing_time: "22:00:00",
      rating: 4.5,
    }),
    Restaurant.create({
      owner_id: restaurantAdmin.id,
      name: "Burger Barn",
      description: "Juicy handcrafted burgers with fresh local ingredients",
      address: "12 Duplication Road, Colombo 4",
      phone: "0119876543",
      email: "info@burgerbarn.lk",
      cuisine_type: "American",
      opening_time: "11:00:00",
      closing_time: "23:00:00",
      rating: 4.2,
    }),
  ]);
  console.log("✅ Restaurants created");

  // ── Menu Items: Pizza Palace ───────────────────────────────────────
  await MenuItem.bulkCreate([
    { restaurant_id: pizzaPlace.id, name: "Margherita Pizza", description: "Classic tomato, mozzarella, basil", price: 1200, category: "Pizza", preparation_time: 20 },
    { restaurant_id: pizzaPlace.id, name: "Pepperoni Pizza", description: "Loaded with premium pepperoni slices", price: 1500, category: "Pizza", preparation_time: 20 },
    { restaurant_id: pizzaPlace.id, name: "BBQ Chicken Pizza", description: "Smoky BBQ sauce, grilled chicken, onions", price: 1600, category: "Pizza", preparation_time: 25 },
    { restaurant_id: pizzaPlace.id, name: "Spaghetti Carbonara", description: "Creamy sauce, pancetta, parmesan", price: 950, category: "Pasta", preparation_time: 15 },
    { restaurant_id: pizzaPlace.id, name: "Fettuccine Alfredo", description: "Rich butter and parmesan cream sauce", price: 900, category: "Pasta", preparation_time: 15 },
    { restaurant_id: pizzaPlace.id, name: "Garlic Bread", description: "Toasted ciabatta with herb garlic butter", price: 350, category: "Starters", preparation_time: 8 },
    { restaurant_id: pizzaPlace.id, name: "Tiramisu", description: "Classic Italian coffee dessert", price: 500, category: "Desserts", preparation_time: 5 },
  ]);

  // ── Menu Items: Burger Barn ────────────────────────────────────────
  await MenuItem.bulkCreate([
    { restaurant_id: burgerJoint.id, name: "Classic Beef Burger", description: "200g beef patty, lettuce, tomato, pickles", price: 850, category: "Burgers", preparation_time: 12 },
    { restaurant_id: burgerJoint.id, name: "Double Smash Burger", description: "Two smashed patties, special sauce, cheese", price: 1200, category: "Burgers", preparation_time: 15 },
    { restaurant_id: burgerJoint.id, name: "Crispy Chicken Burger", description: "Crunchy fried chicken fillet, coleslaw", price: 950, category: "Burgers", preparation_time: 14 },
    { restaurant_id: burgerJoint.id, name: "Mushroom Swiss Burger", description: "Sautéed mushrooms, Swiss cheese, aioli", price: 1100, category: "Burgers", preparation_time: 14 },
    { restaurant_id: burgerJoint.id, name: "Loaded Fries", description: "Crispy fries with cheese sauce, jalapeños, bacon bits", price: 550, category: "Sides", preparation_time: 8 },
    { restaurant_id: burgerJoint.id, name: "Onion Rings", description: "Beer-battered golden onion rings", price: 400, category: "Sides", preparation_time: 8 },
    { restaurant_id: burgerJoint.id, name: "Chocolate Milkshake", description: "Thick and creamy hand-spun milkshake", price: 450, category: "Drinks", preparation_time: 5 },
  ]);
  console.log("✅ Menu items created");

  console.log("\n🎉 Seed complete! Demo credentials:");
  console.log("   Customer:    customer@demo.com  / password123");
  console.log("   Restaurant:  restaurant@demo.com / password123");
  console.log("   Admin:       admin@demo.com      / password123\n");

  process.exit(0);
};

seed().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
