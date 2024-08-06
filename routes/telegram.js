const express = require('express');
const router = express.Router();
const UserManager = require('../managers/userManager');
const { sendLoggedMessage } = require('../utils/telegram');
const {
    processClearHistoryCommand,
    processStartCommand,
    processHistoryCommand,
    processStopCommand,
    processResetCommand,
    handleCallbackQuery
} = require('../handlers/messageHandlers');
const { logMessage } = require("../utils/fileOperations");

router.post('/webhook', async (req, res) => {
    const { message, callback_query } = req.body;
    const chatId = message ? message.chat.id : callback_query.from.id;
    let user = UserManager.getUser(chatId);

    if (!user) {
        user = UserManager.createUser(chatId);
    }
    console.log("All users: " + UserManager.getAllUsers())


    if (callback_query) {
        await handleCallbackQuery(user, callback_query.data);
    } else if (message) {
        const command = message.text.trim().split(' ')[0];

        // Логування повідомлення з командою
        logMessage(chatId, message.message_id); // Зберігає message_id команди

        switch (command) {
            case '/start':
                await processStartCommand(user);
                break;
            case '/history':
                await processHistoryCommand(user);
                break;
            case '/stop':
                await processStopCommand(user);
                break;
            case '/reset':
                await processResetCommand(user);
                break;
            case '/clearhistory':
                await processClearHistoryCommand(user);
                break;
            default:
                await sendLoggedMessage(chatId, 'Unknown command. Use /filters to set your search filters.');
        }
    }

    res.sendStatus(200);
});

module.exports = router; // Переконайтесь, що експортуєте саме роутер
