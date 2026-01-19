import express from 'express';
import {
  getAllVirtualOfficeClients,
  getVirtualOfficeClientById,
  createVirtualOfficeClient,
  updateVirtualOfficeClient,
  deleteVirtualOfficeClient
} from '../controllers/virtualOfficeController.js';
// import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/virtual-office - Get all virtual office clients
router.get('/', getAllVirtualOfficeClients);

// GET /api/virtual-office/:clientId - Get virtual office client by ID
router.get('/:clientId', getVirtualOfficeClientById);

// POST /api/virtual-office - Create new virtual office client (admin only)
router.post('/', createVirtualOfficeClient); // Add authenticate, isAdmin middleware later

// PUT /api/virtual-office/:clientId - Update virtual office client (admin only)
router.put('/:clientId', updateVirtualOfficeClient); // Add authenticate, isAdmin middleware later

// DELETE /api/virtual-office/:clientId - Delete virtual office client (admin only)
router.delete('/:clientId', deleteVirtualOfficeClient); // Add authenticate, isAdmin middleware later

export default router;
