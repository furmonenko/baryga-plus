const { sendLoggedMessage, clearChat } = require('../utils/telegram');
const { getCategoryIdByName } = require('../services/categories');
const { loadHistory, clearHistory, getCategories, getBrands } = require('../utils/fileOperations');
const Filters = require("../models/filters");
const UserManager = require('../managers/userManager');

async function processStartCommand(user) {
    await sendLoggedMessage(user.chatId, 'Welcome to the bot! Use the buttons below to set your filters and start searching.', showMainMenu(user));
}

async function showMainMenu(user) {
    const chatId = user.chatId;
    console.log(`Processing chatId: ${chatId}`);

    clearHistory(chatId);
    await clearChat(chatId);

    user.setReady(false);
    user.setReady(false);

    // Building the main menu options
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Set Filters', callback_data: 'command_/filters' }],
                [{ text: 'Filter Presets', callback_data: 'command_/presetfilters' }],
                [{ text: 'Active Filters', callback_data: 'command_/show_active_filters' }],
                [{ text: 'Stop Search', callback_data: 'command_/stop' }],
                [{ text: 'Reset Filters', callback_data: 'command_/reset' }],
            ]
        }
    };

    // Check if the user has set more than 0 filters
    const filters = user.getFilters();
    if (filters.length > 0) {
        options.reply_markup.inline_keyboard.unshift([{ text: 'Continue Searching', callback_data: 'continue_search' }]);
    }

    await sendLoggedMessage(chatId, 'Welcome to the bot! Use the buttons below:', options);
}

async function continueSearching(user) {
    user.setReady(true);
    const chatId = user.chatId;

    await clearChat(chatId);

    // Форматування повідомлення з актуальними фільтрами
    const filters = user.getFilters();
    let message = '🔍 *Search has resumed with the following filters:* 🔍\n\n';

    message += formatActiveFilters(filters);

    await sendLoggedMessage(chatId, message, { parse_mode: 'Markdown' });
}


async function showCustomPresetsSettings(user) {
    const chatId = user.chatId;
    const customFilters = user.getCustomFilters();
    const currentCount = Object.keys(customFilters).length;
    const maxCount = user.maxCustomFilters;

    // Формуємо повідомлення з інформацією про кастомні пресети
    let message = `✨ *Custom Preset Settings* ✨\n\n`;
    message += `📊 *Current Presets:* ${currentCount}/${maxCount}\n\n`;

    if (currentCount > 0) {
        message += `📝 *Your Custom Presets:*\n`;
        Object.keys(customFilters).forEach((filterName, index) => {
            message += `${index + 1}. ${filterName}\n`;
        });
    } else {
        message += `You have no custom presets at the moment.\n`;
    }

    // Інлайн клавіатура
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ Add Preset', callback_data: 'add_custom_preset' }],
                [{ text: '🗑️ Delete Presets', callback_data: 'delete_custom_presets_menu' }],
                [{ text: '🔙 Back to Menu', callback_data: 'back_to_main_menu' }]
            ],
            one_time_keyboard: true,
            resize_keyboard: true
        },
        parse_mode: 'Markdown'
    };

    // Надсилаємо повідомлення користувачеві
    await sendLoggedMessage(chatId, message, options);
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
    let categoryName = "";

    const filters = user.getFilters().map((filter, index) => {
        let selectedCategory = filter.category ?? 'Men';
        categoryName = selectedCategory;

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
                `📂 *Category:* ${categoryName}\n\n`;
        }).join('');

        await sendLoggedMessage(chatId,
            'Filters have been set.\n\n🔍 Starting search with the following filters:\n\n' +
            filtersSummary +
            'Please wait while we find the best items for you! 🔄',
            { parse_mode: 'Markdown' }
        );

        user.setReady(true);
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
    await clearChat(chatId);
    user.setReady(false);
    await sendLoggedMessage(chatId, 'Search stopped.');
}

async function processResetCommand(user) {
    const chatId = user.chatId;
    user.resetFilters();
    await clearChat(chatId);
    user.setReady(false);

    await sendLoggedMessage(chatId, 'Filters have been reset.');
}

