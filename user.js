const { loadHistory, saveHistory } = require('./utils/fileOperations'); // Ensure the path is correct
const UserManager = require('./managers/userManager'); // Access to UserManager

class User {
    constructor(chatId, firstName = '', lastName = '', username = '', plan = 'casual', banned = false, isAdmin = false) {
        this.chatId = chatId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.plan = plan;
        this.banned = banned;
        this.isAdmin = isAdmin; // New property to indicate if the user is an admin
        this.filters = [];
        this.interval = this.getPlanInterval(plan);
        this.ready = false;
        this.maxFilters = this.getPlanFilters(plan);
        this.maxCustomFilters = this.getPlanCustomFiltersNumber(plan);
        this.currentFilterIndex = 0;
        this.isSettingCustomPreset = false;
        this.customFilters = {}; // To store custom filters
    }

    // Check if the user is an admin
    isUserAdmin() {
        return this.isAdmin;
    }

    // Number of filters the user can use simultaneously
    getPlanFilters(plan = this.plan) {
        switch (plan) {
            case 'admin':
                return Infinity;
            case 'baron':
                return 3;
            case 'dealer':
                return 2;
            case 'casual':
            default:
                return 1;
        }
    }

    // Number of custom filters the user can save
    getPlanCustomFiltersNumber(plan = this.plan) {
        switch (plan) {
            case 'admin':
                return Infinity;
            case 'baron':
                return 4;
            case 'dealer':
                return 2;
            case 'casual':
            default:
                return 0;
        }
    }

    // Get custom filters
    getCustomFilters() {
        return this.customFilters;
    }

    // Interval for updates based on the user's plan
    getPlanInterval(plan = this.plan) {
        switch (plan) {
            case 'admin':
                return 0;
            case 'baron':
                return 3; // 3 seconds
            case 'dealer':
                return 7; // 7 seconds
            case 'casual':
            default:
                return 15; // 15 seconds
        }
    }

    // Change the user's plan
    setPlan(newPlan) {
        this.plan = newPlan;
        this.interval = this.getPlanInterval(newPlan);
        this.maxFilters = this.getPlanFilters(newPlan);
        this.maxCustomFilters = this.getPlanCustomFiltersNumber(newPlan);
    }

    // Check if the user is banned
    isBanned() {
        return this.banned;
    }

    // Manage active filters
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

    // Manage user history
    getHistory() {
        return loadHistory(this.chatId);
    }

    setHistory(history) {
        saveHistory(this.chatId, history);
    }

    // Reset filters
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

    getPlan() {
        return this.plan;
    }
}

module.exports = User;
