import express from 'express';
import { 
  sendRegistrationOTP, 
  verifyOTPAndRegister, 
  login, 
  resendOTP,
  getProfile 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/send-otp', sendRegistrationOTP);
router.post('/verify-otp-register', verifyOTPAndRegister);
router.post('/login', login);
router.post('/resend-otp', resendOTP);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

export default router;
