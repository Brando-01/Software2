const { User, Wallet } = require('../models');
const MockWalletConnectorImpl = require('../services/MockWalletConnectorImpl');
const authService = require('../services/AuthService');

const defaultWalletConnector = new MockWalletConnectorImpl();

const buildSession = (user, wallet, token, extra = {}) => ({
  success: true,
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    walletAddress: user.walletAddress,
    role: user.role,
    wallet: wallet && {
      totalBalance: wallet.totalBalance,
      availableBalance: wallet.availableBalance,
      blockedBalance: wallet.blockedBalance,
      totalEarned: wallet.totalEarned
    }
  },
  ...extra
});

// HU-01 — Autenticación Web3. El controlador depende de la abstracción
// IWalletConnector (DIP); en producción se inyecta el conector real y en
// pruebas un mock.
const connectWallet = (walletConnector = defaultWalletConnector) => async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: 'Dirección de wallet requerida' });
    }

    try {
      await walletConnector.connect(walletAddress);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    let user = await User.findOne({ where: { walletAddress } });
    let isNewUser = false;

    if (!user) {
      user = await User.create({ walletAddress, lastLogin: new Date() });
      await Wallet.create({
        userId: user.id,
        totalBalance: 5000,
        availableBalance: 5000,
        blockedBalance: 0,
        totalEarned: 0
      });
      isNewUser = true;
    } else {
      await user.update({ lastLogin: new Date() });
    }

    const wallet = await Wallet.findOne({ where: { userId: user.id } });
    const token = authService.issueToken(user.id);

    res.status(200).json(buildSession(user, wallet, token, { isNewUser }));
  } catch (error) {
    console.error('[connectWallet]', error.message);
    res.status(500).json({ message: 'Error al conectar wallet', error: error.message });
  }
};

// Login tradicional por correo/contraseña, complementario al acceso Web3.
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await authService.register({ name, email, password });
    const wallet = await Wallet.findOne({ where: { userId: user.id } });
    const token = authService.issueToken(user.id);

    res.status(201).json(buildSession(user, wallet, token, { isNewUser: true }));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login({ email, password });
    const wallet = await Wallet.findOne({ where: { userId: user.id } });
    const token = authService.issueToken(user.id);

    res.status(200).json(buildSession(user, wallet, token));
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['createdAt', 'updatedAt', 'passwordHash'] }
    });
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });

    res.json({ user, wallet });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

module.exports = {
  connectWallet: connectWallet(),
  register,
  login,
  getProfile,
  _factories: { connectWallet }
};
