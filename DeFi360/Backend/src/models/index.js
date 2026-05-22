const User = require('./User');
const Wallet = require('./Wallet');
const Offer = require('./Offer');
const Loan = require('./Loan');
const Ticket = require('./Ticket');

// Definir relaciones
User.hasOne(Wallet, { foreignKey: 'userId' });
Wallet.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Offer, { foreignKey: 'userId' });
Offer.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Loan, { foreignKey: 'lenderId', as: 'LentLoans' });
User.hasMany(Loan, { foreignKey: 'borrowerId', as: 'BorrowedLoans' });
Loan.belongsTo(User, { foreignKey: 'lenderId', as: 'Lender' });
Loan.belongsTo(User, { foreignKey: 'borrowerId', as: 'Borrower' });
Loan.belongsTo(Offer, { foreignKey: 'offerId' });

User.hasMany(Ticket, { foreignKey: 'userId' });
Ticket.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Wallet,
  Offer,
  Loan,
  Ticket
};