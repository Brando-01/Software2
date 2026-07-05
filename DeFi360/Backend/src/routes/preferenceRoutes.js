const express = require('express');
const { savePreferences, getPreferences } = require('../controllers/preferenceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, savePreferences);
router.get('/', protect, getPreferences);

module.exports = router;
