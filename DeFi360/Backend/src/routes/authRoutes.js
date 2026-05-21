const express = require('express');
const { connectWallet, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/connect-wallet', connectWallet);
router.get('/profile', protect, getProfile);

module.exports = router;