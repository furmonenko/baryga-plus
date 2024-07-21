const fs = require('fs');
const path = require('path');

function getBrands() {
    const brandsPath = path.join(__dirname, '../data', 'brands.json');
    if (fs.existsSync(brandsPath)) {
        try {
            const fileContent = fs.readFileSync(brandsPath, 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading or parsing brands.json:', error);
            return {};
        }
    } else {
        return {};
    }
}

function getCategories() {
    const categoriesPath = path.join(__dirname, '../data', 'categories.json');
    if (fs.existsSync(categoriesPath)) {
        try {
            const fileContent = fs.readFileSync(categoriesPath, 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading or parsing categories.json:', error);
            return {};
        }
    } else {
        return {};
    }
}

function getHistoryFilePath(sessionID) {
    return path.join(__dirname, '../data', `history_${sessionID}.json`);
}

function loadHistory(sessionID) {
    const historyFilePath = getHistoryFilePath(sessionID);
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
    const historyFilePath = getHistoryFilePath(sessionID);
    try {
        fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
        console.log(`History saved to ${historyFilePath}`);
    } catch (error) {
        console.error(`Error writing to ${historyFilePath}:`, error);
    }
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

function clearHistory(sessionID) {
    const historyFilePath = getHistoryFilePath(sessionID);
    try {
        fs.unlinkSync(historyFilePath);
        console.log(`History cleared for session ${sessionID}`);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`Error deleting ${historyFilePath}:`, error);
        }
    }
}

function getDeletedItems() {
    const deletedItemsPath = path.join(__dirname, '../data', 'deletedItems.json');
    if (fs.existsSync(deletedItemsPath)) {
        try {
            const fileContent = fs.readFileSync(deletedItemsPath, 'utf8');
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
    const deletedItemsPath = path.join(__dirname, '../data', 'deletedItems.json');
    try {
        fs.writeFileSync(deletedItemsPath, JSON.stringify(deletedItems, null, 2));
        console.log(`Deleted items saved to ${deletedItemsPath}`);
    } catch (error) {
        console.error(`Error writing to ${deletedItemsPath}:`, error);
    }
}

module.exports = {
    getBrands,
    getCategories,
    loadHistory,
    saveHistory,
    deleteHistoryItem,
    clearHistory,
    getDeletedItems,
    saveDeletedItems
};
