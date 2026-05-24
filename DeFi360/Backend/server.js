require('dotenv').config();
console.log(process.env.JWT_SECRET);
const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/database');
const { User, Wallet, Offer, Loan, Ticket } = require('./src/models');

const PORT = process.env.PORT || 3000;

// Sincronizar modelos con la base de datos
const syncDatabase = async () => {
  try {
    await testConnection();
    
    // Sincronizar todos los modelos (force: false para no borrar datos)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados con la base de datos');
    
    // Crear usuario admin por defecto si no existe
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🔧 Servidor iniciado en modo ${process.env.NODE_ENV || 'development'}`);
  syncDatabase();
});