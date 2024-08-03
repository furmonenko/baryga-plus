const { sendLoggedMessage, clearChat } = require('../utils/telegram');
const { getCategoryIdByName } = require('../services/categories');
const { clearTimer, setTimer } = require('../timerManager');
const { loadHistory, clearHistory, getCategories, getBrands } = require('../utils/fileOperations');
const { setUserInterval, isUserReady, resetUserFilters, setUserReady, setUserFilters, getUserInterval } = require("../userFilters");
const { updateHistoryForUser } = require("../managers/userItemManager");

const users = {};

async function processClearHistoryCommand(chatId) {
    clearHistory(chatId);
    await clearChat(chatId);
    await sendLoggedMessage(chatId, 'History and chat have been cleared.');
}

async function processFiltersCommand(chatId, users) {
    await clearChat(chatId); // Clear previous messages
    let selectedCategory = users[chatId].selectedCategory ?? getCategoryIdByName('Men');

    console.log(`Applying filters for chatId: ${chatId}`);
    console.log(`Brand: ${users[chatId].filters.brand}, Sizes: ${users[chatId].filters.size}, MaxPrice: ${users[chatId].filters.maxPrice}, Category: ${selectedCategory}`);

    clearTimer(chatId);
    setUserReady(chatId, false);

    const categoryId = getCategoryIdByName(selectedCategory);
    if (!categoryId) {
        await sendLoggedMessage(chatId, `Invalid category name: ${selectedCategory}`);
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
    await sendLoggedMessage(chatId, 'Filters have been set.\n\n🔍 Starting search with the following filters:\n\n' +
        `🏷️ *Brand:* ${filters.brand}\n` +
        `📏 *Sizes:* ${filters.size.join(', ')}\n` +
        `💰 *Max Price:* ${filters.maxPrice}\n` +
        `📂 *Category:* ${selectedCategory}\n\n` +
        'Please wait while we find the best items for you! 🔄', { parse_mode: 'Markdown' });

    setUserReady(chatId, true);
    if (isUserReady(chatId)) {
        setTimer(chatId, getUserInterval(chatId), updateHistoryForUser);
    }
}

async function processStartCommand(chatId) {
    clearHistory(chatId);
    await clearChat(chatId);
    clearTimer(chatId);
    resetUserFilters(chatId);
    setUserReady(chatId, false);

    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Set Filters', callback_data: 'command_/filters' }],
                [{ text: 'Stop Search', callback_data: 'command_/stop' }],
                [{ text: 'Reset Filters', callback_data: 'command_/reset' }],
            ]
        }
    };
    await sendLoggedMessage(chatId, 'Welcome to the bot! Use the buttons below to set your filters and start searching.', options);
}

async function processCategorySelection(chatId, categoryTitle) {
    await clearChat(chatId);
    const categories = getCategories();
    const selectedCategory = Object.values(categories).find(cat => cat.title === categoryTitle);

    if (selectedCategory) {
        if (!users[chatId]) {
            users[chatId] = { filters: {}, interval: 60, ready: false };
        }

        console.log(selectedCategory);
        users[chatId].selectedCategory = selectedCategory.title;
        await sendLoggedMessage(chatId, `Category selected: ${selectedCategory.title}`);
    } else {
        await sendLoggedMessage(chatId, 'Invalid category selection.');
    }
}

async function processIntervalCommand(chatId, interval) {
    await clearChat(chatId);
    if (isNaN(interval) || interval <= 0) {
        await sendLoggedMessage(chatId, 'Please provide a valid interval in seconds.');
    } else {
        setUserInterval(chatId, interval);
        await sendLoggedMessage(chatId, `Interval has been set to ${interval} seconds.`);

        if (isUserReady(chatId)) {
            clearTimer(chatId);
            setTimer(chatId, interval, updateHistoryForUser);
        }
    }
}

async function processHistoryCommand(chatId) {
    await clearChat(chatId);
    const history = loadHistory(chatId);
    if (history.length === 0) {
        await sendLoggedMessage(chatId, 'No search history found.');
    } else {
        const historyText = history.map(item => `${item.title}: ${item.url}`).join('\n');
        await sendLoggedMessage(chatId, `Search history:\n${historyText}`);
    }
}

