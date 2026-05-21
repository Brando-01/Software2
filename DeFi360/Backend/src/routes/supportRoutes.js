const express = require('express');
const { createTicket, getUserTickets, getTicketById } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/tickets', protect, createTicket);
router.get('/tickets', protect, getUserTickets);
router.get('/tickets/:id', protect, getTicketById);

module.exports = router;