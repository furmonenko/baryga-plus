const { fetchBrandId } = require('../services/brands');
const { getCategoryIdByName } = require('../services/categories');
const { setUserFilters, getUserFilters, setUserInterval, getUserInterval, setUserReady} = require('../userFilters');
const { setTimer, clearTimer } = require('../timerManager');
const { sendTelegramMessage } = require('../utils/telegram');
const {updateCacheForUser} = require("../cron/updateCache");

async function applyPresetFilters(chatId, preset) {
    // Очищення існуючого інтервалу
    clearTimer(chatId);

    // Встановлення користувача як не готового до пошуку
    setUserReady(chatId, false);

    // Розпаковка пресету
    const { brandName, size, minPrice, maxPrice, categoryName } = preset;

    // Отримання ID бренду
    const brandId = await fetchBrandId(brandName);
    if (!brandId) {
        await sendTelegramMessage(chatId, `Invalid brand name: ${brandName}`);
        return;
    }

    // Отримання ID категорії
    const categoryId = getCategoryIdByName(categoryName);
    if (!categoryId) {
        await sendTelegramMessage(chatId, `Invalid category name: ${categoryName}`);
        return;
    }

    // Налаштування фільтрів
    const filters = {
        brand: brandId,
        size: size.split(',').map(s => s.trim()), // Розбиваємо розміри на масив
        minPrice: minPrice,
        maxPrice: maxPrice,
        category: categoryId
    };

    // Збереження фільтрів користувача
    setUserFilters(chatId, filters);
    await sendTelegramMessage(chatId, 'Filters have been set.');

    // Встановлення користувача як готового до пошуку
    setUserReady(chatId, true);

    // Встановлення інтервалу фетчу
    setTimer(chatId, getUserInterval(chatId), updateCacheForUser);
}

module.exports = {
    applyPresetFilters
};
