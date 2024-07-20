const express = require('express');
const { updateCacheForUser } = require('../cron/updateCache');

module.exports = (timers) => {
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

        // Очищення існуючого інтервалу, якщо такий є
        if (timers[req.sessionID]) {
            clearInterval(timers[req.sessionID]);
        }

        req.session.interval = interval;
        timers[req.sessionID] = setInterval(() => {
            updateCacheForUser(req);
        }, interval * 1000);
        console.log('Updated interval:', interval);

        res.status(200).json({ interval });
    });

    return router;
};
