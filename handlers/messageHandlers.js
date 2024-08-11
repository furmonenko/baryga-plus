const { sendLoggedMessage, clearChat } = require('../utils/telegram');
const { getCategoryIdByName } = require('../services/categories');
const { clearTimer, setTimer } = require('../managers/timerManager');
const { loadHistory, clearHistory, getCategories, getBrands } = require('../utils/fileOperations');
const { updateHistoryForUser } = require("../managers/userItemManager");
const Filters = require("../models/filters");
const UserManager = require('../managers/userManager'); // Впевніться, що шлях правильний

async function processStartCommand(user) {
    const chatId = user.chatId;
    console.log(`Processing chatId: ${chatId}`);

    if (!user) {
        const newUser = UserManager.createUser(chatId, user.firstName, user.lastName, user.username);

        if (UserManager.isAdmin(chatId)) {
            await sendLoggedMessage(chatId, 'You have been automatically set as the admin.');
        }

        user = newUser; // Оновлюємо користувача з інформацією про план
    }

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

    await clearChat(chatId);

    let allFiltersUpdated = true;
    const filters = user.getFilters().map((filter, index) => {
        let selectedCategory = filter.category ?? 'Men';
        const categoryId = getCategoryIdByName(selectedCategory);
        if (!categoryId) {
            allFiltersUpdated = false;
            sendLoggedMessage(chatId, `Invalid category name: ${selectedCategory}`);
            console.log(`Invalid category name: ${selectedCategory} for chatId: ${chatId}`);
            return filter;
        }
        return {
            ...filter,
            category: categoryId
        };
    });

    if (allFiltersUpdated) {
        user.setFilters(filters);

        const filtersSummary = filters.map((filter, index) => {
            return `Filter ${index + 1}:\n` +
                `🏷️ *Brand:* ${filter.brand}\n` +
                `📏 *Sizes:* ${filter.size.join(', ')}\n` +
                `💰 *Max Price:* ${filter.maxPrice}\n` +
                `📂 *Category:* ${filter.category}\n\n`;
        }).join('');

        await sendLoggedMessage(chatId,
            'Filters have been set.\n\n🔍 Starting search with the following filters:\n\n' +
            filtersSummary +
            'Please wait while we find the best items for you! 🔄',
            { parse_mode: 'Markdown' }
        );

        // Не встановлюємо isReady тут
    }
}

async function processCategorySelection(user, categoryTitle) {
    const chatId = user.chatId;
    const categories = getCategories();
    const selectedCategory = Object.values(categories).find(cat => cat.title === categoryTitle);

    await clearChat(chatId);

    if (selectedCategory) {
        const filters = user.getFilters();
        filters[user.getCurrentFilterIndex()].category = selectedCategory.title;
        user.updateFilter(filters[user.getCurrentFilterIndex()], user.getCurrentFilterIndex());
        await sendLoggedMessage(chatId, `Category selected: ${selectedCategory.title}`);
    } else {
        await sendLoggedMessage(chatId, 'Invalid category selection.');
    }
}

async function processHistoryCommand(user) {
    const chatId = user.chatId;
    await clearChat(chatId);
    const history = loadHistory(chatId);

    const message = history.length === 0
        ? 'No search history found.'
        : `Search history:\n${history.map(item => `${item.title}: ${item.url}`).join('\n')}`;

    await sendLoggedMessage(chatId, message);
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
    const brandButtons = Object.entries(brands).map(([brandName]) => {
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
            case 'set_filter_count':
                user.setFilterCount(parseInt(value));
                await sendLoggedMessage(chatId, `You have chosen to set ${value} filters. Let's start with filter 1.`);
                await showBrands(user);
                break;

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

            case '/brand':
                await handleBrandSelection(user, value);
                break;

            case '/category':
                await handleCategorySelection(user, value);
                break;

            case '/size':
                await handleSizeSelection(user, value);
                break;

            case '/price':
                await handlePriceSelection(user, value);
                break;

            default:
                await sendLoggedMessage(chatId, 'Unknown command.');
                break;
        }
    } catch (error) {
        console.error('Error handling callback query:', error);
        await sendLoggedMessage(chatId, 'An error occurred while processing your request.');
    }
}

async function handleCategorySelection(user, category) {
    const chatId = user.chatId;
    const filters = user.getFilters();
    filters[user.getCurrentFilterIndex()].category = category;
    user.updateFilter(filters[user.getCurrentFilterIndex()], user.getCurrentFilterIndex());
    await sendLoggedMessage(chatId, `Category selected: ${category}`);
    await showSizes(user);
}

async function handlePriceSelection(user, price) {
    const chatId = user.chatId;
    const filters = user.getFilters();
    filters[user.getCurrentFilterIndex()].maxPrice = price;
    user.updateFilter(filters[user.getCurrentFilterIndex()], user.getCurrentFilterIndex());
    await sendLoggedMessage(chatId, `Max price selected: ${price}`);

    if (user.getCurrentFilterIndex() < user.getFilterCount() - 1) {
        // Переходимо до наступного фільтру
        user.setCurrentFilterIndex(user.getCurrentFilterIndex() + 1);
        await sendLoggedMessage(chatId, `Let's set filter ${user.getCurrentFilterIndex() + 1}.`);
        await showBrands(user);
    } else {
        // Усі фільтри налаштовані, тепер встановлюємо `isReady` на true
        await processFiltersCommand(user);  // Зберігаємо фільтри і надсилаємо підтвердження
        user.setReady(true);  // Встановлюємо користувача як готового до отримання сповіщень
        await sendLoggedMessage(chatId, 'All filters have been set, and you are ready to start searching.');
    }
}

async function handleBrandSelection(user, brand) {
    const chatId = user.chatId;
    const currentFilterIndex = user.getCurrentFilterIndex();
    let filters = user.getFilters();
    if (!filters[currentFilterIndex]) {
        filters[currentFilterIndex] = new Filters();
    }
    filters[currentFilterIndex].brand = brand;
    user.setFilters(filters);
    await sendLoggedMessage(chatId, `Brand selected: ${brand}`);
    await showCategories(user);
}

async function handleSizeSelection(user, size) {
    const chatId = user.chatId;
    if (size !== 'done') {
        const filters = user.getFilters();
        filters[user.getCurrentFilterIndex()].size.push(size);
        user.setFilters(filters);
        await sendLoggedMessage(chatId, `Size added: ${size}`);
        await showSizes(user, filters[user.getCurrentFilterIndex()].size);
    } else {
        const filters = user.getFilters();
        if (filters[user.getCurrentFilterIndex()].size.length === 0) {
            filters[user.getCurrentFilterIndex()].size = ['M', 'L', 'XL', 'XXL', 'XXXL'];
        }
        user.updateFilter(filters[user.getCurrentFilterIndex()], user.getCurrentFilterIndex());
        await sendLoggedMessage(chatId, `Sizes selected: ${filters[user.getCurrentFilterIndex()].size.join(', ')}`);
        await showPrices(user);
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
