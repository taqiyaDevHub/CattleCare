import { Router } from 'express';
import { list, create, markDone, update, remove } from '../controllers/health.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../utils/appError.js';
import { createHealthSchema, doneSchema, updateHealthSchema } from '../validators/health.js';

const router = Router();

router.use(auth);

router.param('id', (req, res, next, id) => {
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return next(new AppError(400, 'INVALID_ID', 'Invalid health record id'));
  }
  next();
});

router.get('/', list);
router.post('/', validate(createHealthSchema), create);
router.patch('/:id/done', validate(doneSchema), markDone);
router.put('/:id', validate(updateHealthSchema), update);
router.delete('/:id', remove);

export default router;
