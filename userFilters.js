const users = {};

function setUserFilters(chatId, filters) {
    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: 60 };
    }
    users[chatId].filters = filters;
}

function getUserFilters(chatId) {
    return users[chatId] ? users[chatId].filters : null;
}

function setUserInterval(chatId, interval) {
    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: 60 };
    }
    users[chatId].interval = interval;
}

function getUserInterval(chatId) {
    return users[chatId] ? users[chatId].interval : 60;
}

module.exports = {
    setUserFilters,
    getUserFilters,
    setUserInterval,
    getUserInterval
};
