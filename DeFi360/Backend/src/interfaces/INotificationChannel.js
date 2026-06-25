class INotificationChannel {
    get name() {
    throw new Error('INotificationChannel.name debe ser implementado');
  }

    async send(notification) {
    throw new Error('INotificationChannel.send() debe ser implementado');
  }
}

module.exports = INotificationChannel;
