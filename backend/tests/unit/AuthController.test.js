/**
 * Unit tests — AuthController
 * All external dependencies (UserRepository, bcryptjs, jwt, nodemailer) are mocked.
 */

jest.mock("../../repositories/UserRepository");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-msg-id" }),
  })),
}));

const bcrypt       = require("bcryptjs");
const jwt          = require("jsonwebtoken");
const UserRepo     = require("../../repositories/UserRepository");
const controller   = require("../../controllers/AuthController");

// ── Helpers ──────────────────────────────────────────────────────────
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const next = jest.fn();

const FAKE_USER = {
  id: 1, name: "Alice", email: "alice@test.com",
  role: "customer", is_active: true, password: "hashed_pw",
};

// ── Setup ─────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET      = "test-secret";
  process.env.BCRYPT_ROUNDS   = "10";
  process.env.FRONTEND_URL    = "http://localhost:3000";
  // Provide sensible defaults so happy-path tests don't need to re-stub
  bcrypt.hash.mockResolvedValue("hashed_pw");
  bcrypt.compare.mockResolvedValue(true);
  jwt.sign.mockReturnValue("fake_jwt_token");
  jwt.verify.mockReturnValue({ id: 1, purpose: "password_reset" });
});

// ══════════════════════════════════════════════════════════════════════
// register
// ══════════════════════════════════════════════════════════════════════
describe("register", () => {
  test("returns 409 when email already registered", async () => {
    UserRepo.findByEmail.mockResolvedValue(FAKE_USER);
    const req = { body: { name: "Bob", email: "alice@test.com", password: "pass" } };
    const res = makeRes();
    await controller.register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test("returns 201 and a token on success", async () => {
    UserRepo.findByEmail.mockResolvedValue(null);
    UserRepo.create.mockResolvedValue(FAKE_USER);
    const req = { body: { name: "Bob", email: "bob@test.com", password: "pass", role: "customer" } };
    const res = makeRes();
    await controller.register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ token: "fake_jwt_token" }) })
    );
  });

  test("calls next(error) on unexpected error", async () => {
    UserRepo.findByEmail.mockRejectedValue(new Error("DB error"));
    const req = { body: { name: "X", email: "x@x.com", password: "p" } };
    const res = makeRes();
    await controller.register(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ══════════════════════════════════════════════════════════════════════
// login
// ══════════════════════════════════════════════════════════════════════
describe("login", () => {
  test("returns 401 when user not found", async () => {
    UserRepo.findByEmail.mockResolvedValue(null);
    const req = { body: { email: "nobody@x.com", password: "pass" } };
    const res = makeRes();
    await controller.login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("returns 401 when user is inactive", async () => {
    UserRepo.findByEmail.mockResolvedValue({ ...FAKE_USER, is_active: false });
    const req = { body: { email: "alice@test.com", password: "pass" } };
    const res = makeRes();
    await controller.login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("returns 401 when password is wrong", async () => {
    UserRepo.findByEmail.mockResolvedValue(FAKE_USER);
    bcrypt.compare.mockResolvedValue(false);
    const req = { body: { email: "alice@test.com", password: "wrongpass" } };
    const res = makeRes();
    await controller.login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("returns 200 with token on success", async () => {
    UserRepo.findByEmail.mockResolvedValue(FAKE_USER);
    bcrypt.compare.mockResolvedValue(true);
    const req = { body: { email: "alice@test.com", password: "pass" } };
    const res = makeRes();
    await controller.login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ token: "fake_jwt_token" }) })
    );
  });
});

// ══════════════════════════════════════════════════════════════════════
// getMe
// ══════════════════════════════════════════════════════════════════════
describe("getMe", () => {
  test("returns 200 with user data", async () => {
    UserRepo.findById.mockResolvedValue(FAKE_USER);
    const req = { user: { id: 1 } };
    const res = makeRes();
    await controller.getMe(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ══════════════════════════════════════════════════════════════════════
// updateMe
// ══════════════════════════════════════════════════════════════════════
describe("updateMe", () => {
  test("returns 200 with updated user", async () => {
    const updated = { ...FAKE_USER, name: "Alice Updated" };
    UserRepo.update.mockResolvedValue(updated);
    const req = { user: { id: 1 }, body: { name: "Alice Updated" } };
    const res = makeRes();
    await controller.updateMe(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: "Alice Updated" }) })
    );
  });
});

// ══════════════════════════════════════════════════════════════════════
// changePassword
// ══════════════════════════════════════════════════════════════════════
describe("changePassword", () => {
  test("returns 401 if current password is wrong", async () => {
    UserRepo.findByEmail.mockResolvedValue(FAKE_USER);
    bcrypt.compare.mockResolvedValue(false);
    const req = { user: { id: 1, email: "alice@test.com" }, body: { currentPassword: "wrong", newPassword: "newpass" } };
    const res = makeRes();
    await controller.changePassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("returns 200 on successful password change", async () => {
    UserRepo.findByEmail.mockResolvedValue(FAKE_USER);
    bcrypt.compare.mockResolvedValue(true);
    UserRepo.update.mockResolvedValue(FAKE_USER);
    const req = { user: { id: 1, email: "alice@test.com" }, body: { currentPassword: "oldpass", newPassword: "newpass" } };
    const res = makeRes();
    await controller.changePassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ══════════════════════════════════════════════════════════════════════
// forgotPassword
// ══════════════════════════════════════════════════════════════════════
describe("forgotPassword", () => {
  test("returns 200 for unknown email — no email leak", async () => {
    UserRepo.findByEmail.mockResolvedValue(null);
    const req = { body: { email: "nobody@nowhere.com" } };
    const res = makeRes();
    await controller.forgotPassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("returns 200 and sends email for known active user", async () => {
    UserRepo.findByEmail.mockResolvedValue(FAKE_USER);
    jwt.sign.mockReturnValue("reset_token");
    const req = { body: { email: "alice@test.com" } };
    const res = makeRes();
    await controller.forgotPassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ══════════════════════════════════════════════════════════════════════
// resetPassword
// ══════════════════════════════════════════════════════════════════════
describe("resetPassword", () => {
  test("returns 400 for invalid/expired token", async () => {
    jwt.verify.mockImplementation(() => { throw new Error("jwt expired"); });
    const req = { body: { token: "bad_token", password: "newpass" } };
    const res = makeRes();
    await controller.resetPassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 400 if token purpose is not password_reset", async () => {
    jwt.verify.mockReturnValue({ id: 1, purpose: "auth" });
    const req = { body: { token: "wrong_purpose_token", password: "newpass" } };
    const res = makeRes();
    await controller.resetPassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 200 on valid reset", async () => {
    jwt.verify.mockReturnValue({ id: 1, purpose: "password_reset" });
    UserRepo.update.mockResolvedValue(FAKE_USER);
    const req = { body: { token: "valid_token", password: "newpass" } };
    const res = makeRes();
    await controller.resetPassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
