// Admin Tenants controller
// Handles tenant management and statistics

import { getFirestore } from '../../config/firebase.js';
import { sendFirestoreError } from '../../utils/firestoreHelper.js';

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
    const [schedulesSnapshot, virtualOfficeSnapshot, deskAssignmentsSnapshot, roomsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('virtual-office-clients').get(),
      firestore.collection('desk-assignments').get(),
      firestore.collection('privateOfficeRooms').doc('data').collection('office').get()
    ]);

    // Process all data
    const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const virtualOfficeClients = virtualOfficeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const deskAssignments = deskAssignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const rooms = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('🔍 Tenants Debug:');
    console.log('Total rooms:', rooms.length);
    console.log('Occupied rooms:', rooms.filter(r => r.status === 'Occupied').length);
    console.log('Desk assignments:', deskAssignments.length);
    console.log('Desk assignment types:', deskAssignments.map(d => d.type));

    // Process Private Office tenants - only occupied rooms
    const occupiedRooms = rooms.filter(room => room.status === 'Occupied');
    const occupiedPrivateOfficeTenants = occupiedRooms.map(room => ({
      id: room.id,
      type: 'private-office',
      name: room.occupiedBy || 'Unknown',
      email: '',
      phone: '',
      office: room.name,
      startDate: room.updatedAt,
      status: 'active',
      createdAt: room.createdAt
    }));

    // Process Virtual Office tenants
    const virtualOfficeTenants = virtualOfficeClients
      .filter(c => c.status !== 'inquiry')
      .map(c => ({
        id: c.id,
        type: 'virtual-office',
        name: c.fullName,
        email: c.email,
        phone: c.phoneNumber,
        company: c.company,
        position: c.position,
        startDate: c.dateStart || c.preferredStartDate,
        status: c.status || 'active',
        createdAt: c.createdAt
      }));

    // Process Dedicated Desk tenants - prioritize Tenants type
    const dedicatedDeskTenants = deskAssignments
      .sort((a, b) => {
        // Tenants first, then Employees
        if (a.type === 'Tenant' && b.type !== 'Tenant') return -1;
        if (a.type !== 'Tenant' && b.type === 'Tenant') return 1;
        return 0;
      })
      .map(assignment => ({
        id: assignment.id,
        type: 'dedicated-desk',
        desk: assignment.desk,
        name: assignment.name,
        email: assignment.email,
        phone: assignment.contactNumber,
        occupantType: assignment.type,
        company: assignment.company || null,
        startDate: assignment.assignedAt,
        status: 'active',
        createdAt: assignment.assignedAt || assignment.createdAt
      }));

    console.log('✅ Processed tenants:');
    console.log('Private Office:', occupiedPrivateOfficeTenants.length);
    console.log('Virtual Office:', virtualOfficeTenants.length);
    console.log('Dedicated Desk:', dedicatedDeskTenants.length);
    console.log('Dedicated Desk order (first 3):', dedicatedDeskTenants.slice(0, 3).map(d => ({ name: d.name, type: d.occupantType })));

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
    const deskAssignments = deskAssignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process rooms data
    const rooms = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process Private Office tenants - include all non-rejected/non-pending statuses
    const privateOfficeTenants = schedules
      .filter(s => !['rejected', 'pending', 'cancelled'].includes(s.status))
      .map(s => ({
        id: s.id,
        type: 'private-office',
        name: s.clientName,
        email: s.email,
        phone: s.contactNumber,
        office: s.room,
        startDate: s.startDate,
        status: ['upcoming', 'ongoing', 'approved'].includes(s.status) ? 'active' : s.status,
        createdAt: s.createdAt
      }));

    // Filter to only show occupied rooms
    const occupiedRooms = rooms.filter(room => room.status === 'Occupied');
    const occupiedPrivateOfficeTenants = occupiedRooms.map(room => ({
      id: room.id,
      type: 'private-office',
      name: room.occupiedBy || 'Unknown',
      email: '',
      phone: '',
      office: room.name,
      startDate: room.updatedAt,
      status: 'active',
      createdAt: room.createdAt
    }));

    // Process Virtual Office tenants
    const virtualOfficeTenants = virtualOfficeClients
      .filter(c => c.status !== 'inquiry')
      .map(c => ({
        id: c.id,
        type: 'virtual-office',
        name: c.fullName,
        email: c.email,
        phone: c.phoneNumber,
        company: c.company,
        position: c.position,
        startDate: c.dateStart || c.preferredStartDate,
        status: c.status || 'active',
        createdAt: c.createdAt
      }));

    // Process Dedicated Desk tenants - prioritize Tenants type
    const dedicatedDeskTenants = deskAssignments
      .sort((a, b) => {
        // Tenants first, then Employees
        if (a.type === 'Tenant' && b.type !== 'Tenant') return -1;
        if (a.type !== 'Tenant' && b.type === 'Tenant') return 1;
        return 0;
      })
      .map(assignment => ({
        id: assignment.id,
        type: 'dedicated-desk',
        desk: assignment.desk,
        name: assignment.name,
        email: assignment.email,
        phone: assignment.contactNumber,
        occupantType: assignment.type,
        company: assignment.company || null,
        startDate: assignment.assignedAt,
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
        (tenant.name && tenant.name.toLowerCase().includes(searchLower)) ||
        (tenant.email && tenant.email.toLowerCase().includes(searchLower)) ||
        (tenant.company && tenant.company.toLowerCase().includes(searchLower)) ||
        (tenant.phone && tenant.phone.toLowerCase().includes(searchLower)) ||
        (tenant.office && tenant.office.toLowerCase().includes(searchLower)) ||
        (tenant.desk && tenant.desk.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    allTenants.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
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