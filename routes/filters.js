const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const { brand, size, minPrice, maxPrice, category } = req.body;

    if (!brand || size === undefined || minPrice === undefined || maxPrice === undefined || !category) {
        return res.status(400).json({ message: 'Invalid filter values' });
    }

    // Зберігаємо фільтри в сесії користувача
    req.session.filters = {
        brand,
        size,
        minPrice,
        maxPrice,
        category
    };

    console.log('Updated filters:', req.session.filters);
    res.status(200).json(req.session.filters);
});

function getFilters(req) {
    return req.session.filters || { brand: '', size: '', minPrice: 0, maxPrice: 1000, category: '' };
}

module.exports = router;
module.exports.getFilters = getFilters;
