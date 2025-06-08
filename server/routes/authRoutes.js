// import express from 'express';
// import { isAuthenticated, login, logout, register, resetPassword, sendResetOtp, sendVerifyOtp, verifyEmail } from '../controllers/authController.js';
// import userAuth from '../middleware/userAuth.js';

// const authRouter = express.Router();

// authRouter.post('/register', register);
// authRouter.post('/login', login);
// authRouter.post('/logout', logout);
// authRouter.post('/verify-otp', userAuth, sendVerifyOtp);
// authRouter.post('/verify-account', userAuth, verifyEmail);
// authRouter.get('/is-auth', userAuth, isAuthenticated);
// authRouter.post('/api/send-reset-otp', sendResetOtp);
// authRouter.post('/reset-password', resetPassword);



// export default authRouter;
import express from 'express';
import {
  isAuthenticated,
  login,
  logout,
  register,
  resetPassword,
  sendResetOtp,
  sendVerifyOtp,
  verifyEmail,
  verifyResetOtp
  
} from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

// Registration and Verification Flow
authRouter.post('/register', register);
authRouter.post('/verify-email', verifyEmail); // Changed from verify-account
authRouter.post('/resend-otp', sendVerifyOtp); // For resending OTP

// Authentication
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/is-auth', userAuth, isAuthenticated);

// Password Reset
authRouter.post('/send-reset-otp', sendResetOtp); // Removed /api prefix for consistency
authRouter.post('/reset-password', resetPassword);
// Add this to your authRoutes.js
authRouter.post('/verify-reset-otp', verifyResetOtp);



export default authRouter;