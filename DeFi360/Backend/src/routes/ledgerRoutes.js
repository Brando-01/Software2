const express = require('express');
const { getLedger, getStatement } = require('../controllers/ledgerController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getLedger);
router.get('/statement', protect, getStatement);

module.exports = router;
