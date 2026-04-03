/**
 * Integration tests — Reviews endpoints
 *
 * Reviews require a DELIVERED order. We place an order then force its
 * status to "delivered" via the admin/restaurant_admin status endpoint.
 */
const request = require("supertest");
const { app }  = require("../../server");
const db       = require("../../config/database");

let customerToken, restaurantToken;
let restaurantId, menuItemId, deliveredOrderId;

beforeAll(async () => {
  await db.connect();
  const [c, r] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: "customer@demo.com",   password: "password123" }),
    request(app).post("/api/auth/login").send({ email: "restaurant@demo.com", password: "password123" }),
  ]);
  customerToken   = c.body.data?.token;
  restaurantToken = r.body.data?.token;

  const list = await request(app).get("/api/restaurants");
  restaurantId = list.body.data?.[0]?.id;

  const menu = await request(app).get(`/api/restaurants/${restaurantId}/menu`);
  menuItemId = menu.body.data?.[0]?.id;

  // Place an order and fast-forward it to delivered
  const placed = await request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({
      restaurant_id: restaurantId,
      items: [{ menu_item_id: menuItemId, quantity: 1 }],
      delivery_address: "Review Test Lane",
    });
  const oid = placed.body.data?.id;

  for (const status of ["confirmed", "preparing", "out_for_delivery", "delivered"]) {
    await request(app)
      .patch(`/api/orders/${oid}/status`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ status });
  }
  deliveredOrderId = oid;
}, 30000);

// ══════════════════════════════════════════════════════════════════════
// GET /api/reviews/menu/:menuItemId  (public)
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/reviews/menu/:menuItemId", () => {
  test("200 — returns array (may be empty) for any menu item", async () => {
    const res = await request(app).get(`/api/reviews/menu/${menuItemId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// POST /api/reviews — guard-rails
// ══════════════════════════════════════════════════════════════════════
describe("POST /api/reviews — guard-rails", () => {
  test("400 — rating below 1 rejected", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ order_id: deliveredOrderId, menu_item_id: menuItemId, rating: 0 });
    expect(res.statusCode).toBe(400);
  });

  test("400 — rating above 5 rejected", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ order_id: deliveredOrderId, menu_item_id: menuItemId, rating: 6 });
    expect(res.statusCode).toBe(400);
  });

  test("403 — restaurant_admin cannot create review", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ order_id: deliveredOrderId, menu_item_id: menuItemId, rating: 5 });
    expect(res.statusCode).toBe(403);
  });

  test("401 — unauthenticated request rejected", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({ order_id: deliveredOrderId, menu_item_id: menuItemId, rating: 4 });
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════
// POST /api/reviews — success + duplicate prevention
// ══════════════════════════════════════════════════════════════════════
describe("POST /api/reviews — create and duplicate prevention", () => {
  test("201 — customer submits a valid review for delivered order", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ order_id: deliveredOrderId, menu_item_id: menuItemId, rating: 5, comment: "Excellent!" });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.rating).toBe(5);
  });

  test("409 — duplicate review for same order + item rejected", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ order_id: deliveredOrderId, menu_item_id: menuItemId, rating: 3, comment: "Again" });
    expect(res.statusCode).toBe(409);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/reviews/order/:orderId
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/reviews/order/:orderId", () => {
  test("200 — customer sees their reviews for the order", async () => {
    const res = await request(app)
      .get(`/api/reviews/order/${deliveredOrderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("401 — unauthenticated request rejected", async () => {
    const res = await request(app).get(`/api/reviews/order/${deliveredOrderId}`);
    expect(res.statusCode).toBe(401);
  });
});
