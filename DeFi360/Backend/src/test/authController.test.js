const jwt = require('jsonwebtoken');

// ---Mocks---
const mockUserStore = new Map();
const mockWalletStore = new Map();
let userId = 1;
let walletId = 1;

class MockWalletConnector {
  constructor(valid = []) {
    this.valid = valid;
    this.connected = new Set();
  }
  validate(addr) {
    return addr && typeof addr === 'string' && this.valid.includes(addr);
  }
  isConnected(addr) {
    return this.connected.has(addr);
  }
  connect(addr) {
    this.connected.add(addr);
  }
}

const User = {
  findOne: async ({ where }) => mockUserStore.get(where.walletAddress) || null,
  create: async (data) => {
    const id = userId++;
    const user = { id, ...data, createdAt: new Date() };
    mockUserStore.set(data.walletAddress, user);
    return user;
  }
};

const Wallet = {
  findOne: async ({ where }) => mockWalletStore.get(where.userId) || null,
  create: async (data) => {
    const id = walletId++;
    const wallet = { id, ...data };
    mockWalletStore.set(data.userId, wallet);
    return wallet;
  }
};

const genToken = (id) => jwt.sign({ id }, 'secret', { expiresIn: '7d' });

// ---CONTROLADORES DE RUTAS---

const connectWalletHandler = (connector) => async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet required' });
    }
    
    if (!connector.validate(walletAddress)) {
      return res.status(400).json({ message: 'Invalid wallet' });
    }
    
    if (connector.isConnected(walletAddress)) {
      return res.status(409).json({ message: 'Already connected', isDuplicate: true });
    }
    
    let user = await User.findOne({ where: { walletAddress } });
    let isNew = false;
    
    if (!user) {
      user = await User.create({ walletAddress, lastLogin: new Date(), role: 'user' });
      await Wallet.create({
        userId: user.id,
        balance: 5000,
        available: 5000,
        blocked: 0
      });
      isNew = true;
    } else {
      user.lastLogin = new Date(); 
    }
    
    connector.connect(walletAddress);
    const token = genToken(user.id);
    const wallet = await Wallet.findOne({ where: { userId: user.id } });
    
    res.status(200).json({
      success: true,
      isNewUser: isNew,
      token,
      user: {
        id: user.id,
        walletAddress,
        role: user.role,
        wallet: {
          balance: wallet.balance,
          available: wallet.available,
          blocked: wallet.blocked
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

const getProfileHandler = async (req, res) => {
  try {
    const userArray = Array.from(mockUserStore.values());
    const user = userArray.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    res.json({ user, wallet });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
};

// ---PRUEBAS MANUALES---
async function probarCodigo() {
  console.log("Iniciando pruebas manuales...\n");

  const connector = new MockWalletConnector([
    '0x1234567890abcdef1234567890abcdef12345678'
  ]);
  
  let respuestaFinal;
  const req = { 
    body: { walletAddress: '0x1234567890abcdef1234567890abcdef12345678' } 
  };
  const res = {
    status: function(code) { 
      this.code = code; 
      return this; 
    },
    json: function(data) { 
      respuestaFinal = { codigo: this.code, data: data }; 
      return this; 
    }
  };

  console.log("Prueba 1: Intentando conectar una wallet válida...");
  const conectar = connectWalletHandler(connector);
  await conectar(req, res);

  if (respuestaFinal.codigo === 200 && respuestaFinal.data.isNewUser === true) {
    console.log("✅ Éxito: El usuario nuevo se conectó correctamente.");
  } else {
    console.log("❌ Falló: Algo salió mal con el usuario nuevo.", respuestaFinal);
  }

  console.log("\nPrueba 2: Intentando conectar la misma wallet otra vez...");
  await conectar(req, res);

  if (respuestaFinal.codigo === 409) {
    console.log("✅ Éxito: El sistema detectó la sesión duplicada (Error 409).");
  } else {
    console.log("❌ Falló: El sistema no detectó el duplicado.", respuestaFinal);
  }
}

probarCodigo();

module.exports = { connectWalletHandler, getProfileHandler, MockWalletConnector };
