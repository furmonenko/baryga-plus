require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { setBotCommands } = require('./utils/telegram');
const { updateCache } = require("./services/fetchData.js");
const { setTimersForAllUsers } = require('./managers/timerManager');
const UserManager = require('./managers/userManager');
const { sendTelegramMessage } = require("./utils/telegram");
const { notifyAdmins } = require("./utils/adminCommands"); // Import UserManager for user operations
const moment = require('moment-timezone');

const app = express();
const port = process.env.PORT || 3000;

const sessionStore = new session.MemoryStore();

app.use(bodyParser.json());
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET, // Use secret key from .env file
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Clear all sessions when the server starts
sessionStore.clear();
console.log('Session store cleared.');

let currentInterval = 30000; // Initial interval 30 seconds
let lastIntervalNotification = null; // Track the last notification sent

// Function to send messages to all users
async function notifyAllUsers(message) {
    const allUsers = UserManager.getAllUsers();
    for (const user of allUsers) {
        try {
            await sendTelegramMessage(user.chatId, message, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error(`Error sending message to user ${user.chatId}:`, error.message);
        }
    }
}

let fetchInterval = setInterval(startFetchCycle, currentInterval); // Start the fetch cycle
let start_hour = 9
let finish_hour = 23

function getFetchIntervalBasedOnTime() {
    const now = moment().tz('Europe/Warsaw'); // Встановлюємо часовий пояс Варшави
    const hours = now.hours();

    console.log(`Local hours in Warsaw: ${hours}`);

    if (hours >= start_hour && hours < finish_hour) {
        return 30000; // Інтервал 30 секунд з 9:00 до 23:00
    } else {
        return 0; // Пауза з 23:00 до 9:00
    }
}

// Function to format hours as "HH:00" for messages
function formatHour(hour) {
    return `${hour.toString().padStart(2, '0')}:00`;
}

async function startFetchCycle() {
    clearInterval(fetchInterval); // Зупиняємо попередній інтервал

    const previousInterval = currentInterval;
    currentInterval = getFetchIntervalBasedOnTime(); // Оновлюємо інтервал на основі поточного часу
    console.log(`Fetch interval set to ${currentInterval} ms based on current time.`);

    if (currentInterval > 0) {
        if (previousInterval === 0 && currentInterval === 30000) {
            // Якщо пошук відновлюється після паузи
            await notifyAllUsers(`🌅 *Good morning!*\n\n🔍 Searching is available again from ${formatHour(start_hour)}. You can set filters and start searching now.`);
        }

        fetchInterval = setInterval(async () => {
            console.log(`Cron job triggered at ${new Date().toISOString()}`);
            try {
                await updateCache();
                setTimersForAllUsers(); // Start timers for users after cache update
            } catch (error) {
                console.error('Error during updateCache:', error);
            }
        }, currentInterval);

    } else {
        console.log(`Fetch cycle is paused (${formatHour(finish_hour)} - ${formatHour(start_hour)}).`);

        // Повідомлення про паузу з автоматичним визначенням годин
        if (lastIntervalNotification !== 'paused') {
            await notifyAllUsers(`⏸️ *Searching is temporarily paused.*\n\n🚫 From ${formatHour(finish_hour)} to ${formatHour(start_hour)}, searching is unavailable.\n\n🕗 Come back after ${formatHour(start_hour)} to resume searching. Good night! 😴`);
            lastIntervalNotification = 'paused';
        }
    }
}


// Start the fetch cycle immediately on server start
notifyAllUsers("🤩 *The Barygabot+ is awake!* 🤩");
startFetchCycle();

// Additional interval to check for time changes
setInterval(() => {
    const newInterval = getFetchIntervalBasedOnTime();
    if (newInterval !== currentInterval) {
        startFetchCycle(); // Restart the cycle if the interval changes
    }
}, 60000); // Check every minute

console.log("Cron job setup completed.");

app.get('/health', (req, res) => {
    console.log(`Health check received at ${new Date().toISOString()} from ${req.ip}`);
    res.status(200).send('OK');
});

// Routes
app.use('/telegram', require('./routes/telegram')); // Add new route for Telegram
console.log('Telegram route initialized.');

// Error handling
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(500).send('Something went wrong.');
});

app.listen(port, async () => {
    try {
        console.log('Setting bot commands...');
        await setBotCommands(); // Set bot commands on server start
        console.log(`Bot commands set successfully.`);
        console.log(`Server is running on http://0.0.0.0:${port}`);
    } catch (err) {
        console.error('Error setting bot commands:', err);
    }
});
