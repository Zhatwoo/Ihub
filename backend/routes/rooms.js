import express from 'express';
const router = express.Router();

// TODO: Import controllers and middleware when ready to connect
// import { authenticate } from '../middleware/auth.js';
// import {
//   getAllRooms,
//   getRoomById,
//   createRoom,
//   updateRoom,
//   deleteRoom
// } from '../controllers/roomsController.js';

// GET /api/rooms - Get all rooms
router.get('/', async (req, res) => {
  // TODO: Implement getAllRooms
  res.json({ message: 'Get all rooms - Not implemented yet' });
});

// GET /api/rooms/:roomId - Get room by ID
router.get('/:roomId', async (req, res) => {
  // TODO: Implement getRoomById
  res.json({ message: 'Get room by ID - Not implemented yet' });
});

// POST /api/rooms - Create new room
router.post('/', async (req, res) => {
  // TODO: Implement createRoom
  res.json({ message: 'Create room - Not implemented yet' });
});

// PUT /api/rooms/:roomId - Update room
router.put('/:roomId', async (req, res) => {
  // TODO: Implement updateRoom
  res.json({ message: 'Update room - Not implemented yet' });
});

// DELETE /api/rooms/:roomId - Delete room
router.delete('/:roomId', async (req, res) => {
  // TODO: Implement deleteRoom
  res.json({ message: 'Delete room - Not implemented yet' });
});

export default router;
