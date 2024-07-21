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
        const latestItem = items.find(item =>
            filters.size.some(size => item.size.toLowerCase() === size.toLowerCase())
        );

        if (latestItem && !getDeletedItems().includes(latestItem.productId)) {
            const itemExistsInHistory = history.some(item => item.productId === latestItem.productId);

            if (!itemExistsInHistory) {
                // Зберігаємо лише найновіший предмет в історії
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
