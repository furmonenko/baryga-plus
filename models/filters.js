class Filters {
    constructor(brand = null, size = [], minPrice = 0, maxPrice = null, category = 'Men') {
        this.brand = brand;
        this.size = size;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.category = category;
    }
}

module.exports = Filters;