class Filters {
    constructor(brand = [], size = [], minPrice = 0, maxPrice = null, category = 'Men', keywords = []) {
        this.brand = Array.isArray(brand) ? brand : [brand]; // Підтримка кількох брендів
        this.size = size;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.category = category;
        this.keywords = keywords; // Додано поле для ключових слів
    }

    // Метод для додавання нового бренду
    addBrand(newBrand) {
        if (!this.brand.includes(newBrand)) {
            this.brand.push(newBrand);
        }
    }

    // Метод для додавання ключового слова
    addKeyword(keyword) {
        if (!this.keywords.includes(keyword)) {
            this.keywords.push(keyword);
        }
    }
}

module.exports = Filters;
