import { Router } from 'express';
import { startTrip, stopTrip, getTrips, getTripById } from '../controllers/tripController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/start', startTrip);
router.post('/:id/stop', stopTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);

export default router;
