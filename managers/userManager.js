const fs = require('fs');
const path = require('path'); // Додайте цей рядок
const User = require('../user.js');  // Впевніться, що шлях правильний

class UserManager {
    constructor() {
        this.users = {};
        this.admins = new Set();
        this.loadUsers();
    }

    loadUsers() {
        const usersPath = path.join(__dirname, '../data/users.json');
        if (fs.existsSync(usersPath)) {
            const data = fs.readFileSync(usersPath, 'utf8');
            const usersData = JSON.parse(data);
            this.users = usersData.users || {};
            this.admins = new Set(usersData.admins || []);
        }
    }

    saveUsers() {
        const usersPath = path.join(__dirname, '../data/users.json');
        const data = {
            users: this.users,
            admins: Array.from(this.admins),
        };
        fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
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
        const user = new User(chatId, firstName, lastName, username);

        if (Object.keys(this.users).length === 0) {
            user.setPlan('admin');
            this.admins.add(chatId);
            console.log(`User with chatId ${chatId} has been set as admin automatically.`);
        }

        this.users[chatId] = user;
        this.saveUsers();
        return user;
    }

    getAllUsers() {
        return Object.values(this.users);
    }

    setAdmin(chatId) {
        this.admins.add(chatId);
        const user = this.getUser(chatId);
        if (user) {
            user.setPlan('admin');
        }
        this.saveUsers();
        console.log(`User with chatId ${chatId} has been set as admin.`);
    }

    removeAdmin(chatId) {
        this.admins.delete(chatId);
        const user = this.getUser(chatId);
        if (user) {
            user.setPlan('casual');
        }
        this.saveUsers();
        console.log(`User with chatId ${chatId} is no longer an admin.`);
    }

    isAdmin(chatId) {
        return this.admins.has(chatId);
    }

    isUserBanned(chatId) {
        const user = this.getUser(chatId);
        return user ? user.isBanned() : false;
    }
}

// Створення та експорт єдиного екземпляра UserManager
const userManagerInstance = new UserManager();
Object.freeze(userManagerInstance);

module.exports = userManagerInstance;
