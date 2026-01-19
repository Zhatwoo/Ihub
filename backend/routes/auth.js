// Authentication routes
import express from 'express';
import { login, signup, getCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/signup
router.post('/signup', signup);

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authenticate, getCurrentUser);

export default router;
