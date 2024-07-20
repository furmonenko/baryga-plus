const axios = require('axios');
const fs = require('fs');

let history = [];

if (fs.existsSync('data/history.json')) {
    try {
        const fileContent = fs.readFileSync('data/history.json', 'utf8');
        if (fileContent) {
            history = JSON.parse(fileContent);
        } else {
            console.log('History file is empty. Initializing empty history.');
        }
    } catch (error) {
        console.error('Error reading or parsing history.json:', error);
    }
} else {
    console.log('History file does not exist. Initializing empty history.');
}

function getHistory() {
    return history;
}

function saveHistory(newHistory) {
    history = newHistory;
    fs.writeFileSync('data/history.json', JSON.stringify(history, null, 2));
}

function deleteHistoryItem(productId) {
    history = history.filter(item => item.productId !== productId);
    const deletedItems = getDeletedItems();
    if (!deletedItems.includes(productId)) {
        deletedItems.push(productId);
        fs.writeFileSync('data/deletedItems.json', JSON.stringify(deletedItems, null, 2));
    }
    return history;
}

async function fetchDataFromOctapi(filters) {
    try {
        console.log('Sending request to Octapi with filters:', filters);

        const response = await axios.get('https://vinted3.p.rapidapi.com/getSearch', {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'vinted3.p.rapidapi.com'
            },
            params: {
                country: 'pl',
                page: '1',
                brands: filters.brand, // Використовуємо ID бренду
                size: filters.size,
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                category: filters.category, // Використовуємо ID категорії
                order: 'newest_first'
            }
        });

        console.log('Response from Octapi:', response.data);

        return response.data;
    } catch (error) {
        console.error('Error fetching data from Octapi:', error.response ? error.response.data : error.message);
        return null;
    }
}

module.exports = {
    getHistory,
    saveHistory,
    deleteHistoryItem,
    fetchDataFromOctapi
};
