const { clearLoggedMessages, getLoggedMessages, logMessage } = require('./fileOperations');
const axios = require('axios');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function setBotCommands() {
    const commands = [
        { command: 'menu', description: 'Open main menu' },
        { command: 'active_filters', description: 'Show active filters' },
        { command: 'stop', description: 'Stop search' },
        { command: 'reset', description: 'Reset all commands' },
        { command: 'custom_presets_settings', description: 'Manage custom presets' },
        { command: 'delete_preset', description: 'Delete custom filter' }
    ];

    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands })
    });

    const data = await response.json();
    console.log('Set Bot Commands:', data);
}

async function sendLoggedMessage(chatId, text, options = {}) {
    const response = await sendTelegramMessage(chatId, text, options);
    if (response.ok) {
        logMessage(chatId, response.result.message_id);
    }
}

async function sendTelegramMessage(chatId, text, options = {}) {
    const payload = {
        chat_id: chatId,
        text: text,
        ...options
    };

    try {
        const response = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, payload);
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
        return { ok: false, result: null };
    }
}

async function sendLoggedPhoto(chatId, photoUrl, caption, options = {}) {
    const payload = {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        ...options
    };

    try {
        const response = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`, payload);
        if (response.data.ok) {
            logMessage(chatId, response.data.result.message_id);
        }
    } catch (error) {
        console.error('Error sending photo:', error.response ? error.response.data : error.message);
    }
}

async function clearChat(chatId) {
    try {
        const messages = getLoggedMessages(chatId);
        for (const msg of messages) {
            await deleteMessage(chatId, msg.message_id);
        }
        clearLoggedMessages(chatId);
    } catch (error) {
        console.error('Error clearing chat:', error);
    }
}

async function deleteMessage(chatId, messageId) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${token}/deleteMessage`;

    const fetch = (await import('node-fetch')).default;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId
            })
        });

        const data = await response.json();
        if (!data.ok) {
            console.error('Failed to delete message:', data);
        } else {
            console.log(`Message ${messageId} deleted successfully.`);
        }
    } catch (error) {
        console.error('Error deleting message:', error);
    }
}

module.exports = {
    setBotCommands,
    sendLoggedPhoto,
    clearChat,
    sendLoggedMessage
};
