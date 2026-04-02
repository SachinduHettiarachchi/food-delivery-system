const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);

  // Sequelize validation errors
  if (err.name === "SequelizeValidationError") {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({ success: false, message: "Validation error", errors: messages });
  }

  // Sequelize unique constraint
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ success: false, message: "Record already exists." });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }

  // Default
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
};

module.exports = errorHandler;
