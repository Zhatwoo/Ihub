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