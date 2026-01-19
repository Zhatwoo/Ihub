import express from 'express';
import {
  getAllDeskAssignments,
  getDeskAssignmentById,
  createDeskAssignment,
  updateDeskAssignment,
  deleteDeskAssignment
} from '../controllers/deskAssignmentsController.js';
// import { authenticate, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/desk-assignments - Get all desk assignments
router.get('/', getAllDeskAssignments);

// GET /api/desk-assignments/:assignmentId - Get desk assignment by ID
router.get('/:assignmentId', getDeskAssignmentById);

// POST /api/desk-assignments - Create new desk assignment (admin only)
router.post('/', createDeskAssignment); // Add authenticate, isAdmin middleware later

// PUT /api/desk-assignments/:assignmentId - Update desk assignment (admin only)
router.put('/:assignmentId', updateDeskAssignment); // Add authenticate, isAdmin middleware later

// DELETE /api/desk-assignments/:assignmentId - Delete desk assignment (admin only)
router.delete('/:assignmentId', deleteDeskAssignment); // Add authenticate, isAdmin middleware later

export default router;
