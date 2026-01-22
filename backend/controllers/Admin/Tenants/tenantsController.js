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
      
      console.log('Processing private office request:', {
        id: request.id,
        clientName: request.clientName,
        companyName: companyName,
        rawCompanyName: request.companyName,
        rawCompany: request.company,
        status: request.status
      });
      
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

  console.log('Processed private office tenants:', privateOfficeTenants);
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
    const [schedulesSnapshot, virtualOfficeSnapshot, deskAssignmentsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('virtual-office-clients').get(),
      firestore.collection('desk-assignments').get()
    ]);

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

    console.log('Raw schedules from Firebase:', schedules.map(s => ({
      id: s.id,
      clientName: s.clientName,
      companyName: s.companyName,
      company: s.company,
      status: s.status
    })));

    // Process Private Office tenants using dedicated function
    const occupiedPrivateOfficeTenants = processPrivateOfficeTenants(schedules);

    // Process Virtual Office tenants
    const virtualOfficeTenants = virtualOfficeClients
      .filter(c => c.status !== 'inquiry')
      .map(c => ({
        id: c.id,
        type: 'virtual-office',
        clientName: c.fullName,
        email: c.email,
        contactNumber: c.phoneNumber,
        companyName: c.company || '',
        position: c.position,
        startDate: c.dateStart || c.preferredStartDate,
        status: c.status || 'active',
        createdAt: c.createdAt
      }));

    // Process Dedicated Desk tenants - ONLY show "Tenant" type, exclude "Employee" type
    const dedicatedDeskTenants = deskAssignments
      .filter(a => a.type === 'Tenant') // Only include Tenant type
      .map(assignment => ({
        id: assignment.id,
        type: 'dedicated-desk',
        desk: assignment.desk, // Use desk field
        clientName: assignment.name,
        email: assignment.email,
        contactNumber: assignment.contactNumber,
        companyName: assignment.company || '',
        occupantType: assignment.type,
        startDate: assignment.assignedAt ? (assignment.assignedAt.toDate ? assignment.assignedAt.toDate().toISOString() : assignment.assignedAt) : null,
        status: 'active',
        createdAt: assignment.assignedAt || assignment.createdAt
      }));

    console.log('✅ Processed tenants:');
    console.log('Private Office:', occupiedPrivateOfficeTenants.length);
    console.log('Virtual Office:', virtualOfficeTenants.length);
    console.log('Dedicated Desk:', dedicatedDeskTenants.length);

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
    const [schedulesSnapshot, virtualOfficeSnapshot, deskAssignmentsSnapshot, roomsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('virtual-office-clients').get(),
      firestore.collection('desk-assignments').get(),
      firestore.collection('privateOfficeRooms').doc('data').collection('office').get()
    ]);

    // Process schedules data
    const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
    const occupiedPrivateOfficeTenants = processPrivateOfficeTenants(schedules);

    // Process Virtual Office tenants
    const virtualOfficeTenants = virtualOfficeClients
      .filter(c => c.status !== 'inquiry')
      .map(c => ({
        id: c.id,
        type: 'virtual-office',
        clientName: c.fullName,
        email: c.email,
        contactNumber: c.phoneNumber,
        companyName: c.company || '',
        position: c.position,
        startDate: c.dateStart || c.preferredStartDate,
        status: c.status || 'active',
        createdAt: c.createdAt
      }));

    // Process Dedicated Desk tenants - ONLY show "Tenant" type, exclude "Employee" type
    const dedicatedDeskTenants = deskAssignments
      .filter(a => a.type === 'Tenant') // Only include Tenant type
      .map(assignment => ({
        id: assignment.id,
        type: 'dedicated-desk',
        desk: assignment.desk, // Use desk field
        clientName: assignment.name,
        email: assignment.email,
        contactNumber: assignment.contactNumber,
        companyName: assignment.company || '',
        occupantType: assignment.type,
        startDate: assignment.assignedAt ? (assignment.assignedAt.toDate ? assignment.assignedAt.toDate().toISOString() : assignment.assignedAt) : null,
        status: 'active',
        createdAt: assignment.assignedAt || assignment.createdAt
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