const UserManager = require("../managers/userManager");
const { sendLoggedMessage } = require("./telegram");

async function notifyAdmins(message) {
    const allUsers = UserManager.getAllUsers(); // Отримуємо всіх користувачів

    for (const user of allUsers) {
        if (user.isUserAdmin()) { // Перевіряємо, чи є користувач адміном
            try {
                await sendLoggedMessage(user.chatId, message); // Надсилаємо повідомлення адмінам
                console.log(`Message sent to admin: ${user.chatId}`);
            } catch (error) {
                console.error(`Failed to send message to admin: ${user.chatId}. Error: ${error.message}`);
            }
        }
    }
}

async function handleRestartServerCommand(user) {
    const chatId = user.chatId;

    if (UserManager.isAdmin(chatId)) {
        // Notify all admins
        await notifyAdmins('🔄 Restarting server...');

        // Restart the server
        process.exit(0); // Exit the process, which will trigger a restart
    } else {
        await sendLoggedMessage(chatId, '🚫 You do not have permission to restart the server.');
    }
}

module.exports = {
    notifyAdmins,
    handleRestartServerCommand
}