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
        console.log(`Fetched ${items.length} items from Octapi.`);

        let history = loadHistory(chatId) || [];
        console.log(`Loaded history with ${history.length} items for chatId: ${chatId}.`);

        // Фільтруємо предмети, які відповідають розмірам з фільтрів
        const filteredItems = items.filter(item => {
            const itemSize = item.size ? item.size.toUpperCase() : '';
            const sizesToCheck = filters.size[0].split(' ').map(s => s.trim().toUpperCase());
            console.log(`Checking item size: ${itemSize} against filters: ${JSON.stringify(sizesToCheck)}`);
            return sizesToCheck.includes(itemSize);
        });

        console.log(`Filtered items count: ${filteredItems.length}`);

        if (filteredItems.length > 0) {
            const latestItem = filteredItems[0];
            const itemExistsInHistory = history.some(item => item.productId === latestItem.productId);

            if (!itemExistsInHistory) {
                history.unshift(latestItem);
                saveHistory(chatId, history);

                await sendTelegramMessage(chatId, `New item found: ${latestItem.title} - ${latestItem.url}`);
                console.log(`New item added to history and notification sent: ${latestItem.title}`);
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
