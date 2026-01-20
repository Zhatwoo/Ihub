import express from 'express';
import {
  getAllVirtualOfficeClients,
  getVirtualOfficeClientById,
  createVirtualOfficeClient,
  updateVirtualOfficeClient,
  deleteVirtualOfficeClient
} from '../controllers/virtualOfficeController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/virtual-office - Get all virtual office clients (admin only)
router.get('/', authenticate, isAdmin, getAllVirtualOfficeClients);

// GET /api/virtual-office/:clientId - Get virtual office client by ID (admin only)
router.get('/:clientId', authenticate, isAdmin, getVirtualOfficeClientById);

// POST /api/virtual-office - Create new virtual office client (admin only)
router.post('/', authenticate, isAdmin, createVirtualOfficeClient);

// PUT /api/virtual-office/:clientId - Update virtual office client (admin only)
router.put('/:clientId', authenticate, isAdmin, updateVirtualOfficeClient);

// DELETE /api/virtual-office/:clientId - Delete virtual office client (admin only)
router.delete('/:clientId', authenticate, isAdmin, deleteVirtualOfficeClient);

export default router;
