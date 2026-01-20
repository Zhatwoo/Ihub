import express from 'express';
import { authenticate, isAdmin } from '../middlewares/auth.js';
import {
  getAllFloors,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor
} from '../controllers/floorsController.js';

const router = express.Router();

// GET /api/floors - Get all floors (public)
router.get('/', getAllFloors);

// GET /api/floors/:floorId - Get floor by ID (public)
router.get('/:floorId', getFloorById);

// POST /api/floors - Create new floor (admin only)
router.post('/', authenticate, isAdmin, createFloor);

// PUT /api/floors/:floorId - Update floor (admin only)
router.put('/:floorId', authenticate, isAdmin, updateFloor);

// DELETE /api/floors/:floorId - Delete floor (admin only)
router.delete('/:floorId', authenticate, isAdmin, deleteFloor);

export default router;
