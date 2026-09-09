import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getSettings);
router.put('/', authorize('SUPER_ADMIN', 'ADMIN'), updateSettings);

export default router;
