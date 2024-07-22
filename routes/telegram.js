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
    processCategorySelection
} = require('../handlers/messageHandlers');

const users = {};

router.post('/webhook', async (req, res) => {
    const { message, callback_query } = req.body;
    const chatId = message ? message.chat.id : callback_query.from.id;
    let text = message ? message.text.trim() : callback_query.data;

    if (text.startsWith('command_')) {
        text = text.replace('command_', '');
    }

    const command = text.split(' ')[0];

    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: 60, ready: false, selectedCategory: 'Men' };
    }

    console.log(text)

    if (text.startsWith('/category_')) {
        const categoryTitle = text.replace('/category_', '');
        await processCategorySelection(chatId, categoryTitle);
    } else {
        switch (command) {
            case '/start':
                await processStartCommand(chatId);
                break;
            case '/filters':
                await processFiltersCommand(chatId, text, users[chatId].selectedCategory);
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
