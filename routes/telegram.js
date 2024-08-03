const express = require('express');
const router = express.Router();
const { sendLoggedMessage, clearChat } = require('../utils/telegram');
const {
    processFiltersCommand,
    processClearHistoryCommand,
    processStartCommand,
    showCategories,
    processIntervalCommand,
    processHistoryCommand,
    processGoCommand,
    processStopCommand,
    processResetCommand,
    processPresetCommand,
    handleCallbackQuery,
    processCategorySelection,
    showBrands,
    showSizes,
    showPrices
} = require('../handlers/messageHandlers');
const { logMessage } = require("../utils/fileOperations");

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

        // Логування повідомлення з командою
        logMessage(chatId, message.message_id); // Зберігає message_id команди

        switch (command) {
            case '/start':
                await processStartCommand(chatId);
                break;
            case '/history':
                await processHistoryCommand(chatId);
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
            default:
                await sendLoggedMessage(chatId, 'Unknown command. Use /filters to set your search filters.');
        }
    }

    res.sendStatus(200);
});

module.exports = router; // Переконайтесь, що експортуєте саме роутер
