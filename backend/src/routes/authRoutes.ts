import { Router } from 'express';
import { login, getMe, logout, registerEngineer } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', registerEngineer);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;

