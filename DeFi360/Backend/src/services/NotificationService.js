const IRiskObserver = require('../interfaces/IRiskObserver');
const InAppChannel = require('../channels/InAppChannel');
const EmailChannel = require('../channels/EmailChannel');
const { Notification } = require('../models');

class NotificationService extends IRiskObserver {
  constructor(model = Notification, channels = null) {
    super();
    this.model = model;
    this.inApp = new InAppChannel();
    this.email = new EmailChannel();

    this.channels = channels || [this.inApp];
  }

    async onRiskEvent(event) {
    if (event.type !== 'RISK_ALERT_HIGH' && event.type !== 'RISK_ALERT_CRITICAL') {
      return null;
    }

    const title = event.type === 'RISK_ALERT_CRITICAL'
      ? 'Alerta crítica: liquidación inminente'
      : 'Alerta de riesgo alto';
    const message = `Préstamo #${event.loanId} con LTV ${event.ltv}%.`;

    const created = [];
    const recipients = [event.borrowerId, event.lenderId].filter((id) => id != null);
    for (const userId of recipients) {
      const n = await this.notify(userId, event.type, title, message);
      if (n) created.push(n);
    }
    return created;
  }

    async notify(userId, type, title, message, options = {}) {
    if (userId == null) return null;

    const channelName = options.channel || 'in_app';
    const channel = channelName === 'email' ? this.email : this.inApp;

    await channel.send({ userId, type, title, message });

    return this.model.create({
      userId,
      type,
      channel: channel.name,
      title,
      message,
      read: false
    });
  }

    async getForUser(userId, onlyUnread = false) {
    const where = { userId };
    if (onlyUnread) where.read = false;
    return this.model.findAll({ where, order: [['createdAt', 'DESC']] });
  }

    async markAsRead(id, userId) {
    const [affected] = await this.model.update(
      { read: true },
      { where: { id, userId } }
    );
    return affected;
  }

    async markAllAsRead(userId) {
    const [affected] = await this.model.update(
      { read: true },
      { where: { userId, read: false } }
    );
    return affected;
  }
}

module.exports = NotificationService;
