import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me } from './auth.controller.js';
import { loginSchema } from './auth.validation.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan masuk yang gagal. Silakan tunggu beberapa saat.',
  },
});

router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
