/**
 * Integration tests — Orders endpoints
 */
const request = require("supertest");
const { app }  = require("../../server");
const db       = require("../../config/database");

let customerToken, restaurantToken, adminToken;
let restaurantId, menuItemId, orderId;

beforeAll(async () => {
  await db.connect();
  const [c, r, a] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: "customer@demo.com",   password: "password123" }),
    request(app).post("/api/auth/login").send({ email: "restaurant@demo.com", password: "password123" }),
    request(app).post("/api/auth/login").send({ email: "admin@demo.com",      password: "password123" }),
  ]);
  customerToken   = c.body.data?.token;
  restaurantToken = r.body.data?.token;
  adminToken      = a.body.data?.token;

  const list = await request(app).get("/api/restaurants");
  restaurantId = list.body.data?.[0]?.id;

  const menu = await request(app).get(`/api/restaurants/${restaurantId}/menu`);
  menuItemId = menu.body.data?.[0]?.id;
}, 30000);

// ══════════════════════════════════════════════════════════════════════
// POST /api/orders — placeOrder
// ══════════════════════════════════════════════════════════════════════
describe("POST /api/orders", () => {
  test("201 — customer places an order successfully", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurant_id:    restaurantId,
        items:            [{ menu_item_id: menuItemId, quantity: 2 }],
        delivery_address: "45 Test Road, Colombo",
        delivery_notes:   "Ring the bell",
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.status).toBe("pending");
    orderId = res.body.data.id;
  });

  test("400 — empty items array rejected", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurant_id: restaurantId, items: [], delivery_address: "Somewhere" });
    expect(res.statusCode).toBe(400);
  });

  test("400 — missing delivery_address", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ restaurant_id: restaurantId, items: [{ menu_item_id: menuItemId, quantity: 1 }] });
    expect(res.statusCode).toBe(400);
  });

  test("403 — restaurant_admin cannot place order", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ restaurant_id: restaurantId, items: [{ menu_item_id: menuItemId, quantity: 1 }], delivery_address: "x" });
    expect(res.statusCode).toBe(403);
  });

  test("401 — unauthenticated request rejected", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ restaurant_id: restaurantId, items: [{ menu_item_id: menuItemId, quantity: 1 }], delivery_address: "x" });
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/orders/my
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/orders/my", () => {
  test("200 — customer sees their orders", async () => {
    const res = await request(app)
      .get("/api/orders/my")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("401 — no token rejected", async () => {
    const res = await request(app).get("/api/orders/my");
    expect(res.statusCode).toBe(401);
  });

  test("403 — restaurant_admin cannot use customer endpoint", async () => {
    const res = await request(app)
      .get("/api/orders/my")
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/orders/:id — ownership check
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/orders/:id", () => {
  test("200 — customer retrieves their own order", async () => {
    if (!orderId) return;
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(orderId);
  });

  test("404 — non-existent order", async () => {
    const res = await request(app)
      .get("/api/orders/999999")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(404);
  });

  test("200 — system_admin can view any order", async () => {
    if (!orderId) return;
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/orders/restaurant/:restaurantId
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/orders/restaurant/:restaurantId", () => {
  test("200 — restaurant_admin views their restaurant's orders", async () => {
    const res = await request(app)
      .get(`/api/orders/restaurant/${restaurantId}`)
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("403 — customer cannot view restaurant orders", async () => {
    const res = await request(app)
      .get(`/api/orders/restaurant/${restaurantId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════
// PATCH /api/orders/:id/status
// ══════════════════════════════════════════════════════════════════════
describe("PATCH /api/orders/:id/status", () => {
  test("200 — restaurant_admin advances order to confirmed", async () => {
    if (!orderId) return;
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ status: "confirmed" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("confirmed");
  });

  test("400 — invalid status value", async () => {
    if (!orderId) return;
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ status: "teleported" });
    expect(res.statusCode).toBe(400);
  });

  test("403 — customer cannot update status", async () => {
    if (!orderId) return;
    const res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: "delivered" });
    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════
// POST /api/orders/:id/cancel
// ══════════════════════════════════════════════════════════════════════
describe("POST /api/orders/:id/cancel", () => {
  let cancelOrderId;

  beforeAll(async () => {
    // Place a fresh pending order to cancel
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurant_id:    restaurantId,
        items:            [{ menu_item_id: menuItemId, quantity: 1 }],
        delivery_address: "Cancel Test Road",
      });
    cancelOrderId = res.body.data?.id;
  });

  test("200 — customer cancels their own pending order", async () => {
    if (!cancelOrderId) return;
    const res = await request(app)
      .post(`/api/orders/${cancelOrderId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe("cancelled");
  });

  test("400 — cannot cancel an already-confirmed order", async () => {
    if (!orderId) return;
    // orderId was confirmed in a previous test
    const res = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(400);
  });
});
