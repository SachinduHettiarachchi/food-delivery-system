const { MenuItem, Restaurant } = require("../models");

class MenuItemRepository {
  async findByRestaurantId(restaurant_id) {
    return await MenuItem.findAll({
      where: { restaurant_id, is_available: true },
      order: [["category", "ASC"], ["name", "ASC"]],
    });
  }

  async findAllByRestaurantId(restaurant_id) {
    return await MenuItem.findAll({
      where: { restaurant_id },
      order: [["category", "ASC"], ["name", "ASC"]],
    });
  }

  async findById(id) {
    return await MenuItem.findOne({
      where: { id },
      include: [{ model: Restaurant, as: "restaurant", attributes: ["id", "name", "owner_id"] }],
    });
  }

  async create(data) {
    return await MenuItem.create(data);
  }

  async update(id, data) {
    const [updated] = await MenuItem.update(data, { where: { id } });
    if (!updated) return null;
    return await this.findById(id);
  }

  async delete(id) {
    return await MenuItem.update({ is_available: false }, { where: { id } });
  }
}

module.exports = new MenuItemRepository();
