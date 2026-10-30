import { Router } from 'express';
import { sseService } from '../services/sseService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/stream', requireAuth, (req, res) => {
  sseService.subscribe(req, res);
});

export default router;
