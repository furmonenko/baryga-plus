const { fetchDataFromOctapi } = require('../services/fetchData');
const { getDeletedItems, loadHistory, saveHistory } = require('../utils/fileOperations');
const { sendNotification } = require('../services/notifications');
const { getFilters } = require('../routes/filters');

async function updateCacheForUser(req) {
    if (!req.session.deviceToken) {
        return;
    }

    const filters = getFilters(req);

    const items = await fetchDataFromOctapi(filters);

    if (items) {
        let history = loadHistory(req.sessionID) || [];

        let newItems = [];

        if (history.length === 0) {
            if (!getDeletedItems().includes(items[0].productId)) {
                const newestItem = items[0];
                newItems.push(newestItem);
                history.unshift(newestItem);
            }
        } else {
            const lastItemTimestamp = new Date(history[0].timestamp);

            newItems = items.filter(item => {
                const itemTimestamp = new Date(item.timestamp);
                const isNewItem = itemTimestamp > lastItemTimestamp;
                const isNotDeleted = !getDeletedItems().includes(item.productId);

                return isNewItem && isNotDeleted;
            });

            history = newItems.concat(history);
        }

        if (newItems.length > 0) {
            newItems.forEach(item => {
                sendNotification(item, req.session.deviceToken);
            });
            saveHistory(req.sessionID, history);
        }
    }
}

module.exports = {
    updateCacheForUser
};
