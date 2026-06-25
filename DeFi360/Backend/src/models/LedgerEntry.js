const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LedgerEntry = sequelize.define('LedgerEntry', {
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
  type: {
    type: DataTypes.ENUM('DISBURSEMENT', 'PAYMENT', 'LIQUIDATION', 'LOCK', 'RELEASE'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  balanceAfter: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false,
    field: 'balance_after'
  },
  refType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'ref_type'
  },
  refId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'ref_id'
  }
}, {
  tableName: 'ledger_entries',
  timestamps: true,

  updatedAt: false,
  underscored: true,
  indexes: [
    { name: 'idx_ledger_user_created', fields: ['user_id', 'created_at'] }
  ]
});

module.exports = LedgerEntry;
