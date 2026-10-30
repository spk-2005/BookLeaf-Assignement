import { Router } from 'express';
import { getAdminTickets, updateTicket, addInternalNote, regenerateAiDraft } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/tickets', getAdminTickets);
router.patch('/tickets/:id', updateTicket);
router.post('/tickets/:id/notes', addInternalNote);
router.post('/tickets/:id/regenerate-draft', regenerateAiDraft);

export default router;
