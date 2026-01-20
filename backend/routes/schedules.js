import express from 'express';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getUserSchedules
} from '../controllers/schedulesController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

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

// DELETE /api/schedules/:scheduleId - Delete schedule/booking (admin only)
router.delete('/:scheduleId', authenticate, isAdmin, deleteSchedule);

export default router;
