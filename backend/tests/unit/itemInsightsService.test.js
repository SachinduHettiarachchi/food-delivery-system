/**
 * Unit tests — itemInsightsService
 *
 * The service calls db.getSequelize() at module-load time, so we must
 * provide a mock sequelize instance inside the jest.mock() factory
 * (which runs before the module is first required).
 */

// Build a stable mock sequelize object inside the factory so it is
// available before any require() runs.
jest.mock("../../config/database", () => {
  const mockSeq = {
    query:  jest.fn(),
    escape: jest.fn((s) => `'${String(s)}'`),
  };
  // Attach to module so tests can reach it via db.__seq
  return { getSequelize: () => mockSeq, __seq: mockSeq };
});

jest.mock("../../models", () => ({
  MenuItem: { findAll: jest.fn() },
}));

const db         = require("../../config/database");
const { MenuItem } = require("../../models");
const { computeAllInsights } = require("../../services/itemInsightsService");

const mockQuery = db.__seq.query;

// ── Helpers ──────────────────────────────────────────────────────────

/** Three empty SELECT results (totalRows, recentRows, reviewRows) */
const emptySelects = () => {
  mockQuery
    .mockResolvedValueOnce([[]])   // totalRows
    .mockResolvedValueOnce([[]])   // recentRows
    .mockResolvedValueOnce([[]]); // reviewRows
};

/** A menu item with all insight fields already at their "no-data" defaults */
const staleItem = (overrides = {}) => ({
  id: 1,
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days old
  category: "Mains",
  tag: null,
  review_description: null,
  avg_rating: null,
  review_count: 0,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════
// Basic execution
// ══════════════════════════════════════════════════════════════════════
describe("computeAllInsights", () => {
  test("resolves without error when there are no menu items", async () => {
    emptySelects();
    MenuItem.findAll.mockResolvedValue([]);
    await expect(computeAllInsights()).resolves.toBeUndefined();
  });

  test("runs the three expected SELECT queries", async () => {
    emptySelects();
    MenuItem.findAll.mockResolvedValue([]);
    await computeAllInsights();
    expect(mockQuery).toHaveBeenCalledTimes(3);
    const calls = mockQuery.mock.calls.map((c) => String(c[0]));
    expect(calls[0]).toMatch(/order_items/i);
    expect(calls[1]).toMatch(/DATE_SUB|INTERVAL/i);
    expect(calls[2]).toMatch(/reviews/i);
  });

  // ── Skip-if-nothing-changed ──────────────────────────────────────
  test("does NOT run an UPDATE when computed values match stored values", async () => {
    // 0 orders, 0 reviews → tag=null, desc=null, avgRating=null, count=0
    // The staleItem already has those values stored → nothing changed
    emptySelects();
    MenuItem.findAll.mockResolvedValue([staleItem()]);
    await computeAllInsights();
    const updateCalls = mockQuery.mock.calls.filter((c) =>
      String(c[0]).includes("UPDATE menu_items")
    );
    expect(updateCalls).toHaveLength(0);
  });

  // ── Update when tag changes ──────────────────────────────────────
  test("runs UPDATE when an item's tag or description changes", async () => {
    // item was created 1 day ago → qualifies for "✨ New" tag
    // stored tag is null → something changed → UPDATE should fire
    mockQuery
      .mockResolvedValueOnce([[]])  // totalRows
      .mockResolvedValueOnce([[]])  // recentRows
      .mockResolvedValueOnce([[]])  // reviewRows
      .mockResolvedValueOnce([{}]) // UPDATE menu_items
      .mockResolvedValueOnce([{}]); // UPDATE restaurants

    const newItem = staleItem({
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day old → "✨ New"
      tag: null, // stored as null, computed will be "✨ New"
    });
    MenuItem.findAll.mockResolvedValue([newItem]);

    await computeAllInsights();

    const updateCalls = mockQuery.mock.calls.filter((c) =>
      String(c[0]).includes("UPDATE menu_items")
    );
    expect(updateCalls.length).toBeGreaterThan(0);
  });

  // ── Reentrancy guard ─────────────────────────────────────────────
  test("does not run concurrently (second call is a no-op while first is pending)", async () => {
    emptySelects();
    MenuItem.findAll.mockResolvedValue([]);

    // First call starts and is awaiting async queries; second call
    // should see isRunning=true and return immediately without
    // making any additional DB calls.
    const first  = computeAllInsights();
    const second = computeAllInsights(); // should skip

    await Promise.all([first, second]);

    // Only 3 SELECT calls — those from the single run that completed
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  // ── "✨ New" tag logic ───────────────────────────────────────────
  test("assigns '✨ New' tag to items created within 14 days", async () => {
    mockQuery
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    const freshItem = staleItem({
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days old
      tag: null,
    });
    MenuItem.findAll.mockResolvedValue([freshItem]);

    await computeAllInsights();

    const updateSql = mockQuery.mock.calls.find((c) =>
      String(c[0]).includes("UPDATE menu_items")
    );
    expect(updateSql).toBeDefined();
    expect(String(updateSql[0])).toContain("New");
  });

  // ── "⭐ Top Rated" tag logic ─────────────────────────────────────
  test("assigns '⭐ Top Rated' tag when Bayesian score ≥ 4.0 and ≥ 8 reviews", async () => {
    mockQuery
      .mockResolvedValueOnce([[]])  // totalRows (no order data needed)
      .mockResolvedValueOnce([[]])  // recentRows
      .mockResolvedValueOnce([[{ menu_item_id: 1, avg_rating: "4.8", review_count: "100" }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    MenuItem.findAll.mockResolvedValue([staleItem({ tag: null, review_description: null })]);

    await computeAllInsights();

    const updateSql = mockQuery.mock.calls.find((c) =>
      String(c[0]).includes("UPDATE menu_items")
    );
    expect(updateSql).toBeDefined();
    expect(String(updateSql[0])).toContain("Top Rated");
  });

  // ── Error handling ───────────────────────────────────────────────
  test("does not throw — logs error and resets isRunning on DB failure", async () => {
    mockQuery.mockRejectedValueOnce(new Error("Connection lost"));
    MenuItem.findAll.mockResolvedValue([]);

    // Should not throw even if the query fails
    await expect(computeAllInsights()).resolves.toBeUndefined();

    // After failure, isRunning must be reset so subsequent calls can run
    emptySelects();
    MenuItem.findAll.mockResolvedValue([]);
    await expect(computeAllInsights()).resolves.toBeUndefined();
  });
});
