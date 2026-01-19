// Rooms controller
// Handles room management operations using Firestore

import { getFirestore } from '../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../utils/firestoreHelper.js';

/**
 * Get all rooms
 */
export const getAllRooms = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const roomsSnapshot = await firestore.collection('rooms').get();
    
    const rooms = roomsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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
    
    const roomDoc = await firestore.collection('rooms').doc(roomId).get();

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
    
    const roomRef = await firestore.collection('rooms').add({
      ...roomData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

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
    
    const roomRef = firestore.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Room not found'
      });
    }

    await roomRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

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
    
    const roomRef = firestore.collection('rooms').doc(roomId);
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
