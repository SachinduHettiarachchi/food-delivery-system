/**
 * Unit tests — ReviewController
 * ReviewRepository, OrderRepository and the insights service are mocked.
 */

jest.mock("../../repositories/ReviewRepository");
jest.mock("../../repositories/OrderRepository");
jest.mock("../../services/itemInsightsService", () => ({
  computeAllInsights: jest.fn().mockResolvedValue(undefined),
}));

const ReviewRepo = require("../../repositories/ReviewRepository");
const OrderRepo  = require("../../repositories/OrderRepository");
const controller = require("../../controllers/ReviewController");

// ── Helpers ──────────────────────────────────────────────────────────
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const next = jest.fn();

// A delivered order owned by customer id=1, containing menu item id=1
const DELIVERED_ORDER = {
  id: 10,
  customer_id: 1,
  status: "delivered",
  orderItems: [{ menu_item_id: 1 }],
};

beforeEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════════════════════════
// create
// ══════════════════════════════════════════════════════════════════════
describe("create", () => {
  test("returns 400 when required fields are missing", async () => {
    // missing menu_item_id and rating
    const req = { body: { order_id: 1 }, user: { id: 1 } };
    const res = makeRes();
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 400 when rating is below 1", async () => {
    const req = { body: { order_id: 1, menu_item_id: 1, rating: 0 }, user: { id: 1 } };
    const res = makeRes();
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 400 when rating is above 5", async () => {
    const req = { body: { order_id: 1, menu_item_id: 1, rating: 6 }, user: { id: 1 } };
    const res = makeRes();
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 404 when order does not exist", async () => {
    OrderRepo.findById.mockResolvedValue(null);
    const req = { body: { order_id: 999, menu_item_id: 1, rating: 4 }, user: { id: 1 } };
    const res = makeRes();
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 403 when order belongs to a different customer", async () => {
    OrderRepo.findById.mockResolvedValue({ ...DELIVERED_ORDER, customer_id: 2 });
    const req = { body: { order_id: 10, menu_item_id: 1, rating: 4 }, user: { id: 1 } };
    const res = makeRes();
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("returns 400 when order is not delivered", async () => {
    OrderRepo.findById.mockResolvedValue({ ...DELIVERED_ORDER, status: "pending" });
    const req = { body: { order_id: 10, menu_item_id: 1, rating: 4 }, user: { id: 1 } };
    const res = makeRes();
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("delivered") })
    );
  });

  test("returns 400 when menu item was not part of the order", async () => {
    OrderRepo.findById.mockResolvedValue({ ...DELIVERED_ORDER, orderItems: [{ menu_item_id: 99 }] });
    const req = { body: { order_id: 10, menu_item_id: 1, rating: 4 }, user: { id: 1 } };
    const res = makeRes();
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("not part of your order") })
    );
  });

  test("returns 409 when review already exists", async () => {
    OrderRepo.findById.mockResolvedValue(DELIVERED_ORDER);
    ReviewRepo.findExisting.mockResolvedValue({ id: 5 });
    const req = { body: { order_id: 10, menu_item_id: 1, rating: 4 }, user: { id: 1 } };
    const res = makeRes();
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test("returns 201 and the new review on success", async () => {
    OrderRepo.findById.mockResolvedValue(DELIVERED_ORDER);
    ReviewRepo.findExisting.mockResolvedValue(null);
    ReviewRepo.create.mockResolvedValue({ id: 20, rating: 5, comment: "Excellent!" });
    const req = { body: { order_id: 10, menu_item_id: 1, rating: 5, comment: "Excellent!" }, user: { id: 1 } };
    const res = makeRes();
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(ReviewRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer_id: 1, menu_item_id: 1, order_id: 10, rating: 5 })
    );
  });

  test("calls next(error) on unexpected error", async () => {
    OrderRepo.findById.mockRejectedValue(new Error("DB error"));
    const req = { body: { order_id: 10, menu_item_id: 1, rating: 3 }, user: { id: 1 } };
    const res = makeRes();
    await controller.create(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ══════════════════════════════════════════════════════════════════════
// getByMenuItem
// ══════════════════════════════════════════════════════════════════════
describe("getByMenuItem", () => {
  test("returns 200 with the list of reviews", async () => {
    ReviewRepo.findByMenuItemId.mockResolvedValue([{ id: 1, rating: 4 }, { id: 2, rating: 5 }]);
    const req = { params: { menuItemId: "1" } };
    const res = makeRes();
    await controller.getByMenuItem(req, res, next);
    expect(ReviewRepo.findByMenuItemId).toHaveBeenCalledWith("1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.any(Array) })
    );
  });

  test("returns 200 with empty array when no reviews exist", async () => {
    ReviewRepo.findByMenuItemId.mockResolvedValue([]);
    const req = { params: { menuItemId: "99" } };
    const res = makeRes();
    await controller.getByMenuItem(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ══════════════════════════════════════════════════════════════════════
// getMyReviewsForOrder
// ══════════════════════════════════════════════════════════════════════
describe("getMyReviewsForOrder", () => {
  test("returns 200 with reviews for the given order and customer", async () => {
    ReviewRepo.findByOrderAndCustomer.mockResolvedValue([{ id: 3, rating: 4 }]);
    const req = { params: { orderId: "10" }, user: { id: 1 } };
    const res = makeRes();
    await controller.getMyReviewsForOrder(req, res, next);
    expect(ReviewRepo.findByOrderAndCustomer).toHaveBeenCalledWith("10", 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("returns 200 with empty array when customer has no reviews for order", async () => {
    ReviewRepo.findByOrderAndCustomer.mockResolvedValue([]);
    const req = { params: { orderId: "10" }, user: { id: 1 } };
    const res = makeRes();
    await controller.getMyReviewsForOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
  });
});
