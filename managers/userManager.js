const fs = require('fs');
const path = require('path');
const User = require('../user');
const { sendLoggedMessage } = require('../utils/telegram');

class UserManager {
    constructor() {
        this.users = {};
        this.plans = {
            admins: new Set(),
            barons: new Set(),
            dealers: new Set(),
            casuals: new Set()
        };
        this.loadUserPlans();
        this.loadUsers();
    }

    addCustomFilter(chatId, name, filter) {
        const user = this.getUser(chatId);

        if (Object.keys(user.customFilters).length < user.maxCustomFilters) {
            user.customFilters[name] = filter;
            this.saveUsers(); // Зберігаємо кастомні фільтри разом з користувачами
            return true;
        }
        return false; // Кількість кастомних фільтрів перевищує ліміт
    }

    // Отримання плану користувача з файлу userPlans.json
    getPlanFromFile(chatId) {
        if (this.plans.admins.has(chatId)) {
            return 'admin';
        } else if (this.plans.barons.has(chatId)) {
            return 'baron';
        } else if (this.plans.dealers.has(chatId)) {
            return 'dealer';
        } else if (this.plans.casuals.has(chatId)) {
            return 'casual';
        }
        return null;
    }

    // Блокування користувача
    banUser(chatId) {
        const user = this.getUser(chatId);
        if (user) {
            user.banned = true;
            this.saveUsers(); // Зберігаємо користувача після блокування
        }
    }

    // Розблокування користувача
    unbanUser(chatId) {
        const user = this.getUser(chatId);
        if (user) {
            user.banned = false;
            this.saveUsers(); // Зберігаємо користувача після розблокування
        }
    }

    // Завантаження планів користувачів з файлу
    loadUserPlans() {
        const plansPath = path.join(__dirname, '../data/userPlans.json');
        if (fs.existsSync(plansPath)) {
            const data = fs.readFileSync(plansPath, 'utf8');
            const plansData = JSON.parse(data);
            this.plans.admins = new Set(plansData.admins || []);
            this.plans.barons = new Set(plansData.barons || []);
            this.plans.dealers = new Set(plansData.dealers || []);
            this.plans.casuals = new Set(plansData.casuals || []);
        }
    }

    // Збереження планів користувачів у файл
    saveUserPlans() {
        const plansPath = path.join(__dirname, '../data/userPlans.json');
        const data = {
            admins: Array.from(this.plans.admins),
            barons: Array.from(this.plans.barons),
            dealers: Array.from(this.plans.dealers),
            casuals: Array.from(this.plans.casuals)
        };
        fs.writeFileSync(plansPath, JSON.stringify(data, null, 2));
    }

// Завантаження користувачів з файлу
    loadUsers() {
        const usersPath = path.join(__dirname, '../data/users.json');
        if (fs.existsSync(usersPath)) {
            const data = fs.readFileSync(usersPath, 'utf8');
            const usersData = JSON.parse(data);
            // Створюємо об'єкти User на основі завантажених даних
            for (const [chatId, userData] of Object.entries(usersData)) {
                this.users[chatId] = new User(
                    userData.chatId,
                    userData.firstName,
                    userData.lastName,
                    userData.username,
                    userData.plan,
                    userData.banned,
                    userData.isAdmin // Load isAdmin status
                );
                this.users[chatId].customFilters = userData.customFilters || {};
            }
        }
    }


// Збереження всіх користувачів у файл
    saveUsers() {
        const usersPath = path.join(__dirname, '../data/users.json');
        const usersData = {};
        // Перетворюємо об'єкти User назад в прості об'єкти для збереження
        for (const [chatId, user] of Object.entries(this.users)) {
            usersData[chatId] = {
                chatId: user.chatId,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                plan: user.plan,
                banned: user.banned,
                isAdmin: user.isAdmin, // Save isAdmin status
                customFilters: user.customFilters
            };
        }
        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));
    }

    // Отримання користувача за chatId
    getUser(chatId) {
        return this.users[chatId];
    }

