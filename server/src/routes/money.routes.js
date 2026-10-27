import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTransactionSchema, updateTransactionSchema } from '../validators/money.js';
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from '../controllers/money.controller.js';

const router = Router();
router.use(auth);
router.param('id', (req, res, next, id) => {
  if (!/^[a-f\d]{24}$/i.test(id)) return res.status(400).json({ ok: false, error: { code: 'INVALID_ID', message: 'Invalid transaction id' } });
  next();
});
router.get('/', listTransactions);
router.post('/', validate(createTransactionSchema), createTransaction);
router.put('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);
export default router;
