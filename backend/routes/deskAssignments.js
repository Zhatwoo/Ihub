import express from 'express';
import {
  getAllDeskAssignments,
  getDeskAssignmentById,
  createDeskAssignment,
  updateDeskAssignment,
  deleteDeskAssignment
} from '../controllers/deskAssignmentsController.js';
import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/desk-assignments - Get all desk assignments (authenticated)
router.get('/', authenticate, getAllDeskAssignments);

// GET /api/desk-assignments/:assignmentId - Get desk assignment by ID (authenticated)
router.get('/:assignmentId', authenticate, getDeskAssignmentById);

// POST /api/desk-assignments - Create new desk assignment (admin only)
router.post('/', authenticate, isAdmin, createDeskAssignment);

// PUT /api/desk-assignments/:assignmentId - Update desk assignment (admin only)
router.put('/:assignmentId', authenticate, isAdmin, updateDeskAssignment);

// DELETE /api/desk-assignments/:assignmentId - Delete desk assignment (admin only)
router.delete('/:assignmentId', authenticate, isAdmin, deleteDeskAssignment);

export default router;
