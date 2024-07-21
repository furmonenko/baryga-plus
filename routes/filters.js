const express = require('express');
const router = express.Router();
const { fetchBrandId } = require('../services/brands');
const { getCategoryIdByName } = require('../services/categories');

router.post('/', async (req, res) => {
    const { brand, size, minPrice, maxPrice, category } = req.body;

    if (!brand || size === undefined || minPrice === undefined || maxPrice === undefined || !category) {
        return res.status(400).json({ message: 'Invalid filter values' });
    }

    const brandId = await fetchBrandId(brand);
    const categoryId = getCategoryIdByName(category);

    if (!brandId) {
        return res.status(400).json({ message: 'Invalid brand name' });
    }

    if (!categoryId) {
        return res.status(400).json({ message: 'Invalid category name' });
    }

    req.session.filters = {
        brand: brandId,
        size,
        minPrice,
        maxPrice,
        category: categoryId
    };

    console.log('Updated filters:', req.session.filters);
    res.status(200).json(req.session.filters);
});

function getFilters(req) {
    return req.session.filters || { brand: '', size: '', minPrice: 0, maxPrice: 1000, category: '' };
}

module.exports = router;
module.exports.getFilters = getFilters;
