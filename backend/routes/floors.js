import express from 'express';
const router = express.Router();

// TODO: Import controllers and middleware when ready to connect
// import { authenticate, isAdmin } from '../middleware/auth.js';
// import {
//   getAllFloors,
//   getFloorById,
//   createFloor,
//   updateFloor,
//   deleteFloor
// } from '../controllers/floorsController.js';

// GET /api/floors - Get all floors
router.get('/', async (req, res) => {
  // TODO: Implement getAllFloors
  res.json({ message: 'Get all floors - Not implemented yet' });
});

// GET /api/floors/:floorId - Get floor by ID
router.get('/:floorId', async (req, res) => {
  // TODO: Implement getFloorById
  res.json({ message: 'Get floor by ID - Not implemented yet' });
});

// POST /api/floors - Create new floor
router.post('/', async (req, res) => {
  // TODO: Implement createFloor
  res.json({ message: 'Create floor - Not implemented yet' });
});

// PUT /api/floors/:floorId - Update floor
router.put('/:floorId', async (req, res) => {
  // TODO: Implement updateFloor
  res.json({ message: 'Update floor - Not implemented yet' });
});

// DELETE /api/floors/:floorId - Delete floor
router.delete('/:floorId', async (req, res) => {
  // TODO: Implement deleteFloor
  res.json({ message: 'Delete floor - Not implemented yet' });
});

export default router;
