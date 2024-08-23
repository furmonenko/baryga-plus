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
    const keywords = filters.keywords || [];
    const brandsArray = Array.isArray(filters.brand) ? filters.brand : [filters.brand];

    const filtered = serverHistory.filter(item => {
        // Перевірка бренду
        if (brandsArray.length > 0) {
            const itemBrand = item.brand.toLowerCase();
            const matchesBrand = brandsArray.some(brand => itemBrand === brand.toLowerCase());
            if (!matchesBrand) {
                return false;
            }
        }

        // Перевірка категорії
        if (filters.category && item.category !== filters.category) {
            return false;
        }

        // Перевірка ключових слів (шукає повні фрази)
        if (keywords.length > 0) {
            const itemTitle = item.title.toLowerCase();
            const keywordMatch = keywords.some(keyword => {
                const keywordLower = keyword.toLowerCase();
                const regex = new RegExp(`\\b${keywordLower}\\b`, 'i'); // Шукаємо слово як повний збіг
                return regex.test(itemTitle);
            });
            if (!keywordMatch) {
                return false;
            }
        }

        // Перевірка ціни
        if (filters.maxPrice && parseFloat(item.price.amount) > parseFloat(filters.maxPrice)) {
            return false;
        }

        // Перевірка розмірів
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

        return true;
    }).sort((a, b) => b.productId - a.productId);

    return filtered;
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

        // Надсилаємо фотографію з інформацією користувачу
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

    // console.log("All users: " + JSON.stringify(UserManager.getAllUsers()));

    const user = UserManager.getUser(chatId);
    if (!user || !user.isReady()) {
        console.log(`User with chatId ${chatId} is not ready or not found.`);
        return;
    }

    // Отримуємо фільтри користувача
    const filters = user.getFilters();
    if (!filters || filters.length === 0) {
        console.log(`No filters found for user with chatId: ${chatId}`);
        return;
    }

    // Завантажуємо кеш сервера
    let serverHistory = loadHistory('server_cache') || [];
    console.log(`Loaded ${serverHistory.length} items from server cache.`);

    // Зберігаємо найновіший елемент у історії користувача перед обробкою фільтрів
    let lastItemId = 0;
    if (user.getHistory().length > 0) {
        lastItemId = user.getHistory()[0].productId;
    }

    let allFilteredItems = [];
    for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        // console.log(`Filtering items with filter ${i + 1}: ${JSON.stringify(filter)}`);

        // Фільтруємо предмети з кешу сервера на основі поточного фільтру
        const filteredItems = filterItems(serverHistory, filter);
        allFilteredItems = allFilteredItems.concat(filteredItems);
    }

    // Сортуємо всі відфільтровані предмети, щоб отримати найновіші спочатку
    allFilteredItems.sort((a, b) => b.productId - a.productId);

    // Визначаємо, які предмети нові, на основі останнього предмета в історії користувача
    let newItems = [];
    if (user.getHistory().length === 0) {
        // Якщо історія користувача порожня, беремо тільки найновіший предмет
        if (allFilteredItems.length > 0) {
            newItems = [allFilteredItems[0]];
        }
    } else {
        // Якщо історія не порожня, беремо всі предмети новіші за останній збережений
        newItems = allFilteredItems.filter(item => item.productId > lastItemId);
    }

    // Оновлюємо історію користувача та надсилаємо нові предмети
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
