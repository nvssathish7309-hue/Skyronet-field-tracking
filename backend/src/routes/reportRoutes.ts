import { Router } from 'express';
import { getDashboardStats, getTravelReports, exportCSV } from '../controllers/reportController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/travel', getTravelReports);
router.get('/export-csv', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'), exportCSV);

export default router;
