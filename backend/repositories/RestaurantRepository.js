const { Restaurant, User, MenuItem } = require("../models");

class RestaurantRepository {
  async findAll() {
    return await Restaurant.findAll({
      where: { is_active: true },
      include: [{ model: User, as: "owner", attributes: ["id", "name", "email"] }],
      order: [["created_at", "DESC"]],
    });
  }

  async findById(id) {
    return await Restaurant.findOne({
      where: { id, is_active: true },
      include: [
        { model: User, as: "owner", attributes: ["id", "name", "email"] },
        { model: MenuItem, as: "menuItems", where: { is_available: true }, required: false },
      ],
    });
  }

  async findByOwnerId(owner_id) {
    return await Restaurant.findAll({
      where: { owner_id, is_active: true },
    });
  }

  async create(data) {
    return await Restaurant.create(data);
  }

  async update(id, data) {
    const [updated] = await Restaurant.update(data, { where: { id } });
    if (!updated) return null;
    return await this.findById(id);
  }

  async delete(id) {
    return await Restaurant.update({ is_active: false }, { where: { id } });
  }
}

module.exports = new RestaurantRepository();
