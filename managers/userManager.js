const User = require('../user');

class UserManager {
    constructor() {
        if (!UserManager.instance) {
            this.users = {};
            UserManager.instance = this;
        }

        return UserManager.instance;
    }

    getUser(chatId) {
        return this.users[chatId];
    }

    createUser(chatId) {
        const user = new User(chatId);
        this.users[chatId] = user;
        return user;
    }

    removeUser(chatId) {
        delete this.users[chatId];
    }

    getAllUsers() {
        return Object.values(this.users);
    }
}

const instance = new UserManager();
Object.freeze(instance);

module.exports = instance;
