// Начальные данные (seed) массива diagrams. Используются хранилищем при старте приложения и в тестах.
const base = () => [
  {
    id: 1,
    title: 'Архитектура микросервисов',
    type: 'flowchart',
    dsl: 'graph TD; A[Client] --> B[API Gateway]; B --> C[Auth Service];',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Поток авторизации JWT',
    type: 'sequence',
    dsl: 'sequenceDiagram; User->>Server: Login; Server-->>User: Token;',
    createdAt: new Date().toISOString()
  }
];

// Дополнительные диаграммы для демонстрации на защите (загружаются командой npm run demo через API).
const demo = [
  { title: 'Жизненный цикл заказа', type: 'state', dsl: 'stateDiagram-v2; [*] --> New; New --> Paid; Paid --> Shipped; Shipped --> [*];' },
  { title: 'Модель пользователя', type: 'class', dsl: 'classDiagram; class User { +id +name +login() }' },
  { title: 'Обработка платежа', type: 'sequence', dsl: 'sequenceDiagram; Shop->>Bank: Pay; Bank-->>Shop: OK;' }
];

module.exports = { base, demo };
