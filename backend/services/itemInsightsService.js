const db = require("../config/database");
const { MenuItem } = require("../models");

const sequelize = db.getSequelize();

let isRunning = false;

/**
 * Determines the smart tag for an item.
 *
 * Priority:
 *  ✨ New         — created within 14 days
 *  🔥 Best Seller — category-relative p80 AND ≥10 orders AND recentOrders > 0
 *  ⭐ Top Rated   — Bayesian-smoothed rating ≥ 4.0 AND ≥ 8 reviews
 *  📈 Trending    — last-7-day orders in top 30% AND ≥ 3 recent orders AND recentOrders > 0
 *  (null)         — no tag
 */
function getTag({ totalOrders, recentOrders, avgRating, reviewCount, createdAt, allTotals, allRecents, category, allTotalsByCategory }) {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);

  if (ageDays <= 14) return "✨ New";

  // Category-relative Best Seller (staleness check: recentOrders > 0)
  if (totalOrders >= 10 && recentOrders > 0) {
    const categoryTotals = (allTotalsByCategory && allTotalsByCategory[category]) || [];
    const totalsToUse = categoryTotals.length >= 5 ? categoryTotals : allTotals;
    if (totalsToUse.length) {
      const sorted = [...totalsToUse].sort((a, b) => a - b);
      const p80 = sorted[Math.floor(sorted.length * 0.8)] ?? sorted[sorted.length - 1];
      if (totalOrders >= p80) return "🔥 Best Seller";
    }
  }

  // Bayesian-smoothed Top Rated
  const bayesian = (reviewCount / (reviewCount + 10)) * avgRating;
  if (bayesian >= 4.0 && reviewCount >= 8) return "⭐ Top Rated";

  // Trending (staleness check: recentOrders > 0)
  if (allRecents.length && recentOrders >= 3) {
    const sorted = [...allRecents].sort((a, b) => a - b);
    const p70 = sorted[Math.floor(sorted.length * 0.7)] ?? sorted[sorted.length - 1];
    if (recentOrders >= p70) return "📈 Trending";
  }

  return null;
}

/**
 * Generates a short review-style description based on order + review metrics.
 * Uses item.id modulo to deterministically vary templates.
 */
function getDescription({ totalOrders, recentOrders, avgRating, reviewCount, tag, itemId }) {
  if (tag === "✨ New") {
    const templates = [
      "Just added — be among the first to try it!",
      "Brand new on our menu — give it a try!",
      "Freshly added — you could be one of the first to review it!",
    ];
    return templates[itemId % templates.length];
  }

  if (tag === "🔥 Best Seller") {
    const templates = [
      `Ordered ${totalOrders}+ times — a customer favourite!`,
      `One of our most popular items with ${totalOrders}+ orders!`,
      `A proven crowd-pleaser — ${totalOrders}+ orders and counting.`,
    ];
    return templates[itemId % templates.length];
  }

  if (tag === "⭐ Top Rated") {
    const templates = [
      `Rated ${avgRating.toFixed(1)}/5 from ${reviewCount} review${reviewCount !== 1 ? "s" : ""} — guests love it!`,
      `Our customers give this ${avgRating.toFixed(1)} stars across ${reviewCount} review${reviewCount !== 1 ? "s" : ""}.`,
      `Consistently well-rated — ${avgRating.toFixed(1)}/5 from ${reviewCount} customer${reviewCount !== 1 ? "s" : ""}.`,
      `${reviewCount} happy customer${reviewCount !== 1 ? "s" : ""} rated this ${avgRating.toFixed(1)}/5.`,
    ];
    return templates[itemId % templates.length];
  }

  if (tag === "📈 Trending") {
    const templates = [
      `${recentOrders} orders this week — everyone's loving it right now.`,
      `Popular pick this week with ${recentOrders} recent orders!`,
      `On the rise — ${recentOrders} orders in the last 7 days.`,
    ];
    return templates[itemId % templates.length];
  }

  // No tag — sentiment bands
  if (reviewCount >= 5 && avgRating < 3.0) {
    const templates = [
      "Mixed reviews — worth trying for yourself.",
      "Some customers had concerns — check reviews before ordering.",
    ];
    return templates[itemId % templates.length];
  }

  if (reviewCount >= 1 && avgRating >= 3.0 && avgRating < 3.5) {
    const templates = [
      "A polarising pick — some love it, some don't.",
      "Opinions vary — see what reviewers say.",
    ];
    return templates[itemId % templates.length];
  }

  if (reviewCount >= 1 && avgRating >= 3.5 && avgRating < 4.0) {
    return "A reliable choice with solid ratings.";
  }

  if (reviewCount >= 1 && avgRating >= 4.0 && avgRating < 4.5) {
    return "Highly regarded by our customers.";
  }

  if (reviewCount >= 1) return `Rated ${avgRating.toFixed(1)}/5 by ${reviewCount} customer${reviewCount !== 1 ? "s" : ""}.`;
  if (totalOrders >= 5) return `A solid choice with ${totalOrders} orders so far.`;
  return null;
}

/**
 * Queries order + review data and writes tag / review_description to every menu item.
 * Uses a single bulk CASE WHEN SQL update and skips items with no changes.
 */
