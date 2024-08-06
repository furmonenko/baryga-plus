const axios = require('axios');
const { saveHistory } = require('../utils/fileOperations');
const UserManager = require('../managers/userManager');
const brandsData = require('../data/brands.json'); // Завантаження брендових даних

// Функція затримки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Функція об'єднання фільтрів користувачів
function mergeUserFilters(userFilters) {
    let combinedFilters = {
        brands: new Set(),
        sizes: new Set(),
        maxPrice: 0,
        categories: new Set()
    };

    for (const filters of userFilters) {
        if (filters.brand && brandsData[filters.brand]) {
            combinedFilters.brands.add(brandsData[filters.brand]); // Заміна назви бренду на ID
        }
        if (filters.size) filters.size.forEach(size => combinedFilters.sizes.add(size));
        if (filters.maxPrice > combinedFilters.maxPrice) combinedFilters.maxPrice = filters.maxPrice;
        if (filters.category) combinedFilters.categories.add(filters.category);
    }

    return combinedFilters;
}

// Функція отримання даних з API
async function fetchDataFromVinted(combinedFilters) {
    const brands = Array.from(combinedFilters.brands).join(',');
    const sizes = Array.from(combinedFilters.sizes).join(',');
    let allData = [];

    for (const category of combinedFilters.categories) {
        try {
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
                    minPrice: 0,
                    maxPrice: combinedFilters.maxPrice,
                    category: category,
                    order: 'newest_first'
                }
            });

            const data = response.data || [];

            // Збереження назви категорії для кожного товару
            const categorizedData = data.map(item => ({
                ...item,
                brand: item.brand,
                category: category // Збереження ID категорії
            }));

            allData = allData.concat(categorizedData);

            await delay(1000); // Затримка між запитами
        } catch (error) {
            console.error(`Error fetching data for category ${category}:`, error);
        }
    }

    return allData;
}

// Функція оновлення кешу
async function updateCache() {
    const allUsers = UserManager.getAllUsers();
    const allUserFilters = allUsers.map(user => user.getFilters());

    const combinedFilters = mergeUserFilters(allUserFilters);

    if (combinedFilters.maxPrice === 0) {
        return;
    }

    const data = await fetchDataFromVinted(combinedFilters);
    if (data) {
        saveHistory('server_cache', data);
    }
}

module.exports = { updateCache };
