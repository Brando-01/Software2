const INotificationChannel = require('../interfaces/INotificationChannel');

class EmailChannel extends INotificationChannel {
  constructor() {
    super();
    this.sent = [];
  }

  get name() {
    return 'email';
  }

  async send(notification) {
    const record = {
      channel: 'email',
      to: notification.userId,
      subject: notification.title,
      body: notification.message,
      sentAt: new Date()
    };
    this.sent.push(record);
    console.log(`[EmailChannel][SIMULADO] -> user ${notification.userId}: ${notification.title}`);
    return { channel: 'email', delivered: true, simulated: true };
  }
}

module.exports = EmailChannel;
