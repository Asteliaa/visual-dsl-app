const request = require("supertest");
const createApp = require("../app");
const { User, resetDb } = require("./setup");

const app = createApp();
const VALID_PASSWORD = "Str0ng&Pwd";

beforeEach(async () => {
  await resetDb();
  jest.restoreAllMocks();
});

describe("POST /auth/register", () => {
  test("создаёт пользователя при корректных данных", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "User@Example.com", password: VALID_PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe("user@example.com");
    expect(res.body.passwordHash).toBeUndefined();
  });

  test("возвращает 400 при отсутствии email или пароля", async () => {
    const res = await request(app).post("/auth/register").send({ email: "user@example.com" });
    expect(res.status).toBe(400);
  });

  test("возвращает 400 при некорректном формате email", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "not-an-email", password: VALID_PASSWORD });
    expect(res.status).toBe(400);
  });

  test("возвращает 400 при слишком коротком пароле", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "Ab1!" });
    expect(res.status).toBe(400);
  });

  test("возвращает 400 при пароле без строчной буквы", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "PASSWORD1!" });
    expect(res.status).toBe(400);
  });

  test("возвращает 400 при пароле без заглавной буквы", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "password1!" });
    expect(res.status).toBe(400);
  });

  test("возвращает 400 при пароле без цифры", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "Password!" });
    expect(res.status).toBe(400);
  });

  test("возвращает 400 при пароле без спецсимвола", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "Password1" });
    expect(res.status).toBe(400);
  });

  test("возвращает 400 при слишком распространённом пароле", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "Password1!" });
    expect(res.status).toBe(400);
  });

  test("возвращает 400 при повторной регистрации с тем же email", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: VALID_PASSWORD });
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: VALID_PASSWORD });
    expect(res.status).toBe(400);
  });

  test("возвращает 500 при неожиданной ошибке", async () => {
    jest.spyOn(User, "create").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: VALID_PASSWORD });
    expect(res.status).toBe(500);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: VALID_PASSWORD });
  });

  test("возвращает токен при верных данных", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: VALID_PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });

  test("возвращает 400 при отсутствии email или пароля", async () => {
    const res = await request(app).post("/auth/login").send({ email: "user@example.com" });
    expect(res.status).toBe(400);
  });

  test("возвращает общую ошибку при несуществующем email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: VALID_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Неверные учетные данные");
  });

  test("возвращает ту же общую ошибку при неверном пароле", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "WrongPass1!" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Неверные учетные данные");
  });

  test("блокирует вход после 5 неудачных попыток подряд", async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .post("/auth/login")
        .send({ email: "user@example.com", password: "WrongPass1!" });
    }
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: VALID_PASSWORD });
    expect(res.status).toBe(423);
  });

  test("сбрасывает счётчик неудачных попыток при успешном входе", async () => {
    await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "WrongPass1!" });
    const okRes = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: VALID_PASSWORD });
    expect(okRes.status).toBe(200);
    const user = await User.findOne({ where: { email: "user@example.com" } });
    expect(user.loginAttempts).toBe(0);
  });

  test("возвращает 403 для деактивированной учётной записи", async () => {
    const user = await User.findOne({ where: { email: "user@example.com" } });
    user.isActive = false;
    await user.save();
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: VALID_PASSWORD });
    expect(res.status).toBe(403);
  });

  test("возвращает 500 при неожиданной ошибке", async () => {
    jest.spyOn(User, "findOne").mockRejectedValueOnce(new Error("сбой БД"));
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: VALID_PASSWORD });
    expect(res.status).toBe(500);
  });
});
