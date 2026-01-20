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

    // Get tenant data first
    const [schedulesSnapshot, virtualOfficeSnapshot, deskAssignmentsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('virtual-office-clients').get(),
      firestore.collection('desk-assignments').get()
    ]);

    // Process schedules data
    const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process virtual office data
    const virtualOfficeClients = virtualOfficeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process desk assignments
    const deskAssignments = deskAssignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process Private Office tenants
    const privateOfficeTenants = schedules
      .filter(s => ['active', 'upcoming', 'ongoing'].includes(s.status))
      .map(s => ({
        id: s.id,
        type: 'private-office',
        name: s.clientName,
        email: s.email,
        phone: s.contactNumber,
        office: s.room,
        startDate: s.startDate,
        status: ['upcoming', 'ongoing'].includes(s.status) ? 'active' : s.status,
        createdAt: s.createdAt
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

    // Process Dedicated Desk tenants
    const dedicatedDeskTenants = deskAssignments.map(assignment => ({
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

    // Calculate counts
    const stats = {
      privateOffice: privateOfficeTenants.length,
      virtualOffice: virtualOfficeTenants.length,
      dedicatedDesk: dedicatedDeskTenants.length,
      total: privateOfficeTenants.length + virtualOfficeTenants.length + dedicatedDeskTenants.length
    };

    const tenantData = {
      stats,
      tenants: {
        privateOffice: privateOfficeTenants,
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
    const [schedulesSnapshot, virtualOfficeSnapshot, deskAssignmentsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('virtual-office-clients').get(),
      firestore.collection('desk-assignments').get()
    ]);

    // Process schedules data
    const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process virtual office data
    const virtualOfficeClients = virtualOfficeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process desk assignments
    const deskAssignments = deskAssignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process Private Office tenants
    const privateOfficeTenants = schedules
      .filter(s => ['active', 'upcoming', 'ongoing'].includes(s.status))
      .map(s => ({
        id: s.id,
        type: 'private-office',
        name: s.clientName,
        email: s.email,
        phone: s.contactNumber,
        office: s.room,
        startDate: s.startDate,
        status: ['upcoming', 'ongoing'].includes(s.status) ? 'active' : s.status,
        createdAt: s.createdAt
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

    // Process Dedicated Desk tenants
    const dedicatedDeskTenants = deskAssignments.map(assignment => ({
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

    let allTenants = [...privateOfficeTenants, ...virtualOfficeTenants, ...dedicatedDeskTenants];

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
      privateOffice: privateOfficeTenants.length,
      virtualOffice: virtualOfficeTenants.length,
      dedicatedDesk: dedicatedDeskTenants.length,
      total: privateOfficeTenants.length + virtualOfficeTenants.length + dedicatedDeskTenants.length
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