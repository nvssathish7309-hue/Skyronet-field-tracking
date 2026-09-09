import { Router } from 'express';
import {
  getExpenses,
  getExpenseById,
  approveExpense,
  rejectExpense
} from '../controllers/expenseController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.post('/:id/approve', authorize('SUPER_ADMIN', 'ACCOUNTS'), approveExpense);
router.post('/:id/reject', authorize('SUPER_ADMIN', 'ACCOUNTS'), rejectExpense);

export default router;
