const MenuItemRepository = require("../repositories/MenuItemRepository");
const RestaurantRepository = require("../repositories/RestaurantRepository");

class MenuItemController {
  // GET /api/restaurants/:restaurantId/menu  (public — available items only)
  async getByRestaurant(req, res, next) {
    try {
      const items = await MenuItemRepository.findByRestaurantId(req.params.restaurantId);
      return res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/restaurants/:restaurantId/menu/manage  (protected — all items including unavailable)
  async getAllByRestaurant(req, res, next) {
    try {
      const items = await MenuItemRepository.findAllByRestaurantId(req.params.restaurantId);
      return res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/menu/:id
  async getById(req, res, next) {
    try {
      const item = await MenuItemRepository.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: "Menu item not found." });
      }
      return res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/restaurants/:restaurantId/menu
  async create(req, res, next) {
    try {
      const restaurant = await RestaurantRepository.findById(req.params.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: "Restaurant not found." });
      }
      if (restaurant.owner_id !== req.user.id && req.user.role !== "system_admin") {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
      const { name, description, price, category, image_url, preparation_time } = req.body;
      const item = await MenuItemRepository.create({
        restaurant_id: req.params.restaurantId,
        name,
        description: description || null,
        price,
        category: category || null,
        image_url: image_url || null,
        preparation_time: preparation_time !== "" && preparation_time != null ? parseInt(preparation_time) : null,
      });
      return res.status(201).json({ success: true, message: "Menu item created.", data: item });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/menu/:id
  async update(req, res, next) {
    try {
      const item = await MenuItemRepository.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: "Menu item not found." });
      }
      if (item.restaurant.owner_id !== req.user.id && req.user.role !== "system_admin") {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
      const body = { ...req.body };
      if ("preparation_time" in body) {
        body.preparation_time = body.preparation_time !== "" && body.preparation_time != null
          ? parseInt(body.preparation_time) : null;
      }
      const updated = await MenuItemRepository.update(req.params.id, body);
      return res.status(200).json({ success: true, message: "Menu item updated.", data: updated });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/menu/:id
  async delete(req, res, next) {
    try {
      await MenuItemRepository.delete(req.params.id);
      return res.status(200).json({ success: true, message: "Menu item deactivated." });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuItemController();
