const jwt = require('jsonwebtoken');
const { User, Wallet } = require('../models');
const MockWalletConnectorImpl = require('../services/MockWalletConnectorImpl');

// Instancia por defecto del conector de wallet
const defaultWalletConnector = new MockWalletConnectorImpl();

// Generar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

/**
 * Conectar wallet (autenticación Web3)
 * SOLID: DIP - El controlador depende de la abstracción IWalletConnector
 * no de la implementación concreta (MockWalletConnectorImpl)
 * 
 * @param {IWalletConnector} walletConnector - Abstracción inyectada (mock para tests, real para producción)
 */
const connectWallet = (walletConnector = defaultWalletConnector) => async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: 'Dirección de wallet requerida' });
    }

    // Usar la abstracción inyectada para validar la wallet
    try {
      await walletConnector.connect(walletAddress);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    let user = await User.findOne({ where: { walletAddress } });
    let isNewUser = false;

    if (!user) {
      // Crear nuevo usuario
      user = await User.create({
        walletAddress,
        lastLogin: new Date()
      });
      
      // Crear wallet para el usuario
      await Wallet.create({
        userId: user.id,
        totalBalance: 5000, // Bonus simulado para nuevos usuarios
        availableBalance: 5000,
        blockedBalance: 0,
        totalEarned: 0
      });
      
      isNewUser = true;
    } else {
      // Actualizar último login
      await user.update({ lastLogin: new Date() });
    }

    const token = generateToken(user.id);
    
    const wallet = await Wallet.findOne({ where: { userId: user.id } });

    res.status(200).json({
      success: true,
      isNewUser,
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
        wallet: {
          totalBalance: wallet.totalBalance,
          availableBalance: wallet.availableBalance,
          blockedBalance: wallet.blockedBalance,
          totalEarned: wallet.totalEarned
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al conectar wallet', error: error.message });
  }
};

// @desc    Obtener perfil del usuario
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
    
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });

    res.json({
      user,
      wallet
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

module.exports = { 
  connectWallet: connectWallet(),
  connectWalletFactory: connectWallet,
  getProfile 
};