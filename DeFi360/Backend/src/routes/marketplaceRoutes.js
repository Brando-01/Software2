const express = require('express');
const { getOffers, createOffer, cancelOffer } = require('../controllers/marketplaceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/offers', getOffers);
router.post('/offers', protect, createOffer);
router.delete('/offers/:id', protect, cancelOffer);

module.exports = router;