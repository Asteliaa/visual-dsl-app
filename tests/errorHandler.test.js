const { errorHandler } = require("../middleware/errorHandler");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("errorHandler", () => {
  test("возвращает 500 и сообщение ошибки", () => {
    const res = mockRes();
    errorHandler(new Error("сбой"), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "сбой" });
  });

  test("возвращает сообщение по умолчанию при ошибке без message", () => {
    const res = mockRes();
    errorHandler({}, {}, res, () => {});
    expect(res.json).toHaveBeenCalledWith({ error: "Внутренняя ошибка сервера" });
  });
});
