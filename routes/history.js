const express = require('express');
const router = express.Router();
const { loadHistory, saveHistory, deleteHistoryItem } = require('../utils/fileOperations');

router.get('/', (req, res) => {
    const history = loadHistory(req.sessionID);
    res.json(history);
});

router.post('/', (req, res) => {
    const newItem = req.body;
    const history = loadHistory(req.sessionID);
    if (!history.some(item => item.productId === newItem.productId)) {
        history.unshift(newItem);
        saveHistory(req.sessionID, history);
        res.status(201).json(newItem);
    } else {
        res.status(409).json({ message: 'Item already exists in history' });
    }
});

router.delete('/:productId', (req, res) => {
    const productId = parseInt(req.params.productId, 10);
    const updatedHistory = deleteHistoryItem(req.sessionID, productId);
    saveHistory(req.sessionID, updatedHistory);
    res.sendStatus(200);
});

module.exports = router;
