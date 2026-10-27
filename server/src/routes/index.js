import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import animalRoutes from './animal.routes.js';
import moneyRoutes from './money.routes.js';
import reportRoutes from './report.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import healthRoutes from './health.routes.js';
import vaccineRoutes from './vaccine.routes.js';
import symptomRoutes from './symptom.routes.js';
import milkRoutes from './milk.routes.js';
import breedingRoutes from './breeding.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/animals', animalRoutes);
router.use('/transactions', moneyRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/health', healthRoutes);
router.use('/vaccines', vaccineRoutes);
router.use('/symptoms', symptomRoutes);
router.use('/milk', milkRoutes);
router.use('/breeding', breedingRoutes);

export default router;
