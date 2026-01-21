// Admin Dashboard controller
// Handles all admin dashboard operations and statistics

import { getFirestore } from '../../../config/firebase.js';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

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

    // Get desk requests from user documents using correct path structure
    const deskRequests = [];
    for (const userDoc of deskRequestsSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      try {
        // Check the correct path: /accounts/client/users/{userId}/request/desk
        const deskRequestDoc = await firestore
          .collection('accounts')
          .doc('client')
          .collection('users')
          .doc(userId)
          .collection('request')
          .doc('desk')
          .get();

        if (deskRequestDoc.exists) {
          const deskRequestData = deskRequestDoc.data();
          deskRequests.push({
            id: userId,
            userId: userId,
            ...deskRequestData,
            userInfo: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email
            }
          });
        }
      } catch (error) {
        console.error(`Error checking desk request for user ${userId}:`, error);
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

    // Calculate Virtual Office stats (Virtual Office clients only)
    const virtualOfficeStats = {
      totalClients: virtualOfficeClients.length,
      recentClients: virtualOfficeClients
        .sort((a, b) => new Date(b.createdAt || b.dateStart || 0) - new Date(a.createdAt || a.dateStart || 0))
        .slice(0, 5),
      // Virtual Office clients only for "Tenants" view
      allTenants: virtualOfficeClients.map(client => ({
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
      })).sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)).slice(0, 10) // Limit for performance
    };

    console.log('🔍 Backend Debug - Virtual Office Only:');
    console.log('Virtual Office Clients Raw:', virtualOfficeClients);
    console.log('Virtual Office Stats:', virtualOfficeStats);
    console.log('All Tenants (should be VO clients only):', virtualOfficeStats.allTenants);

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