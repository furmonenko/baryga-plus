require('dotenv').config(); // Завантаження змінних середовища з файлу .env
const express = require('express');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const session = require('express-session');
const { setBotCommands } = require('./utils/telegram');
const { updateCache } = require("./services/fetchData.js");

const app = express();
const port = 3001;

const sessionStore = new session.MemoryStore();

app.use(bodyParser.json());
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET, // Використання секретного ключа з файлу .env
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Очищення всіх сесій при запуску сервера
sessionStore.clear();

// Middleware для очищення історії для кожної сесії
app.use((req, res, next) => {
    if (!req.session.historyCleared) {
        req.session.history = [];
        req.session.historyCleared = true;
    }
    next();
});

// Middleware для логування запитів
app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    next();
});

console.log("Starting cron job setup...");

cron.schedule('* * * * *', () => { // Запуск задачі кожні 10 хвилин
    console.log('Cron job triggered...');
    updateCache().catch(error => {
        console.error('Error during updateCache:', error);
    });
});

console.log("Cron job setup completed.");

// Маршрути
app.use('/telegram', require('./routes/telegram')); // Додаємо новий маршрут для Telegram

// Обробка помилок
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Something went wrong.');
});

app.listen(port, async () => {
    try {
        await setBotCommands(); // Встановлення команд бота при запуску сервера
        console.log(`Server is running on http://0.0.0.0:${port}`);
    } catch (err) {
        console.error('Error setting bot commands:', err);
    }
});
