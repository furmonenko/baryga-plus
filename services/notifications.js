const apn = require('@parse/node-apn');
const { apnConfig } = require('../config/apnConfig');

async function sendNotification(item, deviceToken) {
    if (!deviceToken) {
        return;
    }

    const apnProvider = new apn.Provider(apnConfig);

    let notification = new apn.Notification();
    notification.topic = 'furmonenko.ServerTest';
    notification.expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    notification.sound = 'default';
    notification.alert = `New ${item.brand} item: ${item.title} - ${item.price.totalAmount} ${item.price.currency}`;
    notification.payload = { url: item.url };

    try {
        const result = await apnProvider.send(notification, deviceToken);
        console.log('Notification result:', result);
        apnProvider.shutdown();
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

module.exports = {
    sendNotification
};
