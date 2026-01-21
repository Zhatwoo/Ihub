import express from 'express';
import { authenticate, isAdmin } from '../middlewares/auth.js';

// Import admin controllers
import { getDashboardStats } from '../controllers/Admin/Dashboard/dashboardController.js';
import { getTenantStats, getFilteredTenants } from '../controllers/Admin/Tenants/tenantsController.js';
import { 
  getPrivateOfficeDashboard, 
  getPrivateOfficeRequests, 
  updateRequestStatus 
} from '../controllers/Admin/Private Office/privateOfficeController.js';
import { 
  getDeskAssignments, 
  getDeskRequests, 
  updateDeskRequestStatus, 
  getOccupantsByPart 
} from '../controllers/Admin/Dedicated Desk/dedicatedDeskController.js';
import { 
  getVirtualOfficeClients, 
  updateClientStatus,
  getAllOccupants 
} from '../controllers/Admin/Virtual Office/virtualOfficeController.js';
import { 
  getBillingDashboard, 
  getInvoices 
} from '../controllers/Admin/Billing/billingController.js';

const router = express.Router();

// Apply authentication and admin middleware to all routes
// router.use(authenticate, isAdmin); // Temporarily disabled for testing

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Tenants routes
router.get('/tenants/stats', getTenantStats);
router.get('/tenants/filtered', getFilteredTenants);

// Private Office routes
router.get('/private-office/dashboard', getPrivateOfficeDashboard);
router.get('/private-office/requests', getPrivateOfficeRequests);
router.put('/private-office/requests/:requestId/status', updateRequestStatus);

// Dedicated Desk routes
router.get('/dedicated-desk/assignments', getDeskAssignments);
router.get('/dedicated-desk/requests', getDeskRequests);
router.put('/dedicated-desk/requests/:userId/status', updateDeskRequestStatus);
router.get('/dedicated-desk/occupants/:part', getOccupantsByPart);

// Virtual Office routes
router.get('/virtual-office/clients', getVirtualOfficeClients);
router.get('/virtual-office/occupants', getAllOccupants);
router.put('/virtual-office/clients/:clientId/status', updateClientStatus);

// Billing routes
router.get('/billing/dashboard', getBillingDashboard);
router.get('/billing/invoices', getInvoices);

export default router;