const { updateCacheForUser } = require('./cron/updateCache'); // Переконайтеся, що шлях правильний

const timers = {};

function setTimer(id, interval) {
    if (timers[id]) {
        clearInterval(timers[id]);
    }
    timers[id] = setInterval(() => {
        updateCacheForUser(id);
    }, interval * 1000);
}

function clearTimer(id) {
    if (timers[id]) {
        clearInterval(timers[id]);
        delete timers[id];
    }
}

module.exports = {
    setTimer,
    clearTimer
};
