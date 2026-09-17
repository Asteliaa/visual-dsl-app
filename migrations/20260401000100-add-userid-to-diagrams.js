module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Diagrams", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "Users", key: "id" },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("Diagrams", "userId");
  },
};
