import express from 'express';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getUserSchedules,
  getRoomOccupancy
} from '../controllers/schedulesController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/schedules/occupancy - Get room occupancy status (public - for checking available rooms)
router.get('/occupancy', getRoomOccupancy);

// GET /api/schedules - Get all schedules (admin only)
router.get('/', authenticate, isAdmin, getAllSchedules);

// GET /api/schedules/user/:userId - Get schedules for a specific user (authenticated)
router.get('/user/:userId', authenticate, getUserSchedules);

// GET /api/schedules/:scheduleId - Get schedule by ID (authenticated)
router.get('/:scheduleId', authenticate, getScheduleById);

// POST /api/schedules - Create new schedule/booking (authenticated)
router.post('/', authenticate, createSchedule);

// PUT /api/schedules/:scheduleId - Update schedule (admin only)
router.put('/:scheduleId', authenticate, isAdmin, updateSchedule);

// DELETE /api/schedules/:scheduleId - Delete schedule/booking (authenticated - clients can delete their own, admins can delete any)
router.delete('/:scheduleId', authenticate, deleteSchedule);

export default router;
