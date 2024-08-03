require('dotenv').config(); // Завантаження змінних середовища з файлу .env
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cron = require('node-cron');
const { setBotCommands } = require('./utils/telegram');
const { updateCache } = require("./services/fetchData.js");
const { clearHistory, loadChatIds, getUserChatIds } = require('./utils/fileOperations');
const { sendLoggedMessage } = require('./utils/telegram');
const { clearTimer } = require('./timerManager');
const { setUserReady } = require('./userFilters');

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

// Middleware для очищення історії для кожної сесії
app.use((req, res, next) => {
    if (!req.session.historyCleared) {
        console.log(`Clearing session history for session ID: ${req.sessionID}`);
        req.session.history = [];
        req.session.historyCleared = true;
    }
    next();
});

// Middleware для логування запитів
app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url} at ${new Date().toISOString()}`);
    console.log(`Request body: ${JSON.stringify(req.body)}`);
    next();
});

console.log("Starting cron job setup...");

// Використання setInterval для запуску завдання кожні 30 секунд
setInterval(() => {
    console.log(`Cron job triggered at ${new Date().toISOString()}`);
    updateCache().catch(error => {
        console.error('Error during updateCache:', error);
    });
}, 30000); // 30000 мілісекунд = 30 секунд

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

// Функція для зупинки пошуку і очищення історії
async function stopSearchForAllUsers() {
    const chatIds = loadChatIds(); // Зробіть відповідне завантаження користувачів

    for (const chatId of chatIds) {
        clearTimer(chatId);
        clearHistory(chatId);
        setUserReady(chatId, false);
        await sendLoggedMessage(chatId, 'Бот зараз спить. Повертайтеся о 8:00!');
    }
}

// Функція для інформування користувачів про можливість початку нового пошуку
async function notifyUsersToStartNewSearch() {
    const chatIds = loadChatIds(); // Зробіть відповідне завантаження користувачів

    for (const chatId of chatIds) {
        await sendLoggedMessage(chatId, 'Бот прокинувся! Ви можете почати новий пошук з новими фільтрами.');
    }
}

// Зупиняємо пошук о 00:00
cron.schedule('0 0 * * *', () => {
    console.log(`Stopping search for all users at ${new Date().toISOString()}`);
    stopSearchForAllUsers().catch(error => {
        console.error('Error during stopSearchForAllUsers:', error);
    });
});

// Повідомляємо користувачів о 8:00
cron.schedule('0 8 * * *', () => {
    console.log(`Notifying users to start new search at ${new Date().toISOString()}`);
    notifyUsersToStartNewSearch().catch(error => {
        console.error('Error during notifyUsersToStartNewSearch:', error);
    });
});