async function handlePresetFiltersCommand(user) {
    const chatId = user.chatId;
    await clearChat(chatId);

    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Baryga+ Filters', callback_data: 'preset_baryga' }],
                [{ text: 'Custom Filters', callback_data: 'preset_custom' }],
                [{ text: 'Back', callback_data: 'back_to_main_menu' }]
            ]
        }
    };

    await sendLoggedMessage(chatId, 'Please choose a preset filter type:', options);
}

async function showBrands(user) {
    const chatId = user.chatId;
    await clearChat(chatId);
    const brands = getBrands();

    // Генеруємо кнопки для брендів
    const brandButtons = Object.entries(brands).map(([brandName]) => {
        return [{ text: brandName, callback_data: `/brand ${brandName}` }];
    });

    // Додаємо кнопку "Назад в меню"
    brandButtons.push([{ text: 'Back to main menu', callback_data: 'back_to_main_menu' }]);

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

async function proceedToNextFilterOrSearch(user) {
    const chatId = user.chatId;

    if (user.getCurrentFilterIndex() < user.getFilterCount() - 1) {
        user.setCurrentFilterIndex(user.getCurrentFilterIndex() + 1);
        await showNextFilterMenu(user);
    } else {
        // Якщо всі фільтри налаштовані, починаємо пошук
        await processFiltersCommand(user);
        await sendLoggedMessage(chatId, 'All filters have been set, and you are ready to start searching.');
    }
}

async function showDeleteCustomFilters(user) {
    const chatId = user.chatId;
    const customFilters = user.getCustomFilters();

    if (Object.keys(customFilters).length === 0) {
        await sendLoggedMessage(chatId, 'You have no custom filters to delete.');
        return;
    }

    const filterButtons = Object.keys(customFilters).map(filterName => {
        return [{ text: filterName, callback_data: `delete_preset ${filterName}` }];
    });

    const options = {
        reply_markup: {
            inline_keyboard: filterButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    await sendLoggedMessage(chatId, 'Select a custom filter to delete:', options);
}

async function deleteCustomFilter(user, filterName) {
    const chatId = user.chatId;

    const customFilters = user.getCustomFilters();
    if (customFilters[filterName]) {
        delete customFilters[filterName];
        UserManager.saveUsers(); // Зберігаємо зміни після видалення фільтру
        await sendLoggedMessage(chatId, `Filter "${filterName}" has been deleted.`);
    } else {
        await sendLoggedMessage(chatId, `Filter "${filterName}" not found.`);
    }
}

async function showNextFilterMenu(user) {
    if (user === null)
    {
        return;
    }
    const chatId = user.chatId;

    // Кількість налаштованих і загальна кількість фільтрів
    const currentFilterIndex = user.currentFilterIndex;
    const filterCount = user.getFilterCount();
    const remainingFilters = filterCount - currentFilterIndex;

    // Повідомлення про кількість залишених фільтрів
    let message = `You have ${remainingFilters} more filter(s) to set.`;
    message += `\nOr you can start searching now with the filters you have set.`;

    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Set Filters', callback_data: 'command_/filters' }],
                [{ text: 'Filter Presets', callback_data: 'command_/presetfilters' }],
                [{ text: 'Start Searching', callback_data: 'continue_search' }], // Додано кнопку для старту пошуку
                [{ text: 'Stop Search', callback_data: 'command_/stop' }],
                [{ text: 'Reset Filters', callback_data: 'command_/reset' }],
            ]
        }
    };

    await sendLoggedMessage(chatId, message, options);
}

