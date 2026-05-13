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