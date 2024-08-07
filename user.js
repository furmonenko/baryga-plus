const { loadHistory, saveHistory } = require('./utils/fileOperations');

class User {
    constructor(chatId) {
        this.chatId = chatId;
        this.filters = [];
        this.interval = 10;
        this.ready = false;
        this.maxFilters = 4;
        this.currentFilterIndex = 0;
    }

    setFilters(filters) {
        this.filters = filters;
    }

    getFilters() {
        return this.filters;
    }

    updateFilter(filter, index) {
        this.filters[index] = filter;
    }

    getInterval() {
        return this.interval;
    }

    setReady(isReady) {
        this.ready = isReady;
    }

    isReady() {
        return this.ready;
    }

    getHistory() {
        return loadHistory(this.chatId);
    }

    setHistory(history) {
        saveHistory(this.chatId, history);
    }

    resetFilters() {
        this.filters = [];
        this.currentFilterIndex = 0;
    }

    getCurrentFilterIndex() {
        return this.currentFilterIndex;
    }

    setCurrentFilterIndex(index) {
        this.currentFilterIndex = index;
    }

    setFilterCount(count) {
        this.maxFilters = count;
    }

    getFilterCount() {
        return this.maxFilters;
    }
}

module.exports = User;