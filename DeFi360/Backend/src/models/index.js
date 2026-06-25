const User = require('./User');
const Wallet = require('./Wallet');
const Offer = require('./Offer');
const Loan = require('./Loan');
const Ticket = require('./Ticket');

const Liquidation = require('./Liquidation');
const LedgerEntry = require('./LedgerEntry');
const Notification = require('./Notification');
const LenderPreference = require('./LenderPreference');

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

Loan.hasMany(Liquidation, { foreignKey: 'loanId' });
Liquidation.belongsTo(Loan, { foreignKey: 'loanId' });

User.hasMany(LedgerEntry, { foreignKey: 'userId' });
LedgerEntry.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(LenderPreference, { foreignKey: 'lenderId', as: 'Preferences' });
LenderPreference.belongsTo(User, { foreignKey: 'lenderId', as: 'Lender' });

module.exports = {
  User,
  Wallet,
  Offer,
  Loan,
  Ticket,
  Liquidation,
  LedgerEntry,
  Notification,
  LenderPreference
};
