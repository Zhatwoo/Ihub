import admin from 'firebase-admin';
import { getFirestore } from '../../../config/firebase.js';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

/**
 * Create new schedule/booking
 */
export const createSchedule = async (req, res) => {
  try {
    const scheduleData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const userId = scheduleData.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'userId is required'
      });
    }
    
    // Ensure user document exists
    const userRef = firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId);
    
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Create booking in user-specific path: /accounts/client/users/{userId}/request/office/{officeRequestId}
    // Generate a unique ID for this booking
    const bookingRef = userRef.collection('request').doc('office').collection('bookings').doc();
    
    await bookingRef.set({
      ...scheduleData,
      status: scheduleData.status || 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const newBooking = await bookingRef.get();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        id: newBooking.id,
        ...newBooking.data()
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create booking'
    });
  }
};

/**
 * Get schedule by ID
 */
export const getScheduleById = async (req, res) => {
  try {
    const { userId, scheduleId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    if (!userId || !scheduleId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'userId and scheduleId are required'
      });
    }
    
    const scheduleDoc = await firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .collection('request')
      .doc('office')
      .collection('bookings')
      .doc(scheduleId)
      .get();

    if (!scheduleDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: scheduleDoc.id,
        ...scheduleDoc.data()
      }
    });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch booking'
    });
  }
};

/**
 * Get schedules for a specific user
 */
export const getUserSchedules = async (req, res) => {
  try {
    const { userId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const bookingsSnapshot = await firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .collection('request')
      .doc('office')
      .collection('bookings')
      .get();
    
    const schedules = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Get user schedules error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch user schedules'
    });
  }
};

/**
 * Delete schedule/booking
 */
export const deleteSchedule = async (req, res) => {
  try {
    const { userId, scheduleId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    if (!userId || !scheduleId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'userId and scheduleId are required'
      });
    }

    const scheduleRef = firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .collection('request')
      .doc('office')
      .collection('bookings')
      .doc(scheduleId);
      
    const scheduleDoc = await scheduleRef.get();

    if (!scheduleDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Booking not found'
      });
    }

    const scheduleData = scheduleDoc.data();

    // If the booking was approved, free up the room
    if (scheduleData.status === 'approved' && scheduleData.roomId) {
      try {
        const roomRef = firestore.collection('privateOfficeRooms').doc('data').collection('office').doc(scheduleData.roomId);
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

    // Delete the booking
    await scheduleRef.delete();

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete booking'
    });
  }
};
