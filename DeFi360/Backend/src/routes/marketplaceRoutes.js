const express = require('express');
const {
  getOffers, createOffer, cancelOffer, getCacheStats, getPrices,
  getRecommendations, autoMatch
} = require('../controllers/marketplaceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/offers', getOffers);
router.get('/cache-stats', getCacheStats);
router.get('/prices', getPrices);
router.post('/offers', protect, createOffer);
router.delete('/offers/:id', protect, cancelOffer);

router.get('/recommendations', protect, getRecommendations);
router.post('/auto-match', protect, autoMatch);

module.exports = router;
