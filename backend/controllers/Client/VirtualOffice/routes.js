import express from 'express';
import {
  createVirtualOfficeClient,
  getVirtualOfficeClientById,
  getUserVirtualOfficeClients,
  updateVirtualOfficeClient,
  deleteVirtualOfficeClient
} from './inquiryController.js';
import { authenticate } from '../../../middlewares/auth.js';

const router = express.Router();

// POST /api/client/virtual-office/inquiries - Create new inquiry
router.post('/inquiries', authenticate, createVirtualOfficeClient);

// GET /api/client/virtual-office/inquiries/:clientId - Get inquiry by ID
router.get('/inquiries/:clientId', authenticate, getVirtualOfficeClientById);

// GET /api/client/virtual-office/user/:userId/inquiries - Get user's inquiries
router.get('/user/:userId/inquiries', authenticate, getUserVirtualOfficeClients);

// PUT /api/client/virtual-office/inquiries/:clientId - Update inquiry
router.put('/inquiries/:clientId', authenticate, updateVirtualOfficeClient);

// DELETE /api/client/virtual-office/inquiries/:clientId - Delete inquiry
router.delete('/inquiries/:clientId', authenticate, deleteVirtualOfficeClient);

export default router;
