const fs = require('fs');
const path = require('path');

let categories = {};

const categoriesPath = path.join(__dirname, '../data', 'categories.json');

// Load categories from the JSON file
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

/**
 * Retrieves the category ID by its name.
 * @param {string} categoryName - The name of the category.
 * @returns {string|null} - The ID of the category or an empty string if not found.
 */
function getCategoryIdByName(categoryName) {
    if (typeof categoryName !== 'string') {
        console.error('Invalid category name type:', typeof categoryName);
        return "";
    }

    const category = Object.values(categories).find(cat => cat.title.toLowerCase() === categoryName.toLowerCase());
    if (category) {
        return category.id;
    } else {
        console.warn(`Category name not found: ${categoryName}`);
        return "";
    }
}

/**
 * Retrieves the category name by its ID.
 * @param {string} categoryId - The ID of the category.
 * @returns {string|null} - The name of the category or an empty string if not found.
 */
function getCategoryNameById(categoryId) {
    const category = categories[categoryId];
    if (category) {
        return category.title;
    } else {
        console.warn(`Category ID not found: ${categoryId}`);
        return "";
    }
}

module.exports = {
    getCategoryIdByName,
    getCategoryNameById
};
