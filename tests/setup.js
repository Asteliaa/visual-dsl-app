const sequelize = require("../models/db");
const Diagram = require("../models/Diagram");

async function resetDb() {
  await sequelize.sync({ force: true });
}

module.exports = { sequelize, Diagram, resetDb };
