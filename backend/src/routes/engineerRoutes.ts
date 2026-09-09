import { Router } from 'express';
import {
  getEngineers,
  getEngineerById,
  createEngineer,
  updateEngineer,
  deleteEngineer,
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
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'), createEngineer);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'), updateEngineer);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'), deleteEngineer);

export default router;
