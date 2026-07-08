const INotificationChannel = require('../interfaces/INotificationChannel');
//usando principios de clases
class InAppChannel extends INotificationChannel {
  get name() {
    return 'in_app';
  }

  async send(notification) {
    return { channel: 'in_app', delivered: true, userId: notification.userId };
  }
}
// Acá se modifica dentro de la app
//Se exporta todos los modulos para el InAppChannel
module.exports = InAppChannel;
