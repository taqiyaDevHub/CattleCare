import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../utils/appError.js';
import { bulkMilkSchema, milkDateQuerySchema, milkTrendQuerySchema, updateMilkSchema } from '../validators/member3.js';
import { listMilk, bulkMilk, getMilkTrend, updateMilk, deleteMilk, milkAlerts } from '../controllers/member3.controller.js';
const router = Router();
// Validated query is stored in req.parsedQuery (assigning to req.query crashes on Express 5).
const parseQuery = (schema) => (req, res, next) => { try { req.parsedQuery = schema.parse(req.query); next(); } catch (e) { next(e); } };
router.use(auth);
router.param('id', (req, res, next, id) => /^[a-f\d]{24}$/i.test(id) ? next() : next(new AppError(400, 'INVALID_ID', 'Invalid id')));
router.get('/', parseQuery(milkDateQuerySchema), listMilk);
router.post('/bulk', validate(bulkMilkSchema), bulkMilk);
router.get('/alerts', milkAlerts);
router.get('/trend/:animalId', parseQuery(milkTrendQuerySchema), getMilkTrend);
router.put('/:id', validate(updateMilkSchema), updateMilk);
router.delete('/:id', deleteMilk);
export default router;
