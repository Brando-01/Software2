const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado, no hay token.' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['createdAt', 'updatedAt', 'passwordHash'] }
    });

    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'No autorizado, token inválido' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autorizado, no hay sesión' });
  }

  if (!roles.includes(req.user.role)) {
    console.warn(
      `[RBAC] 403 — userId=${req.user.id} role='${req.user.role}' ` +
      `intentó acceder a ${req.method} ${req.originalUrl}; requiere [${roles.join(', ')}]`
    );
    return res.status(403).json({ message: 'Acceso denegado: rol insuficiente' });
  }

  return next();
};

const adminOnly = authorize('admin');

module.exports = { protect, authorize, adminOnly };