async function processGoCommand(chatId) {
    await clearChat(chatId);
    if (!isUserReady(chatId)) {
        await sendLoggedMessage(chatId, 'Please set your filters and interval before starting the search.');
    } else {
        setTimer(chatId, getUserInterval(chatId), updateHistoryForUser);
        await sendLoggedMessage(chatId, 'Search started.');
    }
}

async function processStopCommand(chatId) {
    clearTimer(chatId);
    await clearChat(chatId);
    await sendLoggedMessage(chatId, 'Search stopped.');
}

async function processResetCommand(chatId) {
    clearTimer(chatId);
    resetUserFilters(chatId);
    await clearChat(chatId);
    setUserReady(chatId, false);
    await sendLoggedMessage(chatId, 'Filters have been reset.');
}

async function processPresetCommand(chatId) {
    await clearChat(chatId);
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
    await sendLoggedMessage(chatId, 'Please select a preset filter.', options);
}

async function showBrands(chatId) {
    await clearChat(chatId);
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

    await sendLoggedMessage(chatId, 'Please select a brand or type a new one:', options);
}

async function showSizes(chatId, selectedSizes = []) {
    await clearChat(chatId);
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

    await sendLoggedMessage(chatId, 'Please select a size or click "Continue" to proceed:', options);
}

async function showPrices(chatId) {
    await clearChat(chatId);
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

    await sendLoggedMessage(chatId, 'Please select a max price:', options);
}

async function showCategories(chatId) {
    await clearChat(chatId);
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

    await sendLoggedMessage(chatId, 'Please select a category:', options);
}

async function handleCallbackQuery(chatId, data, users, callbackQuery) {
    const [command, ...args] = data.split(' ');
    const value = args.join(' ');
    console.log(`Command: ${command}, Value: ${value}`);

    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: 60, ready: false, selectedCategory: 'Men', selectedSizes: [] };
    }

    try {
        await clearChat(chatId);
        switch (command) {
            case 'command_/clearhistory':
                await processClearHistoryCommand(chatId);
                break;
            case 'command_/reset':
                await processResetCommand(chatId);
                break;
            case 'command_/stop':
                await processStopCommand(chatId);
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
                    await sendLoggedMessage(chatId, `Brand selected: ${value}`);
                    await showCategories(chatId);
                } else if (command === '/category') {
                    users[chatId].selectedCategory = value;
                    await sendLoggedMessage(chatId, `Category selected: ${value}`);
                    await showSizes(chatId);
                } else if (command === '/size') {
                    if (value !== 'done') {
                        users[chatId].selectedSizes.push(value);
                        await sendLoggedMessage(chatId, `Size added: ${value}`);
                        await showSizes(chatId, users[chatId].selectedSizes);
                    } else {
                        if (users[chatId].selectedSizes.length === 0) {
                            users[chatId].filters.size = ['M', 'L', 'XL', 'XXL', 'XXXL'];
                        } else {
                            users[chatId].filters.size = users[chatId].selectedSizes;
                        }
                        await sendLoggedMessage(chatId, `Sizes selected: ${users[chatId].filters.size.join(', ')}`);
                        await showPrices(chatId);
                    }
                } else if (command === '/price') {
                    users[chatId].filters.maxPrice = value;
                    await sendLoggedMessage(chatId, `Max price selected: ${value}`);
                    await processFiltersCommand(chatId, users);
                } else {
                    await sendLoggedMessage(chatId, 'Unknown command.');
                }
        }
    } catch (error) {
        console.error('Error handling callback query:', error);
        await sendLoggedMessage(chatId, 'An error occurred while processing your request.');
    }
}

module.exports = {
    processFiltersCommand,
    processClearHistoryCommand,
    processStartCommand,
    showCategories,
    processIntervalCommand,
    processHistoryCommand,
    processGoCommand,
    processStopCommand,
    processResetCommand,
    processPresetCommand,
    handleCallbackQuery,
    processCategorySelection,
    showBrands,
    showSizes,
    showPrices
};
