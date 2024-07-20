const { fetchDataFromOctapi } = require('../services/fetchData');
const { getDeletedItems } = require('../utils/fileOperations');
const { sendNotification } = require('../services/notifications');
const { getFilters } = require('../routes/filters');

async function updateCacheForUser(req) {
    if (!req.session.deviceToken) {
        console.log('Device token not registered. Skipping update.');
        return;
    }

    console.log('Fetching data from Octapi for user...');
    const filters = getFilters(req);
    console.log('Current filters:', filters);

    const items = await fetchDataFromOctapi(filters);

    if (items) {
        // console.log('Fetched items:', items);

        let history = req.session.history || [];
        // console.log('Current history:', history);

        let newItems = [];

        if (history.length === 0) {
            if (!getDeletedItems().includes(items[0].productId)) {
                const newestItem = items[0];
                newItems.push(newestItem);
                history.unshift(newestItem);
            }
        } else {
            const lastItemTimestamp = new Date(history[0].timestamp);
            // console.log('Last item timestamp in history:', lastItemTimestamp);

            newItems = items.filter(item => {
                const itemTimestamp = new Date(item.timestamp);
                const isNewItem = itemTimestamp > lastItemTimestamp;
                const isNotDeleted = !getDeletedItems().includes(item.productId);

                // console.log(`Item ${item.productId} - isNewItem: ${isNewItem}, isNotDeleted: ${isNotDeleted}`);

                return isNewItem && isNotDeleted;
            });

            // console.log('New items:', newItems);

            history = newItems.concat(history);
        }

        if (newItems.length > 0) {
            newItems.forEach(item => {
                // console.log('Sending notification for item:', item);
                sendNotification(item, req.session.deviceToken); // передайте deviceToken
            });
            req.session.history = history;
            // console.log('History updated with new items:', history);
        } else {
            console.log('No new items found.');
        }
    } else {
        console.log('Failed to fetch data from Octapi.');
    }
}

module.exports = {
    updateCacheForUser
};
