import express from 'express';
import {
  getAllClientUsers,
  getClientUser,
  getAdminUser,
  createAdminUser,
  updateAdminUser,
  getAllDeskRequests,
  getUserDeskRequest,
  updateDeskRequest,
  deleteDeskRequest
} from '../controllers/accountsController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Client users routes
// GET /api/accounts/client/users - Get all client users (admin only)
router.get('/client/users', authenticate, isAdmin, getAllClientUsers);

// GET /api/accounts/client/users/:userId (authenticated)
router.get('/client/users/:userId', authenticate, getClientUser);

// Admin users routes
// GET /api/accounts/admin/users/:userId (authenticated)
router.get('/admin/users/:userId', authenticate, getAdminUser);

// POST /api/accounts/admin/users - Create admin user (admin only)
router.post('/admin/users', authenticate, isAdmin, createAdminUser);

// PUT /api/accounts/admin/users/:userId (admin only)
router.put('/admin/users/:userId', authenticate, isAdmin, updateAdminUser);

// Desk requests routes
// GET /api/accounts/desk-requests - Get all desk requests (admin only)
router.get('/desk-requests', authenticate, isAdmin, getAllDeskRequests);

// GET /api/accounts/client/users/:userId/request/desk - Get user desk request (authenticated)
router.get('/client/users/:userId/request/desk', authenticate, getUserDeskRequest);

// PUT /api/accounts/client/users/:userId/request/desk - Update desk request (authenticated)
router.put('/client/users/:userId/request/desk', authenticate, updateDeskRequest);

// DELETE /api/accounts/client/users/:userId/request/desk - Delete desk request (authenticated)
router.delete('/client/users/:userId/request/desk', authenticate, deleteDeskRequest);

export default router;
