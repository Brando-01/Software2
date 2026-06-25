const { notificationService } = require('../services/riskWiring');

const getNotifications = (service = notificationService) => async (req, res) => {
  try {
    const onlyUnread = req.query.unread === 'true';
    const notifications = await service.getForUser(req.user.id, onlyUnread);
    res.json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    console.error('[getNotifications]', error.message);
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};

const markRead = (service = notificationService) => async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const affected = await service.markAsRead(id, req.user.id);
    if (!affected) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    res.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('[markRead]', error.message);
    res.status(500).json({ message: 'Error al marcar la notificación' });
  }
};

const markAllRead = (service = notificationService) => async (req, res) => {
  try {
    const affected = await service.markAllAsRead(req.user.id);
    res.json({ success: true, updated: affected });
  } catch (error) {
    console.error('[markAllRead]', error.message);
    res.status(500).json({ message: 'Error al marcar las notificaciones' });
  }
};

module.exports = {
  getNotifications: getNotifications(),
  markRead: markRead(),
  markAllRead: markAllRead(),
  _factories: { getNotifications, markRead, markAllRead }
};
