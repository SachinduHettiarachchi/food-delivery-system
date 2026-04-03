/**
 * Integration tests — Admin endpoints
 */
const request = require("supertest");
const { app }  = require("../../server");
const db       = require("../../config/database");

let adminToken, customerToken, restaurantToken;
let targetUserId;

beforeAll(async () => {
  await db.connect();
  const [a, c, r] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: "admin@demo.com",      password: "password123" }),
    request(app).post("/api/auth/login").send({ email: "customer@demo.com",   password: "password123" }),
    request(app).post("/api/auth/login").send({ email: "restaurant@demo.com", password: "password123" }),
  ]);
  adminToken      = a.body.data?.token;
  customerToken   = c.body.data?.token;
  restaurantToken = r.body.data?.token;

  // Register a throwaway user we can safely deactivate
  const reg = await request(app).post("/api/auth/register").send({
    name: "Deactivate Me", email: `deactivate_${Date.now()}@test.com`, password: "password123", role: "customer",
  });
  targetUserId = reg.body.data?.user?.id;
}, 30000);

// ══════════════════════════════════════════════════════════════════════
// GET /api/admin/dashboard
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/admin/dashboard", () => {
  test("200 — system_admin gets dashboard stats", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  test("403 — customer is forbidden", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("401 — unauthenticated request rejected", async () => {
    const res = await request(app).get("/api/admin/dashboard");
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/admin/users
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/admin/users", () => {
  test("200 — system_admin gets all users", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("403 — restaurant_admin is forbidden", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${restaurantToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("403 — customer is forbidden", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/admin/users/role/:role
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/admin/users/role/:role", () => {
  test("200 — returns only customers", async () => {
    const res = await request(app)
      .get("/api/admin/users/role/customer")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach(u => expect(u.role).toBe("customer"));
  });

  test("200 — returns only restaurant_admins", async () => {
    const res = await request(app)
      .get("/api/admin/users/role/restaurant_admin")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// DELETE /api/admin/users/:id  (soft deactivate)
// ══════════════════════════════════════════════════════════════════════
describe("DELETE /api/admin/users/:id", () => {
  test("200 — system_admin deactivates a user", async () => {
    if (!targetUserId) return;
    const res = await request(app)
      .delete(`/api/admin/users/${targetUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("403 — customer cannot deactivate users", async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${targetUserId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/admin/restaurants
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/admin/restaurants", () => {
  test("200 — system_admin gets all restaurants", async () => {
    const res = await request(app)
      .get("/api/admin/restaurants")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /api/admin/orders
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/admin/orders", () => {
  test("200 — system_admin gets all orders", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("403 — customer is forbidden", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});
