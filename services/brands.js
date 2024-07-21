const axios = require('axios');
const fs = require('fs');
const path = require('path');

let brands = {};

const brandsPath = path.join(__dirname, '../data', 'brands.json');

if (fs.existsSync(brandsPath)) {
    try {
        const fileContent = fs.readFileSync(brandsPath, 'utf8');
        if (fileContent) {
            brands = JSON.parse(fileContent);
        } else {
            console.log('Brands file is empty. Initializing empty brands.');
        }
    } catch (error) {
        console.error('Error reading or parsing brands.json:', error);
    }
} else {
    console.log('Brands file does not exist. Initializing empty brands.');
}

function saveBrands() {
    fs.writeFileSync(brandsPath, JSON.stringify(brands, null, 2));
}

async function fetchBrandId(brandName) {
    if (brands[brandName]) {
        return brands[brandName];
    }

    const options = {
        method: 'GET',
        url: 'https://vinted3.p.rapidapi.com/getBrandSearch',
        params: { country: 'pl', keyword: brandName },
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'vinted3.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        const brandId = response.data && response.data[0] ? response.data[0].brandId : null;

        if (brandId) {
            brands[brandName] = brandId;
            saveBrands();
        }
        return brandId;
    } catch (error) {
        console.error('Error fetching brand ID:', error.response ? error.response.data : error.message);
        return null;
    }
}

module.exports = {
    fetchBrandId
};
