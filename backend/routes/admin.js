import express from 'express';

// Import admin controllers
import { getDashboardStats } from '../controllers/Admin/dashboardController.js';
import { getTenantStats, getFilteredTenants } from '../controllers/Admin/tenantsController.js';
import { 
  getPrivateOfficeDashboard, 
  getPrivateOfficeRequests, 
  updateRequestStatus 
} from '../controllers/Admin/privateOfficeController.js';
import { 
  getDeskAssignments, 
  getDeskRequests, 
  updateDeskRequestStatus, 
  getOccupantsByPart 
} from '../controllers/Admin/dedicatedDeskController.js';
import { 
  getVirtualOfficeClients, 
  updateClientStatus,
  getAllOccupants 
} from '../controllers/Admin/virtualOfficeController.js';
import { 
  getReservationTrends, 
  getReportHistory, 
  generateReport 
} from '../controllers/Admin/reportsController.js';
import { 
  getBillingDashboard, 
  getInvoices 
} from '../controllers/Admin/billingController.js';

const router = express.Router();

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

// Reports routes
router.get('/reports/trends', getReservationTrends);
router.get('/reports/history', getReportHistory);
router.post('/reports/generate', generateReport);

// Billing routes
router.get('/billing/dashboard', getBillingDashboard);
router.get('/billing/invoices', getInvoices);

export default router;