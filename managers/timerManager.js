const UserManager = require('../managers/userManager');
const { updateHistoryForUser } = require('../managers/userItemManager');

const timers = {};

function setTimer(chatId, interval) {
    if (timers[chatId]) {
        clearInterval(timers[chatId]);
    }
    timers[chatId] = setInterval(async () => {
        console.log(`Timer triggered for chatId: ${chatId} at interval: ${interval}`);
        const user = UserManager.getUser(chatId);
        if (user && user.isReady() && !user.isBanned()) {
            console.log(`Updating history for chatId: ${chatId}`);
            await updateHistoryForUser(chatId);
        } else if (user && user.isBanned()) {
            console.log(`User with chatId ${chatId} is banned, skipping update.`);
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

function setTimersForAllUsers() {
    const users = UserManager.getAllUsers();
    for (const user of users) {
        clearTimer(user.chatId); // Очищуємо попередній таймер, якщо він існує
        if (!user.isBanned()) {
            const interval = user.getPlanInterval(user.plan);
            if (interval === 0) {
                // Якщо інтервал 0, запускаємо оновлення одразу
                updateHistoryForUser(user.chatId);
            } else {
                // Встановлюємо таймер відповідно до плану користувача
                setTimer(user.chatId, interval);
            }
        }
    }
}

module.exports = {
    setTimer,
    clearTimer,
    setTimersForAllUsers
};
