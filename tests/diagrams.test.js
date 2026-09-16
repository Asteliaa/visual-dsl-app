const request = require("supertest");
const createApp = require("../app");
const store = require("../models/diagramStore");

const app = createApp();

beforeEach(() => {
  store.reset();
});

describe("GET /diagrams", () => {
  test("возвращает пустой список", async () => {
    const res = await request(app).get("/diagrams");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("возвращает список созданных диаграмм", async () => {
    await request(app).post("/diagrams").send({ title: "Заказы", notation: "erd" });
    const res = await request(app).get("/diagrams");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("Заказы");
  });
});

describe("GET /diagrams/:id", () => {
  test("возвращает 404 для несуществующей диаграммы", async () => {
    const res = await request(app).get("/diagrams/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test("возвращает диаграмму по id", async () => {
    const created = await request(app)
      .post("/diagrams")
      .send({ title: "Заказы", notation: "erd" });
    const res = await request(app).get(`/diagrams/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Заказы");
  });
});

describe("POST /diagrams", () => {
  test("создаёт диаграмму при корректных данных", async () => {
    const res = await request(app)
      .post("/diagrams")
      .send({ title: "Процесс", notation: "bpmn", dslContent: "diagram bpmn {}" });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(res.body.notation).toBe("bpmn");
  });

  test("создаёт диаграмму без dslContent", async () => {
    const res = await request(app).post("/diagrams").send({ title: "Процесс", notation: "bpmn" });
    expect(res.status).toBe(201);
    expect(res.body.dslContent).toBe("");
  });

  test("возвращает 400 при отсутствии title", async () => {
    const res = await request(app).post("/diagrams").send({ notation: "erd" });
    expect(res.status).toBe(400);
  });

  test("возвращает 400 при отсутствии notation", async () => {
    const res = await request(app).post("/diagrams").send({ title: "Заказы" });
    expect(res.status).toBe(400);
  });
});

describe("PUT /diagrams/:id", () => {
  test("обновляет существующую диаграмму", async () => {
    const created = await request(app)
      .post("/diagrams")
      .send({ title: "Заказы", notation: "erd" });
    const res = await request(app)
      .put(`/diagrams/${created.body.id}`)
      .send({ title: "Заказы v2", notation: "erd", dslContent: "x" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Заказы v2");
  });

  test("обновляет диаграмму без dslContent", async () => {
    const created = await request(app)
      .post("/diagrams")
      .send({ title: "Заказы", notation: "erd" });
    const res = await request(app)
      .put(`/diagrams/${created.body.id}`)
      .send({ title: "Заказы v2", notation: "erd" });
    expect(res.status).toBe(200);
    expect(res.body.dslContent).toBe("");
  });

  test("возвращает 404 при обновлении несуществующей диаграммы", async () => {
    const res = await request(app)
      .put("/diagrams/999")
      .send({ title: "Заказы", notation: "erd" });
    expect(res.status).toBe(404);
  });

  test("возвращает 400 при некорректных данных обновления", async () => {
    const created = await request(app)
      .post("/diagrams")
      .send({ title: "Заказы", notation: "erd" });
    const res = await request(app).put(`/diagrams/${created.body.id}`).send({ title: "" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /diagrams/:id", () => {
  test("удаляет существующую диаграмму", async () => {
    const created = await request(app)
      .post("/diagrams")
      .send({ title: "Заказы", notation: "erd" });
    const res = await request(app).delete(`/diagrams/${created.body.id}`);
    expect(res.status).toBe(204);
    const getRes = await request(app).get(`/diagrams/${created.body.id}`);
    expect(getRes.status).toBe(404);
  });

  test("возвращает 404 при удалении несуществующей диаграммы", async () => {
    const res = await request(app).delete("/diagrams/999");
    expect(res.status).toBe(404);
  });
});

describe("неизвестный маршрут", () => {
  test("возвращает 404", async () => {
    const res = await request(app).get("/unknown");
    expect(res.status).toBe(404);
    expect(res.body.error).toContain("/unknown");
  });
});
