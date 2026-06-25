const INotificationChannel = require('../interfaces/INotificationChannel');

class InAppChannel extends INotificationChannel {
  get name() {
    return 'in_app';
  }

  async send(notification) {
    return { channel: 'in_app', delivered: true, userId: notification.userId };
  }
}

module.exports = InAppChannel;
