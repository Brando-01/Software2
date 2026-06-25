const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Loan = sequelize.define('Loan', {
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
  borrowerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'borrower_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  offerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'offer_id',
    references: {
      model: 'offers',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  apy: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  rateType: {
    type: DataTypes.ENUM('fixed', 'variable'),
    defaultValue: 'fixed',
    field: 'rate_type'
  },
  baseApy: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'base_apy'
  },
  rateAdjustmentPeriod: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'rate_adjustment_period'
  },
  nextRateAdjustmentDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'next_rate_adjustment_date'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ltv: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Loan-to-Value ratio'
  },
  remainingBalance: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false,
    field: 'remaining_balance'
  },
  status: {
    type: DataTypes.ENUM('active', 'paid', 'defaulted', 'liquidated'),
    defaultValue: 'active'
  },
  liquidationDate: {

    type: DataTypes.DATE,
    allowNull: true,
    field: 'liquidation_date'
  },
  startDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATE,
    field: 'end_date'
  }
}, {
  tableName: 'loans',
  timestamps: true,
  underscored: true
});

module.exports = Loan;