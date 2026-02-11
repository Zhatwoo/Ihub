import express from 'express';
import { authenticate } from '../middlewares/auth.js';

// Import client controllers
import {
  createTicket,
  getUserTickets,
  getTicketById,
  addClientReply,
  getTicketReplies
} from '../controllers/Client/Tickets/ticketsController.js';
import { getCurrentUserProfile } from '../controllers/Client/Profile/profileController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Profile routes
router.get('/profile/me', getCurrentUserProfile);

// Ticket routes
router.post('/tickets/create', createTicket);
router.get('/tickets/user/:userId', getUserTickets);
router.get('/tickets/:ticketId', getTicketById);
router.post('/tickets/:ticketId/reply', addClientReply);
router.get('/tickets/:ticketId/replies', getTicketReplies);

export default router;
