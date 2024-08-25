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
    handleCallbackQuery,
    handlePresetFiltersCommand,
    showDeleteCustomFilters,
    showMainMenu, showCustomPresetsSettings, showActiveFiltersCommand, showActiveFiltersMenu, continueSearching,
    showFiltersInfo
} = require('../handlers/messageHandlers');
const { logMessage } = require("../utils/fileOperations");
const {handleRestartServerCommand} = require("../utils/adminCommands");

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

    const currentPlan = user.plan;
    const planFromFile = UserManager.getPlanFromFile(chatId);

    if (planFromFile && planFromFile !== currentPlan) {
        console.log(`Updating plan for user ${chatId} from ${currentPlan} to ${planFromFile}`);
        await UserManager.setPlan(chatId, planFromFile);
        user.setPlan(planFromFile); // Оновлюємо план користувача в пам'яті
    }

    const isAdmin = UserManager.isAdmin(chatId);

    if (callback_query) {
        await handleCallbackQuery(user, callback_query.data);
    } else if (message) {
        const [command, arg1, arg2] = message.text.trim().split(' ');

        switch (command) {
            case '/start':
                await processStartCommand(user);
                break;
            case '/menu':
                await showMainMenu(user);
                break;
            case '/start_search':
                await continueSearching(user);
                break;
            case '/stop_search':
                await processStopCommand(user);
                break;
            case '/reset':
                await processResetCommand(user);
                break;
            case '/active_filters':
                await showActiveFiltersMenu(user);
                break;
            case '/delete_preset':
                await showDeleteCustomFilters(user)
                break;
            default:
                if (isAdmin) {
                    switch (command) {
                        case '/changeplan':
                            await UserManager.setPlan(arg1, arg2);
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
                        case '/restart_server':
                            await handleRestartServerCommand(user);
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

module.exports = router;
