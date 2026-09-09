import { Router } from 'express';
import { login, getMe, logout, registerEngineer, updateProfile } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', registerEngineer);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

export default router;

