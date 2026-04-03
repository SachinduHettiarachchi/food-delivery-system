/**
 * Integration tests — Restaurants & Menu endpoints
 */
const request = require("supertest");
const { app }  = require("../../server");
const db       = require("../../config/database");

let adminToken, restaurantToken, customerToken;
let restaurantId, menuItemId, createdRestaurantId;

beforeAll(async () => {
  await db.connect();
  const [a, r, c] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: "admin@demo.com",      password: "password123" }),
    request(app).post("/api/auth/login").send({ email: "restaurant@demo.com", password: "password123" }),
    request(app).post("/api/auth/login").send({ email: "customer@demo.com",   password: "password123" }),
  ]);
  adminToken      = a.body.data?.token;
  restaurantToken = r.body.data?.token;
  customerToken   = c.body.data?.token;

  const list = await request(app).get("/api/restaurants");
  restaurantId = list.body.data?.[0]?.id;

  const menu = await request(app).get(`/api/restaurants/${restaurantId}/menu`);
  menuItemId = menu.body.data?.[0]?.id;
}, 30000);

// ══════════════════════════════════════════════════════════════════════
// GET /api/restaurants
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/restaurants", () => {
  test("200 — returns array of restaurants (public)", async () => {
    const res = await request(app).get("/api/restaurants");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/restaurants/:id
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/restaurants/:id", () => {
  test("200 — returns the correct restaurant", async () => {
    const res = await request(app).get(`/api/restaurants/${restaurantId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("id", restaurantId);
  });

  test("404 — unknown id", async () => {
    const res = await request(app).get("/api/restaurants/999999");
    expect(res.statusCode).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/restaurants/:restaurantId/menu
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/restaurants/:id/menu", () => {
  test("200 — returns menu items (public)", async () => {
    const res = await request(app).get(`/api/restaurants/${restaurantId}/menu`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/restaurants/my/restaurants
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/restaurants/my/restaurants", () => {
  test("200 — restaurant_admin gets their own restaurants", async () => {
    const res = await request(app)
      .get("/api/restaurants/my/restaurants")
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("403 — customer is forbidden", async () => {
    const res = await request(app)
      .get("/api/restaurants/my/restaurants")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════
// POST /api/restaurants
// ══════════════════════════════════════════════════════════════════════
describe("POST /api/restaurants", () => {
  test("201 — restaurant_admin creates a restaurant", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ name: "Integration Test Rest", address: "99 Test Road", phone: "0700000001", cuisine_type: "Fusion" });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    createdRestaurantId = res.body.data.id;
  });

  test("400 — missing required fields", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ name: "No Address" });
    expect(res.statusCode).toBe(400);
  });

  test("403 — customer cannot create restaurant", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Sneaky", address: "X", phone: "0700000000" });
    expect(res.statusCode).toBe(403);
  });

  test("401 — unauthenticated request rejected", async () => {
    const res = await request(app)
      .post("/api/restaurants")
      .send({ name: "Anon", address: "Y", phone: "0700000000" });
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════
// PUT /api/restaurants/:id
// ══════════════════════════════════════════════════════════════════════
describe("PUT /api/restaurants/:id", () => {
  test("200 — restaurant_admin updates own restaurant", async () => {
    if (!createdRestaurantId) return;
    const res = await request(app)
      .put(`/api/restaurants/${createdRestaurantId}`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ name: "Integration Test Rest Updated" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe("Integration Test Rest Updated");
  });
});

// ══════════════════════════════════════════════════════════════════════
// POST /api/restaurants/:restaurantId/menu
// ══════════════════════════════════════════════════════════════════════
describe("POST /api/restaurants/:id/menu", () => {
  test("201 — restaurant_admin adds a menu item", async () => {
    const res = await request(app)
      .post(`/api/restaurants/${restaurantId}/menu`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ name: "Test Dish", price: 750, category: "Mains", preparation_time: 10 });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("id");
  });

  test("400 — missing price", async () => {
    const res = await request(app)
      .post(`/api/restaurants/${restaurantId}/menu`)
      .set("Authorization", `Bearer ${restaurantToken}`)
      .send({ name: "No Price" });
    expect(res.statusCode).toBe(400);
  });

  test("403 — customer cannot add menu item", async () => {
    const res = await request(app)
      .post(`/api/restaurants/${restaurantId}/menu`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Sneaky Item", price: 100 });
    expect(res.statusCode).toBe(403);
  });
});
