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
    const [schedulesSnapshot, roomsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('privateOfficeRooms').doc('data').collection('office').get()
    ]);

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

    const schedulesSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('requests').get();
    let schedules = schedulesSnapshot.docs.map(doc => convertTimestamps({ id: doc.id, ...doc.data() }));

    console.log('=== DEBUG: All Requests from Firebase ===');
    console.log('Total requests:', schedules.length);
    schedules.forEach(s => {
      console.log(`- ${s.clientName}: status=${s.status}`);
    });

    // For Request List, only show pending requests by default
    // Dashboard will show all requests including approved/rejected
    if (!status || status === 'all') {
      // Default: only show pending requests in Request List
      schedules = schedules.filter(s => s.status === 'pending');
      console.log('Filtered to pending only:', schedules.length);
    } else {
      // Apply specific status filter if provided
      schedules = schedules.filter(s => s.status === status);
      console.log(`Filtered to ${status}:`, schedules.length);
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
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found'
      });
    }

    const roomData = roomDoc.data();
    
    console.log('=== Removing Tenant ===');
    console.log('Room ID:', roomId);
    console.log('Room Data:', {
      name: roomData.name,
      status: roomData.status,
      occupiedBy: roomData.occupiedBy
    });

    // Find the associated request for this room
    const requestsSnapshot = await firestore
      .collection('privateOfficeRooms')
      .doc('data')
      .collection('requests')
      .where('roomId', '==', roomId)
      .where('status', '==', 'approved')
      .get();

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
      console.log('Request cancelled:', requestDoc.id);
    }

    console.log('Tenant removed successfully');

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
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Request not found'
      });
    }

    const currentRequest = requestDoc.data();
    
    console.log('=== Updating Request Status ===');
    console.log('Request ID:', requestId);
    console.log('Current Request:', {
      clientName: currentRequest.clientName,
      status: currentRequest.status,
      roomId: currentRequest.roomId,
      room: currentRequest.room
    });
    console.log('New Status:', status);
    
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
          const roomDoc = await roomRef.get();
          
          if (roomDoc.exists) {
            await roomRef.update({
              status: 'Occupied',
              occupiedBy: currentRequest.clientName,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
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
          const roomDoc = await roomRef.get();
          
          if (roomDoc.exists) {
            await roomRef.update({
              status: 'Vacant',
              occupiedBy: admin.firestore.FieldValue.delete(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        } catch (roomError) {
          console.error('Error updating room status:', roomError);
        }
      }
    }

    // Ensure the update is committed to Firebase
    await requestRef.update(updateData);

    console.log('Request status updated successfully to:', status);
    console.log('Updated request data:', updateData);

    // Verify the update was saved by reading the document back
    const updatedDoc = await requestRef.get();
    console.log('Verification - Updated request in Firebase:', {
      id: updatedDoc.id,
      status: updatedDoc.data().status,
      clientName: updatedDoc.data().clientName,
      room: updatedDoc.data().room
    });

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