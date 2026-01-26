// Admin Private Office controller
// Handles private office management, requests, and dashboard

import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

/**
 * Convert Firestore timestamps to ISO strings
 */
const convertTimestamps = (obj) => {
  if (!obj) return obj;
  
  const converted = { ...obj };
  
  // Convert startDate
  if (converted.startDate) {
    if (typeof converted.startDate === 'object' && converted.startDate.toDate) {
      converted.startDate = converted.startDate.toDate().toISOString();
    } else if (!(typeof converted.startDate === 'string')) {
      converted.startDate = new Date(converted.startDate).toISOString();
    }
  }
  
  // Convert createdAt
  if (converted.createdAt) {
    if (typeof converted.createdAt === 'object' && converted.createdAt.toDate) {
      converted.createdAt = converted.createdAt.toDate().toISOString();
    } else if (!(typeof converted.createdAt === 'string')) {
      converted.createdAt = new Date(converted.createdAt).toISOString();
    }
  }
  
  // Convert updatedAt
  if (converted.updatedAt) {
    if (typeof converted.updatedAt === 'object' && converted.updatedAt.toDate) {
      converted.updatedAt = converted.updatedAt.toDate().toISOString();
    } else if (!(typeof converted.updatedAt === 'string')) {
      converted.updatedAt = new Date(converted.updatedAt).toISOString();
    }
  }
  
  return converted;
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

    console.log('📖 FIRESTORE READ: Starting private office dashboard fetch...');
    
    let schedules = [];
    let roomsSnapshot;
    
    // Fetch from old path
    try {
      const oldSchedulesSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('requests').get();
      console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests - ${oldSchedulesSnapshot.docs.length} documents`);
      schedules = oldSchedulesSnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('⚠️ Could not fetch old requests path:', err.message);
    }

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
            convertTimestamps({
              id: doc.id,
              userId,
              ...doc.data()
            })
          );
          
          schedules = [...schedules, ...userBookings];
        } catch (err) {
          console.warn(`⚠️ Could not fetch bookings for user ${userId}:`, err.message);
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch new requests path:', err.message);
    }

    // Fetch rooms
    try {
      roomsSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('office').get();
      console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/office - ${roomsSnapshot.docs.length} documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch rooms:', err.message);
      roomsSnapshot = { docs: [] };
    }

    const rooms = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Keep a copy of ALL schedules for stats calculation
    const allSchedules = [...schedules];

    // Calculate stats from ALL documents (BEFORE any filtering)
    const stats = {
      total: allSchedules.length,
      pending: allSchedules.filter(s => s.status === 'pending').length,
      approved: allSchedules.filter(s => s.status === 'approved').length,
      rejected: allSchedules.filter(s => s.status === 'rejected').length,
      cancelled: allSchedules.filter(s => s.status === 'cancelled').length
    };
    
    // Apply status filter (only to schedules, NOT to allSchedules)
    if (status && status !== 'total') {
      if (status === 'approved') {
        schedules = schedules.filter(s => s.status === 'approved');
      } else if (status === 'active') {
        // Keep active filter for backward compatibility (maps to approved)
        schedules = schedules.filter(s => s.status === 'approved');
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

    // Get unique rooms for filter dropdown (from ALL schedules)
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

/**
 * Get private office requests with filtering
 */
export const getPrivateOfficeRequests = async (req, res) => {
  try {
    const { status, search, sortBy = 'date', sortOrder = 'desc' } = req.query;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Use collection group query to get ALL bookings from all users
    // Path: /accounts/client/users/{userId}/request/office/bookings/{bookingId}
    console.log('📖 FIRESTORE READ: collectionGroup("bookings") - executing query for office bookings...');
    const bookingsSnapshot = await firestore
      .collectionGroup('bookings')
      .get();
    console.log(`📖 FIRESTORE READ: collectionGroup("bookings") - ${bookingsSnapshot.docs.length} total documents read`);
    
    let schedules = bookingsSnapshot.docs.map(doc => {
      // Extract userId from the document path: /accounts/client/users/{userId}/request/office/bookings/{bookingId}
      const pathParts = doc.ref.path.split('/');
      const userId = pathParts[3]; // Index 3 is the userId in the path
      
      return convertTimestamps({ 
        id: doc.id, 
        userId, // Add userId to the response
        ...doc.data() 
      });
    });

    console.log(`📖 FIRESTORE READ: collectionGroup("bookings") - ${schedules.length} bookings after extraction`);

    // For Request List, only show pending requests by default
    // Dashboard will show all requests including approved/rejected
    if (!status || status === 'all') {
      // Default: only show pending requests in Request List
      schedules = schedules.filter(s => s.status === 'pending');
    } else {
      // Apply specific status filter if provided
      schedules = schedules.filter(s => s.status === status);
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

    res.json({
      success: true,
      data: {
        requests: schedules,
        totalCount: schedules.length
      }
    });
  } catch (error) {
    console.error('Get private office requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch private office requests'
    });
  }
};

/**
 * Remove tenant from room (mark request as cancelled and room as vacant)
 */
export const removeTenant = async (req, res) => {
  try {
    const { roomId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Get the room to find the associated request
    const roomRef = firestore.collection('privateOfficeRooms').doc('data').collection('office').doc(roomId);
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/office/${roomId} - executing query...`);
    const roomDoc = await roomRef.get();
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/office/${roomId} - ${roomDoc.exists ? '1 document' : 'not found'}`);

    if (!roomDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found'
      });
    }

    const roomData = roomDoc.data();

    // Find the associated request for this room from OLD path
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests - querying where roomId==${roomId} AND status=='approved'...`);
    const oldRequestsSnapshot = await firestore
      .collection('privateOfficeRooms')
      .doc('data')
      .collection('requests')
      .where('roomId', '==', roomId)
      .where('status', '==', 'approved')
      .get();
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests - ${oldRequestsSnapshot.docs.length} documents found`);

    // Find the associated request for this room from NEW path
    // Since we can't use where clauses on collection groups reliably, fetch all and filter
    console.log(`📖 FIRESTORE READ: collectionGroup("bookings") - fetching all office bookings...`);
    const allBookingsSnapshot = await firestore
      .collectionGroup('bookings')
      .get();
    
    // Filter to only office bookings with matching roomId and approved status
    const newOfficeRequests = allBookingsSnapshot.docs.filter(doc => 
      doc.data().roomId === roomId && 
      doc.data().status === 'approved'
    );
    console.log(`📖 FIRESTORE READ: collectionGroup("bookings") - ${newOfficeRequests.length} office bookings found with roomId=${roomId}`);

    // Update room to Vacant
    await roomRef.update({
      status: 'Vacant',
      occupiedBy: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update associated requests from OLD path to cancelled
    for (const requestDoc of oldRequestsSnapshot.docs) {
      await requestDoc.ref.update({
        status: 'cancelled',
        adminNotes: 'Tenant removed by admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Updated old path request to cancelled`);
    }

    // Update associated requests from NEW path to cancelled
    for (const requestDoc of newOfficeRequests) {
      await requestDoc.ref.update({
        status: 'cancelled',
        adminNotes: 'Tenant removed by admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Updated new path request to cancelled`);
    }

    res.json({
      success: true,
      message: 'Tenant removed successfully',
      data: {
        roomId,
        status: 'Vacant'
      }
    });
  } catch (error) {
    console.error('Remove tenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to remove tenant'
    });
  }
};

