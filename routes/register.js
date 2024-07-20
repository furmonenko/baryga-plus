const express = require('express');
const axios = require('axios');
const { updateCacheForUser } = require('../cron/updateCache');

module.exports = (timers) => {
    const router = express.Router();

    router.post('/', async (req, res) => {
        const { deviceToken } = req.body;

        if (!deviceToken) {
            return res.status(400).json({ message: 'Device token is required' });
        }

        req.session.deviceToken = deviceToken;
        console.log(`Device token registered: ${deviceToken}`);

        // Налаштування фільтрів
        try {
            const filters = {
                brand: 73306, // id бренду Stone Island
                size: 'XXL',
                minPrice: 0,
                maxPrice: 1000,
                category: 'Men' // id категорії Clothes
            };
            const filterResponse = await axios.post('http://localhost:3000/filters', filters);
            console.log('Filters set successfully:', filterResponse.data);
            req.session.filters = filterResponse.data; // Зберігаємо фільтри в сесії
        } catch (error) {
            console.error('Error setting filters:', error.response ? error.response.data : error.message);
        }

        // Налаштування інтервалу для сесії тільки якщо є deviceToken
        if (!req.session.intervalSet) {
            const interval = req.session.interval || 60; // Інтервал за замовчуванням 60 секунд
            if (timers[req.sessionID]) {
                clearInterval(timers[req.sessionID]);
            }
            timers[req.sessionID] = setInterval(() => {
                updateCacheForUser(req);
            }, interval * 1000);
            req.session.intervalSet = true;
        }

        res.sendStatus(200);
    });

    return router;
};
