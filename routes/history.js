const express = require('express');
const router = express.Router();
const { getHistory, saveHistory, deleteHistoryItem, saveDeletedItems } = require('../services/fetchData');

router.get('/', (req, res) => {
    res.json(getHistory());
});

router.post('/', (req, res) => {
    const newItem = req.body;
    const history = getHistory();
    if (!history.some(item => item.productId === newItem.productId)) {
        history.unshift(newItem);
        saveHistory(history);
        res.status(201).json(newItem);
    } else {
        res.status(409).json({ message: 'Item already exists in history' });
    }
});

router.delete('/:productId', (req, res) => {
    const productId = parseInt(req.params.productId, 10);
    const updatedHistory = deleteHistoryItem(productId);
    saveHistory(updatedHistory);
    res.sendStatus(200);
});

module.exports = router;
