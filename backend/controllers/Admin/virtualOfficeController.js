// Admin Virtual Office controller
// Handles virtual office client management and processing

import { getFirestore } from '../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../utils/firestoreHelper.js';

/**
 * Get all virtual office occupants (tenants and employees combined)
 */
export const getAllOccupants = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Get virtual office clients and desk assignments
    const [virtualOfficeSnapshot, deskAssignmentsSnapshot] = await Promise.all([
      firestore.collection('virtual-office-clients').get(),
      firestore.collection('desk-assignments').get()
    ]);

    // Process virtual office clients (tenants)
    const virtualOfficeClients = virtualOfficeSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      type: 'Virtual Office Client',
      source: 'virtual-office'
    }));

    // Process desk assignments (employees/tenants)
    const deskAssignments = deskAssignmentsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      source: 'desk-assignment'
    }));

    // Combine all occupants
    const allOccupants = [
      // Virtual office clients
      ...virtualOfficeClients.map(client => ({
        id: client.id,
        name: client.fullName || 'N/A',
        email: client.email || 'N/A',
        phone: client.phoneNumber || 'N/A',
        company: client.company || 'N/A',
        position: client.position || 'N/A',
        type: 'Virtual Office Client',
        status: client.status || 'active',
        startDate: client.dateStart || client.preferredStartDate || client.createdAt,
        source: 'virtual-office',
        details: {
          businessType: client.businessType,
          services: client.services,
          address: client.address
        }
      })),
      // Desk assignments (tenants and employees)
      ...deskAssignments.map(assignment => ({
        id: assignment.id,
        name: assignment.name || 'N/A',
        email: assignment.email || 'N/A',
        phone: assignment.contactNumber || 'N/A',
        company: assignment.company || 'N/A',
        position: assignment.position || assignment.type || 'N/A',
        type: assignment.type === 'Tenant' ? 'Dedicated Desk Tenant' : 'Dedicated Desk Employee',
        status: 'active',
        startDate: assignment.assignedAt || assignment.createdAt,
        source: 'desk-assignment',
        details: {
          desk: assignment.desk,
          assignedAt: assignment.assignedAt
        }
      }))
    ];

    // Sort by most recent first
    allOccupants.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));

    // Calculate stats
    const stats = {
      total: allOccupants.length,
      virtualOfficeClients: virtualOfficeClients.length,
      deskTenants: deskAssignments.filter(d => d.type === 'Tenant').length,
      deskEmployees: deskAssignments.filter(d => d.type === 'Employee').length,
      activeClients: virtualOfficeClients.filter(c => c.status === 'active').length,
      pendingClients: virtualOfficeClients.filter(c => c.status === 'pending').length
    };

    res.json({
      success: true,
      data: {
        occupants: allOccupants,
        stats,
        totalCount: allOccupants.length
      }
    });
  } catch (error) {
    console.error('Get all occupants error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch all occupants'
    });
  }
};

/**
 * Get virtual office clients with filtering and sorting
 */
export const getVirtualOfficeClients = async (req, res) => {
  try {
    const { status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    const clientsSnapshot = await firestore.collection('virtual-office-clients').get();
    let clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Apply status filter
    if (status && status !== 'all') {
      clients = clients.filter(client => client.status === status);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      clients = clients.filter(client =>
        (client.fullName && client.fullName.toLowerCase().includes(searchLower)) ||
        (client.email && client.email.toLowerCase().includes(searchLower)) ||
        (client.company && client.company.toLowerCase().includes(searchLower)) ||
        (client.phoneNumber && client.phoneNumber.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    clients.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'fullName') {
        comparison = (a.fullName || '').localeCompare(b.fullName || '');
      } else if (sortBy === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '');
      } else if (sortBy === 'company') {
        comparison = (a.company || '').localeCompare(b.company || '');
      } else if (sortBy === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Calculate stats
    const allClients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const stats = {
      total: allClients.length,
      inquiry: allClients.filter(c => c.status === 'inquiry').length,
      active: allClients.filter(c => c.status === 'active').length,
      inactive: allClients.filter(c => c.status === 'inactive').length,
      pending: allClients.filter(c => c.status === 'pending').length
    };

    res.json({
      success: true,
      data: {
        clients,
        stats,
        totalCount: clients.length
      }
    });
  } catch (error) {
    console.error('Get virtual office clients error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch virtual office clients'
    });
  }
};

/**
 * Get all virtual office clients (for client access)
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
 * Update client status
 */
export const updateClientStatus = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { status, adminNotes } = req.body;
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
        message: 'Client not found'
      });
    }

    const updateData = {
      status,
      adminNotes: adminNotes || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await clientRef.update(updateData);

    res.json({
      success: true,
      message: `Client status updated to ${status}`,
      data: {
        id: clientId,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Update client status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update client status'
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