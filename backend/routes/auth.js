// Authentication routes
import express from 'express';
import { login, signup, getCurrentUser, logout } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/logout - Clear authentication cookies
router.post('/logout', logout);

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticate, getCurrentUser);

export default router;
