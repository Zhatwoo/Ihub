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

    // Fetch schedules and rooms
    console.log('📖 FIRESTORE READ: Starting private office dashboard fetch...');
    const [schedulesSnapshot, roomsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('privateOfficeRooms').doc('data').collection('office').get()
    ]);
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests - ${schedulesSnapshot.docs.length} documents`);
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/office - ${roomsSnapshot.docs.length} documents`);

    let schedules = schedulesSnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }));
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

    console.log('📖 FIRESTORE READ: privateOfficeRooms/data/requests - executing query...');
    const schedulesSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('requests').get();
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests - ${schedulesSnapshot.docs.length} documents read`);
    let schedules = schedulesSnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }));

    // Removed: Debug logs containing private user data (clientName)

    // For Request List, only show pending requests by default
    // Dashboard will show all requests including approved/rejected
    if (!status || status === 'all') {
      // Default: only show pending requests in Request List
      schedules = schedules.filter(s => s.status === 'pending');
      // Removed: Log (may expose request data)
    } else {
      // Apply specific status filter if provided
      schedules = schedules.filter(s => s.status === status);
      // Removed: Log (may expose request data)
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
    
    // Removed: Debug logs containing room and tenant data
    // Removed: Log containing room data (may contain private info)
    if (false) { // Disabled log
      // Removed: Log containing room data
    }

    // Find the associated request for this room
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests - querying where roomId==${roomId} AND status=='approved'...`);
    const requestsSnapshot = await firestore
      .collection('privateOfficeRooms')
      .doc('data')
      .collection('requests')
      .where('roomId', '==', roomId)
      .where('status', '==', 'approved')
      .get();
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests - ${requestsSnapshot.docs.length} documents found`);

    // Update room to Vacant
    await roomRef.update({
      status: 'Vacant',
      occupiedBy: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update associated request to cancelled
    for (const requestDoc of requestsSnapshot.docs) {
      await requestDoc.ref.update({
        status: 'cancelled',
        adminNotes: 'Tenant removed by admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      // Removed: Log containing request ID
    }

    // Tenant removed successfully (removed log for privacy)

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
    const { requestId } = req.params;
    const { status, adminNotes } = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    const requestRef = firestore.collection('privateOfficeRooms').doc('data').collection('requests').doc(requestId);
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests/${requestId} - executing query...`);
    const requestDoc = await requestRef.get();
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests/${requestId} - ${requestDoc.exists ? '1 document' : 'not found'}`);

    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Request not found'
      });
    }

    const currentRequest = requestDoc.data();
    
    // Removed: Debug logs containing request data
    if (false) { // Disabled logs
    // Removed: Debug logs containing private request data (clientName, roomId, room)
    } // End disabled logs
    
    // Update request status
    const updateData = {
      status,
      adminNotes: adminNotes || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // If approving, update room status
    if (status === 'approved' && currentRequest.status !== 'approved') {
      if (currentRequest.roomId && currentRequest.clientName) {
        try {
          const roomRef = firestore.collection('privateOfficeRooms').doc('data').collection('office').doc(currentRequest.roomId);
          console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/office/${currentRequest.roomId} - executing query...`);
          const roomDoc = await roomRef.get();
          console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/office/${currentRequest.roomId} - ${roomDoc.exists ? '1 document' : 'not found'}`);
          
          if (roomDoc.exists) {
            await roomRef.update({
              status: 'Occupied',
              occupiedBy: currentRequest.clientName,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Room ${currentRequest.roomId} status updated to Occupied (request approved)`);
          }
        } catch (roomError) {
          console.error('Error updating room status:', roomError);
        }
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

    // Ensure the update is committed to Firebase
    await requestRef.update(updateData);

    // Removed: Log containing request status update
    // Removed: Log containing request update data (may contain private info)

    // Verify the update was saved by reading the document back
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests/${requestId} - verification read...`);
    const updatedDoc = await requestRef.get();
    console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests/${requestId} - ${updatedDoc.exists ? '1 document verified' : 'not found'}`);
    // Removed: Verification log containing private request data (clientName, room)

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      data: {
        id: requestId,
        ...updateData
      }
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