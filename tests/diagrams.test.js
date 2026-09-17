const request = require("supertest");
const createApp = require("../app");
const { Diagram, resetDb } = require("./setup");

const app = createApp();
const VALID_PASSWORD = "Str0ng&Pwd";

async function registerAndLogin(email) {
  await request(app).post("/auth/register").send({ email, password: VALID_PASSWORD });
  const res = await request(app).post("/auth/login").send({ email, password: VALID_PASSWORD });
  return res.body.token;
}

let token;
let otherToken;

beforeEach(async () => {
  await resetDb();
  jest.restoreAllMocks();
  token = await registerAndLogin("owner@example.com");
  otherToken = await registerAndLogin("other@example.com");
});

describe("GET /diagrams", () => {
  test("возвращает пустой список", async () => {
    const res = await request(app).get("/diagrams").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("возвращает список созданных диаграмм текущего пользователя", async () => {
    await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Заказы", notation: "erd" });
    const res = await request(app).get("/diagrams").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test("не возвращает диаграммы другого пользователя", async () => {
    await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Чужая", notation: "erd" });
    const res = await request(app).get("/diagrams").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("возвращает 500 при ошибке БД", async () => {
    jest.spyOn(Diagram, "findAll").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app).get("/diagrams").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("сбой БД");
  });
});

describe("GET /diagrams/:id", () => {
  test("возвращает 404 для несуществующей диаграммы", async () => {
    const res = await request(app).get("/diagrams/999").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test("возвращает диаграмму по id", async () => {
    const created = await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Заказы", notation: "erd" });
    const res = await request(app)
      .get(`/diagrams/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Заказы");
    expect(res.body.status).toBe("draft");
  });

  test("возвращает 404 при обращении к чужой диаграмме", async () => {
    const created = await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Чужая", notation: "erd" });
    const res = await request(app)
      .get(`/diagrams/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test("возвращает 500 при ошибке БД", async () => {
    jest.spyOn(Diagram, "findOne").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app).get("/diagrams/1").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(500);
  });
});

describe("POST /diagrams", () => {
  test("создаёт диаграмму при корректных данных", async () => {
    const res = await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Процесс", notation: "bpmn" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("draft");
  });

  test("возвращает 400 при отсутствии title", async () => {
    const res = await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${token}`)
      .send({ notation: "erd" });
    expect(res.status).toBe(400);
  });

  test("возвращает 500 при неожиданной ошибке", async () => {
    jest.spyOn(Diagram, "create").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Процесс", notation: "bpmn" });
    expect(res.status).toBe(500);
  });
});

describe("PUT /diagrams/:id", () => {
  test("обновляет существующую диаграмму", async () => {
    const created = await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Заказы", notation: "erd" });
    const res = await request(app)
      .put(`/diagrams/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Заказы v2", notation: "erd", status: "validated" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Заказы v2");
    expect(res.body.status).toBe("validated");
  });

  test("возвращает 404 при обновлении несуществующей диаграммы", async () => {
    const res = await request(app)
      .put("/diagrams/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Заказы", notation: "erd" });
    expect(res.status).toBe(404);
  });

  test("возвращает 404 при попытке обновить чужую диаграмму", async () => {
    const created = await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Чужая", notation: "erd" });
    const res = await request(app)
      .put(`/diagrams/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Взлом", notation: "erd" });
    expect(res.status).toBe(404);
  });

  test("возвращает 400 при некорректных данных обновления", async () => {
    const created = await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Заказы", notation: "erd" });
    const res = await request(app)
      .put(`/diagrams/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "" });
    expect(res.status).toBe(400);
  });

  test("возвращает 500 при неожиданной ошибке", async () => {
    const created = await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Заказы", notation: "erd" });
    jest.spyOn(Diagram.prototype, "update").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app)
      .put(`/diagrams/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Заказы v2", notation: "erd" });
    expect(res.status).toBe(500);
  });
});

describe("DELETE /diagrams/:id", () => {
  test("удаляет существующую диаграмму", async () => {
    const created = await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Заказы", notation: "erd" });
    const res = await request(app)
      .delete(`/diagrams/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  test("возвращает 404 при удалении несуществующей диаграммы", async () => {
    const res = await request(app)
      .delete("/diagrams/999")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test("возвращает 404 при попытке удалить чужую диаграмму", async () => {
    const created = await request(app)
      .post("/diagrams")
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Чужая", notation: "erd" });
    const res = await request(app)
      .delete(`/diagrams/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test("возвращает 500 при ошибке БД", async () => {
    jest.spyOn(Diagram, "destroy").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app)
      .delete("/diagrams/1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(500);
  });
});

describe("неизвестный маршрут", () => {
  test("возвращает 404", async () => {
    const res = await request(app).get("/unknown");
    expect(res.status).toBe(404);
  });
});
