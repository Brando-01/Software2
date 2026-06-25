const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const loanRoutes = require('./routes/loanRoutes');
const supportRoutes = require('./routes/supportRoutes');

const ledgerRoutes = require('./routes/ledgerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const userRoutes = require('./routes/userRoutes');

const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', rateLimiter({ windowMs: 60000, max: 100 }));

app.use('/api/auth', authRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/support', supportRoutes);

app.use('/api/ledger', ledgerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/users', userRoutes);

app.use('/api', metricsRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

module.exports = app;
