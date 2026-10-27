import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../utils/appError.js';
import { createBreedingSchema, breedingQuerySchema, breedingOutcomeSchema } from '../validators/member3.js';
import { listBreeding, breedingAlerts, getBreeding, createBreeding, updateBreedingOutcome } from '../controllers/member3.controller.js';
const router = Router();
// Validated query is stored in req.parsedQuery (assigning to req.query crashes on Express 5).
const parseQuery = (schema) => (req, res, next) => { try { req.parsedQuery = schema.parse(req.query); next(); } catch (e) { next(e); } };
router.use(auth);
router.param('id', (req, res, next, id) => /^[a-f\d]{24}$/i.test(id) ? next() : next(new AppError(400, 'INVALID_ID', 'Invalid breeding id')));
router.get('/', parseQuery(breedingQuerySchema), listBreeding);
router.post('/', validate(createBreedingSchema), createBreeding);
router.get('/alerts', breedingAlerts);
router.get('/:id', getBreeding);
router.patch('/:id/outcome', validate(breedingOutcomeSchema), updateBreedingOutcome);
export default router;
