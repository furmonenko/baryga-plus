const { loadHistory, saveHistory } = require('./utils/fileOperations'); // Впевніться, що шлях правильний
const UserManager = require('./managers/userManager'); // Для доступу до UserManager

class User {
    constructor(chatId, firstName = '', lastName = '', username = '', plan = 'casual', banned = false) {
        this.chatId = chatId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.plan = plan;
        this.banned = banned;
        this.filters = [];
        this.interval = this.getPlanInterval(plan);
        this.ready = false;
        this.maxFilters = this.getPlanFilters(plan);
        this.maxCustomFilters = this.getPlanCustomFiltersNumber(plan);
        this.currentFilterIndex = 0;
        this.customFilters = {}; // Для зберігання кастомних фільтрів
    }

    // Кількість фільтрів, які можна використовувати одночасно
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

    // Кількість кастомних фільтрів, які можна зберігати
    getPlanCustomFiltersNumber(plan) {
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

    // Отримання кастомних фільтрів
    getCustomFilters() {
        return this.customFilters;
    }

    // Інтервал оновлення в залежності від плану
    getPlanInterval(plan) {
        switch (plan) {
            case 'admin':
                return 0; // Миттєве оновлення для admin
            case 'baron':
                return 5; // 5 секунд
            case 'dealer':
                return 10; // 10 секунд
            case 'casual':
            default:
                return 15; // 15 секунд
        }
    }

    // Зміна плану
    setPlan(newPlan) {
        this.plan = newPlan;
        this.interval = this.getPlanInterval(newPlan);
        this.maxFilters = this.getPlanFilters(newPlan);
        this.maxCustomFilters = this.getPlanCustomFiltersNumber(newPlan);
    }

    // Перевірка, чи заблокований користувач
    isBanned() {
        return this.banned;
    }

    // Робота з активними фільтрами
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

    // Робота з історією користувача
    getHistory() {
        return loadHistory(this.chatId);
    }

    setHistory(history) {
        saveHistory(this.chatId, history);
    }

    // Скидання фільтрів
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
