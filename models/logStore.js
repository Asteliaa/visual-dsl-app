// Журнал запросов в памяти: записи отображаются на странице /logs в виде таблицы.
const MAX_ENTRIES = 500;

let entries = [];
let nextId = 1;

// Тип события определяется по коду ответа.
const eventByStatus = (status) => {
  if (status >= 500) return 'Ошибка сервера';
  if (status >= 400) return 'Ошибка клиента';
  if (status >= 300) return 'Перенаправление';
  return 'Успешный запрос';
};

const add = ({ method, url, status, durationMs, user, ip }) => {
  const entry = {
    id: nextId++,
    time: new Date().toISOString(),
    event: eventByStatus(status),
    method,
    url,
    status,
    durationMs: Number(durationMs.toFixed(2)),
    user,
    ip
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  return entry;
};

// Новые записи первыми; необязательные фильтры по методу и классу события.
const getAll = ({ method, event } = {}) =>
  entries
    .filter((e) => (!method || e.method === method) && (!event || e.event === event))
    .reverse();

const clear = () => {
  entries = [];
  nextId = 1;
};

module.exports = { MAX_ENTRIES, eventByStatus, add, getAll, clear };
