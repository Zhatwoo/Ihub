// Admin Private Office controller
// Handles private office management, requests, and dashboard

import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

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
    let schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

    await requestRef.update(updateData);

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