const { loadHistory, saveHistory } = require('./utils/fileOperations');

class User {
    constructor(chatId, firstName = '', lastName = '', username = '', plan = 'casual', banned = false) {
        this.chatId = chatId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.plan = plan;
        this.banned = banned; // Поле для збереження статусу бану
        this.filters = [];
        this.interval = this.getPlanInterval(plan);
        this.ready = false;
        this.maxFilters = this.getPlanFilters(plan);
        this.currentFilterIndex = 0;
    }

    getPlanFilters(plan) {
        switch (plan) {
            case 'admin':
                return 4;
            case 'baron':
                return 3;
            case 'dealer':
                return 2;
            case 'casual':
            default:
                return 1;
        }
    }

    getPlanInterval(plan) {
        switch (plan) {
            case 'admin':
                return 0; // Instant update for admin
            case 'baron':
                return 5;
            case 'dealer':
                return 10;
            case 'casual':
            default:
                return 15;
        }
    }

    setPlan(newPlan) {
        this.plan = newPlan;
        this.interval = this.getPlanInterval(newPlan);
        this.maxFilters = this.getPlanFilters(newPlan);
    }

    ban() {
        this.banned = true;
    }

    unban() {
        this.banned = false;
    }

    isBanned() {
        return this.banned;
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