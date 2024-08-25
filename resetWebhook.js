// Використовуйте динамічний імпорт для node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config(); // Завантаження змінних середовища з файлу .env

const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const NGROK_URL = 'https://barygabot.com'; // Додайте ваш NGROK URL до .env файлу
// Функція для видалення вебхука
async function deleteWebhook() {
    const response = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
        method: 'POST'
    });
    const data = await response.json();
    console.log('Delete Webhook:', data);
    return data;
}

// Функція для отримання оновлень (очищення черги повідомлень)
async function getUpdates() {
    const response = await fetch(`${TELEGRAM_API_URL}/getUpdates`, {
        method: 'GET'
    });
    const data = await response.json();
    console.log('Get Updates:', data);
    return data;
}

// Функція для налаштування нового вебхука
async function setWebhook() {
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `${NGROK_URL}/telegram/webhook` })
    });
    const data = await response.json();
    console.log('Set Webhook:', data);
    return data;
}

// Головна функція для виконання всіх кроків
async function resetWebhook() {
    await deleteWebhook();
    await getUpdates();
    await setWebhook();
}

// Виконання головної функції
resetWebhook().catch(console.error);
