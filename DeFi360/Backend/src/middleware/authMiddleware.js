const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;

  console.log('Headers recibidos:', req.headers); // ✅ Para debug

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extraído:', token);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decodificado:', decoded);
      
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      });
      
      if (!req.user) {
        console.log('Usuario no encontrado');
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }
      
      console.log('Usuario autenticado:', req.user.id);
      next();
    } catch (error) {
      console.error('Error verificando token:', error.message);
      return res.status(401).json({ message: 'No autorizado, token inválido' });
    }
  } else {
    console.log('No hay authorization header o no es Bearer');
    console.log('Authorization header:', req.headers.authorization);
  }

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, no hay token' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: se requieren privilegios de administrador' });
  }

  next();
};

module.exports = { protect, adminOnly };