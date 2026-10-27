import { Router } from 'express';
import { options, check } from '../controllers/symptom.controller.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { symptomCheckSchema } from '../validators/symptom.js';

const router = Router();

router.use(auth);

router.get('/options', options);
router.post('/check', validate(symptomCheckSchema), check);

export default router;
