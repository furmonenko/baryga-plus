const { sendTelegramMessage } = require('../utils/telegram');
const { fetchBrandId } = require('../services/brands');
const { getCategoryIdByName } = require('../services/categories');
const { clearTimer, setTimer} = require('../timerManager');
const { loadHistory, clearHistory, getCategories, getBrands, saveBrand} = require('../utils/fileOperations');
const { applyPresetFilters } = require('../handlers/applyPresetFilters');
const {setUserInterval, isUserReady, resetUserFilters, setUserReady, setUserFilters, getUserInterval} = require("../userFilters");
const {updateCacheForUser} = require("../cron/updateCache");

const users = {};

async function processFiltersCommand(chatId, users) {
    console.log(`Processing filters command for chatId: ${chatId}`);

    const userFilters = users[chatId].filters;
    const selectedCategory = users[chatId].selectedCategory;

    if (!userFilters.brand || !userFilters.size || !userFilters.maxPrice || !selectedCategory) {
        await sendTelegramMessage(chatId, 'Please ensure all filters are set: brand, size, maxPrice, and category.');
        return;
    }

    clearTimer(chatId);
    setUserReady(chatId, false);
    console.log(`Cleared timer and set user ready status to false for chatId: ${chatId}`);

    const brandName = userFilters.brand;
    const sizeArray = userFilters.size.replace(/[\[\]]/g, '').split(',').map(s => s.trim().toUpperCase());
    const minPrice = 0;  // Default minPrice is set to 0
    const maxPrice = parseInt(userFilters.maxPrice, 10);
    const categoryName = selectedCategory;

    console.log(`Extracted parts - Brand: ${brandName}, Size: ${sizeArray}, MinPrice: ${minPrice}, MaxPrice: ${maxPrice}, Category: ${categoryName}`);

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


        console.log(selectedCategory);
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

async function showBrands(chatId) {
    const brands = getBrands();
    const brandButtons = Object.keys(brands).map(brand => {
        return [{ text: brand, callback_data: `/brand ${brand}` }];
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

async function showSizes(chatId) {
    const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const sizeButtons = sizes.map(size => {
        return [{ text: size, callback_data: `/size ${size}` }];
    });

    const options = {
        reply_markup: {
            inline_keyboard: sizeButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    await sendTelegramMessage(chatId, 'Please select a size:', options);
}

async function showPrices(chatId) {
    const prices = [200, 250, 300, 400, 500, 800, 1000, 5000];
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

async function showIntervals(chatId) {
    const intervals = [120, 300, 600]; // Інтервали в секундах
    const intervalButtons = intervals.map(interval => {
        return [{ text: `${interval / 60} minutes`, callback_data: `/interval ${interval}` }];
    });

    const options = {
        reply_markup: {
            inline_keyboard: intervalButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    await sendTelegramMessage(chatId, 'Please select an interval:', options);
}

async function handleCallbackQuery(chatId, data, users) {
    const [command, ...args] = data.split(' ');
    const value = args.join(' ');
    console.log(`Command: ${command}, Value: ${value}`);

    if (!users[chatId]) {
        users[chatId] = { filters: {}, interval: 60, ready: false, selectedCategory: 'Men' };
    }

    switch (command) {
        case 'command_/categories':
            await showCategories(chatId);
            break;
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
        case 'command_/interval':
            await showIntervals(chatId);
            break;
        case 'command_/filters':
            await showBrands(chatId);
            break;
        default:
            if (command === '/brand') {
                users[chatId].filters.brand = value;
                await sendTelegramMessage(chatId, `Brand selected: ${value}`);
                await showSizes(chatId);
            } else if (command === '/size') {
                users[chatId].filters.size = value;
                await sendTelegramMessage(chatId, `Size selected: ${value}`);
                await showPrices(chatId);
            } else if (command === '/price') {
                users[chatId].filters.maxPrice = value;
                await sendTelegramMessage(chatId, `Max price selected: ${value}`);
                await showCategories(chatId);
            } else if (command === '/category') {
                users[chatId].selectedCategory = value;
                await sendTelegramMessage(chatId, `Category selected: ${value}`);
                await showIntervals(chatId);
            } else if (command === '/interval') {
                users[chatId].interval = parseInt(value, 10);
                await sendTelegramMessage(chatId, `Interval selected: ${value} seconds.`);
                // Proceed with the filters
                await processFiltersCommand(chatId, users);
            } else {
                await sendTelegramMessage(chatId, 'Unknown command.');
            }
    }
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
    processCategorySelection,
    showBrands,
    showSizes,
    showPrices,
    showIntervals
};
