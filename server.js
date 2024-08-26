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

function getFetchIntervalBasedOnTime() {
    const now = new Date();
    const hours = now.getHours() - 2;
    console.log(`Current hours: ${hours}`);

    if (hours >= 16 && hours < 20) {
        return 10000; // 16:00 to 20:00 - 10 seconds interval
    } else if (hours >= 20 && hours < 24) {
        return 30000; // 20:00 to 00:00 - 30 seconds interval
    } else if (hours >= 0 && hours < 8) {
        return 0; // 00:00 to 08:00 - No fetches
    } else {
        return 30000; // 08:00 to 16:00 - 30 seconds interval
    }
}

async function startFetchCycle() {
    clearInterval(fetchInterval); // Stop the previous interval

    const previousInterval = currentInterval;
    currentInterval = getFetchIntervalBasedOnTime(); // Update interval based on current time
    console.log(`Fetch interval set to ${currentInterval} ms based on current time.`);

    if (currentInterval > 0) {
        if (previousInterval === 0 && currentInterval === 30000) {
            // If fetches resume after a pause (8 AM)
            await notifyAllUsers("🌅 *Good morning!*\n\n🔍 Searching is available again\. You can set filters and start searching now.");
        } else if (currentInterval === 10000 && lastIntervalNotification !== 'peak') {
            // Notify about peak hours when the interval decreases to 10 seconds
            await notifyAllUsers("🚀 *It's peak time on Vinted!*\n\n🔍 The search speed has been tripled to find new items faster.");
            lastIntervalNotification = 'peak';
        } else if (currentInterval === 30000 && previousInterval === 10000 && lastIntervalNotification !== 'calm') {
            // Notify about calm hours when the interval returns to 30 seconds
            await notifyAllUsers("😌 *It's calm on Vinted right now.*\n\n🔍 The search speed has returned to normal.");
            lastIntervalNotification = 'calm';
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
        console.log('Fetch cycle is paused (00:00 - 08:00).');

        // Send a notification to all users about the search being paused
        if (lastIntervalNotification !== 'paused') {
            await notifyAllUsers("⏸️ *Searching is temporarily paused.*\n\n🚫 From 00:00 to 08:00, searching is unavailable.\n\n🕗 Come back after 08:00 to resume searching. Good night! 😴");
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
