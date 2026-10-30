import { Router } from 'express';
import { login, getMe, getDemoAccounts } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.get('/demo-accounts', getDemoAccounts);

export default router;
