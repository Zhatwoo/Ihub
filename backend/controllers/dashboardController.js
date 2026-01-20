// Dashboard controller
// Handles dashboard statistics and aggregated data

import { getFirestore } from '../config/firebase.js';
import { sendFirestoreError } from '../utils/firestoreHelper.js';

/**
 * Get dashboard statistics for all services
 */
export const getDashboardStats = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Fetch all required data
    const [roomsSnapshot, schedulesSnapshot, virtualOfficeSnapshot, deskAssignmentsSnapshot, deskRequestsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('office').get(),
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('virtual-office-clients').get(),
      firestore.collection('desk-assignments').get(),
      firestore.collection('accounts').doc('client').collection('users').get()
    ]);

    // Process rooms data
    const rooms = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process schedules data
    const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process virtual office data
    const virtualOfficeClients = virtualOfficeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process desk assignments
    const deskAssignments = deskAssignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get desk requests from user documents
    const deskRequests = [];
    for (const userDoc of deskRequestsSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.deskRequest) {
        deskRequests.push({
          id: userDoc.id,
          userId: userDoc.id,
          ...userData.deskRequest,
          userInfo: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email
          }
        });
      }
    }

    // Calculate Private Office stats
    const privateOfficeStats = {
      totalRooms: rooms.length,
      totalBookings: schedules.length,
      approved: schedules.filter(s => ['approved', 'upcoming', 'ongoing', 'active', 'completed'].includes(s.status)).length,
      rejected: schedules.filter(s => s.status === 'rejected').length,
      pending: schedules.filter(s => s.status === 'pending').length,
      recentBookings: schedules
        .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
        .slice(0, 5)
    };

    // Calculate Virtual Office stats
    const virtualOfficeStats = {
      totalTenants: deskAssignments.filter(d => d.type === 'Tenant').length,
      totalEmployees: deskAssignments.filter(d => d.type === 'Employee').length,
      totalClients: virtualOfficeClients.length,
      recentTenants: deskAssignments
        .filter(d => d.type === 'Tenant')
        .sort((a, b) => new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0))
        .slice(0, 5)
    };

    // Calculate Dedicated Desk stats
    const dedicatedDeskStats = {
      approved: deskRequests.filter(r => r.status === 'approved').length,
      pending: deskRequests.filter(r => r.status === 'pending').length,
      rejected: deskRequests.filter(r => r.status === 'rejected').length,
      totalAssigned: deskAssignments.length,
      recentRequests: deskRequests
        .sort((a, b) => new Date(b.requestDate || b.createdAt || 0) - new Date(a.requestDate || a.createdAt || 0))
        .slice(0, 5)
    };

    res.json({
      success: true,
      data: {
        privateOffice: privateOfficeStats,
        virtualOffice: virtualOfficeStats,
        dedicatedDesk: dedicatedDeskStats,
        rawData: {
          rooms,
          schedules: schedules.slice(0, 10), // Limit for performance
          virtualOfficeClients: virtualOfficeClients.slice(0, 10),
          deskAssignments: deskAssignments.slice(0, 10),
          deskRequests: deskRequests.slice(0, 10)
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch dashboard statistics'
    });
  }
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

    const [schedulesSnapshot, virtualOfficeSnapshot, deskAssignmentsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('virtual-office-clients').get(),
      firestore.collection('desk-assignments').get()
    ]);

    // Process Private Office tenants
    const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    const virtualOfficeClients = virtualOfficeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    const deskAssignments = deskAssignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

    res.json({
      success: true,
      data: {
        stats,
        tenants: {
          privateOffice: privateOfficeTenants,
          virtualOffice: virtualOfficeTenants,
          dedicatedDesk: dedicatedDeskTenants
        }
      }
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
 * Get private office dashboard data with filtering and sorting
 */
export const getPrivateOfficeDashboard = async (req, res) => {
  try {
    const { status, search, sortBy = 'date', sortOrder = 'desc', roomFilter } = req.query;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Fetch schedules and rooms
    const [schedulesSnapshot, roomsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('privateOfficeRooms').doc('data').collection('office').get()
    ]);

    let schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const rooms = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Apply status filter
    if (status && status !== 'total') {
      if (status === 'active') {
        schedules = schedules.filter(s => ['upcoming', 'ongoing', 'active'].includes(s.status));
      } else {
        schedules = schedules.filter(s => s.status === status);
      }
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      schedules = schedules.filter(s => 
        (s.clientName && s.clientName.toLowerCase().includes(searchLower)) ||
        (s.room && s.room.toLowerCase().includes(searchLower)) ||
        (s.email && s.email.toLowerCase().includes(searchLower))
      );
    }

    // Apply room filter
    if (roomFilter && roomFilter !== 'all') {
      schedules = schedules.filter(s => s.room === roomFilter);
    }

    // Apply sorting
    schedules.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.startDate || a.createdAt || 0) - new Date(b.startDate || b.createdAt || 0);
      } else if (sortBy === 'name') {
        comparison = (a.clientName || '').localeCompare(b.clientName || '');
      } else if (sortBy === 'room') {
        comparison = (a.room || '').localeCompare(b.room || '');
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Calculate stats
    const allSchedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const stats = {
      total: allSchedules.length,
      active: allSchedules.filter(s => ['upcoming', 'ongoing', 'active'].includes(s.status)).length,
      pending: allSchedules.filter(s => s.status === 'pending').length,
      approved: allSchedules.filter(s => s.status === 'approved').length,
      rejected: allSchedules.filter(s => s.status === 'rejected').length,
      completed: allSchedules.filter(s => s.status === 'completed').length
    };

    // Get unique rooms for filter dropdown
    const uniqueRooms = [...new Set(allSchedules.map(s => s.room).filter(Boolean))];

    res.json({
      success: true,
      data: {
        schedules,
        stats,
        uniqueRooms,
        totalCount: schedules.length
      }
    });
  } catch (error) {
    console.error('Get private office dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch private office dashboard data'
    });
  }
};