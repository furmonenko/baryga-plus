const express = require('express');
const router = express.Router();
const { sendTelegramMessage } = require('../utils/telegram');
const {
    processFiltersCommand,
    applyPresetFilters,
    showCategories,
    processIntervalCommand,
    processHistoryCommand,
    processGoCommand,
    processStopCommand,
    processResetCommand,
    processClearHistoryCommand,
    processPresetCommand,
    processStartCommand,
    processCategorySelection,
    showBrands,
    showSizes,
    showPrices,
    showIntervals,
    handleCallbackQuery
} = require('../handlers/messageHandlers');

const users = {};

router.post('/webhook', async (req, res) => {
    const { message, callback_query } = req.body;
    const chatId = message ? message.chat.id : callback_query.from.id;
    const text = message ? message.text.trim() : callback_query.data;

    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: 60, ready: false, selectedCategory: 'Men', selectedSizes: [] };
    }

    if (callback_query) {
        await handleCallbackQuery(chatId, callback_query.data, users);
    } else if (message) {
        const command = text.split(' ')[0];

        switch (command) {
            case '/start':
                await processStartCommand(chatId);
                break;
            case '/filters':
                await showBrands(chatId);
                break;
            case '/interval':
                await processIntervalCommand(chatId, text);
                break;
            case '/history':
                await processHistoryCommand(chatId);
                break;
            case '/go':
                await processGoCommand(chatId);
                break;
            case '/stop':
                await processStopCommand(chatId);
                break;
            case '/reset':
                await processResetCommand(chatId);
                break;
            case '/clearhistory':
                await processClearHistoryCommand(chatId);
                break;
            case '/presets':
                await processPresetCommand(chatId);
                break;
            case '/categories':
                await showCategories(chatId);
                break;
            default:
                await sendTelegramMessage(chatId, 'Unknown command. Use /filters to set your search filters.');
        }
    }

    res.sendStatus(200);
});

module.exports = router;
