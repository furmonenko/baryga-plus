const express = require('express');
const router = express.Router();
const { sendTelegramMessage } = require('../utils/telegram');
const { setTimer, clearTimer } = require('../timerManager');
const { updateCacheForUser } = require('../cron/updateCache');
const { setUserFilters, getUserFilters, setUserInterval, getUserInterval } = require('../userFilters');
const { fetchBrandId } = require('../services/brands');
const { getCategoryIdByName } = require('../services/categories');
const { clearHistory } = require('../utils/fileOperations');

const users = {};

function setUserReady(chatId, isReady) {
    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: 60, ready: false };
    }
    users[chatId].ready = isReady;
}

function isUserReady(chatId) {
    return users[chatId] ? users[chatId].ready : false;
}

function resetUserFilters(chatId) {
    users[chatId].filters = {};
}

function resetAllUsers() {
    for (const chatId in users) {
        clearTimer(chatId);
    }
    for (const chatId in users) {
        delete users[chatId];
    }
}

async function applyPresetFilters(chatId, preset) {
    clearTimer(chatId);
    setUserReady(chatId, false);

    const { brandName, size, minPrice, maxPrice, categoryName } = preset;

    const brandId = await fetchBrandId(brandName);
    if (!brandId) {
        await sendTelegramMessage(chatId, `Invalid brand name: ${brandName}`);
        return;
    }

    const categoryId = getCategoryIdByName(categoryName);
    if (!categoryId) {
        await sendTelegramMessage(chatId, `Invalid category name: ${categoryName}`);
        return;
    }

    const filters = {
        brand: brandId,
        size: size.split(',').map(s => s.trim()), // Розбиваємо розміри на масив
        minPrice: minPrice,
        maxPrice: maxPrice,
        category: categoryId
    };

    setUserFilters(chatId, filters);
    await sendTelegramMessage(chatId, 'Filters have been set.');

    setUserReady(chatId, true);
    setTimer(chatId, getUserInterval(chatId), updateCacheForUser);
}

async function processFiltersCommand(chatId, text) {
    const parts = text.replace('/filters', '').split(',').map(part => part.trim());
    if (parts.length !== 5) {
        await sendTelegramMessage(chatId, 'Please use the correct format: /filters brand, size (e.g., S, M, L), minPrice, maxPrice, category');
        return;
    }

    clearTimer(chatId);
    setUserReady(chatId, false);

    const brandName = parts[0];
    const size = parts[1];
    const minPrice = parseInt(parts[2], 10);
    const maxPrice = parseInt(parts[3], 10);
    const categoryName = parts[4];

    resetUserFilters(chatId);

    const brandId = await fetchBrandId(brandName);
    if (!brandId) {
        await sendTelegramMessage(chatId, `Invalid brand name: ${brandName}`);
        return;
    }

    const categoryId = getCategoryIdByName(categoryName);
    if (!categoryId) {
        await sendTelegramMessage(chatId, `Invalid category name: ${categoryName}`);
        return;
    }

    const filters = {
        brand: brandId,
        size: size.split(',').map(s => s.trim()), // Розбиваємо розміри на масив
        minPrice: minPrice,
        maxPrice: maxPrice,
        category: categoryId
    };

    setUserFilters(chatId, filters);
    await sendTelegramMessage(chatId, 'Filters have been set.');

    if (isUserReady(chatId)) {
        setTimer(chatId, getUserInterval(chatId), updateCacheForUser);
    }
}

