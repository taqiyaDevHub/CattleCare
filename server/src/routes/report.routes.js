import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { profitLossReport } from '../controllers/money.controller.js';

const router = Router();
router.use(auth);
router.get('/profit-loss', profitLossReport);
export default router;
