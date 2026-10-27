import { Router } from 'express';
import { updateMe } from '../controllers/user.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema } from '../validators/auth.js';

const router = Router();

router.patch('/me', auth, validate(updateMeSchema), updateMe);

export default router;