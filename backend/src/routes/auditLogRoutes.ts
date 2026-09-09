import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'), getAuditLogs);

export default router;
