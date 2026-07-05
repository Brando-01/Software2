const jwt = require('jsonwebtoken');

function equal(actual, expected, msg) {
  if (actual !== expected) throw new Error(msg || `Esperado ${expected} pero fue ${actual}`);
}
function ok(val, msg) {
  if (!val) throw new Error(msg || 'El valor no es verdadero o está indefinido');
}

const mockUserStore = new Map();
const mockWalletStore = new Map();
let userId = 1;

class MockWalletConnector {
  constructor(validWallets = []) {
    this.validWallets = validWallets;
    this.connected = new Set();
  }
  validate(addr) {
    return addr && typeof addr === 'string' && this.validWallets.includes(addr);
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
    const user = { id, ...data };
    mockUserStore.set(data.walletAddress, user);
    return user;
  }
};

const Wallet = {
  findOne: async ({ where }) => mockWalletStore.get(where.userId) || null,
  create: async (data) => {
    const wallet = { id: Math.floor(Math.random() * 1000), ...data };
    mockWalletStore.set(data.userId, wallet);
    return wallet;
  }
};

const genToken = (id) => jwt.sign({ id }, 'secret', { expiresIn: '7d' });

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
    if (!user) {
      user = await User.create({ walletAddress, role: 'user' });
      await Wallet.create({ userId: user.id, balance: 5000 });
    }

    connector.connect(walletAddress);
    const token = genToken(user.id);

    res.status(200).json({ success: true, token });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
};

describe('Autenticación Web3', () => {
  let connector;
  let handler;

  beforeEach(() => {
    mockUserStore.clear();
    mockWalletStore.clear();
    userId = 1;

    connector = new MockWalletConnector([
      '0x1234567890abcdef1234567890abcdef12345678'
    ]);
    handler = connectWalletHandler(connector);
  });

  test('Flujo: Conexión exitosa', async () => {
    const req = { body: { walletAddress: '0x1234567890abcdef1234567890abcdef12345678' } };
    let respData, statusCode;

    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { respData = data; }
    };

    await handler(req, res);

    equal(statusCode, 200);
    equal(respData.success, true);
    ok(respData.token, 'Debe generar un token JWT');
  });

  test('Flujo: Wallet inválida rechazada', async () => {
    const req = { body: { walletAddress: '0xFALSA' } };
    let respData, statusCode;

    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { respData = data; }
    };

    await handler(req, res);

    equal(statusCode, 400);
    equal(respData.message, 'Invalid wallet');
  });

  test('Flujo: Sesión duplicada bloqueada (409)', async () => {
    const req = { body: { walletAddress: '0x1234567890abcdef1234567890abcdef12345678' } };

    const res1 = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.respData = data; }
    };

    await handler(req, res1);
    equal(res1.statusCode, 200);

    const res2 = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.respData = data; }
    };

    await handler(req, res2);
    equal(res2.statusCode, 409);
    equal(res2.respData.isDuplicate, true);
  });
});