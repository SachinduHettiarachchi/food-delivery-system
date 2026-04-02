const { Sequelize } = require("sequelize");
require("dotenv").config();

// Singleton pattern - ensures only one DB connection instance exists
class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }

    this.sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: "mysql",
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

    Database.instance = this;
  }

  async connect() {
    try {
      await this.sequelize.authenticate();
      console.log("✅ MySQL Database connected successfully.");
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      process.exit(1);
    }
  }

  getSequelize() {
    return this.sequelize;
  }
}

const db = new Database();
module.exports = db;
