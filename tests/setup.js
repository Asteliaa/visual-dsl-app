process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-jest";

const sequelize = require("../models/db");
const Diagram = require("../models/Diagram");
const User = require("../models/User");

async function resetDb() {
  await sequelize.sync({ force: true });
}

module.exports = { sequelize, Diagram, User, resetDb };
