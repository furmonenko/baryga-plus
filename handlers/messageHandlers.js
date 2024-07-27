const { sendTelegramMessage } = require('../utils/telegram');
const { getCategoryIdByName } = require('../services/categories');
const { clearTimer, setTimer} = require('../timerManager');
const { loadHistory, clearHistory, getCategories, getBrands, saveBrand} = require('../utils/fileOperations');
const {setUserInterval, isUserReady, resetUserFilters, setUserReady, setUserFilters, getUserInterval} = require("../userFilters");
const {updateCacheForUser} = require("../cron/updateCache");

const users = {};

async function deleteMessage(chatId, messageId) {
    const token = process.env.TELEGRAM_BOT_TOKEN; // Використайте свій токен бота
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


async function processFiltersCommand(chatId, users) {
    let selectedCategory = users[chatId].selectedCategory ?? getCategoryIdByName('Men');

    console.log(`Applying filters for chatId: ${chatId}`);
    console.log(`Brand: ${users[chatId].filters.brand}, Sizes: ${users[chatId].filters.size}, MaxPrice: ${users[chatId].filters.maxPrice}, Category: ${selectedCategory}`);

    clearTimer(chatId);
    setUserReady(chatId, false);

    const categoryId = getCategoryIdByName(selectedCategory);
    if (!categoryId) {
        await sendTelegramMessage(chatId, `Invalid category name: ${selectedCategory}`);
        return;
    }

    const filters = {
        brand: users[chatId].filters.brand,
        size: users[chatId].filters.size,
        minPrice: 0,
        maxPrice: users[chatId].filters.maxPrice,
        category: categoryId
    };

    console.log(`Final filters object: ${JSON.stringify(filters)}`);

    setUserFilters(chatId, filters);
    await sendTelegramMessage(chatId, 'Filters have been set.');

    setUserReady(chatId, true);
    if (isUserReady(chatId)) {
        setTimer(chatId, getUserInterval(chatId), updateCacheForUser);
    }
}

async function processCategorySelection(chatId, categoryTitle) {
    const categories = getCategories();
    const selectedCategory = Object.values(categories).find(cat => cat.title === categoryTitle);

    if (selectedCategory) {
        if (!users[chatId]) {
            users[chatId] = { filters: {}, interval: 60, ready: false };
        }


        console.log(selectedCategory);
        users[chatId].selectedCategory = selectedCategory.title;
        await sendTelegramMessage(chatId, `Category selected: ${selectedCategory.title}`);
    } else {
        await sendTelegramMessage(chatId, 'Invalid category selection.');
    }
}

async function processIntervalCommand(chatId, interval) {
    if (isNaN(interval) || interval <= 0) {
        await sendTelegramMessage(chatId, 'Please provide a valid interval in seconds.');
    } else {
        setUserInterval(chatId, interval);
        await sendTelegramMessage(chatId, `Interval has been set to ${interval} seconds.`);

        if (isUserReady(chatId)) {
            clearTimer(chatId);
            setTimer(chatId, interval, updateCacheForUser);
        }
    }
}

async function processHistoryCommand(chatId) {
    const history = loadHistory(chatId);
    if (history.length === 0) {
        await sendTelegramMessage(chatId, 'No search history found.');
    } else {
        const historyText = history.map(item => `${item.title}: ${item.url}`).join('\n');
        await sendTelegramMessage(chatId, `Search history:\n${historyText}`);
    }
}

async function processGoCommand(chatId) {
    if (!isUserReady(chatId)) {
        await sendTelegramMessage(chatId, 'Please set your filters and interval before starting the search.');
    } else {
        setTimer(chatId, getUserInterval(chatId), updateCacheForUser);
        await sendTelegramMessage(chatId, 'Search started.');
    }
}

async function processStopCommand(chatId) {
    clearTimer(chatId);
    await sendTelegramMessage(chatId, 'Search stopped.');
}

async function processResetCommand(chatId) {
    clearTimer(chatId);
    resetUserFilters(chatId);
    setUserReady(chatId, false);
    await sendTelegramMessage(chatId, 'Filters have been reset.');
}

async function processClearHistoryCommand(chatId) {
    clearHistory(chatId);
    await sendTelegramMessage(chatId, 'History has been cleared.');
}

async function processPresetCommand(chatId) {
    const presetButtons = [
        [{ text: '/preset Stone Island, XXL, 0, 200, Men' }],
        [{ text: '/preset Stone Island, L, 0, 300, Men' }],
        [{ text: '/preset Stone Island, M, 0, 400, Men' }],
        [{ text: '/preset Stone Island, S, 0, 500, Men' }]
    ];
    const options = {
        reply_markup: {
            keyboard: presetButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };
    await sendTelegramMessage(chatId, 'Please select a preset filter.', options);
}

async function processStartCommand(chatId) {
    clearHistory(chatId);

    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Set Filters', callback_data: 'command_/filters' }],
                [{ text: 'Stop Search', callback_data: 'command_/stop' }],
                [{ text: 'Reset Filters', callback_data: 'command_/reset' }],
            ]
        }
    };
    await sendTelegramMessage(chatId, 'Welcome to the bot! Use the buttons below to set your filters and start searching.', options);
}

