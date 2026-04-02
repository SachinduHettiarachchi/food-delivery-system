const RestaurantRepository = require("../repositories/RestaurantRepository");

class RestaurantController {
  // GET /api/restaurants
  async getAll(req, res, next) {
    try {
      const restaurants = await RestaurantRepository.findAll();
      return res.status(200).json({ success: true, data: restaurants });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/restaurants/:id
  async getById(req, res, next) {
    try {
      const restaurant = await RestaurantRepository.findById(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: "Restaurant not found." });
      }
      return res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/restaurants/my  (restaurant admin sees their own restaurants)
  async getMine(req, res, next) {
    try {
      const restaurants = await RestaurantRepository.findByOwnerId(req.user.id);
      return res.status(200).json({ success: true, data: restaurants });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/restaurants
  async create(req, res, next) {
    try {
      const { name, description, address, phone, email, cuisine_type, opening_time, closing_time } = req.body;
      const restaurant = await RestaurantRepository.create({
        owner_id: req.user.id,
        name, description, address, phone, email, cuisine_type, opening_time, closing_time,
      });
      return res.status(201).json({ success: true, message: "Restaurant created.", data: restaurant });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/restaurants/:id
  async update(req, res, next) {
    try {
      const restaurant = await RestaurantRepository.findById(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: "Restaurant not found." });
      }
      // Only owner or system_admin can update
      if (restaurant.owner_id !== req.user.id && req.user.role !== "system_admin") {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
      const updated = await RestaurantRepository.update(req.params.id, req.body);
      return res.status(200).json({ success: true, message: "Restaurant updated.", data: updated });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/restaurants/:id
  async delete(req, res, next) {
    try {
      await RestaurantRepository.delete(req.params.id);
      return res.status(200).json({ success: true, message: "Restaurant deactivated." });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RestaurantController();
