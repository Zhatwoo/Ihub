// Admin Dashboard controller
// Handles all admin dashboard operations and statistics

import { getFirestore } from '../../config/firebase.js';
import { sendFirestoreError } from '../../utils/firestoreHelper.js';

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

    // Calculate Virtual Office stats (tenants only, no employees)
    const tenantAssignments = deskAssignments.filter(d => d.type === 'Tenant');
    
    const virtualOfficeStats = {
      totalTenants: tenantAssignments.length,
      totalClients: virtualOfficeClients.length,
      totalOccupants: virtualOfficeClients.length + tenantAssignments.length,
      recentTenants: tenantAssignments
        .sort((a, b) => new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0))
        .slice(0, 5),
      // Combined occupants data for "Tenants" view (Virtual Office Clients + Dedicated Desk Tenants only)
      allTenants: [
        // Virtual office clients
        ...virtualOfficeClients.map(client => ({
          id: client.id,
          name: client.fullName || 'N/A',
          email: client.email || 'N/A',
          phone: client.phoneNumber || 'N/A',
          company: client.company || 'N/A',
          position: client.position || 'N/A',
          type: 'Virtual Office Client',
          status: client.status || 'active',
          startDate: client.dateStart || client.preferredStartDate || client.createdAt,
          source: 'virtual-office'
        })),
        // Desk assignments (tenants only)
        ...tenantAssignments.map(assignment => ({
          id: assignment.id,
          name: assignment.name || 'N/A',
          email: assignment.email || 'N/A',
          phone: assignment.contactNumber || 'N/A',
          company: assignment.company || 'N/A',
          position: assignment.type || 'N/A',
          type: 'Dedicated Desk Tenant',
          status: 'active',
          startDate: assignment.assignedAt || assignment.createdAt,
          source: 'desk-assignment',
          desk: assignment.desk
        }))
      ].sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)).slice(0, 10) // Limit for performance
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