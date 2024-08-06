const UserManager = require('../managers/userManager');
const { sendLoggedPhoto } = require('../utils/telegram');
const { loadHistory, saveHistory } = require('../utils/fileOperations');

/**
 * Filters items from the server cache based on user filters.
 * @param {Array} serverHistory - The server cache history.
 * @param {Object} filters - The user filters.
 * @returns {Array} - The filtered items.
 */
function filterItems(serverHistory, filters) {
    console.log(`Filtering items with filters: ${JSON.stringify(filters)}`);
    const filtered = serverHistory.filter(item => {
        if (filters.brand && item.brand !== filters.brand) {
            return false;
        }

        if (filters.category && item.category !== filters.category) {
            return false;
        }

        if (filters.size && filters.size.length > 0) {
            if (!item.size) {
                return false;
            }
            const itemSize = item.size.toUpperCase();
            const sizeMatch = filters.size.some(size => itemSize.includes(size));
            if (!sizeMatch) {
                return false;
            }
        }

        return !(filters.maxPrice && parseFloat(item.price.amount) > parseFloat(filters.maxPrice));
    }).sort((a, b) => b.productId - a.productId);

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
        const latestItem = filteredItems[0];
        if (latestItem) newItems.push(latestItem);
    } else {
        const lastItemId = userHistory[0].productId;
        newItems = filteredItems.filter(item => item.productId > lastItemId);
    }

    if (newItems.length > 0) {
        userHistory = newItems.concat(userHistory);
        user.setHistory(userHistory);
        console.log(`User history updated with ${newItems.length} new items.`);
    } else {
        console.log('No new items to update in user history.');
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
    if (!user) {
        console.log(`No user found for chatId: ${chatId}`);
        return;
    }

    // Get user filters
    const filters = user.getFilters();
    if (!filters) {
        console.log(`No filters found for user with chatId: ${chatId}`);
        return;
    }

    console.log(`Updating history for user with chatId: ${chatId} using filters: ${JSON.stringify(filters)}`);

    // Load server cache history
    let serverHistory = loadHistory('server_cache') || [];
    console.log(`Loaded ${serverHistory.length} items from server cache.`);

    // Filter items from server cache based on user filters
    let filteredItems = filterItems(serverHistory, filters);

    // Update user history and get new items
    let newItems = updateUserHistory(user, filteredItems);

    // Send new items to user
    if (newItems.length > 0) {
        await sendNewItemsToUser(chatId, newItems);
    } else {
        console.log(`No new items to send for chatId: ${chatId}`);
    }
}

module.exports = {
    updateHistoryForUser
};
