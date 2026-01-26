// Admin Tenants controller
// Handles tenant management and statistics

import { getFirestore } from '../../../config/firebase.js';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

/**
 * Process private office tenants from requests collection
 * Returns data in same format as private office dashboard for consistency
 */
const processPrivateOfficeTenants = (schedules) => {
  // Filter to only include approved/active/ongoing/upcoming requests (not pending or rejected)
  const privateOfficeTenants = schedules
    .filter(s => !['pending', 'rejected', 'cancelled'].includes(s.status))
    .map(request => {
      const companyName = request.companyName || request.company || '';
      
      // Removed: Log containing private user data (clientName, companyName)
      
      return {
        id: request.id,
        type: 'private-office',
        clientName: request.clientName || 'Unknown',
        email: request.email || null,
        contactNumber: request.contactNumber || request.contact || null,
        companyName: companyName,
        room: request.room || null,
        startDate: request.startDate || null,
        status: request.status || 'active',
        createdAt: request.createdAt
      };
    });

  // Removed: Log containing private tenant data
  return privateOfficeTenants;
};

/**
 * Get tenant statistics and processed data
 */
export const getTenantStats = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Fetch all data in parallel to reduce latency
    console.log('📖 FIRESTORE READ: Starting tenants stats fetch...');
    let schedulesSnapshot, virtualOfficeSnapshot, deskAssignmentsSnapshot;
    
    try {
      schedulesSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('requests').get();
      console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests - ${schedulesSnapshot.docs.length} documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch privateOfficeRooms/data/requests:', err.message);
      schedulesSnapshot = { docs: [] };
    }

    try {
      virtualOfficeSnapshot = await firestore.collection('virtual-office-clients').get();
      console.log(`📖 FIRESTORE READ: virtual-office-clients - ${virtualOfficeSnapshot.docs.length} documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch virtual-office-clients:', err.message);
      virtualOfficeSnapshot = { docs: [] };
    }

    try {
      deskAssignmentsSnapshot = await firestore.collection('desk-assignments').get();
      console.log(`📖 FIRESTORE READ: desk-assignments - ${deskAssignmentsSnapshot.docs.length} documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch desk-assignments:', err.message);
      deskAssignmentsSnapshot = { docs: [] };
    }

    // Process all data
    const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const virtualOfficeClients = virtualOfficeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const deskAssignments = deskAssignmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Normalize desk - use desk if available, otherwise use document ID
        desk: data.desk || doc.id
      };
    });

    // Also fetch from new path for private office tenants
    let newSchedulesSnapshot;
    try {
      newSchedulesSnapshot = await firestore.collectionGroup('bookings').get();
      console.log(`📖 FIRESTORE READ: collectionGroup("bookings") - ${newSchedulesSnapshot.docs.length} total documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch new requests path:', err.message);
      newSchedulesSnapshot = { docs: [] };
    }

    // Process new path schedules - extract userId from path
    const newSchedules = newSchedulesSnapshot.docs
      .map(doc => {
        // Extract userId from path: /accounts/client/users/{userId}/request/office/bookings/{bookingId}
        const pathParts = doc.ref.path.split('/');
        const userId = pathParts[3];
        
        return {
          id: doc.id,
          userId,
          ...doc.data()
        };
      });
    
    console.log(`📖 FIRESTORE READ: collectionGroup("bookings") - ${newSchedules.length} office bookings after extraction`);

    // Combine schedules from both paths
    const allSchedules = [...schedules, ...newSchedules];

    // Process Private Office tenants using dedicated function
    const occupiedPrivateOfficeTenants = processPrivateOfficeTenants(allSchedules);

    // Process Virtual Office tenants - ONLY exclude cancelled/rejected (include all other statuses)
    const virtualOfficeTenants = virtualOfficeClients
      .filter(c => !['cancelled', 'rejected'].includes(c.status))
      .map(c => ({
        id: c.id,
        type: 'virtual-office',
        clientName: c.fullName || c.name || 'Unknown',
        email: c.email || null,
        contactNumber: c.phoneNumber || null,
        companyName: c.company || '',
        position: c.position || null,
        startDate: c.dateStart || c.preferredStartDate || c.createdAt || null,
        status: c.status || 'active',
        createdAt: c.createdAt || null
      }));

    // Process Dedicated Desk tenants - ONLY show "Tenant" type, exclude "Employee" type
    const dedicatedDeskTenants = deskAssignments
      .filter(a => a.type === 'Tenant') // Only include Tenant type
      .map(assignment => ({
        id: assignment.id,
        type: 'dedicated-desk',
        desk: assignment.desk, // Use desk field
        clientName: assignment.name || 'Unknown',
        email: assignment.email || null,
        contactNumber: assignment.contactNumber || null,
        companyName: assignment.company || '',
        occupantType: assignment.type,
        startDate: assignment.assignedAt ? (typeof assignment.assignedAt === 'object' && assignment.assignedAt.toDate ? assignment.assignedAt.toDate().toISOString() : assignment.assignedAt) : null,
        status: 'active',
        createdAt: assignment.assignedAt || assignment.createdAt || null
      }));

    // Calculate counts
    const stats = {
      privateOffice: occupiedPrivateOfficeTenants.length,
      virtualOffice: virtualOfficeTenants.length,
      dedicatedDesk: dedicatedDeskTenants.length,
      total: occupiedPrivateOfficeTenants.length + virtualOfficeTenants.length + dedicatedDeskTenants.length
    };

    const tenantData = {
      stats,
      tenants: {
        privateOffice: occupiedPrivateOfficeTenants,
        virtualOffice: virtualOfficeTenants,
        dedicatedDesk: dedicatedDeskTenants
      }
    };

    res.json({
      success: true,
      data: tenantData
    });
  } catch (error) {
    console.error('Get tenant stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch tenant statistics'
    });
  }
};

/**
 * Get filtered and sorted tenants
 */
export const getFilteredTenants = async (req, res) => {
  try {
    const { type, search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Get tenant data first by calling getTenantStats function logic
    console.log('📖 FIRESTORE READ: Starting filtered tenants fetch...');
    let schedulesSnapshot, virtualOfficeSnapshot, deskAssignmentsSnapshot, roomsSnapshot;
    
    try {
      schedulesSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('requests').get();
      console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests - ${schedulesSnapshot.docs.length} documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch privateOfficeRooms/data/requests:', err.message);
      schedulesSnapshot = { docs: [] };
    }

    try {
      virtualOfficeSnapshot = await firestore.collection('virtual-office-clients').get();
      console.log(`📖 FIRESTORE READ: virtual-office-clients - ${virtualOfficeSnapshot.docs.length} documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch virtual-office-clients:', err.message);
      virtualOfficeSnapshot = { docs: [] };
    }

    try {
      deskAssignmentsSnapshot = await firestore.collection('desk-assignments').get();
      console.log(`📖 FIRESTORE READ: desk-assignments - ${deskAssignmentsSnapshot.docs.length} documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch desk-assignments:', err.message);
      deskAssignmentsSnapshot = { docs: [] };
    }

    try {
      roomsSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('office').get();
      console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/office - ${roomsSnapshot.docs.length} documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch privateOfficeRooms/data/office:', err.message);
      roomsSnapshot = { docs: [] };
    }

    // Process schedules data
    const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Also fetch from new path for private office tenants
    let newSchedulesSnapshot;
    try {
      newSchedulesSnapshot = await firestore.collectionGroup('bookings').get();
      console.log(`📖 FIRESTORE READ: collectionGroup("bookings") - ${newSchedulesSnapshot.docs.length} total documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch new requests path:', err.message);
      newSchedulesSnapshot = { docs: [] };
    }

    // Process new path schedules - extract userId from path
    const newSchedules = newSchedulesSnapshot.docs
      .map(doc => {
        // Extract userId from path: /accounts/client/users/{userId}/request/office/bookings/{bookingId}
        const pathParts = doc.ref.path.split('/');
        const userId = pathParts[3];
        
        return {
          id: doc.id,
          userId,
          ...doc.data()
        };
      });
    
    console.log(`📖 FIRESTORE READ: collectionGroup("bookings") - ${newSchedules.length} office bookings after extraction`);

    // Combine schedules from both paths
    const allSchedules = [...schedules, ...newSchedules];

    // Process virtual office data
    const virtualOfficeClients = virtualOfficeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process desk assignments
    const deskAssignments = deskAssignmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Normalize desk - use desk if available, otherwise use document ID
        desk: data.desk || doc.id
      };
    });

    // Process rooms data
    const rooms = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process Private Office tenants using the same helper function as getTenantStats
    const occupiedPrivateOfficeTenants = processPrivateOfficeTenants(allSchedules);

    // Process Virtual Office tenants - ONLY exclude cancelled/rejected (include all other statuses)
    const virtualOfficeTenants = virtualOfficeClients
      .filter(c => !['cancelled', 'rejected'].includes(c.status))
      .map(c => ({
        id: c.id,
        type: 'virtual-office',
        clientName: c.fullName || c.name || 'Unknown',
        email: c.email || null,
        contactNumber: c.phoneNumber || null,
        companyName: c.company || '',
        position: c.position || null,
        startDate: c.dateStart || c.preferredStartDate || c.createdAt || null,
        status: c.status || 'active',
        createdAt: c.createdAt || null
      }));

    // Process Dedicated Desk tenants - ONLY show "Tenant" type, exclude "Employee" type
    const dedicatedDeskTenants = deskAssignments
      .filter(a => a.type === 'Tenant') // Only include Tenant type
      .map(assignment => ({
        id: assignment.id,
        type: 'dedicated-desk',
        desk: assignment.desk, // Use desk field
        clientName: assignment.name || 'Unknown',
        email: assignment.email || null,
        contactNumber: assignment.contactNumber || null,
        companyName: assignment.company || '',
        occupantType: assignment.type,
        startDate: assignment.assignedAt ? (typeof assignment.assignedAt === 'object' && assignment.assignedAt.toDate ? assignment.assignedAt.toDate().toISOString() : assignment.assignedAt) : null,
        status: 'active',
        createdAt: assignment.assignedAt || assignment.createdAt || null
      }));

    let allTenants = [...occupiedPrivateOfficeTenants, ...virtualOfficeTenants, ...dedicatedDeskTenants];

    // Apply type filter
    if (type && type !== 'all') {
      allTenants = allTenants.filter(tenant => tenant.type === type);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      allTenants = allTenants.filter(tenant =>
        (tenant.clientName && tenant.clientName.toLowerCase().includes(searchLower)) ||
        (tenant.email && tenant.email.toLowerCase().includes(searchLower)) ||
        (tenant.companyName && tenant.companyName.toLowerCase().includes(searchLower)) ||
        (tenant.contactNumber && tenant.contactNumber.toLowerCase().includes(searchLower)) ||
        (tenant.room && tenant.room.toLowerCase().includes(searchLower)) ||
        (tenant.desk && tenant.desk.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    allTenants.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.clientName || '').localeCompare(b.clientName || '');
      } else if (sortBy === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '');
      } else if (sortBy === 'type') {
        comparison = (a.type || '').localeCompare(b.type || '');
      } else if (sortBy === 'date') {
        comparison = new Date(a.startDate || 0) - new Date(b.startDate || 0);
      } else if (sortBy === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const stats = {
      privateOffice: occupiedPrivateOfficeTenants.length,
      virtualOffice: virtualOfficeTenants.length,
      dedicatedDesk: dedicatedDeskTenants.length,
      total: occupiedPrivateOfficeTenants.length + virtualOfficeTenants.length + dedicatedDeskTenants.length
    };

    res.json({
      success: true,
      data: {
        tenants: allTenants,
        totalCount: allTenants.length,
        stats
      }
    });
  } catch (error) {
    console.error('Get filtered tenants error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch filtered tenants'
    });
  }
};