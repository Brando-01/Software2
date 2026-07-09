const INotificationChannel = require('../interfaces/INotificationChannel');
//Aplicamos lo aprendido en clase
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
// acá se simula la notificación del email
//Tendría que darte una notificación tipo alerta
module.exports = EmailChannel;
