const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Offer = sequelize.define('Offer', {
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
    type: DataTypes.ENUM('lend', 'borrow'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  apy: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Annual Percentage Yield'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duración en días'
  },
  collateralType: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'collateral_type'
  },
  collateralAmount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'collateral_amount'
  },
  status: {
    type: DataTypes.ENUM('active', 'matched', 'cancelled', 'completed'),
    defaultValue: 'active'
  },
  matchedWith: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'matched_with'
  }
}, {
  tableName: 'offers',
  timestamps: true,
  underscored: true
});

module.exports = Offer;