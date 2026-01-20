import express from 'express';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getUserSchedules
} from '../controllers/Admin/schedulesController.js';
// import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/schedules - Get all schedules
router.get('/', getAllSchedules);

// GET /api/schedules/user/:userId - Get schedules for a specific user
router.get('/user/:userId', getUserSchedules);

// GET /api/schedules/:scheduleId - Get schedule by ID
router.get('/:scheduleId', getScheduleById);

// POST /api/schedules - Create new schedule/booking
router.post('/', createSchedule); // Add authenticate middleware later

// PUT /api/schedules/:scheduleId - Update schedule
router.put('/:scheduleId', updateSchedule); // Add authenticate middleware later

// DELETE /api/schedules/:scheduleId - Delete schedule/booking
router.delete('/:scheduleId', deleteSchedule); // Add authenticate middleware later

export default router;
