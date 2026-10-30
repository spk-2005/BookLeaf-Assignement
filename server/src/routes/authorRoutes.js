import { Router } from 'express';
import { getAuthorBooks, getAuthorDashboard } from '../controllers/authorController.js';
import { requireAuth, requireAuthor } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, requireAuthor);

router.get('/books', getAuthorBooks);
router.get('/dashboard', getAuthorDashboard);

export default router;
