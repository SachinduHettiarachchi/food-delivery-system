const cron = require("node-cron");
const { computeAllInsights } = require("../services/itemInsightsService");

/**
 * Starts the insights cron job:
 *  - Runs immediately on server start
 *  - Then every hour (at :00)
 */
function startInsightsCron() {
  // Run once immediately after DB sync
  computeAllInsights();

  // Schedule every 6 hours (event-triggered calls from ReviewController handle freshness)
  cron.schedule("0 */6 * * *", () => {
    console.log("[insights] Running scheduled insights computation…");
    computeAllInsights();
  });

  console.log("[insights] Cron job scheduled (every 6 hours).");
}

module.exports = { startInsightsCron };
