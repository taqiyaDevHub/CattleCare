import { Router } from 'express';
import { schedule } from '../controllers/vaccine.controller.js';
import { auth } from '../middleware/auth.js';
import { AppError } from '../utils/appError.js';

const router = Router();

router.use(auth);

router.param('animalId', (req, res, next, id) => {
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return next(new AppError(400, 'INVALID_ID', 'Invalid animal id'));
  }
  next();
});

router.get('/schedule/:animalId', schedule);

export default router;
