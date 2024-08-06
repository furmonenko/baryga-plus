const { sendLoggedMessage, clearChat } = require('../utils/telegram');
const { getCategoryIdByName } = require('../services/categories');
const { clearTimer, setTimer } = require('../managers/timerManager');
const { loadHistory, clearHistory, getCategories, getBrands } = require('../utils/fileOperations');
const { updateHistoryForUser } = require("../managers/userItemManager");

async function processStartCommand(user) {
    const chatId = user.chatId;
    console.log(`Processing chatId: ${chatId}`);

    clearHistory(chatId);
    await clearChat(chatId);
    clearTimer(chatId);
    user.resetFilters();
    user.setReady(false);

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

async function processClearHistoryCommand(user) {
    const chatId = user.chatId;
    clearHistory(chatId);
    await clearChat(chatId);
    await sendLoggedMessage(chatId, 'History and chat have been cleared.');
}

async function processFiltersCommand(user) {
    const chatId = user.chatId;
    console.log(`Starting processFiltersCommand for chatId: ${chatId}`);

    await clearChat(chatId); // Clear previous messages
    let selectedCategory = user.getFilters().category ?? 'Men';

    console.log(`Applying filters for chatId: ${chatId}`);
    console.log(`Brand: ${user.getFilters().brand}, Sizes: ${user.getFilters().size}, MaxPrice: ${user.getFilters().maxPrice}, Category: ${selectedCategory}`);

    clearTimer(chatId);
    console.log(`Timer cleared for chatId: ${chatId}`);
    user.setReady(false);

    const categoryId = getCategoryIdByName(selectedCategory);
    if (!categoryId) {
        await sendLoggedMessage(chatId, `Invalid category name: ${selectedCategory}`);
        console.log(`Invalid category name: ${selectedCategory} for chatId: ${chatId}`);
        return;
    }

    const filters = {
        ...user.getFilters(),
        category: categoryId
    };

    console.log(`Final filters object for chatId: ${chatId}: ${JSON.stringify(filters)}`);

    user.setFilters(filters);
    await sendLoggedMessage(chatId, 'Filters have been set.\n\n🔍 Starting search with the following filters:\n\n' +
        `🏷️ *Brand:* ${filters.brand}\n` +
        `📏 *Sizes:* ${filters.size.join(', ')}\n` +
        `💰 *Max Price:* ${filters.maxPrice}\n` +
        `📂 *Category:* ${selectedCategory}\n\n` +
        'Please wait while we find the best items for you! 🔄', { parse_mode: 'Markdown' });

    user.setReady(true);
    console.log(`User is set to ready for chatId: ${chatId}`);

    if (user.isReady()) {
        setTimer(chatId, user.getInterval(), updateHistoryForUser);
        console.log(`Timer set for chatId: ${chatId} with interval: ${user.getInterval()}`);
    }
}


async function processCategorySelection(user, categoryTitle) {
    const chatId = user.chatId;
    await clearChat(chatId);
    const categories = getCategories();
    const selectedCategory = Object.values(categories).find(cat => cat.title === categoryTitle);

    if (selectedCategory) {
        const filters = {
            ...user.getFilters(),
            category: selectedCategory.title
        };
        user.setFilters(filters);
        await sendLoggedMessage(chatId, `Category selected: ${selectedCategory.title}`);
    } else {
        await sendLoggedMessage(chatId, 'Invalid category selection.');
    }
}

async function processHistoryCommand(user) {
    const chatId = user.chatId;
    await clearChat(chatId);
    const history = loadHistory(chatId);
    if (history.length === 0) {
        await sendLoggedMessage(chatId, 'No search history found.');
    } else {
        const historyText = history.map(item => `${item.title}: ${item.url}`).join('\n');
        await sendLoggedMessage(chatId, `Search history:\n${historyText}`);
    }
}

async function processStopCommand(user) {
    const chatId = user.chatId;
    clearTimer(chatId);
    await clearChat(chatId);
    await sendLoggedMessage(chatId, 'Search stopped.');
}

async function processResetCommand(user) {
    const chatId = user.chatId;
    clearTimer(chatId);
    user.resetFilters();
    await clearChat(chatId);
    user.setReady(false);
    await sendLoggedMessage(chatId, 'Filters have been reset.');
}

async function processPresetCommand(user) {
    const chatId = user.chatId;
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

async function showBrands(user) {
    const chatId = user.chatId;
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

async function showSizes(user, selectedSizes = []) {
    const chatId = user.chatId;
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

async function showPrices(user) {
    const chatId = user.chatId;
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

async function showCategories(user) {
    const chatId = user.chatId;
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

async function handleCallbackQuery(user, data) {
    const chatId = user.chatId;
    const [command, ...args] = data.split(' ');
    const value = args.join(' ');
    console.log(`Command: ${command}, Value: ${value}`);

    try {
        await clearChat(chatId);
        switch (command) {
            case 'command_/clearhistory':
                await processClearHistoryCommand(user);
                break;
            case 'command_/reset':
                await processResetCommand(user);
                break;
            case 'command_/stop':
                await processStopCommand(user);
                break;
            case 'command_/history':
                await processHistoryCommand(user);
                break;
            case 'command_/filters':
                await showBrands(user);
                break;
            default:
                if (command === '/brand') {
                    user.filters.brand = value;
                    await sendLoggedMessage(chatId, `Brand selected: ${value}`);
                    await showCategories(user);
                } else if (command === '/category') {
                    user.filters.category = value;
                    await sendLoggedMessage(chatId, `Category selected: ${value}`);
                    await showSizes(user);
                } else if (command === '/size') {
                    if (value !== 'done') {
                        user.filters.size.push(value);
                        await sendLoggedMessage(chatId, `Size added: ${value}`);
                        await showSizes(user, user.filters.size);
                    } else {
                        if (user.filters.size.length === 0) {
                            user.filters.size = ['M', 'L', 'XL', 'XXL', 'XXXL'];
                        }
                        await sendLoggedMessage(chatId, `Sizes selected: ${user.filters.size.join(', ')}`);
                        await showPrices(user);
                    }
                } else if (command === '/price') {
                    user.filters.maxPrice = value;
                    await sendLoggedMessage(chatId, `Max price selected: ${value}`);
                    await processFiltersCommand(user);
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
    processClearHistoryCommand,
    processStartCommand,
    processHistoryCommand,
    processStopCommand,
    processResetCommand,
    handleCallbackQuery
};
