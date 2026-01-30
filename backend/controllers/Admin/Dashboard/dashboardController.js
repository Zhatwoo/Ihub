// Admin Dashboard controller
// Handles all admin dashboard operations and statistics

import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';
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

    // Fetch all required data (desk requests and assignments fetched separately using collection group query)
    const [roomsSnapshot, oldSchedulesSnapshot, virtualOfficeTenantsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('office').get(),
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('accounts').doc('virtual-tenants').collection('tenants').get()
    ]);

    // Process rooms data
    const rooms = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Process schedules data from old path
    let schedules = oldSchedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch from new path - query all users and their office bookings
    try {
      console.log('📖 FIRESTORE READ: Fetching all users from accounts/client/users...');
      const usersSnapshot = await firestore.collection('accounts').doc('client').collection('users').get();
      console.log(`📖 FIRESTORE READ: Found ${usersSnapshot.docs.length} users`);
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        try {
          const bookingsSnapshot = await firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(userId)
            .collection('request')
            .doc('office')
            .collection('bookings')
            .get();
          
          console.log(`📖 FIRESTORE READ: accounts/client/users/${userId}/request/office/bookings - ${bookingsSnapshot.docs.length} documents`);
          
          const userBookings = bookingsSnapshot.docs.map(doc => 
            ({ id: doc.id, userId, ...doc.data() })
          );
          
          schedules = [...schedules, ...userBookings];
        } catch (err) {
          console.warn(`⚠️ Could not fetch bookings for user ${userId}:`, err.message);
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch new requests path:', err.message);
    }

    // Process virtual office data
    const virtualOfficeTenants = virtualOfficeTenantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // OPTIMIZED: Use collection group query to get ALL desk requests in 1 READ!
    console.log('📖 FIRESTORE READ: collectionGroup("requests") - executing query...');
    const deskRequestsSnapshot = await firestore
      .collectionGroup('requests')
      .get();
    console.log(`📖 FIRESTORE READ: collectionGroup("requests") - ${deskRequestsSnapshot.docs.length} total documents read`);
    
    // Filter to only get desk requests (from /request/desk/requests path)
    const deskRequestDocs = deskRequestsSnapshot.docs.filter(doc => {
      const path = doc.ref.path;
      return path.includes('/request/desk/requests/');
    });
    console.log(`📖 FIRESTORE READ: collectionGroup("requests") - ${deskRequestDocs.length} desk requests after filtering`);

    const deskRequests = [];
    const deskAssignments = []; // Approved requests = assignments
    const userIds = new Set();

    // Process all desk requests from the single query
    for (const deskRequestDoc of deskRequestDocs) {
      const deskRequestData = deskRequestDoc.data();
      
      if (!deskRequestData || Object.keys(deskRequestData).length === 0) {
        continue;
      }

      // Extract userId from document path: accounts/client/users/{userId}/request/desk/requests/{requestId}
      const pathParts = deskRequestDoc.ref.path.split('/');
      const userIdIndex = pathParts.indexOf('users');
      const userId = userIdIndex !== -1 && userIdIndex + 1 < pathParts.length 
        ? pathParts[userIdIndex + 1] 
        : null;

      if (!userId) continue;

      userIds.add(userId);
      
      const requestData = {
        id: deskRequestDoc.id,
        userId: userId,
        ...deskRequestData,
        userInfo: null
      };
      
      deskRequests.push(requestData);
      
      // If approved, also add to assignments
      if (deskRequestData.status === 'approved') {
        deskAssignments.push({
          ...requestData,
          deskTag: deskRequestData.assignedDesk || deskRequestData.desk || deskRequestDoc.id
        });
      }
    }

    // Fetch user info in batch (only for users that have requests)
    if (userIds.size > 0) {
      const userIdsArray = Array.from(userIds);
      const userPromises = userIdsArray.slice(0, 100).map(async (userId) => { // Limit to 100 for dashboard
        try {
          const userDoc = await firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(userId)
            .get();
      console.log(`📖 FIRESTORE READ: accounts/client/users/${userId} - ${userDoc.exists ? '1 document' : 'not found'}`);
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            return { 
              userId, 
              userInfo: {
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || ''
              }
            };
          }
          return { userId, userInfo: null };
        } catch (error) {
          return { userId, userInfo: null };
        }
      });

      const userInfoResults = await Promise.all(userPromises);
      const userInfoMap = new Map();
      userInfoResults.forEach(({ userId, userInfo }) => {
        if (userInfo) userInfoMap.set(userId, userInfo);
      });

      // Attach user info
      deskRequests.forEach(request => {
        request.userInfo = userInfoMap.get(request.userId) || {
          firstName: '',
          lastName: '',
          email: ''
        };
      });
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

    // Calculate Virtual Office stats (Virtual Office tenants only)
    const virtualOfficeStats = {
      totalClients: virtualOfficeTenants.length,
      recentClients: virtualOfficeTenants
        .sort((a, b) => new Date(b.createdAt || b.dateStart || 0) - new Date(a.createdAt || a.dateStart || 0))
        .slice(0, 5),
      // Virtual Office tenants only for "Tenants" view
      allTenants: virtualOfficeTenants.map(tenant => ({
        id: tenant.id,
        name: tenant.fullName || 'N/A',
        email: tenant.email || 'N/A',
        phone: tenant.phoneNumber || 'N/A',
        company: tenant.company || 'N/A',
        position: tenant.position || 'N/A',
        type: 'Virtual Office Client',
        status: tenant.status || 'active',
        startDate: tenant.dateStart || tenant.preferredStartDate || tenant.createdAt,
        source: 'virtual-office'
      })).sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)).slice(0, 10) // Limit for performance
    };

    // Debug logs removed - sensitive user data should not be logged
    // Only log in development mode if needed
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Dashboard stats fetched successfully');
    }

    // Calculate Dedicated Desk stats
    const dedicatedDeskStats = {
      approved: deskRequests.filter(r => r.status === 'approved').length,
      pending: deskRequests.filter(r => r.status === 'pending').length,
      rejected: deskRequests.filter(r => r.status === 'rejected').length,
      totalAssigned: deskAssignments.length, // Count of approved requests
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
          virtualOfficeClients: virtualOfficeTenants.slice(0, 10),
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

