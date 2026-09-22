const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Diagram = sequelize.define(
  "Diagram",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    notation: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    dslContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "draft",
    },
  },
  { tableName: "Diagrams" },
);

module.exports = Diagram;
