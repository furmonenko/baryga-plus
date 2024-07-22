const users = {};

function setUserFilters(chatId, filters) {
    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: 60, ready: false };
    }
    users[chatId].filters = filters;
}

function getUserFilters(chatId) {
    return users[chatId] ? users[chatId].filters : null;
}

function setUserReady(chatId, isReady) {
    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: 60, ready: false };
    }
    users[chatId].ready = isReady;
}

function isUserReady(chatId) {
    return users[chatId] ? users[chatId].ready : false;
}

function setUserInterval(chatId, interval) {
    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: 60, ready: false };
    }
    users[chatId].interval = interval;
}

function getUserInterval(chatId) {
    return users[chatId] ? users[chatId].interval : 60;
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
    resetUserFilters
};
