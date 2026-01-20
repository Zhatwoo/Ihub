import express from 'express';
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
} from '../controllers/Admin/roomsController.js';
// import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/rooms - Get all rooms
router.get('/', getAllRooms);

// GET /api/rooms/:roomId - Get room by ID
router.get('/:roomId', getRoomById);

// POST /api/rooms - Create new room (admin only)
router.post('/', createRoom); // Add authenticate, isAdmin middleware later

// PUT /api/rooms/:roomId - Update room (admin only)
router.put('/:roomId', updateRoom); // Add authenticate, isAdmin middleware later

// DELETE /api/rooms/:roomId - Delete room (admin only)
router.delete('/:roomId', deleteRoom); // Add authenticate, isAdmin middleware later

export default router;
