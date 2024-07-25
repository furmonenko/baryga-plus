const axios = require('axios');
const cron = require('node-cron');
const { saveHistory } = require('../utils/fileOperations');
const { getAllUserFilters } = require('../userFilters');

// Об'єднані фільтри для всіх користувачів
let combinedFilters = {
    brands: new Set(),
    sizes: new Set(),
    maxPrice: 0
};

// Функція для об'єднання фільтрів користувачів
function mergeUserFilters(userFilters) {
    console.log('Merging user filters...');
    combinedFilters = { brands: new Set(), sizes: new Set(), maxPrice: 0 }; // Reset combined filters
    for (const filters of userFilters) {
        console.log(`Processing filters: ${JSON.stringify(filters)}`);
        if (filters.brand) {
            combinedFilters.brands.add(filters.brand);
            console.log(`Added brand: ${filters.brand}`);
        }
        if (filters.size) {
            filters.size.forEach(size => combinedFilters.sizes.add(size));
            console.log(`Added sizes: ${filters.size}`);
        }
        if (filters.maxPrice > combinedFilters.maxPrice) {
            combinedFilters.maxPrice = filters.maxPrice;
            console.log(`Updated maxPrice to: ${filters.maxPrice}`);
        }
    }
    console.log(`Combined filters: Brands - ${Array.from(combinedFilters.brands)}, Sizes - ${Array.from(combinedFilters.sizes)}, MaxPrice - ${combinedFilters.maxPrice}`);
}

async function fetchDataFromVinted() {
    try {
        // Конвертуємо множини в масиви для запиту
        const brands = Array.from(combinedFilters.brands).join(',');
        const sizes = Array.from(combinedFilters.sizes).join(',');

        console.log('Sending request to Octapi with combined filters:', {
            brands,
            sizes,
            maxPrice: combinedFilters.maxPrice
        });

        const response = await axios.get('https://vinted3.p.rapidapi.com/getSearch', {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'vinted3.p.rapidapi.com'
            },
            params: {
                country: 'pl',
                page: '1',
                brands: brands,
                sizes: sizes,
                minPrice: 0, // Мінімальна ціна за замовчуванням 0
                maxPrice: combinedFilters.maxPrice,
                category: 3, // Категорія Men, наприклад
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

// Функція оновлення кешу на сервері
async function updateCache() {
    console.log('updateCache function called...');

    // Отримуємо всі фільтри користувачів і об'єднуємо їх
    const allUserFilters = getAllUserFilters();
    console.log(`Retrieved all user filters: ${JSON.stringify(allUserFilters)}`);
    mergeUserFilters(allUserFilters);

    // Перевірка наявності фільтрів
    if (combinedFilters.maxPrice === 0) {
        console.log('Користувачі не задали ніяких фільтрів, сервер не фетчить дані.');
        return;
    }

    const data = await fetchDataFromVinted();
    if (data) {
        saveHistory('server_cache', data);
        console.log('Cache updated successfully.');
    } else {
        console.error('Failed to update cache.');
    }
}

module.exports = {
    updateCache
};
