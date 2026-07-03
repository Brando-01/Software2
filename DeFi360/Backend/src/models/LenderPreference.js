const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LenderPreference = sequelize.define('LenderPreference', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lenderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'lender_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  maxAmount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'max_amount'
  },
  minApy: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'min_apy'
  },
  collateralTypes: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'collateral_types'
  },
  maxLtv: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'max_ltv'
  },
  minCreditScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'min_credit_score'
  },
  autoMatch: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false, 
    field: 'auto_match'
  }
}, {
  tableName: 'lender_preferences',
  timestamps: true,
  underscored: true
});

module.exports = LenderPreference;
