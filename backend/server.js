const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Разрешаем CORS
app.use(cors());
app.use(express.json());

// Инициализация базы данных SQLite
const dbPath = path.resolve(__dirname, 'tracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка подключения к SQLite:', err.message);
  } else {
    console.log('Подключено к SQLite базе данных.');
  }
});

// Создание таблицы кликов
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      click_id TEXT NOT NULL UNIQUE,
      offer TEXT NOT NULL,
      sub1 TEXT,
      timestamp TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT
    )
  `);
});

// Маппинг официальных ссылок брендов
const BRAND_URLS = {
  Dell: 'https://www.dell.com',
  "Macy's": 'https://www.macys.com',
  "Office Depot": 'https://www.officedepot.com',
  "Keiser University": 'https://www.keiseruniversity.edu',
  "Choice Hotels": 'https://www.choicehotels.com',
  "Vivid Seats": 'https://www.vividseats.com',
  "Zenni Optical": 'https://www.zennioptical.com',
  Houzz: 'https://www.houzz.com',
  ZipRecruiter: 'https://www.ziprecruiter.com',
  "State Farm": 'https://www.statefarm.com'
};

/**
 * 1. GET /click?offer=Dell&sub1=test123
 */
app.get('/click', (req, res) => {
  const offer = req.query.offer || 'Dell';
  const sub1 = req.query.sub1 || null;
  const clickId = uuidv4();
  const timestamp = new Date().toISOString();

  // Получаем реальный IP пользователя с учетом прокси/CDN
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Сохраняем в БД
  const sql = `INSERT INTO clicks (click_id, offer, sub1, timestamp, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [clickId, offer, sub1, timestamp, ip, userAgent], function (err) {
    if (err) {
      console.error('Ошибка сохранения клика:', err.message);
    } else {
      console.log(`[CLICK LOGGED] id: ${clickId} | offer: ${offer} | sub1: ${sub1}`);
    }

    // Определяем URL для редиректа
    const redirectUrl = BRAND_URLS[offer] || 'https://www.dell.com';

    // 302 Редирект на целевой сайт
    return res.redirect(302, redirectUrl);
  });
});

/**
 * 2. GET /clicks
 */
app.get('/clicks', (req, res) => {
  const sql = `SELECT * FROM clicks ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      status: 'success',
      total: rows.length,
      data: rows
    });
  });
});

// Проверка статуса сервера
app.get('/', (req, res) => {
  res.send('Tracker Backend is running! Endpoints: /click?offer=Dell&sub1=123, /clicks');
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});