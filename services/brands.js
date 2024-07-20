const axios = require('axios');
const fs = require('fs');

let brands = {};

if (fs.existsSync('data/brands.json')) {
    try {
        const fileContent = fs.readFileSync('data/brands.json', 'utf8');
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
    fs.writeFileSync('data/brands.json', JSON.stringify(brands, null, 2));
}

async function fetchBrandId(brandName) {
    if (brands[brandName]) {
        return brands[brandName];
    }

    console.log(brandName);

    const options = {
        method: 'GET',
        url: 'https://vinted3.p.rapidapi.com/getBrandSearch',
        params: { country: 'pl', keyword: brandName },
        headers: {
            'x-rapidapi-key': 'c11cc0dfd2msh1ba92ec23df8848p18e756jsn53f19a689b23',
            'x-rapidapi-host': 'vinted3.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);

        const brandId = response.data && response.data[0] ? response.data[0].brandId : null;

        console.log("brand id - ", brandId)

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
