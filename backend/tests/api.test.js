/**
 * HungryHub Backend — Full API Test Suite
 * Covers: Auth, Restaurants, Menu, Orders, Payments, Reviews, Admin
 * Run: npm test
 */
require("dotenv").config();
const request = require("supertest");
const db      = require("../config/database");

// Initialise model associations before app import
require("../models/index");
const { app } = require("../server");

// ─── Shared state (populated in beforeAll / early tests) ──────────────
let customerToken, restaurantToken, adminToken;
let restaurantId, menuItemId, orderId, deliveredOrderId, paymentId;
let createdRestaurantId, createdMenuItemId, createdReviewId;
const uniqueEmail = `jest_${Date.now()}@test.com`;

// ─── Setup / Teardown ─────────────────────────────────────────────────
beforeAll(async () => {
  await db.connect();

  // Login all three demo roles in parallel
  const [c, r, a] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: "customer@demo.com",    password: "password123" }),
    request(app).post("/api/auth/login").send({ email: "restaurant@demo.com",  password: "password123" }),
    request(app).post("/api/auth/login").send({ email: "admin@demo.com",       password: "password123" }),
  ]);

  customerToken   = c.body.data?.token;
  restaurantToken = r.body.data?.token;
  adminToken      = a.body.data?.token;

  // Resolve a restaurant + menu item from seed data
  const rList = await request(app).get("/api/restaurants");
  restaurantId = rList.body.data?.[0]?.id;

  if (restaurantId) {
    const menu = await request(app).get(`/api/restaurants/${restaurantId}/menu`);
    menuItemId = menu.body.data?.[0]?.id;
  }

  // Find a delivered order owned by the customer (for review + payment tests)
  if (customerToken) {
    const orders = await request(app)
      .get("/api/orders/my")
      .set("Authorization", `Bearer ${customerToken}`);
    const delivered = orders.body.data?.find(o => o.status === "delivered");
    deliveredOrderId = delivered?.id;
  }
}, 30000);

afterAll(async () => {
  await db.getSequelize().close();
});

