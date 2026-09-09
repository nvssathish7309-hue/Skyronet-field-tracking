import { Router } from 'express';
import {
  getEngineers,
  getEngineerById,
  createEngineer,
  updateEngineer,
  updateMyProfile,
  updateLocation
} from '../controllers/engineerController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/location', updateLocation);
router.put('/profile', updateMyProfile);
router.get('/', getEngineers);
router.get('/:id', getEngineerById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createEngineer);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateEngineer);

export default router;
