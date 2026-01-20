// Rooms controller
// Handles room management operations using Firestore

import { getFirestore } from '../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../utils/firestoreHelper.js';

/**
 * Get all rooms
 * Returns all rooms from privateOfficeRooms collection
 */
export const getAllRooms = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // Fetch all rooms from privateOfficeRooms collection -> office subcollection
    const roomsSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('office').get();
    
    // Map all rooms - make them visible to all clients
    // Filter out rooms that are explicitly marked as hidden/deleted
    const rooms = roomsSnapshot.docs
      .map(doc => {
        const roomData = doc.data();
        return {
          id: doc.id,
          ...roomData
        };
      })
      // Filter out rooms that are deleted or explicitly hidden
      .filter(room => {
        // Include room if:
        // - status is not 'deleted' or 'hidden'
        // - visible is not false
        // - Or if status/visible fields don't exist (default to visible)
        const status = room.status?.toLowerCase();
        const visible = room.visible !== false; // Default to true if not set
        const isDeleted = status === 'deleted' || status === 'hidden';
        
        return visible && !isDeleted;
      });

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Get all rooms error:', error);
    
    // Check if Firestore is not initialized
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
      message: error.message || 'Failed to fetch rooms'
    });
  }
};

/**
 * Get room by ID
 */
export const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const roomDoc = await firestore.collection('privateOfficeRooms').doc('data').collection('office').doc(roomId).get();

    if (!roomDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: roomDoc.id,
        ...roomDoc.data()
      }
    });
  } catch (error) {
    console.error('Get room by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch room'
    });
  }
};

/**
 * Create new room
 */
export const createRoom = async (req, res) => {
  try {
    const roomData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // Ensure room has all required fields with defaults
    const roomDataWithDefaults = {
      image: roomData.image || '/rooms/default.png', // Image filename
      name: roomData.name, // Name of office
      rentFee: roomData.rentFee, // Rent Fee
      currency: roomData.currency || 'PHP', // Currency
      rentFeePeriod: roomData.rentFeePeriod || 'per hour', // Rent fee period
      description: roomData.description || '', // Description
      inclusions: roomData.inclusions || '', // Inclusions
      status: 'Vacant', // Default status is Vacant (Vacant or Occupied)
      visible: true, // Make room visible to all clients
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const roomRef = await firestore.collection('privateOfficeRooms').doc('data').collection('office').add(roomDataWithDefaults);

    const newRoom = await roomRef.get();

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        id: newRoom.id,
        ...newRoom.data()
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create room'
    });
  }
};

/**
 * Update room
 */
export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const updateData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const roomRef = firestore.collection('privateOfficeRooms').doc('data').collection('office').doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found'
      });
    }

    // Ensure room remains visible to all clients unless explicitly set to hidden
    const updateDataWithDefaults = {
      ...updateData,
      // If visible is not explicitly set to false, keep it true (visible to all clients)
      visible: updateData.visible !== undefined ? updateData.visible : true,
      // Ensure status is valid (Vacant or Occupied)
      status: updateData.status && ['Vacant', 'Occupied'].includes(updateData.status) ? updateData.status : roomDoc.data().status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await roomRef.update(updateDataWithDefaults);

    const updatedRoom = await roomRef.get();

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: {
        id: updatedRoom.id,
        ...updatedRoom.data()
      }
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update room'
    });
  }
};

/**
 * Delete room
 */
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const roomRef = firestore.collection('privateOfficeRooms').doc('data').collection('office').doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found'
      });
    }

    await roomRef.delete();

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete room'
    });
  }
};
