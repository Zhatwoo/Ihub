import express from 'express';
import { getDashboardStats } from '../controllers/Admin/Dashboard/dashboardController.js';
import { getTenantStats } from '../controllers/Admin/Tenants/tenantsController.js';
import { getPrivateOfficeDashboard } from '../controllers/Admin/Private Office/privateOfficeController.js';

const router = express.Router();

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', getDashboardStats);

// GET /api/dashboard/tenants - Get tenant statistics
router.get('/tenants', getTenantStats);

// GET /api/dashboard/private-office - Get private office dashboard with filters
router.get('/private-office', getPrivateOfficeDashboard);

export default router;