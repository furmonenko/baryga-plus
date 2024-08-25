require('dotenv').config(); // Завантаження змінних середовища з файлу .env
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { setBotCommands } = require('./utils/telegram');
const { updateCache } = require("./services/fetchData.js");
const { setTimersForAllUsers } = require('./managers/timerManager');

const app = express();
const port = process.env.PORT || 3000;

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
console.log('Session store cleared.');

let currentInterval = 30000; // Початковий інтервал 30 секунд

function getFetchIntervalBasedOnTime() {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 16 && hours < 20) {
        return 10000; // З 16:00 до 20:00 - інтервал 10 секунд
    } else if (hours >= 20 && hours < 24) {
        return 30000; // З 20:00 до 00:00 - інтервал 30 секунд
    } else if (hours >= 0 && hours < 8) {
        return 0; // З 00:00 до 08:00 - не виконуємо фетчів
    } else {
        return 30000; // З 08:00 до 16:00 - інтервал 30 секунд
    }
}

function startFetchCycle() {
    clearInterval(fetchInterval); // Зупиняємо попередній інтервал

    currentInterval = getFetchIntervalBasedOnTime(); // Оновлюємо інтервал на основі поточного часу
    console.log(`Fetch interval set to ${currentInterval} ms based on current time.`);

    if (currentInterval > 0) {
        fetchInterval = setInterval(async () => {
            console.log(`Cron job triggered at ${new Date().toISOString()}`);
            try {
                await updateCache();
                setTimersForAllUsers(); // Запуск таймерів для користувачів після оновлення кешу
            } catch (error) {
                console.error('Error during updateCache:', error);
            }
        }, currentInterval);
    } else {
        console.log('Fetch cycle is paused (00:00 - 08:00).');
    }
}

let fetchInterval = setInterval(startFetchCycle, currentInterval); // Запускаємо цикл фетчів

// Додатковий інтервал для перевірки зміни часу
setInterval(() => {
    const newInterval = getFetchIntervalBasedOnTime();
    if (newInterval !== currentInterval) {
        startFetchCycle(); // Якщо інтервал змінився, перезапускаємо цикл
    }
}, 60000); // Перевірка кожну хвилину

console.log("Cron job setup completed.");

app.get('/health', (req, res) => {
    console.log(`Health check received at ${new Date().toISOString()} from ${req.ip}`);
    res.status(200).send('OK');
});

// Маршрути
app.use('/telegram', require('./routes/telegram')); // Додаємо новий маршрут для Telegram
console.log('Telegram route initialized.');

// Обробка помилок
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(500).send('Something went wrong.');
});

app.listen(port, async () => {
    try {
        console.log('Setting bot commands...');
        await setBotCommands(); // Встановлення команд бота при запуску сервера
        console.log(`Bot commands set successfully.`);
        console.log(`Server is running on http://0.0.0.0:${port}`);
    } catch (err) {
        console.error('Error setting bot commands:', err);
    }
});