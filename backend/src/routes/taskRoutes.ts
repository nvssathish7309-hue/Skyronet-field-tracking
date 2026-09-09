import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  assignTask,
  updateTaskStatus,
  uploadTaskPhotos
} from '../controllers/taskController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createTask);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'), updateTask);
router.post('/:id/assign', authorize('SUPER_ADMIN', 'ADMIN'), assignTask);
router.put('/:id/status', updateTaskStatus);
router.post('/:id/photos', upload.array('photos', 5), uploadTaskPhotos);

export default router;

