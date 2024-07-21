const fs = require('fs');
const path = require('path');

let categories = {};

const categoriesPath = path.join(__dirname, '../data', 'categories.json');

if (fs.existsSync(categoriesPath)) {
    try {
        const fileContent = fs.readFileSync(categoriesPath, 'utf8');
        if (fileContent) {
            categories = JSON.parse(fileContent);
        } else {
            console.log('Categories file is empty. Initializing empty categories.');
        }
    } catch (error) {
        console.error('Error reading or parsing categories.json:', error);
    }
} else {
    console.log('Categories file does not exist. Initializing empty categories.');
}

function getCategoryIdByName(categoryName) {
    const category = Object.values(categories).find(cat => cat.title.toLowerCase() === categoryName.toLowerCase());
    return category ? category.id : null;
}

module.exports = {
    getCategoryIdByName
};