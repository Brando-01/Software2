const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Wallet = sequelize.define('Wallet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  totalBalance: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0,
    field: 'total_balance'
  },
  availableBalance: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0,
    field: 'available_balance'
  },
  blockedBalance: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0,
    field: 'blocked_balance'
  },
  totalEarned: {
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0,
    field: 'total_earned'
  }
}, {
  tableName: 'wallets',
  timestamps: true,
  underscored: true
});

module.exports = Wallet;