async function showBrands(chatId) {
    const brands = getBrands();
    const brandButtons = Object.entries(brands).map(([brandName, brandId]) => {
        return [{ text: brandName, callback_data: `/brand ${brandName}` }];
    });

    const options = {
        reply_markup: {
            inline_keyboard: brandButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    await sendTelegramMessage(chatId, 'Please select a brand or type a new one:', options);
}


async function showSizes(chatId, selectedSizes = []) {
    const allSizes = ['M', 'L', 'XL', 'XXL', 'XXXL'];
    const availableSizes = allSizes.filter(size => !selectedSizes.includes(size));

    const sizeButtons = availableSizes.map(size => {
        return [{ text: size, callback_data: `/size ${size}` }];
    });

    sizeButtons.push([{ text: 'Continue', callback_data: '/size done' }]);

    const options = {
        reply_markup: {
            inline_keyboard: sizeButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    await sendTelegramMessage(chatId, 'Please select a size or click "Continue" to proceed:', options);
}

async function showPrices(chatId) {
    const prices = [50, 100, 150, 200, 250, 300, 400, 500, 600];
    const priceButtons = prices.map(price => {
        return [{ text: `${price}`, callback_data: `/price ${price}` }];
    });

    const options = {
        reply_markup: {
            inline_keyboard: priceButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    await sendTelegramMessage(chatId, 'Please select a max price:', options);
}

async function showCategories(chatId) {
    const categories = getCategories();
    const categoryButtons = Object.values(categories).map(category => {
        return [{ text: category.title, callback_data: `/category ${category.title}` }];
    });

    const options = {
        reply_markup: {
            inline_keyboard: categoryButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    await sendTelegramMessage(chatId, 'Please select a category:', options);
}


async function handleCallbackQuery(chatId, data, users, callbackQuery) {
    const [command, ...args] = data.split(' ');
    const value = args.join(' ');
    console.log(`Command: ${command}, Value: ${value}`);

    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: 60, ready: false, selectedCategory: 'Men', selectedSizes: [] };
    }

    try {
        switch (command) {
            case 'command_/presets':
                await processPresetCommand(chatId);
                break;
            case 'command_/clearhistory':
                await processClearHistoryCommand(chatId);
                break;
            case 'command_/reset':
                await processResetCommand(chatId);
                break;
            case 'command_/stop':
                await processStopCommand(chatId);
                break;
            case 'command_/go':
                await processGoCommand(chatId);
                break;
            case 'command_/history':
                await processHistoryCommand(chatId);
                break;
            case 'command_/filters':
                await showBrands(chatId);
                break;
            default:
                if (command === '/brand') {
                    users[chatId].filters.brand = value;
                    await sendTelegramMessage(chatId, `Brand selected: ${value}`);
                    await showCategories(chatId);
                } else if (command === '/category') {
                    users[chatId].selectedCategory = value;
                    await sendTelegramMessage(chatId, `Category selected: ${value}`);
                    await showSizes(chatId);
                } else if (command === '/size') {
                    if (value !== 'done') {
                        users[chatId].selectedSizes.push(value);
                        await sendTelegramMessage(chatId, `Size added: ${value}`);
                        await showSizes(chatId, users[chatId].selectedSizes);
                    } else {
                        if (users[chatId].selectedSizes.length === 0) {
                            users[chatId].filters.size = ['M', 'L', 'XL', 'XXL', 'XXXL']; // Додаємо всі розміри, якщо жоден не вибрано
                        } else {
                            users[chatId].filters.size = users[chatId].selectedSizes;
                        }
                        await sendTelegramMessage(chatId, `Sizes selected: ${users[chatId].filters.size.join(', ')}`);
                        await showPrices(chatId);
                    }
                } else if (command === '/price') {
                    users[chatId].filters.maxPrice = value;
                    await sendTelegramMessage(chatId, `Max price selected: ${value}`);
                    await processFiltersCommand(chatId, users);
                }  else {
                    await sendTelegramMessage(chatId, 'Unknown command.');
                }
        }
    } catch (error) {
        console.error('Error handling callback query:', error);
        await sendTelegramMessage(chatId, 'An error occurred while processing your request.');
    }
}

module.exports = {
    processFiltersCommand,
    showCategories,
    processIntervalCommand,
    processHistoryCommand,
    processGoCommand,
    processStopCommand,
    processResetCommand,
    processClearHistoryCommand,
    processPresetCommand,
    processStartCommand,
    handleCallbackQuery,
    processCategorySelection,
    showBrands,
    showSizes,
    showPrices
};