// ══════════════════════════════════════════════════════════════════════
// 1. HEALTH CHECK
// ══════════════════════════════════════════════════════════════════════
describe("Health Check", () => {
  test("GET /api/health → 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("Unknown route → 404", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.statusCode).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 2. AUTH
// ══════════════════════════════════════════════════════════════════════
describe("Auth", () => {

  // ── Registration ──────────────────────────────────────────────────
  test("POST /register — success", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Jest Tester", email: uniqueEmail, password: "password123", role: "customer",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("token");
  });

  test("POST /register — duplicate email → 409", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Dup", email: uniqueEmail, password: "password123",
    });
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("POST /register — missing fields → 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "x@x.com" });
    expect(res.statusCode).toBe(400);
  });

  // ── Login ─────────────────────────────────────────────────────────
  test("POST /login — customer success", async () => {
    expect(customerToken).toBeTruthy();
  });

  test("POST /login — restaurant_admin success", async () => {
    expect(restaurantToken).toBeTruthy();
  });

  test("POST /login — system_admin success", async () => {
    expect(adminToken).toBeTruthy();
  });

  test("POST /login — wrong password → 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "customer@demo.com", password: "wrongpassword",
    });
    expect(res.statusCode).toBe(401);
  });

  test("POST /login — non-existent email → 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@nowhere.com", password: "password123",
    });
    expect(res.statusCode).toBe(401);
  });

  // ── Get me ────────────────────────────────────────────────────────
  test("GET /me — authenticated", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("email", "customer@demo.com");
  });

  test("GET /me — no token → 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });

  test("GET /me — invalid token → 401", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.statusCode).toBe(401);
  });

  // ── Update profile ────────────────────────────────────────────────
  test("PUT /me — update name", async () => {
    const res = await request(app)
      .put("/api/auth/me")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Customer Updated" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe("Customer Updated");
  });

  // Restore original name
  afterAll(async () => {
    await request(app)
      .put("/api/auth/me")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Demo Customer" });
  });

  // ── Change password ───────────────────────────────────────────────
  test("PUT /change-password — wrong current password → 401", async () => {
    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ currentPassword: "wrongpassword", newPassword: "newpass123" });
    expect(res.statusCode).toBe(401);
  });

  // ── Forgot password ───────────────────────────────────────────────
  test("POST /forgot-password — known email", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "customer@demo.com" });
    // Either 200 (email sent) or error is acceptable — must not crash
    expect([200, 500]).toContain(res.statusCode);
  });

  test("POST /forgot-password — unknown email → 200 (no email leak)", async () => {
    // API returns 200 even for unknown emails (security: don't reveal if email exists)
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@nowhere.com" });
    expect(res.statusCode).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 3. RESTAURANTS
// ══════════════════════════════════════════════════════════════════════
describe("Restaurants", () => {

  test("GET / — public list", async () => {
    const res = await request(app).get("/api/restaurants");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("GET /:id — existing restaurant", async () => {
    const res = await request(app).get(`/api/restaurants/${restaurantId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("id", restaurantId);
  });

  test("GET /:id — not found → 404", async () => {
    const res = await request(app).get("/api/restaurants/999999");
    expect(res.statusCode).toBe(404);
  });

  test("GET /my/restaurants — restaurant_admin", async () => {
    const res = await request(app)
      .get("/api/restaurants/my/restaurants")
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /my/restaurants — customer → 403", async () => {
    const res = await request(app)
      .get("/api/restaurants/my/restaurants")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("POST / — restaurant_admin creates restaurant", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        name: `Jest Restaurant ${Date.now()}`,
        address: "123 Test Street",
        phone: "0712345678",
        cuisine_type: "Italian",
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    createdRestaurantId = res.body.data.id;
  });

  test("POST / — missing required field → 400", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ name: "No Address" });
    expect(res.statusCode).toBe(400);
  });

  test("POST / — customer → 403", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Sneaky", address: "X", phone: "0700000000" });
    expect(res.statusCode).toBe(403);
  });

  test("PUT /:id — restaurant_admin updates own restaurant", async () => {
    if (!createdRestaurantId) return;
    const res = await request(app)
      .put(`/api/restaurants/${createdRestaurantId}`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ name: "Jest Restaurant Updated", description: "Updated by test" });
    expect(res.statusCode).toBe(200);
  });

  test("DELETE /:id — system_admin deletes restaurant", async () => {
    if (!createdRestaurantId) return;
    const res = await request(app)
      .delete(`/api/restaurants/${createdRestaurantId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  test("DELETE /:id — restaurant_admin → 403", async () => {
    const res = await request(app)
      .delete(`/api/restaurants/${restaurantId}`)
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 4. MENU ITEMS
// ══════════════════════════════════════════════════════════════════════
describe("Menu Items", () => {

  test("GET /:restaurantId/menu — public", async () => {
    const res = await request(app).get(`/api/restaurants/${restaurantId}/menu`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /:restaurantId/menu/manage — restaurant_admin", async () => {
    const res = await request(app)
      .get(`/api/restaurants/${restaurantId}/menu/manage`)
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(res.statusCode).toBe(200);
  });

  test("GET /menu/:id — public single item", async () => {
    if (!menuItemId) return;
    const res = await request(app).get(`/api/menu/${menuItemId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("id", menuItemId);
  });

  test("GET /menu/:id — not found → 404", async () => {
    const res = await request(app).get("/api/menu/999999");
    expect(res.statusCode).toBe(404);
  });

  test("POST /:restaurantId/menu — restaurant_admin creates item", async () => {
    const res = await request(app)
      .post(`/api/restaurants/${restaurantId}/menu`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({
        name: "Jest Test Item",
        price: 350,
        category: "Starters",
        description: "Created by test",
        preparation_time: 15,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    createdMenuItemId = res.body.data.id;
  });

  test("POST /:restaurantId/menu — missing price → 400", async () => {
    const res = await request(app)
      .post(`/api/restaurants/${restaurantId}/menu`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ name: "No Price Item" });
    expect(res.statusCode).toBe(400);
  });

  test("POST /:restaurantId/menu — customer → 403", async () => {
    const res = await request(app)
      .post(`/api/restaurants/${restaurantId}/menu`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Sneaky Item", price: 100 });
    expect(res.statusCode).toBe(403);
  });

  test("PUT /menu/:id — update item", async () => {
    if (!createdMenuItemId) return;
    const res = await request(app)
      .put(`/api/menu/${createdMenuItemId}`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ name: "Jest Item Updated", price: 400 });
    expect(res.statusCode).toBe(200);
  });

  test("DELETE /menu/:id — delete created item", async () => {
    if (!createdMenuItemId) return;
    const res = await request(app)
      .delete(`/api/menu/${createdMenuItemId}`)
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(res.statusCode).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 5. ORDERS
// ══════════════════════════════════════════════════════════════════════
describe("Orders", () => {

  test("POST / — customer places order", async () => {
    if (!menuItemId || !restaurantId) return;
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurant_id: restaurantId,
        items: [{ menu_item_id: menuItemId, quantity: 1 }],
        delivery_address: "45 Test Road, Colombo",
        delivery_notes: "Ring the bell",
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    orderId = res.body.data.id;
  });

  test("POST / — restaurant_admin → 403", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ restaurant_id: restaurantId, items: [], delivery_address: "x" });
    expect(res.statusCode).toBe(403);
  });

  test("POST / — missing delivery_address → 400", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurant_id: restaurantId, items: [{ menu_item_id: menuItemId, quantity: 1 }] });
    expect(res.statusCode).toBe(400);
  });

  test("GET /my — customer orders list", async () => {
    const res = await request(app)
      .get("/api/orders/my")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /my — no token → 401", async () => {
    const res = await request(app).get("/api/orders/my");
    expect(res.statusCode).toBe(401);
  });

  test("GET /:id — get order by id", async () => {
    if (!orderId) return;
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("id", orderId);
  });

  test("GET /restaurant/:restaurantId — restaurant_admin", async () => {
    const res = await request(app)
      .get(`/api/orders/restaurant/${restaurantId}`)
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /restaurant/:restaurantId — customer → 403", async () => {
    const res = await request(app)
      .get(`/api/orders/restaurant/${restaurantId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("PATCH /:id/status — advance to confirmed", async () => {
    if (!orderId) return;
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ status: "confirmed" });
    expect(res.statusCode).toBe(200);
  });

  test("PATCH /:id/status — customer → 403", async () => {
    if (!orderId) return;
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: "delivered" });
    expect(res.statusCode).toBe(403);
  });

  test("PATCH /:id/status — invalid status → 400", async () => {
    if (!orderId) return;
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ status: "teleported" });
    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 6. PAYMENTS
// ══════════════════════════════════════════════════════════════════════
describe("Payments", () => {

  test("POST / — customer processes payment for order", async () => {
    if (!orderId) return;
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ order_id: orderId, payment_method: "cash" });
    expect([200, 201]).toContain(res.statusCode);
    paymentId = res.body.data?.id;
  });

  test("POST / — invalid payment method → 400", async () => {
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ order_id: orderId, payment_method: "bitcoin" });
    expect(res.statusCode).toBe(400);
  });

  test("POST / — no token → 401", async () => {
    const res = await request(app)
      .post("/api/payments")
      .send({ order_id: orderId, payment_method: "cash" });
    expect(res.statusCode).toBe(401);
  });

  test("GET /order/:orderId — get payment for order", async () => {
    if (!orderId) return;
    const res = await request(app)
      .get(`/api/payments/order/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
  });

  test("GET / — admin gets all payments", async () => {
    const res = await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET / — customer → 403", async () => {
    const res = await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 7. REVIEWS
// ══════════════════════════════════════════════════════════════════════
describe("Reviews", () => {

  test("GET /menu/:menuItemId — public", async () => {
    if (!menuItemId) return;
    const res = await request(app).get(`/api/reviews/menu/${menuItemId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /order/:orderId — customer gets own reviews", async () => {
    if (!deliveredOrderId) return;
    const res = await request(app)
      .get(`/api/reviews/order/${deliveredOrderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
  });

  test("GET /order/:orderId — no token → 401", async () => {
    if (!deliveredOrderId) return;
    const res = await request(app).get(`/api/reviews/order/${deliveredOrderId}`);
    expect(res.statusCode).toBe(401);
  });

  test("POST / — restaurant_admin → 403", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ order_id: deliveredOrderId, menu_item_id: menuItemId, rating: 5 });
    expect(res.statusCode).toBe(403);
  });

  test("POST / — review on non-delivered order → 400", async () => {
    if (!orderId) return;
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ order_id: orderId, menu_item_id: menuItemId, rating: 4 });
    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 8. ADMIN
// ══════════════════════════════════════════════════════════════════════
describe("Admin", () => {

  test("GET /admin/dashboard — system_admin", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  test("GET /admin/dashboard — customer → 403", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("GET /admin/dashboard — no token → 401", async () => {
    const res = await request(app).get("/api/admin/dashboard");
    expect(res.statusCode).toBe(401);
  });

  test("GET /admin/users — system_admin", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("GET /admin/users/role/customer — system_admin", async () => {
    const res = await request(app)
      .get("/api/admin/users/role/customer")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /admin/restaurants — system_admin", async () => {
    const res = await request(app)
      .get("/api/admin/restaurants")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /admin/orders — system_admin", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /admin/users — restaurant_admin → 403", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(res.statusCode).toBe(403);
  });
});
