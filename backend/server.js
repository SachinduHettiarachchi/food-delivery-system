const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const db = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Import all models (triggers associations)
require("./models/index");

// Background jobs
const { startInsightsCron } = require("./jobs/insightsCron");

// Import routes
const authRoutes = require("./routes/auth");
const restaurantRoutes = require("./routes/restaurants");
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const adminRoutes = require("./routes/admin");
const reviewRoutes = require("./routes/reviews");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["http://localhost:3000"];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Auth rate limiter: max 20 requests per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

// General API rate limiter: max 200 requests per 15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Food Delivery API is running ✅" });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",        authLimiter, authRoutes);
app.use("/api/restaurants", apiLimiter,  restaurantRoutes);
app.use("/api/menu",        apiLimiter,  menuRoutes);
app.use("/api/orders",      apiLimiter,  orderRoutes);
app.use("/api/payments",    apiLimiter,  paymentRoutes);
app.use("/api/admin",       apiLimiter,  adminRoutes);
app.use("/api/reviews",     apiLimiter,  reviewRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  await db.connect();

  // Sync models with DB (alter: true updates tables without dropping data)
  const sequelize = db.getSequelize();
  await sequelize.sync({ alter: true });
  console.log("✅ Database tables synced.");

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV}`);
    startInsightsCron();
  });
};

// Only start the HTTP server when run directly (not when imported by tests)
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
