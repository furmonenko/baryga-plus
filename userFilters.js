const users = {};
const DEFAULT_INTERVAL= 10

function setUserFilters(chatId, filters) {
    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: DEFAULT_INTERVAL, ready: false };
    }
    users[chatId].filters = filters;
}

function getAllUserFilters() {
    const allFilters = [];
    for (const chatId in users) {
        if (users.hasOwnProperty(chatId)) {
            allFilters.push(users[chatId].filters);
        }
    }
    return allFilters;
}

function getUserFilters(chatId) {
    return users[chatId] ? users[chatId].filters : null;
}

function setUserReady(chatId, isReady) {
    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: DEFAULT_INTERVAL, ready: false };
    }
    users[chatId].ready = isReady;
}

function isUserReady(chatId) {
    return users[chatId] ? users[chatId].ready : false;
}

function setUserInterval(chatId, interval) {
    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: DEFAULT_INTERVAL, ready: false };
    }
    users[chatId].interval = interval;
}

function getUserInterval(chatId) {
    return users[chatId] ? users[chatId].interval : DEFAULT_INTERVAL;
}

function resetUserFilters(chatId) {
    if (users[chatId]) {
        users[chatId].filters = {};
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
