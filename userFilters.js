const users = {};
const filters = {};
const DEFAULT_INTERVAL = 30;

function setUserFilters(chatId, userFilters) {
    console.log(`Setting filters for chatId ${chatId}:`, userFilters);
    filters[chatId] = userFilters; // Зберігаємо фільтри для кожного користувача
    if (!users[chatId]) {
        users[chatId] = { filters: userFilters, interval: DEFAULT_INTERVAL, ready: false };
    } else {
        users[chatId].filters = userFilters;
    }
}

function getUserFilters(chatId) {
    console.log(`Getting filters for chatId ${chatId}`);
    const userFilters = filters[chatId];
    console.log(`Filters for chatId ${chatId}:`, userFilters);
    return userFilters;
}

function getAllUserFilters() {
    const allFilters = [];
    for (const chatId in filters) {
        if (filters.hasOwnProperty(chatId)) {
            allFilters.push(filters[chatId]);
        }
    }
    return allFilters;
}

function setUserReady(chatId, isReady) {
    if (!users[chatId]) {
        users[chatId] = { filters: filters[chatId] || {}, interval: DEFAULT_INTERVAL, ready: false };
    }
    users[chatId].ready = isReady;
}

function isUserReady(chatId) {
    return users[chatId] ? users[chatId].ready : false;
}

function setUserInterval(chatId, interval) {
    if (!users[chatId]) {
        users[chatId] = { filters: filters[chatId] || {}, interval: DEFAULT_INTERVAL, ready: false };
    }
    users[chatId].interval = interval;
}

function getUserInterval(chatId) {
    return users[chatId] ? users[chatId].interval : DEFAULT_INTERVAL;
}

function resetUserFilters(chatId) {
    if (users[chatId]) {
        users[chatId].filters = {};
        filters[chatId] = {};
    }
}

module.exports = {
    setUserFilters,
    getUserFilters,
    setUserReady,
    isUserReady,
    setUserInterval,
    getUserInterval,
    resetUserFilters,
    getAllUserFilters
};
