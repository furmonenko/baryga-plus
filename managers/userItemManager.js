const { getUserFilters } = require('../userFilters');
const { sendLoggedPhoto } = require('../utils/telegram');
const { loadHistory, saveHistory } = require('../utils/fileOperations');

/**
 * Filters items from the server cache based on user filters.
 * @param {Array} serverHistory - The server cache history.
 * @param {Object} filters - The user filters.
 * @returns {Array} - The filtered items.
 */
function filterItems(serverHistory, filters) {
    return serverHistory.filter(item => {
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
}

/**
 * Updates the user history with new items and returns the new items.
 * @param {number} chatId - The chat ID of the user.
 * @param {Array} filteredItems - The filtered items.
 * @returns {Array} - The new items.
 */
function updateUserHistory(chatId, filteredItems) {
    let userHistory = loadHistory(chatId) || [];
    let newItems = [];

    if (userHistory.length === 0) {
        const latestItem = filteredItems[0];
        if (latestItem) newItems.push(latestItem);
    } else {
        const lastItemId = userHistory[0].productId;
        newItems = filteredItems.filter(item => item.productId > lastItemId);
    }

    if (newItems.length > 0) {
        userHistory = newItems.concat(userHistory);
        saveHistory(chatId, userHistory);
        console.log(`User history updated with ${newItems.length} new items.`);
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
        return;
    }

    // Get user filters
    const filters = getUserFilters(chatId);
    if (!filters) {
        return;
    }

    // Load server cache history
    let serverHistory = loadHistory('server_cache') || [];

    // Filter items from server cache based on user filters
    let filteredItems = filterItems(serverHistory, filters);

    // Update user history and get new items
    let newItems = updateUserHistory(chatId, filteredItems);

    // Send new items to user
    if (newItems.length > 0) {
        await sendNewItemsToUser(chatId, newItems);
    }
}

module.exports = {
    updateHistoryForUser
};