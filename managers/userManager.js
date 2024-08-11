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

    banUser(chatID) {
        let user = this.getUser(chatID)
        user.banned = true
    }

    unbanUser(chatID) {
        let user = this.getUser(chatID)
        user.banned = false
    }

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

    loadUsers() {
        const usersPath = path.join(__dirname, '../data/users.json');
        if (fs.existsSync(usersPath)) {
            const data = fs.readFileSync(usersPath, 'utf8');
            const usersData = JSON.parse(data);
            this.users = usersData || {};
        }
    }

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

    saveUsers() {
        const usersPath = path.join(__dirname, '../data/users.json');
        fs.writeFileSync(usersPath, JSON.stringify(this.users, null, 2));
    }

    getUser(chatId) {
        let user = this.users[chatId];
        if (user) {
            if (!(user instanceof User)) {
                user = new User(
                    user.chatId,
                    user.firstName,
                    user.lastName,
                    user.username,
                    user.plan,
                    user.banned
                );
                this.users[chatId] = user;
            }
        }
        return user;
    }

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
        this.saveUsers();
        this.saveUserPlans(); // Зберігаємо плани користувачів після зміни
        return user;
    }

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
            this.users[chatId] = user;
        }

        this.saveUsers();
        this.saveUserPlans();
        console.log(`User with chatId ${chatId} has been set to plan ${plan}.`);
    }

    isAdmin(chatId) {
        return this.plans.admins.has(chatId);
    }

    isUserBanned(chatId) {
        const user = this.getUser(chatId);
        return user ? user.isBanned() : false;
    }

    getAllUsers() {
        return Object.values(this.users);
    }
}

const userManagerInstance = new UserManager();
Object.freeze(userManagerInstance);

module.exports = userManagerInstance;
