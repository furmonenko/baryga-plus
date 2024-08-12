const fs = require('fs');
const path = require('path');
const User = require('../user');

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
            user.unban();
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
                    userData.banned
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
    createUser(chatId, firstName, lastName, username) {
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

        const user = new User(chatId, firstName, lastName, username, plan);

        this.users[chatId] = user;
        this.saveUsers(); // Зберігаємо новий список користувачів
        this.saveUserPlans(); // Зберігаємо плани користувачів після зміни
        return user;
    }

    // Встановлення плану користувача
    setPlan(chatId, plan) {
        // Видаляємо користувача з усіх інших списків
        this.plans.admins.delete(chatId);
        this.plans.barons.delete(chatId);
        this.plans.dealers.delete(chatId);
        this.plans.casuals.delete(chatId);

        // Додаємо користувача до відповідного списку
        switch (plan) {
            case 'admin':
                this.plans.admins.add(chatId);
                break;
            case 'baron':
                this.plans.barons.add(chatId);
                break;
            case 'dealer':
                this.plans.dealers.add(chatId);
                break;
            case 'casual':
            default:
                this.plans.casuals.add(chatId);
                plan = 'casual';
                break;
        }

        const user = this.getUser(chatId);
        if (user) {
            user.setPlan(plan);
        }

        this.saveUsers(); // Зберігаємо зміни користувачів
        this.saveUserPlans(); // Зберігаємо плани користувачів після зміни
        console.log(`User with chatId ${chatId} has been set to plan ${plan}.`);
    }

    // Перевірка, чи користувач є адміном
    isAdmin(chatId) {
        return this.plans.admins.has(chatId);
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