async function computeAllInsights() {
  if (isRunning) {
    console.log("[insights] Already running, skipping.");
    return;
  }
  isRunning = true;
  try {
    // All-time order counts per item (excluding cancelled)
    const [totalRows] = await sequelize.query(`
      SELECT oi.menu_item_id, COUNT(*) AS cnt
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('cancelled')
      GROUP BY oi.menu_item_id
    `);

    // Last-7-day order counts per item
    const [recentRows] = await sequelize.query(`
      SELECT oi.menu_item_id, COUNT(*) AS cnt
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('cancelled')
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY oi.menu_item_id
    `);

    // Review stats per item
    const [reviewRows] = await sequelize.query(`
      SELECT menu_item_id,
             AVG(rating)   AS avg_rating,
             COUNT(*)      AS review_count
      FROM reviews
      GROUP BY menu_item_id
    `);

    const totalMap  = Object.fromEntries(totalRows.map(r  => [r.menu_item_id, Number(r.cnt)]));
    const recentMap = Object.fromEntries(recentRows.map(r => [r.menu_item_id, Number(r.cnt)]));
    const reviewMap = Object.fromEntries(reviewRows.map(r => [
      r.menu_item_id,
      { avgRating: parseFloat(r.avg_rating) || 0, reviewCount: Number(r.review_count) },
    ]));

    const allTotals  = Object.values(totalMap);
    const allRecents = Object.values(recentMap);

    // Fetch current DB state for change detection
    const items = await MenuItem.findAll({
      attributes: ["id", "created_at", "category", "tag", "review_description", "avg_rating", "review_count"],
    });

    // Build per-category totals for category-relative Best Seller
    const allTotalsByCategory = {};
    for (const item of items) {
      const cat = item.category || "__uncategorized__";
      if (!allTotalsByCategory[cat]) allTotalsByCategory[cat] = [];
      allTotalsByCategory[cat].push(totalMap[item.id] ?? 0);
    }

    // Compute new insights and collect changed items only
    const updates = [];
    for (const item of items) {
      const totalOrders  = totalMap[item.id]  ?? 0;
      const recentOrders = recentMap[item.id] ?? 0;
      const { avgRating = 0, reviewCount = 0 } = reviewMap[item.id] ?? {};

      const tag  = getTag({
        totalOrders, recentOrders, avgRating, reviewCount,
        createdAt: item.created_at, allTotals, allRecents,
        category: item.category || "__uncategorized__",
        allTotalsByCategory,
      });
      const desc = getDescription({ totalOrders, recentOrders, avgRating, reviewCount, tag, itemId: item.id });
      const newAvgRating    = reviewCount > 0 ? avgRating : null;
      const newReviewCount  = reviewCount;

      // Skip if nothing changed (includes avg_rating and review_count)
      const sameTag    = item.tag                === tag;
      const sameDesc   = item.review_description  === desc;
      const sameRating = (item.avg_rating == null && newAvgRating == null)
                         || (item.avg_rating != null && newAvgRating != null
                             && Math.abs(parseFloat(item.avg_rating) - newAvgRating) < 0.005);
      const sameCount  = Number(item.review_count) === newReviewCount;
      if (sameTag && sameDesc && sameRating && sameCount) continue;

      updates.push({
        id: item.id,
        tag,
        review_description: desc,
        avg_rating: newAvgRating,
        review_count: newReviewCount,
      });
    }

    const skipped = items.length - updates.length;
    console.log(`[insights] ${updates.length} to update, ${skipped} unchanged.`);

    if (updates.length === 0) return;

    // Single bulk CASE WHEN update
    const ids = updates.map(u => u.id);
    const tagCases    = updates.map(u => `WHEN id = ${u.id} THEN ${u.tag               === null ? "NULL" : sequelize.escape(u.tag)}`).join(" ");
    const descCases   = updates.map(u => `WHEN id = ${u.id} THEN ${u.review_description === null ? "NULL" : sequelize.escape(u.review_description)}`).join(" ");
    const ratingCases = updates.map(u => `WHEN id = ${u.id} THEN ${u.avg_rating        === null ? "NULL" : u.avg_rating}`).join(" ");
    const countCases  = updates.map(u => `WHEN id = ${u.id} THEN ${u.review_count}`).join(" ");

    await sequelize.query(`
      UPDATE menu_items
      SET tag                = CASE ${tagCases}    ELSE tag                END,
          review_description = CASE ${descCases}   ELSE review_description END,
          avg_rating         = CASE ${ratingCases} ELSE avg_rating         END,
          review_count       = CASE ${countCases}  ELSE review_count       END,
          last_computed_at   = NOW()
      WHERE id IN (${ids.join(",")})
    `);

    console.log(`[insights] Bulk updated ${updates.length} items.`);

    // Update restaurant-level rating = avg of all its reviewed menu items
    await sequelize.query(`
      UPDATE restaurants r
      JOIN (
        SELECT mi.restaurant_id,
               AVG(rv.rating) AS avg_rating
        FROM reviews rv
        INNER JOIN menu_items mi ON mi.id = rv.menu_item_id
        GROUP BY mi.restaurant_id
      ) sub ON sub.restaurant_id = r.id
      SET r.rating = ROUND(sub.avg_rating, 2)
    `);

    console.log(`[insights] Restaurant ratings updated.`);
  } catch (err) {
    console.error("[insights] Error:", err.message);
  } finally {
    isRunning = false;
  }
}

module.exports = { computeAllInsights };
