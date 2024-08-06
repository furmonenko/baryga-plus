const UserManager = require('../managers/userManager'); // Переконайтеся, що шлях правильний
const { updateHistoryForUser } = require('../managers/userItemManager'); // Переконайтеся, що шлях правильний

const timers = {};

function setTimer(chatId, interval) {
    if (timers[chatId]) {
        clearInterval(timers[chatId]);
    }
    timers[chatId] = setInterval(async () => {
        console.log(`Timer triggered for chatId: ${chatId} at interval: ${interval}`);
        const user = UserManager.getUser(chatId);
        if (user && user.isReady()) {
            console.log(`Updating history for chatId: ${chatId}`);
            await updateHistoryForUser(chatId);
        } else {
            console.log(`User is not ready for chatId: ${chatId}`);
        }
    }, interval * 1000);
    console.log(`Timer set for chatId: ${chatId} with interval: ${interval}`);
}

function clearTimer(chatId) {
    if (timers[chatId]) {
        clearInterval(timers[chatId]);
        delete timers[chatId];
        console.log(`Timer cleared for chatId: ${chatId}`);
    }
}

module.exports = {
    setTimer,
    clearTimer
};
