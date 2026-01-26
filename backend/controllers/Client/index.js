import express from 'express';
import dedicatedDeskRoutes from './DedicatedDesk/routes.js';
import privateOfficeRoutes from './PrivateOffice/routes.js';
import virtualOfficeRoutes from './VirtualOffice/routes.js';

const router = express.Router();

// Mount service-specific routes
router.use('/dedicated-desk', dedicatedDeskRoutes);
router.use('/private-office', privateOfficeRoutes);
router.use('/virtual-office', virtualOfficeRoutes);

export default router;
