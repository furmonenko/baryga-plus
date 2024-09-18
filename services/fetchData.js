const axios = require('axios');
const UserManager = require('../managers/userManager');
const { saveHistory } = require('../utils/fileOperations');
const brandsData = require('../data/brands.json');
const {getCategoryIdByName, getCategoryNameById} = require("./categories"); // Завантаження брендових даних

// Функція затримки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function mergeUserFilters(userFilters) {
    let combinedFilters = {
        categories: {}, // Ключ: категорія (назва), Значення: множина брендів
        maxPrice: 0
    };

    console.log(`Merging ${userFilters.length} user filters.`);

    for (const filters of userFilters) {
        console.log(`Processing filters: ${JSON.stringify(filters)}`);

        // Отримуємо назву категорії, якщо фільтр містить ID категорії
        let categoryName = filters.category;
        if (!isNaN(categoryName)) {
            categoryName = getCategoryNameById(categoryName);
        }

        // Об'єднання брендів для кожної категорії
        if (filters.brand && categoryName) {
            const brandsArray = Array.isArray(filters.brand) ? filters.brand : [filters.brand];
            if (!combinedFilters.categories[categoryName]) {
                combinedFilters.categories[categoryName] = new Set();
            }
            brandsArray.forEach(brand => {
                if (brandsData[brand]) {
                    combinedFilters.categories[categoryName].add(brandsData[brand].id); // Додаємо тільки id бренду
                    console.log(`Added brand: ${brand} (ID: ${brandsData[brand].id}) to category: ${categoryName}`);
                } else {
                    console.warn(`Brand '${brand}' not found in brandsData.`);
                }
            });
        }

        // Вибір максимальної ціни
        if (filters.maxPrice && filters.maxPrice > combinedFilters.maxPrice) {
            combinedFilters.maxPrice = filters.maxPrice;
            console.log(`Updated max price to: ${combinedFilters.maxPrice}`);
        }
    }

    // Форматування брендів для кожної категорії
    for (const category in combinedFilters.categories) {
        combinedFilters.categories[category] = Array.from(combinedFilters.categories[category]).join(',');
    }

    console.log("Combined filters result:", combinedFilters);

    return combinedFilters;
}

// Функція отримання даних з API
async function fetchDataFromVinted(combinedFilters) {
    let allData = [];
    let uniqueProductIds = new Set(); // Множина для збереження унікальних productId

    console.log(`Fetching data with max price: ${combinedFilters.maxPrice}, categories: ${Object.keys(combinedFilters.categories).join(', ')}`);

    for (const category in combinedFilters.categories) {
        const brands = combinedFilters.categories[category];
        console.log(`Fetching data for category: ${category} with brands: ${brands}`);
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
                    minPrice: 0,
                    maxPrice: combinedFilters.maxPrice,
                    category: getCategoryIdByName(category),
                    order: 'newest_first'
                }
            });

            const data = response.data || [];
            console.log(`Received ${data.length} items for category: ${category}`);

            // Збереження назви категорії для кожного товару
            const categorizedData = data.map(item => ({
                ...item,
                brand: item.brand,
                category: category // Збереження ID категорії
            }));

            allData = allData.concat(categorizedData);

            // Додавання productId до множини для підрахунку унікальних товарів
            categorizedData.forEach(item => {
                uniqueProductIds.add(item.productId);
            });

            await delay(3000); // Затримка між запитами
        } catch (error) {
            console.error(`Error fetching data for category ${category}:`, error.message);
        }
    }

    // Лог кількості унікальних товарів після фетчу
    console.log(`Fetched ${uniqueProductIds.size} unique items from Vinted.`);

    return allData;
}

// Функція оновлення кешу
async function updateCache() {
    const allUsers = UserManager.getAllUsers();
    console.log(`Loaded ${allUsers.length} users from UserManager.`);

    const allUserFilters = allUsers.flatMap(user => user.getFilters());
    console.log(`Extracted ${allUserFilters.length} filters from all users.`);

    if (allUserFilters.length === 0) {
        console.log('No filters found to fetch data.');
        return;
    }

    const combinedFilters = mergeUserFilters(allUserFilters);

    if (combinedFilters.maxPrice === 0) {
        console.log('Max price is 0, skipping fetch.');
        return;
    }

    const data = await fetchDataFromVinted(combinedFilters);
    if (data && data.length > 0) {
        console.log(`Saving ${data.length} items to server cache.`);
        saveHistory('server_cache', data);
    } else {
        console.log('No data to save to server cache.');
    }
}

module.exports = { updateCache };