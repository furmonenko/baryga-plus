const axios = require('axios');

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
                brands: filters.brand,
                size: filters.size,  // Зверніть увагу, що можливо параметр має бути 'sizes', а не 'size'
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                category: filters.category,
                order: 'newest_first'
            }
        });

        // console.log('Response from Octapi:', response.data);

        return response.data;
    } catch (error) {
        console.error('Error fetching data from Octapi:', error.response ? error.response.data : error.message);
        return null;
    }
}

module.exports = {
    fetchDataFromOctapi
};
