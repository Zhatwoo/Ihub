// Admin Schedules/Bookings controller
// Handles booking and schedule management operations using Firestore

import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

/**
 * Get all schedules/bookings from privateOfficeRooms/data/requests collection
 */
export const getAllSchedules = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const schedulesSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('requests').get();
    
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
    
    const scheduleDoc = await firestore.collection('privateOfficeRooms').doc('data').collection('requests').doc(scheduleId).get();

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
      .collection('privateOfficeRooms').doc('data').collection('requests')
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
    
    const scheduleRef = await firestore.collection('privateOfficeRooms').doc('data').collection('requests').add({
      ...scheduleData,
      status: scheduleData.status || 'pending', // Default to pending
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
 * Update schedule - includes logic for room status updates when approved
 */
export const updateSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updateData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const scheduleRef = firestore.collection('privateOfficeRooms').doc('data').collection('requests').doc(scheduleId);
    const scheduleDoc = await scheduleRef.get();

    if (!scheduleDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Schedule not found'
      });
    }

    const currentSchedule = scheduleDoc.data();
    
    // Check if request is being approved
    if (updateData.status === 'approved' && currentSchedule.status !== 'approved') {
      // Update the room status to "Occupied" and add occupiedBy field
      if (currentSchedule.roomId && currentSchedule.clientName) {
        try {
          const roomRef = firestore.collection('privateOfficeRooms').doc('data').collection('office').doc(currentSchedule.roomId);
          const roomDoc = await roomRef.get();
          
          if (roomDoc.exists) {
            await roomRef.update({
              status: 'Occupied',
              occupiedBy: currentSchedule.clientName,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Room ${currentSchedule.roomId} status updated to Occupied by ${currentSchedule.clientName}`);
          }
        } catch (roomError) {
          console.error('Error updating room status:', roomError);
          // Continue with schedule update even if room update fails
        }
      }
    }
    
    // Check if request is being rejected or cancelled (free up the room)
    if ((updateData.status === 'rejected' || updateData.status === 'cancelled') && currentSchedule.status === 'approved') {
      // Update the room status back to "Vacant" and remove occupiedBy field
      if (currentSchedule.roomId) {
        try {
          const roomRef = firestore.collection('privateOfficeRooms').doc('data').collection('office').doc(currentSchedule.roomId);
          const roomDoc = await roomRef.get();
          
          if (roomDoc.exists) {
            const updateRoomData = {
              status: 'Vacant',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            // Remove occupiedBy field
            await roomRef.update({
              ...updateRoomData,
              occupiedBy: admin.firestore.FieldValue.delete()
            });
            console.log(`Room ${currentSchedule.roomId} status updated to Vacant`);
          }
        } catch (roomError) {
          console.error('Error updating room status:', roomError);
          // Continue with schedule update even if room update fails
        }
      }
    }

    // Update the schedule
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
 * Get room occupancy status (public/authenticated)
 * Returns which rooms are currently occupied without exposing full schedule details
 */
export const getRoomOccupancy = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const now = new Date();
    const occupiedRoomIds = new Set();
    const occupiedRoomNames = new Set();
    
    // Get all schedules to check occupancy
    const schedulesSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('requests').get();
    
    schedulesSnapshot.docs.forEach((doc) => {
      const schedule = doc.data();
      
      // Check if schedule is for private office
      const isPrivateOffice = schedule.requestType === 'privateroom' || 
                             schedule.requestType === 'private-office' ||
                             schedule.requestType === 'private_office' ||
                             (!schedule.requestType && schedule.room && (schedule.roomId || schedule.room)) ||
                             (schedule.room && schedule.roomId);
      
      // Check if status indicates the room is occupied
      const isOccupiedStatus = schedule.status === 'active' || 
                              schedule.status === 'ongoing' || 
                              schedule.status === 'upcoming' ||
                              schedule.status === 'approved';
      
      if (isPrivateOffice && isOccupiedStatus) {
        const startDate = schedule.startDate ? new Date(schedule.startDate) : null;
        const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
        
        let isCurrentlyOccupied = false;
        
        // Active/ongoing/approved always means occupied
        if (schedule.status === 'active' || schedule.status === 'ongoing' || schedule.status === 'approved') {
          isCurrentlyOccupied = true;
        } else if (schedule.status === 'upcoming' && startDate) {
          // For upcoming, check if current date/time is within booking period
          const startDateOnly = new Date(startDate);
          startDateOnly.setHours(0, 0, 0, 0);
          const nowDateOnly = new Date(now);
          nowDateOnly.setHours(0, 0, 0, 0);
          
          if (!endDate) {
            // Single day booking
            if (startDateOnly.getTime() <= nowDateOnly.getTime()) {
              if (schedule.startTime && schedule.endTime) {
                const [startHour, startMin] = schedule.startTime.split(':').map(Number);
                const [endHour, endMin] = schedule.endTime.split(':').map(Number);
                const currentHour = now.getHours();
                const currentMin = now.getMinutes();
                const currentTimeInMinutes = currentHour * 60 + currentMin;
                const startTimeInMinutes = startHour * 60 + startMin;
                const endTimeInMinutes = endHour * 60 + endMin;
                
                if (startDateOnly.getTime() < nowDateOnly.getTime() || 
                    (startDateOnly.getTime() === nowDateOnly.getTime() && 
                     currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes)) {
                  isCurrentlyOccupied = true;
                }
              } else {
                isCurrentlyOccupied = true;
              }
            }
          } else {
            // Multi-day booking
            const endDateOnly = new Date(endDate);
            endDateOnly.setHours(23, 59, 59, 999);
            
            if (now >= startDateOnly && now <= endDateOnly) {
              if (schedule.startTime && schedule.endTime) {
                const isStartDate = startDateOnly.getTime() === nowDateOnly.getTime();
                const isEndDate = endDateOnly.getTime() === nowDateOnly.getTime();
                
                if (isStartDate) {
                  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
                  const currentHour = now.getHours();
                  const currentMin = now.getMinutes();
                  const currentTimeInMinutes = currentHour * 60 + currentMin;
                  const startTimeInMinutes = startHour * 60 + startMin;
                  
                  if (currentTimeInMinutes >= startTimeInMinutes) {
                    isCurrentlyOccupied = true;
                  }
                } else if (isEndDate) {
                  const [endHour, endMin] = schedule.endTime.split(':').map(Number);
                  const currentHour = now.getHours();
                  const currentMin = now.getMinutes();
                  const currentTimeInMinutes = currentHour * 60 + currentMin;
                  const endTimeInMinutes = endHour * 60 + endMin;
                  
                  if (currentTimeInMinutes <= endTimeInMinutes) {
                    isCurrentlyOccupied = true;
                  }
                } else {
                  isCurrentlyOccupied = true;
                }
              } else {
                isCurrentlyOccupied = true;
              }
            } else if (now > endDateOnly) {
              isCurrentlyOccupied = true;
            }
          }
        } else if (!startDate) {
          if (schedule.status === 'active' || schedule.status === 'ongoing') {
            isCurrentlyOccupied = true;
          }
        }
        
        if (isCurrentlyOccupied) {
          if (schedule.roomId) {
            occupiedRoomIds.add(schedule.roomId);
          }
          if (schedule.room) {
            occupiedRoomNames.add(schedule.room.toLowerCase().trim());
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        occupiedRoomIds: Array.from(occupiedRoomIds),
        occupiedRoomNames: Array.from(occupiedRoomNames)
      }
    });
  } catch (error) {
    console.error('Get room occupancy error:', error);
    
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
      message: error.message || 'Failed to fetch room occupancy'
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
    
    const scheduleRef = firestore.collection('privateOfficeRooms').doc('data').collection('requests').doc(scheduleId);
    const scheduleDoc = await scheduleRef.get();

    if (!scheduleDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Schedule not found'
      });
    }

    const currentSchedule = scheduleDoc.data();
    
    // If deleting an approved schedule, free up the room
    if (currentSchedule.status === 'approved' && currentSchedule.roomId) {
      try {
        const roomRef = firestore.collection('privateOfficeRooms').doc('data').collection('office').doc(currentSchedule.roomId);
        const roomDoc = await roomRef.get();
        
        if (roomDoc.exists) {
          await roomRef.update({
            status: 'Vacant',
            occupiedBy: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Room ${currentSchedule.roomId} status updated to Vacant (schedule deleted)`);
        }
      } catch (roomError) {
        console.error('Error updating room status on delete:', roomError);
        // Continue with schedule deletion even if room update fails
      }
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