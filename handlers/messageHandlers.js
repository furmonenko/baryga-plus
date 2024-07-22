const { sendTelegramMessage } = require('../utils/telegram');
const { fetchBrandId } = require('../services/brands');
const { getCategoryIdByName } = require('../services/categories');
const { clearTimer, setTimer} = require('../timerManager');
const { loadHistory, clearHistory, getCategories, getBrands, saveBrand} = require('../utils/fileOperations');
const { applyPresetFilters } = require('../handlers/applyPresetFilters');
const {setUserInterval, isUserReady, resetUserFilters, setUserReady, setUserFilters, getUserInterval} = require("../userFilters");
const {updateCacheForUser} = require("../cron/updateCache");

const users = {};

async function processFiltersCommand(chatId, text, selectedCategory) {
    console.log(`Received /filters command from chatId: ${chatId}, text: ${text}`);

    const parts = text.replace('/filters', '').trim().match(/(?:\[.*?\]|[^,]+)/g).map(part => part.trim());
    console.log(`Parsed parts: ${JSON.stringify(parts)}`);

    if (parts.length !== 4) { // Modified to 4 because category is handled separately
        await sendTelegramMessage(chatId, 'Please use the correct format: /filters brand, size (e.g., [S, M, L]), minPrice, maxPrice');
        return;
    }

    clearTimer(chatId);
    setUserReady(chatId, false);
    console.log(`Cleared timer and set user ready status to false for chatId: ${chatId}`);

    const brandName = parts[0];
    const sizeText = parts[1];
    const minPrice = parseInt(parts[2], 10);
    const maxPrice = parseInt(parts[3], 10);
    const categoryName = selectedCategory;

    console.log(`Extracted parts - Brand: ${brandName}, Size: ${sizeText}, MinPrice: ${minPrice}, MaxPrice: ${maxPrice}, Category: ${categoryName}`);

    resetUserFilters(chatId);

    const brandId = await fetchBrandId(brandName);
    console.log(`Fetched brandId: ${brandId} for brandName: ${brandName}`);
    if (!brandId) {
        await sendTelegramMessage(chatId, `Invalid brand name: ${brandName}`);
        return;
    }

    const categoryId = getCategoryIdByName(categoryName);
    console.log(`Fetched categoryId: ${categoryId} for categoryName: ${categoryName}`);
    if (!categoryId) {
        await sendTelegramMessage(chatId, `Invalid category name: ${categoryName}`);
        return;
    }

    const sizeArray = sizeText.replace(/[\[\]]/g, '').split(',').map(s => s.trim().toUpperCase());
    console.log(`Parsed size array: ${JSON.stringify(sizeArray)}`);

    const filters = {
        brand: brandId,
        size: sizeArray,
        minPrice: minPrice,
        maxPrice: maxPrice,
        category: categoryId
    };

    console.log(`Final filters object: ${JSON.stringify(filters)}`);

    setUserFilters(chatId, filters);
    await sendTelegramMessage(chatId, 'Filters have been set.');
    console.log(`Filters set for chatId: ${chatId}`);

    setUserReady(chatId, true);

    if (isUserReady(chatId)) {
        setTimer(chatId, getUserInterval(chatId), updateCacheForUser);
        console.log(`Timer set for chatId: ${chatId} with interval: ${getUserInterval(chatId)}`);
    }
}

