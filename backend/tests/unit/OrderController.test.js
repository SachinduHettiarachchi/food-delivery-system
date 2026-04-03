/**
 * Unit tests — OrderController
 * All repositories and the insights service are mocked.
 */

jest.mock("../../repositories/OrderRepository");
jest.mock("../../repositories/MenuItemRepository");
jest.mock("../../repositories/RestaurantRepository");
jest.mock("../../services/itemInsightsService", () => ({
  computeAllInsights: jest.fn().mockResolvedValue(undefined),
}));

const OrderRepo      = require("../../repositories/OrderRepository");
const MenuItemRepo   = require("../../repositories/MenuItemRepository");
const RestaurantRepo = require("../../repositories/RestaurantRepository");
const controller     = require("../../controllers/OrderController");

// ── Helpers ──────────────────────────────────────────────────────────
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const next = jest.fn();

// A restaurant that is "always open" (null hours → isRestaurantOpen returns true)
const OPEN_RESTAURANT = { id: 1, name: "Test Rest", opening_time: null, closing_time: null };

// A restaurant that is "always closed" (00:00–00:00 → window of 0 min → always false)
const CLOSED_RESTAURANT = { id: 1, name: "Closed Rest", opening_time: "00:00", closing_time: "00:00" };

const MENU_ITEM = { id: 1, name: "Burger", is_available: true, restaurant: { id: 1 }, price: "500", preparation_time: 20 };

beforeEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════════════════════════
// placeOrder
// ══════════════════════════════════════════════════════════════════════
describe("placeOrder", () => {
  const baseBody = {
    restaurant_id: 1,
    items: [{ menu_item_id: 1, quantity: 2 }],
    delivery_address: "42 Test Lane",
  };

  test("returns 400 when items array is empty", async () => {
    const req = { body: { ...baseBody, items: [] }, user: { id: 1 } };
    const res = makeRes();
    await controller.placeOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 404 when restaurant not found", async () => {
    RestaurantRepo.findById.mockResolvedValue(null);
    const req = { body: baseBody, user: { id: 1 } };
    const res = makeRes();
    await controller.placeOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 400 when restaurant is closed", async () => {
    RestaurantRepo.findById.mockResolvedValue(CLOSED_RESTAURANT);
    const req = { body: baseBody, user: { id: 1 } };
    const res = makeRes();
    await controller.placeOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining("closed") })
    );
  });

  test("returns 400 when menu item is unavailable", async () => {
    RestaurantRepo.findById.mockResolvedValue(OPEN_RESTAURANT);
    MenuItemRepo.findById.mockResolvedValue({ ...MENU_ITEM, is_available: false });
    const req = { body: baseBody, user: { id: 1 } };
    const res = makeRes();
    await controller.placeOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 400 when item belongs to a different restaurant", async () => {
    RestaurantRepo.findById.mockResolvedValue(OPEN_RESTAURANT);
    MenuItemRepo.findById.mockResolvedValue({ ...MENU_ITEM, restaurant: { id: 99 } });
    const req = { body: baseBody, user: { id: 1 } };
    const res = makeRes();
    await controller.placeOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("same restaurant") })
    );
  });

  test("returns 201 and creates order on success", async () => {
    RestaurantRepo.findById.mockResolvedValue(OPEN_RESTAURANT);
    MenuItemRepo.findById.mockResolvedValue(MENU_ITEM);
    OrderRepo.create.mockResolvedValue({ id: 10, status: "pending", total_amount: 1000 });
    const req = { body: baseBody, user: { id: 1 } };
    const res = makeRes();
    await controller.placeOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(OrderRepo.create).toHaveBeenCalled();
  });

  test("calls next(error) on unexpected repository failure", async () => {
    RestaurantRepo.findById.mockRejectedValue(new Error("DB down"));
    const req = { body: baseBody, user: { id: 1 } };
    const res = makeRes();
    await controller.placeOrder(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ══════════════════════════════════════════════════════════════════════
// getAll
// ══════════════════════════════════════════════════════════════════════
describe("getAll", () => {
  test("system_admin receives all orders", async () => {
    OrderRepo.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const req = { user: { id: 99, role: "system_admin" } };
    const res = makeRes();
    await controller.getAll(req, res, next);
    expect(OrderRepo.findAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("customer receives only their own orders", async () => {
    OrderRepo.findByCustomerId.mockResolvedValue([{ id: 5 }]);
    const req = { user: { id: 3, role: "customer" } };
    const res = makeRes();
    await controller.getAll(req, res, next);
    expect(OrderRepo.findByCustomerId).toHaveBeenCalledWith(3);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("restaurant_admin receives only their restaurants' orders", async () => {
    RestaurantRepo.findByOwnerId.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    OrderRepo.findByRestaurantId.mockResolvedValue([]);
    const req = { user: { id: 5, role: "restaurant_admin" } };
    const res = makeRes();
    await controller.getAll(req, res, next);
    expect(RestaurantRepo.findByOwnerId).toHaveBeenCalledWith(5);
    expect(OrderRepo.findByRestaurantId).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ══════════════════════════════════════════════════════════════════════
// getMyOrders
// ══════════════════════════════════════════════════════════════════════
describe("getMyOrders", () => {
  test("returns orders for the authenticated customer", async () => {
    OrderRepo.findByCustomerId.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const req = { user: { id: 7 } };
    const res = makeRes();
    await controller.getMyOrders(req, res, next);
    expect(OrderRepo.findByCustomerId).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ══════════════════════════════════════════════════════════════════════
// getById
// ══════════════════════════════════════════════════════════════════════
describe("getById", () => {
  test("returns 404 when order does not exist", async () => {
    OrderRepo.findById.mockResolvedValue(null);
    const req = { params: { id: "999" }, user: { id: 1, role: "customer" } };
    const res = makeRes();
    await controller.getById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 403 when customer tries to view another customer's order", async () => {
    OrderRepo.findById.mockResolvedValue({ id: 1, customer_id: 2 });
    const req = { params: { id: "1" }, user: { id: 1, role: "customer" } };
    const res = makeRes();
    await controller.getById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("returns 200 for customer viewing their own order", async () => {
    OrderRepo.findById.mockResolvedValue({ id: 1, customer_id: 1 });
    const req = { params: { id: "1" }, user: { id: 1, role: "customer" } };
    const res = makeRes();
    await controller.getById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("returns 200 for restaurant_admin regardless of customer_id", async () => {
    OrderRepo.findById.mockResolvedValue({ id: 1, customer_id: 42 });
    const req = { params: { id: "1" }, user: { id: 5, role: "restaurant_admin" } };
    const res = makeRes();
    await controller.getById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ══════════════════════════════════════════════════════════════════════
// updateStatus
// ══════════════════════════════════════════════════════════════════════
describe("updateStatus", () => {
  test("returns 400 for an unrecognised status value", async () => {
    const req = { params: { id: "1" }, body: { status: "teleported" }, user: { id: 1 } };
    const res = makeRes();
    await controller.updateStatus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 404 when order does not exist", async () => {
    OrderRepo.updateStatus.mockResolvedValue(null);
    const req = { params: { id: "999" }, body: { status: "confirmed" }, user: { id: 1 } };
    const res = makeRes();
    await controller.updateStatus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 200 on successful status update", async () => {
    OrderRepo.updateStatus.mockResolvedValue({ id: 1, status: "confirmed" });
    const req = { params: { id: "1" }, body: { status: "confirmed" }, user: { id: 1 } };
    const res = makeRes();
    await controller.updateStatus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ══════════════════════════════════════════════════════════════════════
// cancelOrder
// ══════════════════════════════════════════════════════════════════════
describe("cancelOrder", () => {
  test("returns 404 when order does not exist", async () => {
    OrderRepo.findById.mockResolvedValue(null);
    const req = { params: { id: "999" }, user: { id: 1 } };
    const res = makeRes();
    await controller.cancelOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 403 when customer does not own the order", async () => {
    OrderRepo.findById.mockResolvedValue({ id: 1, customer_id: 2, status: "pending" });
    const req = { params: { id: "1" }, user: { id: 1 } };
    const res = makeRes();
    await controller.cancelOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("returns 400 when order is not in pending state", async () => {
    OrderRepo.findById.mockResolvedValue({ id: 1, customer_id: 1, status: "confirmed" });
    const req = { params: { id: "1" }, user: { id: 1 } };
    const res = makeRes();
    await controller.cancelOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("pending") })
    );
  });

  test("returns 200 and cancels the order", async () => {
    OrderRepo.findById.mockResolvedValue({ id: 1, customer_id: 1, status: "pending" });
    OrderRepo.updateStatus.mockResolvedValue({ id: 1, status: "cancelled" });
    const req = { params: { id: "1" }, user: { id: 1 } };
    const res = makeRes();
    await controller.cancelOrder(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(OrderRepo.updateStatus).toHaveBeenCalledWith("1", "cancelled");
  });
});