module.exports = () => {
    router.post('/webhook', async (req, res) => {
        const { message } = req.body;
        console.log('Received message:', message);

        if (message && message.text) {
            const chatId = message.chat.id;
            const text = message.text.trim();

            if (!users[chatId]) {
                users[chatId] = { filters: {}, interval: 60, ready: false };
            }

            console.log(`Processing command from chatId: ${chatId}, text: ${text}`);

            if (text.startsWith('/start')) {
                const options = {
                    reply_markup: {
                        keyboard: [
                            [{ text: '/filters' }],
                            [{ text: '/interval' }],
                            [{ text: '/history' }],
                            [{ text: '/go' }],
                            [{ text: '/stop' }],
                            [{ text: '/reset' }],
                            [{ text: '/clearhistory' }],
                            [{ text: '/presets' }] // Додаємо кнопку для пресетів
                        ],
                        one_time_keyboard: true,
                        resize_keyboard: true
                    }
                };
                await sendTelegramMessage(chatId, 'Welcome to the bot! Use the buttons below to set your filters and start searching.', options);
            } else if (text.startsWith('/filters')) {
                await processFiltersCommand(chatId, text);
            } else if (text.startsWith('/interval')) {
                const interval = parseInt(text.replace('/interval', '').trim(), 10);
                if (isNaN(interval) || interval <= 0) {
                    await sendTelegramMessage(chatId, 'Please provide a valid interval in seconds.');
                } else {
                    setUserInterval(chatId, interval);
                    await sendTelegramMessage(chatId, `Interval has been set to ${interval} seconds.`);

                    if (isUserReady(chatId)) {
                        clearTimer(chatId);
                        setTimer(chatId, interval, updateCacheForUser);
                    }
                }
            } else if (text.startsWith('/history')) {
                const history = loadHistory(chatId);
                if (history.length === 0) {
                    await sendTelegramMessage(chatId, 'No search history found.');
                } else {
                    const historyText = history.map(item => `${item.title}: ${item.url}`).join('\n');
                    await sendTelegramMessage(chatId, `Search history:\n${historyText}`);
                }
            } else if (text.startsWith('/go')) {
                if (!isUserReady(chatId)) {
                    await sendTelegramMessage(chatId, 'Please set your filters and interval before starting the search.');
                } else {
                    setTimer(chatId, getUserInterval(chatId), updateCacheForUser);
                    await sendTelegramMessage(chatId, 'Search started.');
                }
            } else if (text.startsWith('/stop')) {
                clearTimer(chatId);
                await sendTelegramMessage(chatId, 'Search stopped.');
            } else if (text.startsWith('/reset')) {
                clearTimer(chatId);
                resetUserFilters(chatId);
                setUserReady(chatId, false);
                await sendTelegramMessage(chatId, 'Filters have been reset.');
            } else if (text.startsWith('/clearhistory')) {
                clearHistory(chatId);
                await sendTelegramMessage(chatId, 'History has been cleared.');
            } else if (text.startsWith('/presets')) {
                const presetButtons = [
                    [{ text: '/preset Stone Island, XXL, 0, 200, Men' }],
                    [{ text: '/preset Stone Island, L, 0, 300, Men' }],
                    [{ text: '/preset Stone Island, M, 0, 400, Men' }],
                    [{ text: '/preset Stone Island, S, 0, 500, Men' }]
                ];
                const options = {
                    reply_markup: {
                        keyboard: presetButtons,
                        one_time_keyboard: true,
                        resize_keyboard: true
                    }
                };
                await sendTelegramMessage(chatId, 'Please select a preset filter.', options);
            } else if (text.startsWith('/preset')) {
                const presetText = text.replace('/preset', '').trim();
                const presetParts = presetText.split(',').map(part => part.trim());

                if (presetParts.length !== 5) {
                    await sendTelegramMessage(chatId, 'Invalid preset format.');
                } else {
                    const preset = {
                        brandName: presetParts[0],
                        size: presetParts[1],
                        minPrice: parseInt(presetParts[2], 10),
                        maxPrice: parseInt(presetParts[3], 10),
                        categoryName: presetParts[4]
                    };

                    await applyPresetFilters(chatId, preset);
                }
            } else {
                await sendTelegramMessage(chatId, 'Unknown command. Use /filters to set your search filters.');
            }
        }

        res.sendStatus(200);
    });

    return router;
};

module.exports.getUserFilters = getUserFilters;