async function applyPresetFilter(user, presetName) {
    const chatId = user.chatId;
    const barygaFilters = require('../data/baryga_filters.json');
    const customFilters = user.getCustomFilters();

    let selectedFilter = null;

    // Перевіряємо, чи є такий фільтр у Baryga+ Filters
    if (barygaFilters[presetName]) {
        selectedFilter = barygaFilters[presetName];
    }
    // Якщо ні, то шукаємо серед кастомних фільтрів користувача
    else if (customFilters[presetName]) {
        selectedFilter = customFilters[presetName];
    }

    if (selectedFilter) {
        // Застосовуємо вибраний фільтр до користувача
        const filters = user.getFilters();
        const currentFilterIndex = user.getCurrentFilterIndex();

        if (!filters[currentFilterIndex]) {
            filters[currentFilterIndex] = new Filters();
        }

        filters[currentFilterIndex].brand = selectedFilter.brand;
        filters[currentFilterIndex].size = selectedFilter.size;
        filters[currentFilterIndex].minPrice = selectedFilter.minPrice;
        filters[currentFilterIndex].maxPrice = selectedFilter.maxPrice;
        filters[currentFilterIndex].category = selectedFilter.category;
        filters[currentFilterIndex].keywords = selectedFilter.keywords;

        user.setFilters(filters);
        user.setCurrentFilterIndex(currentFilterIndex + 1);

        // Перевіряємо, чи є ще вільні фільтри
        if (user.getCurrentFilterIndex() < user.getFilterCount()) {
            // Якщо є, показуємо меню для вибору наступного фільтра
            await showNextFilterMenu(user);
        } else {
            // Якщо це останній фільтр, запускаємо пошук
            await sendLoggedMessage(chatId, `Preset "${presetName}" has been applied. Starting search with the selected filters.`);
            await processFiltersCommand(user);  // Запускаємо пошук за новими фільтрами
        }
    } else {
        await sendLoggedMessage(chatId, `Preset "${presetName}" not found.`);
    }
}

