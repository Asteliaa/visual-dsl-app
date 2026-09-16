module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert("Diagrams", [
      {
        title: "Заказы",
        notation: "erd",
        dslContent: 'diagram erd "Заказы" {\n  entity order "Заказ" pk=id\n}',
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Оформление заявки",
        notation: "bpmn",
        dslContent: 'diagram bpmn "OrderProcess" {\n  start ev1 "Начало"\n}',
        status: "validated",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete("Diagrams", null, {});
  },
};
