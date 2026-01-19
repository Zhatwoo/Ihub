// Schedules/Bookings controller
// Handles booking and schedule management operations using Firestore

import { getFirestore } from '../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../utils/firestoreHelper.js';

/**
 * Get all schedules/bookings
 */
export const getAllSchedules = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const schedulesSnapshot = await firestore.collection('schedules').get();
    
    const schedules = schedulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Get all schedules error:', error);
    
    if (error.message && error.message.includes('not initialized')) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database is not connected. Please configure Firebase Admin SDK credentials in backend/.env'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch schedules'
    });
  }
};

/**
 * Get schedule by ID
 */
export const getScheduleById = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const scheduleDoc = await firestore.collection('schedules').doc(scheduleId).get();

    if (!scheduleDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Schedule not found'
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
    console.error('Get schedule by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch schedule'
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
    
    // Query schedules by userId
    const schedulesSnapshot = await firestore
      .collection('schedules')
      .where('userId', '==', userId)
      .get();
    
    const schedules = schedulesSnapshot.docs.map(doc => ({
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
 * Create new schedule/booking
 */
export const createSchedule = async (req, res) => {
  try {
    const scheduleData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const scheduleRef = await firestore.collection('schedules').add({
      ...scheduleData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const newSchedule = await scheduleRef.get();

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: {
        id: newSchedule.id,
        ...newSchedule.data()
      }
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create schedule'
    });
  }
};

/**
 * Update schedule
 */
export const updateSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updateData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const scheduleRef = firestore.collection('schedules').doc(scheduleId);
    const scheduleDoc = await scheduleRef.get();

    if (!scheduleDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Schedule not found'
      });
    }

    await scheduleRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedSchedule = await scheduleRef.get();

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: {
        id: updatedSchedule.id,
        ...updatedSchedule.data()
      }
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update schedule'
    });
  }
};

/**
 * Delete schedule/booking
 */
export const deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const scheduleRef = firestore.collection('schedules').doc(scheduleId);
    const scheduleDoc = await scheduleRef.get();

    if (!scheduleDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Schedule not found'
      });
    }

    await scheduleRef.delete();

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete schedule'
    });
  }
};
