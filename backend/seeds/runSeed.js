/**
 * HungryHub — Test Insights Seed Runner
 * Executes testInsights.sql against the configured MySQL database.
 *
 * Usage:
 *   node seeds/runSeed.js          (from /backend)
 *   npm run seed:test              (shortcut)
 *
 * Prerequisites:
 *   - Server does NOT need to be running.
 *   - The main seed (node seed.js) must have been run first so the
 *     base tables and demo users/restaurants/menu-items exist.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const fs   = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const SQL_FILE = path.join(__dirname, "testInsights.sql");

async function run() {
  let connection;
  try {
    // ── Connect ────────────────────────────────────────────────────────────────
    connection = await mysql.createConnection({
      host:               process.env.DB_HOST     || "localhost",
      port:               parseInt(process.env.DB_PORT) || 3306,
      user:               process.env.DB_USER,
      password:           process.env.DB_PASSWORD,
      database:           process.env.DB_NAME,
      multipleStatements: true,   // required to run the full SQL file in one call
    });
    console.log("✅ Connected to MySQL database.");

    // ── Read SQL file ──────────────────────────────────────────────────────────
    if (!fs.existsSync(SQL_FILE)) {
      throw new Error(`SQL file not found: ${SQL_FILE}`);
    }
    const sql = fs.readFileSync(SQL_FILE, "utf8");

    // ── Execute ────────────────────────────────────────────────────────────────
    console.log("⏳ Executing testInsights.sql …");
    await connection.query(sql);

    // ── Summary ────────────────────────────────────────────────────────────────
    const [items]   = await connection.query("SELECT id, name, tag, review_description, avg_rating, review_count FROM menu_items WHERE name IN ('Margherita Pizza','Butter Chicken','Pad Thai','Dry Fried Rice','Truffle Fries','Veggie Wrap') ORDER BY id");
    const [orders]  = await connection.query("SELECT COUNT(*) AS total FROM orders");
    const [reviews] = await connection.query("SELECT COUNT(*) AS total FROM reviews");

    console.log("\n✅ Seed complete!\n");
    console.log(`   Orders inserted  : ${orders[0].total}`);
    console.log(`   Reviews inserted : ${reviews[0].total}`);
    console.log("\n── Expected tags after computeAllInsights() runs ─────────────────");
    console.log("   Item                  Tag             Avg   Reviews");
    console.log("   ─────────────────     ─────────────   ────  ───────");
    for (const row of items) {
      const tag  = row.tag              ?? "(none — pending compute)";
      const avg  = row.avg_rating       ?? "–";
      const cnt  = row.review_count     ?? 0;
      console.log(`   ${row.name.padEnd(22)}  ${String(tag).padEnd(16)}  ${String(avg).padEnd(4)}  ${cnt}`);
    }
    console.log("\n   NOTE: Tags and descriptions are populated by computeAllInsights().");
    console.log("   Restart the backend (npm run dev) and the cron runs immediately,");
    console.log("   or POST an order to trigger it manually.\n");

  } catch (err) {
    console.error("\n❌ Seed failed!");
    console.error("   Message :", err.message);
    if (err.sqlMessage) {
      console.error("   SQL     :", err.sqlMessage);
      console.error("   SQL state:", err.sqlState);
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

run();
