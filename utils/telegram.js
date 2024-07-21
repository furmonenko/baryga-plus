const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function setBotCommands() {
    const commands = [
        { command: 'start', description: 'Start the bot' },
        { command: 'filters', description: 'Set search filters (e.g., /filters brand, size (e.g., S, M, L), minPrice, maxPrice, category)' },
        { command: 'interval', description: 'Set search interval' },
        { command: 'history', description: 'Show search history' },
        { command: 'go', description: 'Start search' },
        { command: 'stop', description: 'Stop search' },
        { command: 'reset', description: 'Reset all commands' },
        { command: 'clearhistory', description: 'Clear search history' },
        { command: 'presets', description: 'Show available presets' }
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
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, ...options })
    });

    return await response.json();
}

module.exports = {
    setBotCommands,
    sendTelegramMessage
};
