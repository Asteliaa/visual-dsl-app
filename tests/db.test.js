describe("models/db", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalUrl = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.DATABASE_URL = originalUrl;
    jest.resetModules();
  });

  test("строит подключение через use_env_variable для development", () => {
    jest.resetModules();
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/diagramcode";
    const sequelize = require("../models/db");
    expect(sequelize.getDialect()).toBe("postgres");
  });

  test("использует development по умолчанию без NODE_ENV", () => {
    jest.resetModules();
    delete process.env.NODE_ENV;
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/diagramcode";
    const sequelize = require("../models/db");
    expect(sequelize.getDialect()).toBe("postgres");
  });
});
