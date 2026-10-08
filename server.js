const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '693529821';
const ROOT = __dirname;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000) req.destroy();
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(new Error('Некорректные данные формы')); }
    });
    req.on('error', reject);
  });
}

async function sendTelegram(data) {
  if (!BOT_TOKEN) throw new Error('Не задан TELEGRAM_BOT_TOKEN в .env');

  const text = [
    '🔔 <b>Новая заявка с сайта Егора Кацуры</b>',
    '',
    `👤 <b>Имя:</b> ${escapeHtml(data.name || '—')}`,
    `📞 <b>Телефон / мессенджер:</b> ${escapeHtml(data.contact || '—')}`,
    `📅 <b>Дата:</b> ${escapeHtml(data.date || '—')}`,
    `📍 <b>Город:</b> ${escapeHtml(data.city || '—')}`,
    `👥 <b>Гостей:</b> ${escapeHtml(data.guests || '—')}`,
    `🎤 <b>Формат:</b> ${escapeHtml(data.format || '—')}`,
    '',
    '<i>Заявка отправлена с сайта.</i>'
  ].join('\n');

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
  });

  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.description || 'Telegram API error');
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/telegram') {
    try {
      const data = await readBody(req);
      if (!data.name || !data.contact || !data.date) {
        return sendJson(res, 400, { ok: false, message: 'Заполните имя, телефон и дату.' });
      }
      await sendTelegram(data);
      return sendJson(res, 200, { ok: true });
    } catch (error) {
      console.error(error);
      return sendJson(res, 500, { ok: false, message: error.message });
    }
  }

  if (req.method !== 'GET') return sendJson(res, 405, { ok: false });

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) return sendJson(res, 403, { ok: false });

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Страница не найдена');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Сайт запущен: http://localhost:${PORT}`);
  console.log(`Telegram: ${BOT_TOKEN ? 'токен найден' : 'ТОКЕН НЕ НАСТРОЕН'}`);
});
