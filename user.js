const {loadHistory, saveHistory} = require("./utils/fileOperations");

class User {
    constructor(chatId) {
        this.chatId = chatId;
        this.filters = {
            brand: null,
            size: [],
            minPrice: 0,
            maxPrice: null,
            category: 'Men'
        };
        this.interval = 10;
        this.ready = false;
    }

    setFilters(filters) {
        this.filters = filters;
    }

    getFilters() {
        return this.filters;
    }

    setInterval(interval) {
        this.interval = interval;
    }

    getInterval() {
        return this.interval;
    }

    setReady(isReady) {
        this.ready = isReady;
    }

    getHistory() {
        return loadHistory(this.chatId);
    }

    setHistory(history) {
        saveHistory(this.chatId, history);
    }

    isReady() {
        return this.ready;
    }

    resetFilters() {
        this.filters = {
            brand: null,
            size: [],
            minPrice: 0,
            maxPrice: null,
            category: 'Men'
        };
    }
}

module.exports = User;
