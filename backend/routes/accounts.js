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
// import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Client users routes
// GET /api/accounts/client/users - Get all client users
router.get('/client/users', getAllClientUsers);

// GET /api/accounts/client/users/:userId
router.get('/client/users/:userId', getClientUser);

// Admin users routes
// GET /api/accounts/admin/users/:userId
router.get('/admin/users/:userId', getAdminUser);

// POST /api/accounts/admin/users - Create admin user
router.post('/admin/users', createAdminUser); // Add authenticate, isAdmin middleware later

// PUT /api/accounts/admin/users/:userId
router.put('/admin/users/:userId', updateAdminUser); // Add authenticate middleware later

// Desk requests routes
// GET /api/accounts/desk-requests - Get all desk requests
router.get('/desk-requests', getAllDeskRequests);

// GET /api/accounts/client/users/:userId/request/desk - Get user desk request
router.get('/client/users/:userId/request/desk', getUserDeskRequest);

// PUT /api/accounts/client/users/:userId/request/desk - Update desk request
router.put('/client/users/:userId/request/desk', updateDeskRequest);

// DELETE /api/accounts/client/users/:userId/request/desk - Delete desk request
router.delete('/client/users/:userId/request/desk', deleteDeskRequest);

export default router;
