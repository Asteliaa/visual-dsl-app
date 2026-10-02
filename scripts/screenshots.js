// Генерация скриншотов для отчета: запускает сервер, обходит страницы в Chrome (playwright-core).
// Запуск: npm run screenshots  (нужен установленный Google Chrome)
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const PORT = 5055;
const BASE = `http://localhost:${PORT}`;
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let serverLog = '';
  const server = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'development' }
  });
  server.stdout.on('data', (d) => (serverLog += d));
  server.stderr.on('data', (d) => (serverLog += d));
  await sleep(1200);

  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
  const shot = async (name, url) => {
    if (url) await page.goto(BASE + url);
    await page.screenshot({ path: path.join(OUT, name + '.png') });
  };

  await shot('01-index', '/?auth=1');
  await shot('02-item', '/item/1?auth=1');
  await shot('03-add-form', '/add?auth=1');

  await page.goto(BASE + '/add?auth=1');
  await page.fill('#title', 'Диаграмма состояний заказа');
  await page.selectOption('#type', 'state');
  await page.fill('#dsl', 'stateDiagram-v2; [*] --> New; New --> Paid; Paid --> [*];');
  await page.screenshot({ path: path.join(OUT, '04-add-form-filled.png') });
  await page.click('button[type=submit]');
  await page.waitForURL('**/?auth=1');
  await shot('05-index-after-add');

  await page.goto(BASE + '/add?auth=1');
  await page.click('button[type=submit]');
  await shot('06-add-validation');

  await shot('07-login-redirect', '/add'); // гость -> редирект на /login
  await shot('08-404', '/no-such-page');
  await shot('09-500', '/debug/error');

  await page.setViewportSize({ width: 1200, height: 640 });
  await shot('10-logs-table', '/logs?auth=1');
  await shot('11-logs-filter', '/logs?auth=1&method=POST');
  await page.setViewportSize({ width: 1000, height: 600 });

  // Лог middleware: оформляем вывод консоли сервера как страницу и снимаем скриншот.
  await sleep(300);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  await page.setContent(
    `<body style="margin:0;background:#0c0c0c"><pre style="color:#cccccc;font:15px Consolas,monospace;padding:16px;margin:0">` +
      esc(serverLog.replace(/^\s*at .*\n/gm, '')) +
      `</pre></body>`
  );
  await page.setViewportSize({ width: 1000, height: 560 });
  await page.screenshot({ path: path.join(OUT, '12-console-log.png') });

  await browser.close();
  server.kill();
  console.log('Скриншоты сохранены в', OUT);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
