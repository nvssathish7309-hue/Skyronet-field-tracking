import { Router } from 'express';
import { getBikes, createBike, updateBike, assignBike } from '../controllers/bikeController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getBikes);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createBike);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateBike);
router.post('/:id/assign', authorize('SUPER_ADMIN', 'ADMIN'), assignBike);

export default router;
