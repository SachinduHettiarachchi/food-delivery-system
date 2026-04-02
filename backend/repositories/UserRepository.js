const { User } = require("../models");

// Repository Pattern: abstracts all User DB operations from business logic
class UserRepository {
  async findAll() {
    return await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["created_at", "DESC"]],
    });
  }

  async findById(id) {
    return await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
  }

  async findByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  async create(userData) {
    return await User.create(userData);
  }

  async update(id, data) {
    const [updated] = await User.update(data, { where: { id } });
    if (!updated) return null;
    return await this.findById(id);
  }

  async delete(id) {
    return await User.update({ is_active: false }, { where: { id } });
  }

  async findByRole(role) {
    return await User.findAll({
      where: { role, is_active: true },
      attributes: { exclude: ["password"] },
    });
  }
}

module.exports = new UserRepository();
