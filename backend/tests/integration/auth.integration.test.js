/**
 * Integration tests — Auth endpoints
 * Requires a seeded test DB (see tests/setup.js globalSetup).
 */
const request = require("supertest");
const { app }  = require("../../server");
const db       = require("../../config/database");

let customerToken;

beforeAll(async () => {
  await db.connect();
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "customer@demo.com", password: "password123" });
  customerToken = res.body.data?.token;
}, 30000);

// ══════════════════════════════════════════════════════════════════════
// Register
// ══════════════════════════════════════════════════════════════════════
describe("POST /api/auth/register", () => {
  const uniqueEmail = `jest_auth_${Date.now()}@test.com`;

  test("201 — new user registered with token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "New User", email: uniqueEmail, password: "password123", role: "customer",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user).toHaveProperty("email", uniqueEmail);
  });

  test("409 — duplicate email rejected", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Dup", email: uniqueEmail, password: "password123",
    });
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("400 — missing required fields", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "x@x.com" });
    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Login
// ══════════════════════════════════════════════════════════════════════
describe("POST /api/auth/login", () => {
  test("200 — valid credentials return token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "customer@demo.com", password: "password123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user.role).toBe("customer");
  });

  test("401 — wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "customer@demo.com", password: "wrongpass",
    });
    expect(res.statusCode).toBe(401);
  });

  test("401 — non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@nowhere.com", password: "password123",
    });
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════
// GET /me
// ══════════════════════════════════════════════════════════════════════
describe("GET /api/auth/me", () => {
  test("200 — authenticated user gets own profile", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("email", "customer@demo.com");
    expect(res.body.data).not.toHaveProperty("password");
  });

  test("401 — missing token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });

  test("401 — invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════
// PUT /me
// ══════════════════════════════════════════════════════════════════════
describe("PUT /api/auth/me", () => {
  test("200 — name updated successfully", async () => {
    const res = await request(app)
      .put("/api/auth/me")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "John Updated" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe("John Updated");
  });

  test("401 — no auth token", async () => {
    const res = await request(app).put("/api/auth/me").send({ name: "X" });
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════
// PUT /change-password
// ══════════════════════════════════════════════════════════════════════
describe("PUT /api/auth/change-password", () => {
  test("401 — wrong current password", async () => {
    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ currentPassword: "wrongpass", newPassword: "newpass123" });
    expect(res.statusCode).toBe(401);
  });

  test("200 — correct current password", async () => {
    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ currentPassword: "password123", newPassword: "password123" });
    expect(res.statusCode).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════
// POST /forgot-password
// ══════════════════════════════════════════════════════════════════════
describe("POST /api/auth/forgot-password", () => {
  test("200 — always returns 200 regardless of email existence", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@nowhere.com" });
    expect(res.statusCode).toBe(200);
  });
});
