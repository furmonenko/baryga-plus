const axios = require('axios');

// Функція для отримання даних з Octapi через RapidAPI
async function fetchDataFromOctapi(filters) {
    try {
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

        return response.data;
    } catch (error) {
        console.error('Error fetching data from Octapi:', error.response ? error.response.data : error.message);
        return null;
    }
}

module.exports = {
    fetchDataFromOctapi
};
