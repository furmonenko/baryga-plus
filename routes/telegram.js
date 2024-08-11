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
        const { first_name: firstName, last_name: lastName, username } = message ? message.from : callback_query.from;
        user = UserManager.createUser(chatId, firstName, lastName, username);
    }

    if (UserManager.isUserBanned(chatId)) {
        console.log(`User with chatId ${chatId} is banned.`);
        return res.sendStatus(403); // Забороняємо доступ
    }

    const isAdmin = user.plan === 'admin';

    if (callback_query) {
        await handleCallbackQuery(user, callback_query.data);
    } else if (message) {
        const [command, arg1, arg2] = message.text.trim().split(' ');

        // Загальні команди для всіх користувачів
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
                if (isAdmin) {
                    // Додаткові команди для адміністратора
                    switch (command) {
                        case '/changeplan':
                            UserManager.changeUserPlan(arg1, arg2);
                            await sendLoggedMessage(chatId, `Plan changed for ${arg1} to ${arg2}`);
                            break;
                        case '/ban':
                            UserManager.banUser(parseInt(arg1));
                            await sendLoggedMessage(chatId, `User with chatId ${arg1} has been banned`);
                            break;
                        case '/unban':
                            UserManager.unbanUser(parseInt(arg1));
                            await sendLoggedMessage(chatId, `User with chatId ${arg1} has been unbanned`);
                            break;
                        default:
                            await sendLoggedMessage(chatId, 'Unknown command.');
                    }
                } else {
                    await sendLoggedMessage(chatId, 'Unknown command.');
                }
        }
    }

    res.sendStatus(200);
});

module.exports = router; // Переконайтесь, що експортуєте саме роутер
