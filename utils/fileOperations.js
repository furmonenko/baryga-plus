const fs = require('fs');
const path = require('path');

function saveBrand(brandName, brandId) {
    const brandsPath = path.join(__dirname, '../data/brands.json');
    const brands = getBrands();
    brands[brandName] = brandId;
    fs.writeFileSync(brandsPath, JSON.stringify(brands, null, 2));
    console.log(`Brand saved: ${brandName} with ID ${brandId}`);
}

function getBrands() {
    const brandsPath = path.join(__dirname, '../data', 'brands.json');
    if (fs.existsSync(brandsPath)) {
        try {
            const fileContent = fs.readFileSync(brandsPath, 'utf8');
            // console.log(`Loaded brands data: ${fileContent}`);
            return JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading or parsing brands.json:', error);
            return {};
        }
    } else {
        console.log('Brands file does not exist.');
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
        console.log('Categories file does not exist.');
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
            console.log(`Loaded history for ${sessionID}`);
            return JSON.parse(fileContent);
        } catch (error) {
            console.error(`Error reading or parsing ${historyFilePath}:`, error);
            return [];
        }
    } else {
        console.log(`History file for ${sessionID} does not exist. Creating new file.`);
        try {
            const initialData = [];
            fs.writeFileSync(historyFilePath, JSON.stringify(initialData, null, 2));
            return initialData;
        } catch (error) {
            console.error(`Error creating new history file ${historyFilePath}:`, error);
            return [];
        }
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

module.exports = {
    getBrands,
    getCategories,
    loadHistory,
    saveHistory,
    clearHistory,
    saveBrand
};
