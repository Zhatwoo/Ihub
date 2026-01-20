import express from 'express';
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
} from '../controllers/roomsController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/rooms - Get all rooms (public)
router.get('/', getAllRooms);

// GET /api/rooms/:roomId - Get room by ID (public)
router.get('/:roomId', getRoomById);

// POST /api/rooms - Create new room (admin only)
router.post('/', authenticate, isAdmin, createRoom);

// PUT /api/rooms/:roomId - Update room (admin only)
router.put('/:roomId', authenticate, isAdmin, updateRoom);

// DELETE /api/rooms/:roomId - Delete room (admin only)
router.delete('/:roomId', authenticate, isAdmin, deleteRoom);

export default router;
