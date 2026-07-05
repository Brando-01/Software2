const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Liquidation = sequelize.define('Liquidation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  loanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'loan_id',
    references: {
      model: 'loans',
      key: 'id'
    }
  },
  ltvAtLiquidation: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'ltv_at_liquidation'
  },
  collateralSeized: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false,
    field: 'collateral_seized'
  },
  amountRecovered: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false,
    field: 'amount_recovered'
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'liquidations',
  timestamps: true,

  updatedAt: false,
  underscored: true
});

module.exports = Liquidation;
