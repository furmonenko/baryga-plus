const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
    console.log('Received message:', msg);
});

// Зупинка бота після отримання всіх повідомлень
setTimeout(() => {
    bot.stopPolling();
}, 30000); // 30 секунд достатньо для отримання всіх старих повідомлень
