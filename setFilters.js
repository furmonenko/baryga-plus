const axios = require('axios');

const filters = {
    brand: 'Stone Island',
    size: '',
    minPrice: '',
    maxPrice: '300',
    category: 'Men'
};

axios.post('http://localhost:3000/filters', filters)
    .then(response => {
        console.log('Filters set successfully:', response.data);
    })
    .catch(error => {
        console.error('Error setting filters:', error.response ? error.response.data : error.message);
    });
