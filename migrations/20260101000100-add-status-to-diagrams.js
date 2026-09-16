module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Diagrams", "status", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "draft",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("Diagrams", "status");
  },
};
