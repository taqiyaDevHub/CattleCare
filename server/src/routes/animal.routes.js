import { Router } from 'express';
import { list, getOne, create, update, archive, sell } from '../controllers/animal.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../utils/appError.js';
import { createAnimalSchema, updateAnimalSchema, sellSchema } from '../validators/animal.js';

const router = Router();

router.use(auth);

router.param('id', (req, res, next, id) => {
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return next(new AppError(400, 'INVALID_ID', 'Invalid animal id'));
  }
  next();
});

router.get('/', list);
router.post('/', validate(createAnimalSchema), create);
router.get('/:id', getOne);
router.put('/:id', validate(updateAnimalSchema), update);
router.patch('/:id/archive', archive);
router.post('/:id/sell', validate(sellSchema), sell);

export default router;