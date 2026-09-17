const request = require("supertest");
const jwt = require("jsonwebtoken");
const createApp = require("../app");
const { resetDb } = require("./setup");

const app = createApp();
const VALID_PASSWORD = "Str0ng&Pwd";

beforeEach(async () => {
  await resetDb();
});

describe("защита маршрутов /diagrams", () => {
  test("отклоняет запрос без токена", async () => {
    const res = await request(app).get("/diagrams");
    expect(res.status).toBe(401);
  });

  test("отклоняет запрос с некорректным токеном", async () => {
    const res = await request(app).get("/diagrams").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  test("отклоняет запрос без схемы Bearer", async () => {
    const res = await request(app).get("/diagrams").set("Authorization", "Token abc123");
    expect(res.status).toBe(401);
  });

  test("принимает запрос с валидным токеном", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: VALID_PASSWORD });
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: VALID_PASSWORD });
    const res = await request(app)
      .get("/diagrams")
      .set("Authorization", `Bearer ${loginRes.body.token}`);
    expect(res.status).toBe(200);
  });

  test("отклоняет запрос с токеном для несуществующего секрета", async () => {
    const token = jwt.sign({ userId: 1 }, "wrong-secret", { expiresIn: "7d" });
    const res = await request(app).get("/diagrams").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