async function showCategories(chatId) {
    const categories = getCategories();
    const categoryButtons = Object.values(categories).map(category => {
        return [{ text: `${category.title}` }];
    });

    const options = {
        reply_markup: {
            keyboard: categoryButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    await sendTelegramMessage(chatId, 'Please select a category:', options);
}


async function handleCallbackQuery(chatId, data, users) {
    const command = data.replace('command_/', ''); // Видаляємо 'command_/' з початку

    switch (command) {
        case 'categories':
            await showCategories(chatId);
            break;
        case 'presets':
            await processPresetCommand(chatId);
            break;
        case 'clearhistory':
            await processClearHistoryCommand(chatId);
            break;
        case 'reset':
            await processResetCommand(chatId);
            break;
        case 'stop':
            await processStopCommand(chatId);
            break;
        case 'go':
            await processGoCommand(chatId);
            break;
        case 'history':
            await processHistoryCommand(chatId);
            break;
        case 'interval':
            await sendTelegramMessage(chatId, 'Please enter the interval in seconds using the format: /interval <seconds>');
            break;
        case 'filters':
            await sendTelegramMessage(chatId, 'Please enter your filters in the format: /filters brand, size (e.g., [S, M, L]), minPrice, maxPrice, category');
            break;
        default:
            if (command.startsWith('category_')) {
                const categoryId = command.replace('category_', '');
                await processCategorySelection(chatId, categoryId);
            }
    }
}


async function handleTextMessage(chatId, text) {
    const brandName = text.trim();
    if (brandName) {
        const brandId = await fetchBrandId(brandName);
        if (brandId) {
            saveBrand(brandName, brandId);
            users[chatId].selectedBrand = brandName;
            await sendTelegramMessage(chatId, `Brand ${brandName} has been added with ID ${brandId}.`);
        } else {
            await sendTelegramMessage(chatId, `Failed to fetch brand ID for ${brandName}.`);
        }
    }
}

async function processCategorySelection(chatId, categoryTitle) {
    const categories = getCategories();
    const selectedCategory = Object.values(categories).find(cat => cat.title === categoryTitle);

    if (selectedCategory) {
        if (!users[chatId]) {
            users[chatId] = { filters: {}, interval: 60, ready: false };
        }
        users[chatId].selectedCategory = selectedCategory.title;
        await sendTelegramMessage(chatId, `Category selected: ${selectedCategory.title}`);
    } else {
        await sendTelegramMessage(chatId, 'Invalid category selection.');
    }
}

async function processBrandSelection(chatId, brandName, users) {
    console.log(`Processing brand selection: ${brandName} for chatId: ${chatId}`);
    const brandId = await fetchBrandId(brandName);
    if (brandId) {
        saveBrand(brandName, brandId);
        users[chatId].selectedBrand = brandName;
        await sendTelegramMessage(chatId, `Brand ${brandName} has been added with ID ${brandId}.`);
    } else {
        await sendTelegramMessage(chatId, `Failed to fetch brand ID for ${brandName}.`);
    }
}

async function showBrands(chatId) {
    const brands = getBrands();
    const brandButtons = Object.keys(brands).map(brand => {
        return [{ text: `/brand_${brand}` }];
    });

    const options = {
        reply_markup: {
            keyboard: brandButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    await sendTelegramMessage(chatId, 'Please select a brand or type a new one:', options);
}

async function processIntervalCommand(chatId, text) {
    const interval = parseInt(text.replace('/interval', '').trim(), 10);
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
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Set Filters', callback_data: 'command_/filters' }],
                [{ text: 'Set Interval', callback_data: 'command_/interval' }],
                [{ text: 'View History', callback_data: 'command_/history' }],
                [{ text: 'Start Search', callback_data: 'command_/go' }],
                [{ text: 'Stop Search', callback_data: 'command_/stop' }],
                [{ text: 'Reset Filters', callback_data: 'command_/reset' }],
                [{ text: 'Clear History', callback_data: 'command_/clearhistory' }],
                [{ text: 'Show Presets', callback_data: 'command_/presets' }],
                [{ text: 'Show Categories', callback_data: 'command_/categories' }]
            ]
        }
    };
    await sendTelegramMessage(chatId, 'Welcome to the bot! Use the buttons below to set your filters and start searching.', options);
}

module.exports = {
    processFiltersCommand,
    applyPresetFilters,
    showCategories,
    processIntervalCommand,
    processHistoryCommand,
    processGoCommand,
    processStopCommand,
    processResetCommand,
    processClearHistoryCommand,
    processPresetCommand,
    processStartCommand,
    handleTextMessage,
    handleCallbackQuery,
    processCategorySelection
};
