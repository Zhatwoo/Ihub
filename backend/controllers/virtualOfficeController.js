// Virtual Office controller
// Handles virtual office client management operations using Firestore

import { getFirestore } from '../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../utils/firestoreHelper.js';

/**
 * Get all virtual office clients
 */
export const getAllVirtualOfficeClients = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const clientsSnapshot = await firestore.collection('virtual-office-clients').get();
    
    const clients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Get all virtual office clients error:', error);
    
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
      message: error.message || 'Failed to fetch virtual office clients'
    });
  }
};

/**
 * Get virtual office client by ID
 */
export const getVirtualOfficeClientById = async (req, res) => {
  try {
    const { clientId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const clientDoc = await firestore.collection('virtual-office-clients').doc(clientId).get();

    if (!clientDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Virtual office client not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: clientDoc.id,
        ...clientDoc.data()
      }
    });
  } catch (error) {
    console.error('Get virtual office client by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch virtual office client'
    });
  }
};

/**
 * Get virtual office clients for a specific user (client access)
 * Allows users to fetch their own virtual office bookings
 */
export const getUserVirtualOfficeClients = async (req, res) => {
  try {
    const { userId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // Query virtual office clients by userId or email
    const user = req.user; // From authenticate middleware
    const userEmail = user?.email?.toLowerCase();
    const userUid = user?.uid;
    
    // Try to fetch by userId field first
    let clientsQuery = firestore.collection('virtual-office-clients')
      .where('userId', '==', userId);
    
    const snapshot = await clientsQuery.get();
    let clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Also check by email if no results and email is available
    if (clients.length === 0 && userEmail) {
      const emailQuery = firestore.collection('virtual-office-clients')
        .where('email', '==', userEmail);
      
      const emailSnapshot = await emailQuery.get();
      clients = emailSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    // Also check by userUid if still no results
    if (clients.length === 0 && userUid) {
      const uidQuery = firestore.collection('virtual-office-clients')
        .where('userId', '==', userUid);
      
      const uidSnapshot = await uidQuery.get();
      clients = uidSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Get user virtual office clients error:', error);
    
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
      message: error.message || 'Failed to fetch virtual office clients'
    });
  }
};

/**
 * Create new virtual office client
 */
export const createVirtualOfficeClient = async (req, res) => {
  try {
    const clientData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const clientRef = await firestore.collection('virtual-office-clients').add({
      ...clientData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const newClient = await clientRef.get();

    res.status(201).json({
      success: true,
      message: 'Virtual office client created successfully',
      data: {
        id: newClient.id,
        ...newClient.data()
      }
    });
  } catch (error) {
    console.error('Create virtual office client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create virtual office client'
    });
  }
};

/**
 * Update virtual office client
 */
export const updateVirtualOfficeClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const updateData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const clientRef = firestore.collection('virtual-office-clients').doc(clientId);
    const clientDoc = await clientRef.get();

    if (!clientDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Virtual office client not found'
      });
    }

    await clientRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedClient = await clientRef.get();

    res.json({
      success: true,
      message: 'Virtual office client updated successfully',
      data: {
        id: updatedClient.id,
        ...updatedClient.data()
      }
    });
  } catch (error) {
    console.error('Update virtual office client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update virtual office client'
    });
  }
};

/**
 * Delete virtual office client
 */
export const deleteVirtualOfficeClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const clientRef = firestore.collection('virtual-office-clients').doc(clientId);
    const clientDoc = await clientRef.get();

    if (!clientDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Virtual office client not found'
      });
    }

    await clientRef.delete();

    res.json({
      success: true,
      message: 'Virtual office client deleted successfully'
    });
  } catch (error) {
    console.error('Delete virtual office client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete virtual office client'
    });
  }
};
