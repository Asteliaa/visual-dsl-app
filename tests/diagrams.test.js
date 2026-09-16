const request = require("supertest");
const createApp = require("../app");
const { Diagram, resetDb } = require("./setup");

const app = createApp();

beforeEach(async () => {
  await resetDb();
  jest.restoreAllMocks();
});

describe("GET /diagrams", () => {
  test("возвращает пустой список", async () => {
    const res = await request(app).get("/diagrams");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("возвращает список созданных диаграмм", async () => {
    await Diagram.create({ title: "Заказы", notation: "erd" });
    const res = await request(app).get("/diagrams");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test("возвращает 500 при ошибке БД", async () => {
    jest.spyOn(Diagram, "findAll").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app).get("/diagrams");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("сбой БД");
  });
});

describe("GET /diagrams/:id", () => {
  test("возвращает 404 для несуществующей диаграммы", async () => {
    const res = await request(app).get("/diagrams/999");
    expect(res.status).toBe(404);
  });

  test("возвращает диаграмму по id", async () => {
    const created = await Diagram.create({ title: "Заказы", notation: "erd" });
    const res = await request(app).get(`/diagrams/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Заказы");
    expect(res.body.status).toBe("draft");
  });

  test("возвращает 500 при ошибке БД", async () => {
    jest.spyOn(Diagram, "findByPk").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app).get("/diagrams/1");
    expect(res.status).toBe(500);
  });
});

describe("POST /diagrams", () => {
  test("создаёт диаграмму при корректных данных", async () => {
    const res = await request(app)
      .post("/diagrams")
      .send({ title: "Процесс", notation: "bpmn" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("draft");
  });

  test("возвращает 400 при отсутствии title", async () => {
    const res = await request(app).post("/diagrams").send({ notation: "erd" });
    expect(res.status).toBe(400);
  });

  test("возвращает 500 при неожиданной ошибке", async () => {
    jest.spyOn(Diagram, "create").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app)
      .post("/diagrams")
      .send({ title: "Процесс", notation: "bpmn" });
    expect(res.status).toBe(500);
  });
});

describe("PUT /diagrams/:id", () => {
  test("обновляет существующую диаграмму", async () => {
    const created = await Diagram.create({ title: "Заказы", notation: "erd" });
    const res = await request(app)
      .put(`/diagrams/${created.id}`)
      .send({ title: "Заказы v2", notation: "erd", status: "validated" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Заказы v2");
    expect(res.body.status).toBe("validated");
  });

  test("возвращает 404 при обновлении несуществующей диаграммы", async () => {
    const res = await request(app)
      .put("/diagrams/999")
      .send({ title: "Заказы", notation: "erd" });
    expect(res.status).toBe(404);
  });

  test("возвращает 400 при некорректных данных обновления", async () => {
    const created = await Diagram.create({ title: "Заказы", notation: "erd" });
    const res = await request(app).put(`/diagrams/${created.id}`).send({ title: "" });
    expect(res.status).toBe(400);
  });

  test("возвращает 500 при неожиданной ошибке", async () => {
    const created = await Diagram.create({ title: "Заказы", notation: "erd" });
    jest.spyOn(Diagram.prototype, "update").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app)
      .put(`/diagrams/${created.id}`)
      .send({ title: "Заказы v2", notation: "erd" });
    expect(res.status).toBe(500);
  });
});

describe("DELETE /diagrams/:id", () => {
  test("удаляет существующую диаграмму", async () => {
    const created = await Diagram.create({ title: "Заказы", notation: "erd" });
    const res = await request(app).delete(`/diagrams/${created.id}`);
    expect(res.status).toBe(204);
  });

  test("возвращает 404 при удалении несуществующей диаграммы", async () => {
    const res = await request(app).delete("/diagrams/999");
    expect(res.status).toBe(404);
  });

  test("возвращает 500 при ошибке БД", async () => {
    jest.spyOn(Diagram, "destroy").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app).delete("/diagrams/1");
    expect(res.status).toBe(500);
  });
});

describe("неизвестный маршрут", () => {
  test("возвращает 404", async () => {
    const res = await request(app).get("/unknown");
    expect(res.status).toBe(404);
  });
});
