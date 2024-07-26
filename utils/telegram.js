const axios = require('axios');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function setBotCommands() {
    const commands = [
        { command: 'start', description: 'Start the bot' },
        { command: 'history', description: 'Show search history' },
        { command: 'stop', description: 'Stop search' },
        { command: 'reset', description: 'Reset all commands' },
        { command: 'clearhistory', description: 'Clear search history' },
    ];

    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands })
    });

    const data = await response.json();
    console.log('Set Bot Commands:', data);
}

async function sendTelegramMessage(chatId, text, options = {}) {
    const payload = {
        chat_id: chatId,
        text: text,
        ...options
    };

    try {
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, payload);
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
    }
}

async function answerCallbackQuery(callbackQueryId, text) {
    const payload = {
        callback_query_id: callbackQueryId,
        text: text
    };

    try {
        await post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, payload);
    } catch (error) {
        console.error('Error answering callback query:', error.response ? error.response.data : error.message);
    }
}


module.exports = {
    setBotCommands,
    sendTelegramMessage
};
