const { fetchDataFromOctapi } = require('../services/fetchData');
const { getDeletedItems, loadHistory, saveHistory } = require('../utils/fileOperations');
const { sendTelegramMessage } = require('../utils/telegram');
const { getUserFilters } = require('../userFilters');

async function updateCacheForUser(chatId) {
    if (!chatId) {
        console.log('No chatId provided. Skipping update.');
        return;
    }

    const filters = getUserFilters(chatId);
    if (!filters) {
        console.log(`No filters found for chatId: ${chatId}. Skipping update.`);
        return;
    }

    console.log('Using filters:', filters);

    const items = await fetchDataFromOctapi(filters);

    if (items) {
        let history = loadHistory(chatId) || [];

        // Фільтруємо предмети, які відповідають розмірам з фільтрів або не мають розміру
        const filteredItems = items.filter(item => {
            if (!item.size) {
                console.log(`Item ${item.title} does not have a size.`);
                return true; // Додаємо предмети без розміру
            }
            const itemSize = item.size.toUpperCase();
            console.log(`Checking item size: ${itemSize} against filters: ${JSON.stringify(filters.size)}`);
            return filters.size.some(size => itemSize.includes(size));
        });

        console.log(`Filtered items count: ${filteredItems.length}`);

        if (filteredItems.length > 0) {
            let newItems = [];

            if (history.length === 0) {
                newItems.push(filteredItems[0]);
            } else {
                const latestHistoryItem = history[0];
                newItems = filteredItems.filter(item => item.productId !== latestHistoryItem.productId && new Date(item.addedDate) > new Date(latestHistoryItem.addedDate));
            }

            if (newItems.length > 0) {
                history = [...newItems, ...history];
                saveHistory(chatId, history);

                for (const item of newItems) {
                    await sendTelegramMessage(chatId, `New item found: ${item.title} - ${item.url}`);
                    console.log(`New item added to history and notification sent: ${item.title}`);
                }
            } else {
                console.log('No new items found.');
            }
        } else {
            console.log('No new items found or the latest item is in the deleted items list.');
        }
    } else {
        console.log('Failed to fetch data from Octapi.');
    }
}

module.exports = {
    updateCacheForUser
};