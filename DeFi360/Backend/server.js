const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/database');

const {
  User, Wallet, Offer, Loan, Ticket,
  Liquidation, LedgerEntry, Notification, LenderPreference
} = require('./src/models');

require('./src/services/riskWiring');

const PORT = process.env.PORT || 3000;


const syncDatabase = async () => {
  try {
    await testConnection();


    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados con la base de datos');


    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      const admin = await User.create({
        walletAddress: '0xadmin123456789defi360',
        email: 'admin@defi360.com',
        name: 'Administrador',
        role: 'admin'
      });

      await Wallet.create({
        userId: admin.id,
        totalBalance: 100000,
        availableBalance: 100000,
        blockedBalance: 0,
        totalEarned: 0
      });

      console.log('✅ Usuario admin creado');
    }

    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  } catch (error) {
    console.error('❌ Error al sincronizar base de datos:', error);
  }
};


app.listen(PORT, () => {
  console.log(`🔧 Servidor iniciado en modo ${process.env.NODE_ENV || 'development'}`);
  syncDatabase();
});