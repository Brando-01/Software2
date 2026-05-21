const { Ticket } = require('../models');

// @desc    Crear ticket de soporte
// @route   POST /api/support/tickets
const createTicket = async (req, res) => {
  try {
    const { subject, description, priority } = req.body;
    
    if (!subject || !description) {
      return res.status(400).json({ message: 'Asunto y descripción son requeridos' });
    }
    
    const ticketNumber = 'TKT-' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
    
    const ticket = await Ticket.create({
      userId: req.user.id,
      ticketNumber,
      subject,
      description,
      priority: priority || 'medium',
      status: 'open'
    });
    
    res.status(201).json({
      success: true,
      ticketNumber: ticket.ticketNumber,
      ticket
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear ticket' });
  }
};

// @desc    Obtener tickets del usuario
// @route   GET /api/support/tickets
const getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tickets' });
  }
};

// @desc    Obtener detalles de un ticket
// @route   GET /api/support/tickets/:id
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }
    
    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ticket' });
  }
};

module.exports = { createTicket, getUserTickets, getTicketById };