import express from 'express';
import {
  getUserDeskRequest,
  updateDeskRequest,
  deleteDeskRequest
} from './deskRequestController.js';
import { authenticate } from '../../../middlewares/auth.js';

const router = express.Router();

// GET /api/client/dedicated-desk/:userId/requests - Get all user desk requests
router.get('/:userId/requests', authenticate, getUserDeskRequest);

// POST /api/client/dedicated-desk/:userId/request - Create new desk request
router.post('/:userId/request', authenticate, updateDeskRequest);

// DELETE /api/client/dedicated-desk/:userId/request/:requestId - Delete specific desk request
router.delete('/:userId/request/:requestId', authenticate, deleteDeskRequest);

export default router;
