const { getUserFilters } = require('../userFilters');
const { sendTelegramMessage } = require('../utils/telegram');
const { saveHistory, loadHistory } = require('../utils/fileOperations');

// Функція для оновлення кешу для конкретного користувача
async function updateCacheForUser(chatId) {
    if (!chatId) {
        return;
    }

    // Отримання фільтрів користувача
    const filters = getUserFilters(chatId);
    if (!filters) {
        return;
    }

    // Завантаження загальної історії з файлу
    let serverHistory = loadHistory('server_cache') || [];

    // Завантаження історії користувача
    let userHistory = loadHistory(chatId) || [];

    // Фільтрація предметів з кешу відповідно до фільтрів користувача
    const filteredItems = serverHistory.filter(item => {
        if (!item.size) {
            return true; // Додаємо предмети без розміру
        }
        const itemSize = item.size.toUpperCase();
        return filters.size.some(size => itemSize.includes(size));
    });

    if (filteredItems.length > 0) {
        // Визначення нових предметів
        let newItems = [];
        if (userHistory.length === 0) {
            // Якщо історія користувача порожня, додаємо лише найновіший предмет
            const latestItem = filteredItems[0];
            newItems.push(latestItem);
        } else {
            // Якщо є історія користувача, додаємо нові предмети, які мають більший `productId`
            const lastItemId = userHistory[0].productId;
            newItems = filteredItems.filter(item => item.productId > lastItemId);
        }

        if (newItems.length > 0) {
            // Оновлення історії користувача
            userHistory = newItems.concat(userHistory);
            saveHistory(chatId, userHistory);

            // Надсилання повідомлення користувачу про нові предмети
            for (const item of newItems) {
                await sendTelegramMessage(chatId, `New item found: ${item.title} - ${item.url}`);
            }
        }
    }
}

module.exports = {
    updateCacheForUser
};