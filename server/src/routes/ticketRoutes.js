import { Router } from 'express';
import { getAuthorTickets, createTicket, getTicketById, postMessage } from '../controllers/ticketController.js';
import { requireAuth, requireAuthor } from '../middleware/authMiddleware.js';

const router = Router();

// General ticket routes requiring authentication
router.get('/my-tickets', requireAuth, requireAuthor, getAuthorTickets);
router.post('/', requireAuth, requireAuthor, createTicket);
router.get('/:id', requireAuth, getTicketById);
router.post('/:id/messages', requireAuth, postMessage);

export default router;
