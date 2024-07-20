const fs = require('fs');

function getDeletedItems() {
    let deletedItems = [];
    if (fs.existsSync('data/deletedItems.json')) {
        try {
            const fileContent = fs.readFileSync('data/deletedItems.json', 'utf8');
            if (fileContent) {
                deletedItems = JSON.parse(fileContent);
            } else {
                console.log('Deleted items file is empty. Initializing empty list.');
            }
        } catch (error) {
            console.error('Error reading or parsing deletedItems.json:', error);
        }
    } else {
        console.log('Deleted items file does not exist. Initializing empty list.');
    }
    return deletedItems;
}

module.exports = {
    getDeletedItems
};
