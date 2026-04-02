const { DataTypes } = require("sequelize");
const db = require("../config/database");

const sequelize = db.getSequelize();

const MenuItem = sequelize.define(
  "MenuItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "restaurants", key: "id" },
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    preparation_time: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
    },
    tag: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    review_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avg_rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
    },
    review_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_computed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "menu_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = MenuItem;
