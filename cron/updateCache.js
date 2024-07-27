const { getUserFilters } = require('../userFilters');
const { sendTelegramMessage, sendTelegramPhoto } = require('../utils/telegram');
const { loadHistory, saveHistory } = require('../utils/fileOperations');

async function updateCacheForUser(chatId) {
    if (!chatId) {
        console.log('No chatId provided. Skipping update.');
        return;
    }

    // Отримання фільтрів користувача
    const filters = getUserFilters(chatId);
    if (!filters) {
        console.log(`No filters found for chatId: ${chatId}. Skipping update.`);
        return;
    }

    console.log(`Using filters for user ${chatId}:`, JSON.stringify(filters));

    // Завантаження загальної історії з файлу
    let serverHistory = loadHistory('server_cache') || [];
    console.log(`Loaded server history with ${serverHistory.length} items.`);

    // Завантаження історії користувача
    let userHistory = loadHistory(chatId) || [];
    console.log(`Loaded user history for ${chatId} with ${userHistory.length} items.`);

    // Фільтрація предметів з кешу відповідно до фільтрів користувача
    let filteredItems = serverHistory.filter(item => {
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
                console.log(`Item ${item.title} filtered out by size: ${itemSize}`);
                return false;
            }
        }

        if (filters.maxPrice && parseFloat(item.price.amount) > parseFloat(filters.maxPrice)) {
            console.log(`Item ${item.title} filtered out by price: ${item.price.amount}`);
            return false;
        }

        console.log(`Item ${item.title} passed all filters.`);
        return true;
    });

    filteredItems = filteredItems.sort((a, b) => b.productId - a.productId);

    // Визначення нових предметів та оновлення історії користувача
    let newItems = [];
    if (userHistory.length === 0) {
        const latestItem = filteredItems[0];
        if (latestItem) newItems.push(latestItem);
        console.log(`User history is empty, first new item: ${latestItem ? latestItem.title : 'None'}`);
    } else {
        const lastItemId = userHistory[0].productId;
        newItems = filteredItems.filter(item => item.productId > lastItemId);
    }

    if (newItems.length > 0) {
        userHistory = newItems.concat(userHistory);
        saveHistory(chatId, userHistory);
        console.log(`User history updated with ${newItems.length} new items.`);

        for (const item of newItems) {
            const message = `✨ *New Item Found!* ✨\n\n` +
                `📌 *Title:* ${item.title}\n\n` +
                `🏷️ *Brand:* ${item.brand}\n\n` +
                `📏 *Size:* ${item.size}\n\n` +
                `💰 *Price:* ${item.price.amount} ${item.price.currency}\n\n` +
                `🔗 [👉 BUY THE ITEM NOW 👈](${item.url})`;

            console.log(`Sending new item to user: ${item.title} - ${item.url}`);

            // Відправка фотографії з інформацією про товар
            await sendTelegramPhoto(chatId, item.image, message, { parse_mode: 'Markdown' });
        }
    } else {
        console.log(`No new items found for user ${chatId}.`);
    }
}

module.exports = {
    updateCacheForUser
};
