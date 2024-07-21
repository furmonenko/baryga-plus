const fs = require('fs');

function loadHistory(sessionID) {
    const historyFilePath = `./data/history_${sessionID}.json`;
    if (fs.existsSync(historyFilePath)) {
        try {
            const fileContent = fs.readFileSync(historyFilePath, 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error(`Error reading or parsing ${historyFilePath}:`, error);
            return [];
        }
    } else {
        return [];
    }
}

function saveHistory(sessionID, history) {
    const historyFilePath = `./data/history_${sessionID}.json`;
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
}

function deleteHistoryItem(sessionID, productId) {
    let history = loadHistory(sessionID);
    history = history.filter(item => item.productId !== productId);
    saveHistory(sessionID, history);

    const deletedItems = getDeletedItems();
    if (!deletedItems.includes(productId)) {
        deletedItems.push(productId);
        saveDeletedItems(deletedItems);
    }
    return history;
}

function getDeletedItems() {
    if (fs.existsSync('data/deletedItems.json')) {
        try {
            const fileContent = fs.readFileSync('data/deletedItems.json', 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading or parsing deletedItems.json:', error);
            return [];
        }
    } else {
        return [];
    }
}

function saveDeletedItems(deletedItems) {
    fs.writeFileSync('data/deletedItems.json', JSON.stringify(deletedItems, null, 2));
}

module.exports = {
    loadHistory,
    saveHistory,
    deleteHistoryItem,
    getDeletedItems,
    saveDeletedItems
};
