const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Wallet } = require('../models');

const SALT_ROUNDS = 10;
const WELCOME_BALANCE = 5000;

class AuthService {
  issueToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
  }

  async register({ name, email, password }) {
    if (!email || !password) {
      throw new Error('Correo y contraseña son obligatorios');
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new Error('Ya existe una cuenta registrada con ese correo');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      passwordHash,
      lastLogin: new Date()
    });

    await Wallet.create({
      userId: user.id,
      totalBalance: WELCOME_BALANCE,
      availableBalance: WELCOME_BALANCE,
      blockedBalance: 0,
      totalEarned: 0
    });

    return user;
  }

  async login({ email, password }) {
    const user = await User.findOne({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new Error('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Credenciales inválidas');
    }

    await user.update({ lastLogin: new Date() });
    return user;
  }
}

module.exports = new AuthService();