async function showBarygaFilters(user) {
    const chatId = user.chatId;
    const barygaFilters = require('../data/baryga_filters.json');
    const filterButtons = Object.keys(barygaFilters).map(filterName => {
        return [{ text: filterName, callback_data: `preset ${filterName}` }];
    });

    filterButtons.push([{ text: 'Back to Menu', callback_data: 'back_to_main_menu' }]);

    const options = {
        reply_markup: {
            inline_keyboard: filterButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    await sendLoggedMessage(chatId, 'Select a Baryga+ Filter:', options);
}

async function showCustomFilters(user) {
    const chatId = user.chatId;
    const customFilters = user.getCustomFilters();

    if (Object.keys(customFilters).length === 0) {
        await sendLoggedMessage(chatId, 'You have no custom filters. Please create one first.');
        return;
    }

    const filterButtons = Object.keys(customFilters).map(filterName => {
        return [{ text: filterName, callback_data: `preset ${filterName}` }];
    });

    // Додаємо кнопку для повернення в меню
    filterButtons.push([{ text: 'Back to Menu', callback_data: 'back_to_main_menu' }]);

    const options = {
        reply_markup: {
            inline_keyboard: filterButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    await sendLoggedMessage(chatId, 'Select a Custom Filter:', options);
}

async function handleCategorySelection(user, category) {
    const chatId = user.chatId;
    const filters = user.getFilters();
    filters[user.getCurrentFilterIndex()].category = category;
    user.updateFilter(filters[user.getCurrentFilterIndex()], user.getCurrentFilterIndex());
    await sendLoggedMessage(chatId, `Category selected: ${category}`);
    await showSizes(user);
}

async function addCustomPreset(user) {
    const chatId = user.chatId;
    user.isSettingCustomPreset = true;

    // Begin the filter setup process by asking for the brand
    await sendLoggedMessage(chatId, 'Let\'s set up a new custom preset. Start by selecting a brand.');
    await showBrands(user);
}

// Handle the saving of the preset when the user completes the filter setup
async function handleSaveCustomPreset(user, presetName) {
    const chatId = user.chatId;
    const filters = user.getFilters();
    const currentFilter = filters[user.getCurrentFilterIndex()];

    // Save the filter as a custom preset
    if (UserManager.addCustomFilter(chatId, presetName, currentFilter)) {
        await sendLoggedMessage(chatId, `Filter "${presetName}" has been saved as a custom preset.`);
    } else {
        await sendLoggedMessage(chatId, `Failed to save the filter. You have reached your custom filter limit.`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Delay for 2 seconds
    }

    // Return to the custom presets settings menu
    await showCustomPresetsSettings(user);
}

// Ask if the user wants to save the filter as a custom preset
async function askToSaveCustomPreset(user) {
    const chatId = user.chatId;

    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Yes', callback_data: 'save_custom_preset_yes' }],
                [{ text: 'No', callback_data: 'save_custom_preset_no' }],
            ]
        }
    };

    await sendLoggedMessage(chatId, 'Do you want to save this filter as a custom preset?', options);
}

async function handlePriceSelection(user, price) {
    const chatId = user.chatId;
    const filters = user.getFilters();
    filters[user.getCurrentFilterIndex()].maxPrice = price;
    user.updateFilter(filters[user.getCurrentFilterIndex()], user.getCurrentFilterIndex());
    await sendLoggedMessage(chatId, `Max price selected: ${price}`);

    if (user.isSettingCustomPreset) {
        await askToSaveCustomPreset(user);
    }
    else {
        await proceedToNextFilterOrSearch(user);
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

// Function to handle the /show_active_filters command and display the main menu
async function showActiveFiltersMenu(user) {
    const chatId = user.chatId;
    const filters = user.getFilters();

    // Inline keyboard with options: show filters, delete filters, and go back to menu
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Show Filters Info', callback_data: 'show_filters_info' }],
                [{ text: 'Delete Filter', callback_data: 'delete_filter_menu' }],
                [{ text: 'Go Back to Menu', callback_data: 'back_to_main_menu' }]
            ],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    // Send the main menu to the user
    await sendLoggedMessage(chatId, 'Select an option for active filters:', options);
}

// Function to show detailed information about active filters
async function showFiltersInfo(user) {
    const chatId = user.chatId;
    const filters = user.getFilters();

    // Check if user has any active filters
    if (filters.length === 0) {
        await sendLoggedMessage(chatId, 'You have no active filters.');
        return;
    }

    // Check if search is active based on isReady status
    const searchStatus = user.isReady() ? '🔍 *Search is currently active.*' : '⏸️ *Search is currently paused.*';

    // Format the filters information
    let message = `✨ *Your Active Filters:* ✨\n\n`;
    message += `${searchStatus}\n\n`;

    message += formatActiveFilters(filters);

    // Send the formatted message
    await sendLoggedMessage(chatId, message, { parse_mode: 'Markdown' });
}

// Допоміжна функція для форматування активних фільтрів
function formatActiveFilters(filters) {
    let message = '';

    if (filters.length > 0) {
        filters.forEach((filter, index) => {
            const brand = Array.isArray(filter.brand) ? filter.brand.join(', ') : filter.brand;
            const sizes = filter.size.join(', ');
            const maxPrice = filter.maxPrice ? `${filter.maxPrice} PLN` : 'No limit';
            const categoryName = getCategoryIdByName(filter.category); // Convert category ID to name

            message += `*Filter ${index + 1}:*\n`;
            message += `🏷️ *Brand:* ${brand || 'Any'}\n`;
            message += `📏 *Sizes:* ${sizes || 'Any'}\n`;
            message += `💰 *Max Price:* ${maxPrice}\n`;
            message += `📂 *Category:* ${categoryName || 'Any'}\n`;
            message += `🔑 *Keywords:* ${(filter.keywords && filter.keywords.length > 0) ? filter.keywords.join(', ') : 'None'}\n\n`;
        });
    } else {
        message += 'You have no active filters.';
    }

    return message;
}

// Function to show the delete filter menu with inline buttons for each filter
async function showDeleteFilterMenu(user) {
    const chatId = user.chatId;
    const filters = user.getFilters();

    // Check if user has any filters to delete
    if (filters.length === 0) {
        await sendLoggedMessage(chatId, 'You have no filters to delete.');
        return;
    }

    // Generate inline buttons for each filter
    const filterButtons = filters.map((filter, index) => {
        const filterName = `${filter.brand} + ${filter.category} + ${filter.maxPrice}`;
        return [{ text: `${filterName}`, callback_data: `delete_filter ${index}` }];
    });

    // Add a back button
    filterButtons.push([{ text: 'Go Back', callback_data: 'back_to_active_filters_menu' }]);

    const options = {
        reply_markup: {
            inline_keyboard: filterButtons,
            one_time_keyboard: true,
            resize_keyboard: true
        }
    };

    // Send the delete filter menu to the user
    await sendLoggedMessage(chatId, 'Select a filter to delete:', options);
}

// Function to delete a specific filter by index
async function deleteFilter(user, filterIndex) {
    const chatId = user.chatId;
    const filters = user.getFilters();

    if (filters[filterIndex]) {
        filters.splice(filterIndex, 1); // Remove the filter from the array
        user.setFilters(filters); // Update the filters
        await sendLoggedMessage(chatId, `Filter ${filterIndex + 1} has been deleted.`);
    } else {
        await sendLoggedMessage(chatId, `Filter ${filterIndex + 1} not found.`);
    }

    user.currentFilterIndex -= 1;

    // After deleting, show the delete filter menu again
    await showDeleteFilterMenu(user);
}

async function handleCallbackQuery(user, data) {
    const chatId = user.chatId;
    const [command, ...args] = data.split(' ');
    const value = args.join(' ');
    console.log(`Command: ${command}, Value: ${value}`);

    try {
        await clearChat(chatId);

        switch (command) {
            case 'command_/show_active_filters':
                await showFiltersInfo(user);
                break;

            case 'show_filters_info':
                await showFiltersInfo(user);
                break;

            case 'delete_filter_menu':
                await showDeleteFilterMenu(user);
                break;

            case 'delete_filter':
                const filterIndex = parseInt(value);
                await deleteFilter(user, filterIndex);
                break;

            case 'back_to_active_filters_menu':
                await showActiveFiltersMenu(user);
                break;

            case 'back_to_main_menu':
                await showMainMenu(user);
                break;

            case 'add_custom_preset':
                await addCustomPreset(user);
                break;

            case 'continue_search':
                await continueSearching(user);
                break;

            case 'delete_custom_presets_menu':
                await showDeleteCustomFilters(user);
                break;

            case 'delete_preset':
                await deleteCustomFilter(user, value);
                break;

            case 'save_custom_preset_yes':
                // Get the current filter and generate the preset name
                const filters = user.getFilters();
                const currentFilter = filters[user.getCurrentFilterIndex()];

                // Generate the preset name: "Brand + Category + Max Price"
                const brandArray = Array.isArray(currentFilter.brand) ? currentFilter.brand : [currentFilter.brand];
                const categoryName = currentFilter.category; // Convert category ID to name
                const presetName = `${brandArray.join(', ')} + ${categoryName} + ${currentFilter.maxPrice}`;

                await handleSaveCustomPreset(user, presetName);
                break;

            case 'save_custom_preset_no':
                // Skip saving and return to custom presets settings
                await showCustomPresetsSettings(user);
                break;

            case 'preset_baryga':
                await showBarygaFilters(user);
                break; // Додано правильний виклик функції

            case 'preset_custom':
                await showCustomFilters(user);
                break; // Додано правильний виклик функції

            case 'preset':
                await applyPresetFilter(user, value);
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

            case 'command_/baryga_filters':
                await showBarygaFilters(user);
                break;

            case 'command_/custom_filters':
                await showCustomFilters(user);
                break;

            case 'command_/presetfilters':
                await handlePresetFiltersCommand(user);
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

module.exports = {
    processClearHistoryCommand,
    processStartCommand,
    processHistoryCommand,
    processStopCommand,
    processResetCommand,
    handleCallbackQuery,
    handlePresetFiltersCommand,
    showDeleteCustomFilters,
    showCustomPresetsSettings,
    showMainMenu,
    showActiveFiltersMenu
};
