import express from 'express';
import { authenticate, isAdmin } from '../middlewares/auth.js';

// Import admin controllers
import { getDashboardStats } from '../controllers/Admin/Dashboard/dashboardController.js';
import { getTenantStats, getFilteredTenants } from '../controllers/Admin/Tenants/tenantsController.js';
import { 
  getPrivateOfficeDashboard, 
  getPrivateOfficeRequests, 
  updateRequestStatus,
  removeTenant
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
  getInvoices,
  getBillingStats
} from '../controllers/Admin/Billing/billingController.js';
import {
  getBillingDetails,
  updateBillingDetails
} from '../controllers/Admin/Billing/editBillingController.js';

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
router.put('/private-office/requests/:userId/:bookingId/status', updateRequestStatus);
router.put('/private-office/rooms/:roomId/remove-tenant', removeTenant);

// Dedicated Desk routes
router.get('/dedicated-desk/assignments', getDeskAssignments);
router.get('/dedicated-desk/requests', getDeskRequests);
router.put('/dedicated-desk/requests/:userId/:requestId/status', updateDeskRequestStatus);
router.get('/dedicated-desk/occupants/:part', getOccupantsByPart);

// Virtual Office routes
router.get('/virtual-office/clients', getVirtualOfficeClients);
router.get('/virtual-office/occupants', getAllOccupants);
router.put('/virtual-office/clients/:clientId/status', updateClientStatus);

// Billing routes
router.get('/billing/dashboard', getBillingDashboard);
router.get('/billing/invoices', getInvoices);
router.get('/billing/stats', getBillingStats);
router.get('/billing/:serviceType/:billingId/details', getBillingDetails);
router.put('/billing/:serviceType/:billingId/details', updateBillingDetails);

export default router;