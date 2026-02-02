// Admin Virtual Office controller
// Handles virtual office client management and processing

import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

/**
 * Get all virtual office occupants (tenants and employees combined)
 */
export const getAllOccupants = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Get virtual office tenants from new path
    const virtualOfficeTenantsSnapshot = await firestore
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .get();
    
    // Fetch desk assignments from approved requests using collection group
    const requestsSnapshot = await firestore
      .collectionGroup('requests')
      .where('status', '==', 'approved')
      .get();
    
    // Filter to only desk requests
    const deskAssignments = requestsSnapshot.docs
      .filter(doc => doc.ref.path.includes('/request/desk/'))
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          source: 'desk-assignment',
          desk: data.assignedDesk || data.desk || doc.id
        };
      });

    // Process virtual office tenants
    const virtualOfficeTenants = virtualOfficeTenantsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      type: 'Virtual Office Client',
      source: 'virtual-office'
    }));

    // Combine all occupants
    const allOccupants = [
      // Virtual office tenants
      ...virtualOfficeTenants.map(tenant => ({
        id: tenant.id,
        name: tenant.fullName || 'N/A',
        email: tenant.email || 'N/A',
        phone: tenant.phoneNumber || 'N/A',
        company: tenant.company || 'N/A',
        position: tenant.position || 'N/A',
        type: 'Virtual Office Client',
        status: tenant.status || 'active',
        startDate: tenant.dateStart || tenant.preferredStartDate || tenant.createdAt,
        source: 'virtual-office',
        details: {
          businessType: tenant.businessType,
          services: tenant.services,
          address: tenant.address
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
      virtualOfficeClients: virtualOfficeTenants.length,
      deskTenants: deskAssignments.filter(d => d.type === 'Tenant').length,
      deskEmployees: deskAssignments.filter(d => d.type === 'Employee').length,
      activeClients: virtualOfficeTenants.filter(c => c.status === 'active').length,
      pendingClients: virtualOfficeTenants.filter(c => c.status === 'pending').length
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

    const tenantsSnapshot = await firestore
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .get();
    let tenants = tenantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Apply status filter
    if (status && status !== 'all') {
      tenants = tenants.filter(tenant => tenant.status === status);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      tenants = tenants.filter(tenant =>
        (tenant.fullName && tenant.fullName.toLowerCase().includes(searchLower)) ||
        (tenant.email && tenant.email.toLowerCase().includes(searchLower)) ||
        (tenant.company && tenant.company.toLowerCase().includes(searchLower)) ||
        (tenant.phoneNumber && tenant.phoneNumber.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    tenants.sort((a, b) => {
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
    const allTenants = tenantsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const stats = {
      total: allTenants.length,
      inquiry: allTenants.filter(c => c.status === 'inquiry').length,
      active: allTenants.filter(c => c.status === 'active').length,
      inactive: allTenants.filter(c => c.status === 'inactive').length,
      pending: allTenants.filter(c => c.status === 'pending').length
    };

    res.json({
      success: true,
      data: {
        clients: tenants,
        stats,
        totalCount: tenants.length
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
    
    const tenantsSnapshot = await firestore
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .get();
    
    const tenants = tenantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: tenants
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
    
    const tenantDoc = await firestore
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .doc(clientId)
      .get();

    if (!tenantDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Virtual office client not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: tenantDoc.id,
        ...tenantDoc.data()
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
    
    // Query virtual office tenants by userId or email
    const user = req.user; // From authenticate middleware
    const userEmail = user?.email?.toLowerCase();
    const userUid = user?.uid;
    
    // Try to fetch by userId field first
    let tenantsQuery = firestore
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .where('userId', '==', userId);
    
    const snapshot = await tenantsQuery.get();
    let tenants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Also check by email if no results and email is available
    if (tenants.length === 0 && userEmail) {
      const emailQuery = firestore
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .where('email', '==', userEmail);
      
      const emailSnapshot = await emailQuery.get();
      tenants = emailSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    // Also check by userUid if still no results
    if (tenants.length === 0 && userUid) {
      const uidQuery = firestore
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .where('userId', '==', userUid);
      
      const uidSnapshot = await uidQuery.get();
      tenants = uidSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    res.json({
      success: true,
      data: tenants
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
    
    // Store tenant under /accounts/virtual-tenants/tenants/{tenantId}
    const tenantRef = firestore
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .doc();
    
    const tenantId = tenantRef.id;

    await tenantRef.set({
      ...clientData,
      serviceType: 'virtual-office',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const newTenant = await tenantRef.get();
    const newTenantData = newTenant.data();

    console.log(`✅ Virtual office tenant created with ID: ${tenantId}`);

    // Create initial bill under /accounts/virtual-tenants/tenants/{tenantId}/bills
    let billCreated = false;
    let billError = null;
    
    try {
      console.log(`🔄 Creating bill for virtual office tenant ${tenantId}...`);
      
      const billRef = firestore
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .doc(tenantId)
        .collection('bills')
        .doc();

      const startDate = new Date();
      
      const billData = {
        clientName: clientData.fullName || 'N/A',
        companyName: clientData.company || 'N/A',
        email: clientData.email || 'N/A',
        contactNumber: clientData.phoneNumber || 'N/A',
        serviceType: 'virtual-office',
        assignedResource: clientData.package || clientData.plan || 'Virtual Office',
        amount: 0, // Admin must set via Edit Bill
        cusaFee: 0,
        parkingFee: 0,
        lateFee: 0,
        damageFee: 0,
        feePeriod: null, // Admin must set via Edit Bill
        startDate: admin.firestore.Timestamp.fromDate(startDate),
        dueDate: null, // Admin must set via Edit Bill
        status: 'inactive', // Newly created bills start as inactive
        tenantId: tenantId, // Reference to virtual office tenant
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await billRef.set(billData);
      
      billCreated = true;
      console.log(`✅ Created initial bill at /accounts/virtual-tenants/tenants/${tenantId}/bills/${billRef.id}`);
    } catch (error) {
      billError = error;
      console.error('❌ Error creating virtual office bill:', error);
    }

    res.status(201).json({
      success: true,
      message: billCreated 
        ? 'Virtual office tenant and bill created successfully' 
        : `Virtual office tenant created but bill creation failed: ${billError?.message || 'Unknown error'}`,
      billCreated: billCreated,
      billError: billError ? billError.message : null,
      data: {
        id: newTenant.id,
        ...newTenantData
      }
    });
  } catch (error) {
    console.error('Create virtual office tenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create virtual office tenant'
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
    
    const tenantRef = firestore
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .doc(clientId);
    const tenantDoc = await tenantRef.get();

    if (!tenantDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Virtual office client not found'
      });
    }

    await tenantRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedTenant = await tenantRef.get();

    res.json({
      success: true,
      message: 'Virtual office client updated successfully',
      data: {
        id: updatedTenant.id,
        ...updatedTenant.data()
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

    const tenantRef = firestore
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .doc(clientId);
    const tenantDoc = await tenantRef.get();

    if (!tenantDoc.exists) {
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

    await tenantRef.update(updateData);

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
    
    const tenantRef = firestore
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .doc(clientId);
    const tenantDoc = await tenantRef.get();

    if (!tenantDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Virtual office client not found'
      });
    }

    // Delete associated bills
    try {
      const billsSnapshot = await firestore
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .doc(clientId)
        .collection('bills')
        .get();

      if (billsSnapshot.docs.length > 0) {
        const batch = firestore.batch();
        billsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`✅ Deleted ${billsSnapshot.docs.length} bill(s) for virtual office tenant ${clientId}`);
      }
    } catch (billError) {
      console.error('Error deleting bills:', billError);
      // Continue even if bill deletion fails
    }

    // Delete the tenant
    await tenantRef.delete();

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

