const UserManager = require('../managers/userManager');
const { sendLoggedPhoto } = require('../utils/telegram');
const { loadHistory, saveHistory } = require('../utils/fileOperations');
const categories = require('../data/categories.json'); // Load category data

/**
 * Gets all subcategories for a given category.
 * @param {number} categoryId - The ID of the category.
 * @returns {Array} - An array of subcategory IDs.
 */
function getAllSubcategories(categoryId) {
    let subcategories = [];
    for (const [id, category] of Object.entries(categories)) {
        if (category.parent_id === categoryId) {
            subcategories.push(parseInt(id));
            subcategories = subcategories.concat(getAllSubcategories(parseInt(id)));
        }
    }
    return subcategories;
}

/**
 * Filters items from the server cache based on user filters.
 * @param {Array} serverHistory - The server cache history.
 * @param {Object} filters - The user filters.
 * @returns {Array} - The filtered items.
 */
function filterItems(serverHistory, filters) {
    console.log(`Filtering items with filters: ${JSON.stringify(filters)}`);
    const categoryIds = [filters.category].concat(getAllSubcategories(filters.category));
    const filtered = serverHistory.filter(item => {
        if (filters.brand && item.brand !== filters.brand) {
            return false;
        }

        if (filters.category && !categoryIds.includes(item.category)) {
            return false;
        }

        if (filters.size && filters.size.length > 0) {
            if (!item.size || item.size.toUpperCase() === 'UNIWERSALNY') {
                return true;
            }
            const itemSize = item.size.toUpperCase();
            const sizeMatch = filters.size.some(size => itemSize.includes(size.toUpperCase()));
            if (!sizeMatch) {
                return false;
            }
        }

        return !(filters.maxPrice && parseFloat(item.price.amount) > parseFloat(filters.maxPrice));
    }).sort((a, b) => b.productId - a.productId); // Sort by productId in descending order

    console.log(`Filtered ${filtered.length} items`);
    return filtered;
}


/**
 * Updates the user history with new items and returns the new items.
 * @param {User} user - The user object.
 * @param {Array} filteredItems - The filtered items.
 * @returns {Array} - The new items.
 */
function updateUserHistory(user, filteredItems) {
    let userHistory = user.getHistory() || [];
    let newItems = [];

    console.log(`User history length before update: ${userHistory.length}`);
    if (userHistory.length === 0) {
        // If user history is empty, find the newest item from all filters
        if (filteredItems.length > 0) {
            newItems = [filteredItems[0]]; // Take only the newest item from all filters
        }
    } else {
        const lastItemId = userHistory[0].productId;
        newItems = filteredItems.filter(item => item.productId > lastItemId);
    }

    if (newItems.length > 0) {
        userHistory = newItems.concat(userHistory);
        userHistory.sort((a, b) => b.productId - a.productId); // Ensure newest item is at the top
        user.setHistory(userHistory);
        console.log(`User history updated with ${newItems.length} new items.`);
    } else {
        console.log(`No new items to update in user history.`);
    }

    return newItems;
}

/**
 * Sends new items found to the user.
 * @param {number} chatId - The chat ID of the user.
 * @param {Array} newItems - The new items to send.
 */
async function sendNewItemsToUser(chatId, newItems) {
    for (const item of newItems) {
        const message = `✨ *New Item Found!* ✨\n\n` +
            `📌 *Title:* ${item.title}\n\n` +
            `🏷️ *Brand:* ${item.brand}\n\n` +
            `📏 *Size:* ${item.size}\n\n` +
            `💰 *Price:* ${item.price.amount} ${item.price.currency}\n\n` +
            `🔗 [👉 BUY THE ITEM NOW 👈](${item.url})`;

        console.log(`Sending new item to user: ${item.title} - ${item.url}`);

        // Send item photo with information to user
        await sendLoggedPhoto(chatId, item.image, message, { parse_mode: 'Markdown' });
    }
}

/**
 * Updates the cache for a specific user based on their filters and sends new items found.
 * @param {number} chatId - The chat ID of the user.
 */
async function updateHistoryForUser(chatId) {
    if (!chatId) {
        console.log('No chatId provided.');
        return;
    }

    console.log("All users: " + JSON.stringify(UserManager.getAllUsers()));

    const user = UserManager.getUser(chatId);
    if (!user || !user.isReady()) {
        console.log(`User with chatId ${chatId} is not ready or not found.`);
        return;
    }

    // Get user filters
    const filters = user.getFilters();
    if (!filters || filters.length === 0) {
        console.log(`No filters found for user with chatId: ${chatId}`);
        return;
    }

    console.log(`Updating history for user with chatId: ${chatId} using filters: ${JSON.stringify(filters)}`);

    // Load server cache history
    let serverHistory = loadHistory('server_cache') || [];
    console.log(`Loaded ${serverHistory.length} items from server cache.`);

    // Save the newest item in the user history before processing filters
    let lastItemId = 0;
    if (user.getHistory().length > 0) {
        lastItemId = user.getHistory()[0].productId;
    }

    let allFilteredItems = [];
    for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        console.log(`Filtering items with filter ${i + 1}: ${JSON.stringify(filter)}`);

        // Filter items from server cache based on current filter
        const filteredItems = filterItems(serverHistory, filter);
        allFilteredItems = allFilteredItems.concat(filteredItems);
    }

    // Sort all filtered items to get the newest items first
    allFilteredItems.sort((a, b) => b.productId - a.productId);

    // Determine which items are new based on the last item in user history
    let newItems = [];
    if (user.getHistory().length === 0) {
        // If user history is empty, take only the newest item
        if (allFilteredItems.length > 0) {
            newItems = [allFilteredItems[0]];
        }
    } else {
        // If user history is not empty, take all items newer than the last item
        newItems = allFilteredItems.filter(item => item.productId > lastItemId);
    }

    // Update user history and send new items
    if (newItems.length > 0) {
        const updatedHistory = newItems.concat(user.getHistory());
        user.setHistory(updatedHistory.sort((a, b) => b.productId - a.productId));
        await sendNewItemsToUser(chatId, newItems);
    } else {
        console.log(`No new items to send for chatId: ${chatId}`);
    }
}

module.exports = {
    updateHistoryForUser
};
