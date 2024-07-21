require('dotenv').config(); // Завантаження змінних середовища з файлу .env
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { setBotCommands } = require('./utils/telegram');

const app = express();
const port = 3000;

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

// Маршрути
app.use('/register', require('./routes/register')());
app.use('/history', require('./routes/history'));
app.use('/filters', require('./routes/filters'));
app.use('/interval', require('./routes/interval')());
app.use('/telegram', require('./routes/telegram')()); // Додаємо новий маршрут для Telegram

app.listen(port, async () => {
    await setBotCommands(); // Встановлення команд бота при запуску сервера
    console.log(`Server is running on http://localhost:${port}`);
});
