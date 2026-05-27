const jwt = require('jsonwebtoken');

function equal(a, b, msg) {
  if (a !== b) throw new Error(msg || `${b} !== ${a}`);
}

function ok(val, msg) {
  if (!val) throw new Error(msg || 'Not ok');
}

// Mock de wallet
class IWalletConnector {
  validate(addr) {
    throw new Error('implement');
  }
  isConnected(addr) {
    throw new Error('implement');
  }
}

class MockWalletConnector extends IWalletConnector {
  constructor(valid = []) {
    super();
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

// Mocks simples
const mockUserStore = new Map();
const mockWalletStore = new Map();
let userId = 1;

const User = {
  findOne: async ({ where }) => {
    return mockUserStore.get(where.walletAddress) || null;
  },
  create: async (data) => {
    const id = userId++;
    const user = { id, ...data, createdAt: new Date() };
    mockUserStore.set(data.walletAddress, user);
    return user;
  }
};

const Wallet = {
  findOne: async ({ where }) => {
    return mockWalletStore.get(where.userId) || null;
  },
  create: async (data) => {
    const wallet = { id: Math.random(), ...data };
    mockWalletStore.set(data.userId, wallet);
    return wallet;
  }
};

const genToken = (id) => jwt.sign({ id }, 'secret', { expiresIn: '7d' });

const _factories = {
  connectWallet: (connector) => {
    return async (req, res) => {
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
          await user.update({ lastLogin: new Date() });
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
  },
  
  getProfile: () => {
    return async (req, res) => {
      try {
        const user = await User.findOne({ where: { id: req.user.id } });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
        res.json({ user, wallet });
      } catch (err) {
        res.status(500).json({ message: 'Error' });
      }
    };
  }
};

describe('Auth - Connect Wallet', () => {
  let connector;
  let handler;

  beforeEach(() => {
    mockUserStore.clear();
    mockWalletStore.clear();
    userId = 1;
    
    connector = new MockWalletConnector([
      '0x1234567890abcdef1234567890abcdef12345678',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    ]);
    handler = _factories.connectWallet(connector);
  });

  test('Usuario nuevo con wallet válida', async () => {
    const req = { body: { walletAddress: '0x1234567890abcdef1234567890abcdef12345678' } };
    let resp;
    const res = {
      status: function(code) { this.code = code; return this; },
      json: function(data) { resp = data; return this; }
    };

    await handler(req, res);

    equal(res.code, 200);
    equal(resp.success, true);
    equal(resp.isNewUser, true);
    ok(resp.token);
  });

  test('Usuario existente se conecta', async () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    await User.create({ walletAddress: addr, lastLogin: new Date(), role: 'user' });
    await Wallet.create({ userId: 1, balance: 5000, available: 5000, blocked: 0 });

    const req = { body: { walletAddress: addr } };
    let resp;
    const res = {
      status: function(code) { this.code = code; return this; },
      json: function(data) { resp = data; return this; }
    };

    await handler(req, res);

    equal(res.code, 200);
    equal(resp.isNewUser, false);
  });

  test('Wallet vacía rechazada', async () => {
    const req = { body: { walletAddress: null } };
    let resp;
    const res = {
      status: function(code) { this.code = code; return this; },
      json: function(data) { resp = data; return this; }
    };

    await handler(req, res);

    equal(res.code, 400);
  });

  test('Wallet inválida rechazada', async () => {
    const req = { body: { walletAddress: '0xinvalid' } };
    let resp;
    const res = {
      status: function(code) { this.code = code; return this; },
      json: function(data) { resp = data; return this; }
    };

    await handler(req, res);

    equal(res.code, 400);
  });

  test('Sesión duplicada - 409', async () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678';
    
    let req = { body: { walletAddress: addr } };
    let resp;
    const res = {
      status: function(code) { this.code = code; return this; },
      json: function(data) { resp = data; return this; }
    };

    await handler(req, res);
    equal(res.code, 200);

    req = { body: { walletAddress: addr } };
    resp = null;
    await handler(req, res);

    equal(res.code, 409);
    equal(resp.isDuplicate, true);
  });
});

describe('Auth - Get Profile', () => {
  let handler;

  beforeEach(() => {
    mockUserStore.clear();
    mockWalletStore.clear();
    userId = 1;
    handler = _factories.getProfile();
  });

  test('Obtener perfil de usuario existente', async () => {
    const user = await User.create({ walletAddress: '0x123', lastLogin: new Date(), role: 'user' });
    await Wallet.create({ userId: user.id, balance: 5000, available: 4500, blocked: 500 });

    const req = { user: { id: user.id } };
    let resp;
    const res = {
      json: function(data) { resp = data; return this; },
      status: function() { return this; }
    };

    await handler(req, res);

    equal(resp.user.id, user.id);
    equal(resp.wallet.available, 4500);
  });

  test('Usuario no encontrado - 404', async () => {
    const req = { user: { id: 999 } };
    let resp;
    const res = {
      status: function(code) { this.code = code; return this; },
      json: function(data) { resp = data; return this; }
    };

    await handler(req, res);

    equal(res.code, 404);
  });
});

module.exports = { _factories, IWalletConnector, MockWalletConnector };
