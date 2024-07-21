const express = require('express');
const { setTimer, clearTimer } = require('../timerManager');
const { updateCacheForUser } = require('../cron/updateCache');
const { setUserInterval } = require('../userFilters');

module.exports = () => {
    const router = express.Router();

    router.post('/', (req, res) => {
        const { interval } = req.body;

        if (typeof interval !== 'number' || interval <= 0) {
            return res.status(400).json({ message: 'Invalid interval value' });
        }

        // Перевірка наявності deviceToken
        if (!req.session.deviceToken) {
            return res.status(400).json({ message: 'Device token is required to set interval' });
        }

        const sessionId = req.sessionID;

        // Очищення існуючого інтервалу, якщо такий є
        clearTimer(sessionId);

        setUserInterval(sessionId, interval);
        setTimer(sessionId, interval, updateCacheForUser);
        console.log('Updated interval:', interval);

        res.status(200).json({ interval });
    });

    return router;
};
