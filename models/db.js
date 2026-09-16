const { Sequelize } = require("sequelize");
const config = require("../config/config")[process.env.NODE_ENV || "development"];

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], config)
  : new Sequelize(config);

module.exports = sequelize;
