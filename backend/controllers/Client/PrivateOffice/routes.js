import express from 'express';
import {
  createSchedule,
  getScheduleById,
  getUserSchedules,
  deleteSchedule
} from './bookingController.js';
import { authenticate } from '../../../middlewares/auth.js';

const router = express.Router();

// POST /api/client/private-office/bookings - Create new booking
router.post('/bookings', authenticate, createSchedule);

// GET /api/client/private-office/user/:userId/bookings - Get user's all bookings
router.get('/user/:userId/bookings', authenticate, getUserSchedules);

// GET /api/client/private-office/bookings/:userId/:scheduleId - Get specific booking
router.get('/bookings/:userId/:scheduleId', authenticate, getScheduleById);

// DELETE /api/client/private-office/bookings/:userId/:scheduleId - Delete specific booking
router.delete('/bookings/:userId/:scheduleId', authenticate, deleteSchedule);

export default router;