// Створення нового користувача
    createUser(chatId, firstName, lastName, username, isAdmin = false) {
        let plan = 'casual';

        if (this.plans.admins.has(chatId)) {
            plan = 'admin';
        } else if (this.plans.barons.has(chatId)) {
            plan = 'baron';
        } else if (this.plans.dealers.has(chatId)) {
            plan = 'dealer';
        } else {
            this.plans.casuals.add(chatId);
        }

        const user = new User(chatId, firstName, lastName, username, plan, false, isAdmin); // Add isAdmin parameter

        this.users[chatId] = user;
        this.saveUsers(); // Зберігаємо новий список користувачів
        this.saveUserPlans(); // Зберігаємо плани користувачів після зміни
        return user;
    }

    // Очищення кастомних фільтрів користувача
    clearCustomFilters(chatId) {
        const user = this.getUser(chatId);

        if (!user) {
            console.log(`User with chatId ${chatId} not found.`);
            return;
        }

        const presetCount = Object.keys(user.customFilters).length;
        user.customFilters = {}; // Очищення всіх кастомних фільтрів

        console.log(`Cleared ${presetCount} custom filters for user with chatId ${chatId}`);
        this.saveUsers(); // Зберігаємо оновлені дані користувачів після очищення кастомних фільтрів
    }

    // Встановлення плану користувача
    async setPlan(chatId, newPlan) {
        const user = this.getUser(chatId);

        if (!user) {
            console.log(`User with chatId ${chatId} not found.`);
            return;
        }

        const oldPlan = user.getPlan();
        const oldPresetCount = Object.keys(user.getCustomFilters()).length;
        const oldSearchSpeed = user.getPlanInterval(oldPlan); // Lower value = higher speed

        // Конвертуємо chatId у число (в разі, якщо він зберігається як рядок)
        const numericChatId = Number(chatId);

        // Видаляємо користувача з усіх інших списків
        this.plans.admins.delete(numericChatId);
        this.plans.barons.delete(numericChatId);
        this.plans.dealers.delete(numericChatId);
        this.plans.casuals.delete(numericChatId);

        // Додаємо користувача до відповідного списку
        switch (newPlan) {
            case 'admin':
                this.plans.admins.add(numericChatId);
                break;
            case 'baron':
                this.plans.barons.add(numericChatId);
                break;
            case 'dealer':
                this.plans.dealers.add(numericChatId);
                break;
            case 'casual':
            default:
                this.plans.casuals.add(numericChatId);
                newPlan = 'casual';
                break;
        }

        // Оновлюємо план користувача
        user.setPlan(newPlan);

        // Оновлюємо відповідні властивості на основі нового плану
        user.interval = user.getPlanInterval(newPlan); // Оновлення інтервалу
        user.maxFilters = user.getPlanFilters(newPlan); // Оновлення максимальної кількості фільтрів
        user.maxCustomFilters = user.getPlanCustomFiltersNumber(newPlan); // Оновлення максимальної кількості кастомних фільтрів

        // Очищаємо кастомні фільтри та активні фільтри
        this.clearCustomFilters(numericChatId); // Очищення кастомних пресетів
        user.resetFilters(); // Скидання активних фільтрів

        // Зупиняємо активний пошук
        user.setReady(false);

        this.saveUsers(); // Save changes
        this.saveUserPlans(); // Save user plans

        const newActiveFiltersLimit = user.getPlanFilters();
        const newPresetLimit = user.getPlanCustomFiltersNumber(); // Отримуємо новий ліміт пресетів на основі нового плану
        const newSearchSpeed = user.getPlanInterval();

        // Повідомлення користувачу про зміну плану
        let message = `Your plan has been changed from *${oldPlan}* to *${newPlan}*.\n\n`;

        message += `As a result:\n`;
        message += `1. You can now search up to *${newActiveFiltersLimit}* filters at a time.\n\n`;
        message += `2. You can now create up to *${newPresetLimit}* custom presets.\n`;

        // Повідомлення про зміну швидкості пошуку
        if (newSearchSpeed < oldSearchSpeed) {
            message += `3. Your search speed has *increased* (faster).\n`;
        } else if (newSearchSpeed > oldSearchSpeed) {
            message += `3. Your search speed has *decreased* (slower).\n`;
        } else {
            message += `3. Your search speed remains the same.\n\n`;
        }

        message += `Your active search has been stopped.\n`;
        message += `Your custom presets have been cleared (You had ${oldPresetCount} presets).\n`;
        message += `Your active filters have been reset.\n\n`;

        message += `Thank you for using our service!`;

        await sendLoggedMessage(chatId, message, { parse_mode: 'Markdown' });
    }



    // Перевірка, чи користувач є адміном
    isAdmin(chatId) {
        const user = this.getUser(chatId);

        if (!user) {
            return false;
        }

        return user.isUserAdmin();
    }

    // Перевірка, чи користувач заблокований
    isUserBanned(chatId) {
        const user = this.getUser(chatId);
        return user ? user.isBanned() : false;
    }

    // Отримання всіх користувачів
    getAllUsers() {
        return Object.values(this.users);
    }

    // Збереження кастомних фільтрів для користувача
    saveCustomFilters(chatId) {
        this.saveUsers(); // Використовуємо загальну функцію збереження користувачів
    }
}



const userManagerInstance = new UserManager();
Object.freeze(userManagerInstance);

module.exports = userManagerInstance;
