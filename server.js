require('dotenv').config(); // Завантаження змінних середовища з файлу .env
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios');
const { updateCacheForUser } = require('./cron/updateCache');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET, // Використання секретного ключа з файлу .env
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Зберігаємо таймери в глобальному об'єкті
const timers = {};

// Middleware для очищення історії для кожної сесії
app.use((req, res, next) => {
    if (!req.session.historyCleared) {
        req.session.history = [];
        req.session.historyCleared = true;
    }
    next();
});

// Маршрути
app.use('/register', require('./routes/register')(timers));
app.use('/history', require('./routes/history'));
app.use('/filters', require('./routes/filters'));
app.use('/interval', require('./routes/interval')(timers));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