/**
 * Update request status (approve/reject)
 */
export const updateRequestStatus = async (req, res) => {
  try {
    const { userId, bookingId } = req.params;
    const { status, adminNotes } = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    if (!userId || !bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'userId and bookingId are required'
      });
    }

    // Read from new path: /accounts/client/users/{userId}/request/office/bookings/{bookingId}
    const requestRef = firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .collection('request')
      .doc('office')
      .collection('bookings')
      .doc(bookingId);
      
    console.log(`📖 FIRESTORE READ: accounts/client/users/${userId}/request/office/bookings/${bookingId} - executing query...`);
    const requestDoc = await requestRef.get();
    console.log(`📖 FIRESTORE READ: accounts/client/users/${userId}/request/office/bookings/${bookingId} - ${requestDoc.exists ? '1 document' : 'not found'}`);

    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Request not found'
      });
    }

    const currentRequest = requestDoc.data();
    
    // Update request status
    const updateData = {
      status,
      adminNotes: adminNotes || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // If approving, update room status, save rentFee, and create bill
    if (status === 'approved' && currentRequest.status !== 'approved') {
      let rentFee = 0;
      let rentFeePeriod = 'Monthly';
      
      if (currentRequest.roomId && currentRequest.clientName) {
        try {
          const roomRef = firestore.collection('privateOfficeRooms').doc('data').collection('office').doc(currentRequest.roomId);
          console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/office/${currentRequest.roomId} - executing query...`);
          const roomDoc = await roomRef.get();
          console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/office/${currentRequest.roomId} - ${roomDoc.exists ? '1 document' : 'not found'}`);
          
          if (roomDoc.exists) {
            const roomData = roomDoc.data();
            // Save rentFee from room to booking
            rentFee = roomData.rentFee || 0;
            rentFeePeriod = roomData.rentFeePeriod || 'Monthly';
            updateData.rentFee = rentFee;
            updateData.rentFeePeriod = rentFeePeriod;
            
            await roomRef.update({
              status: 'Occupied',
              occupiedBy: currentRequest.clientName,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Room ${currentRequest.roomId} status updated to Occupied (request approved)`);
            console.log(`✅ Saved rentFee: ${rentFee} to booking`);
          }
        } catch (roomError) {
          console.error('Error updating room status:', roomError);
        }
      }

      // Create bill in user's bills collection (separate try-catch for better error handling)
      try {
        const billRef = firestore
          .collection('accounts')
          .doc('client')
          .collection('users')
          .doc(userId)
          .collection('bills')
          .doc();

        // Calculate due date (30 days from start date)
        const startDate = currentRequest.startDate ? new Date(currentRequest.startDate) : new Date();
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + 30); // Due 30 days after start date

        const billData = {
          clientName: currentRequest.clientName || '',
          companyName: currentRequest.companyName || '',
          email: currentRequest.email || '',
          contactNumber: currentRequest.contactNumber || '',
          serviceType: 'Private Office',
          suite: currentRequest.room || '',
          rentFee: rentFee,
          rentFeePeriod: rentFeePeriod,
          cusaFee: 0,
          parkingFee: 0,
          bookingId: bookingId,
          roomId: currentRequest.roomId || '',
          startDate: admin.firestore.Timestamp.fromDate(startDate),
          dueDate: admin.firestore.Timestamp.fromDate(dueDate),
          status: 'unpaid',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await billRef.set(billData);
        console.log(`✅ Created bill for user ${userId}`);
      } catch (billError) {
        console.error('❌ Error creating bill:', billError.message);
      }
    }

    // If rejecting an approved request, free up the room
    if (status === 'rejected' && currentRequest.status === 'approved') {
      if (currentRequest.roomId) {
        try {
          const roomRef = firestore.collection('privateOfficeRooms').doc('data').collection('office').doc(currentRequest.roomId);
          console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/office/${currentRequest.roomId} - executing query...`);
          const roomDoc = await roomRef.get();
          console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/office/${currentRequest.roomId} - ${roomDoc.exists ? '1 document' : 'not found'}`);
          
          if (roomDoc.exists) {
            await roomRef.update({
              status: 'Vacant',
              occupiedBy: admin.firestore.FieldValue.delete(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Room ${currentRequest.roomId} status updated to Vacant (request rejected)`);
          }
        } catch (roomError) {
          console.error('Error updating room status:', roomError);
        }
      }
    }

    // Update the request status
    await requestRef.update(updateData);

    // Verify the update was saved
    console.log(`📖 FIRESTORE READ: accounts/client/users/${userId}/request/office/bookings/${bookingId} - verification read...`);
    const updatedDoc = await requestRef.get();
    console.log(`📖 FIRESTORE READ: accounts/client/users/${userId}/request/office/bookings/${bookingId} - ${updatedDoc.exists ? '1 document verified' : 'not found'}`);

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      data: updatedDoc.data()
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update request status'
    });
  }
};