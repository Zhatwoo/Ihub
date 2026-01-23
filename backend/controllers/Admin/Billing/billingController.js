// Admin Billing controller
// Handles billing records for all service types

import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

/**
 * Convert Firestore timestamps to ISO strings
 */
const convertTimestamps = (obj) => {
  if (!obj) return obj;
  
  const converted = { ...obj };
  
  // Convert startDate
  if (converted.startDate) {
    if (typeof converted.startDate === 'object' && converted.startDate.toDate) {
      converted.startDate = converted.startDate.toDate().toISOString();
    } else if (!(typeof converted.startDate === 'string')) {
      converted.startDate = new Date(converted.startDate).toISOString();
    }
  }
  
  // Convert createdAt
  if (converted.createdAt) {
    if (typeof converted.createdAt === 'object' && converted.createdAt.toDate) {
      converted.createdAt = converted.createdAt.toDate().toISOString();
    } else if (!(typeof converted.createdAt === 'string')) {
      converted.createdAt = new Date(converted.createdAt).toISOString();
    }
  }
  
  // Convert assignedAt
  if (converted.assignedAt) {
    if (typeof converted.assignedAt === 'object' && converted.assignedAt.toDate) {
      converted.assignedAt = converted.assignedAt.toDate().toISOString();
    } else if (!(typeof converted.assignedAt === 'string')) {
      converted.assignedAt = new Date(converted.assignedAt).toISOString();
    }
  }
  
  return converted;
};

/**
 * Get billing dashboard data
 */
export const getBillingDashboard = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // For now, return empty dashboard data
    res.json({
      success: true,
      data: {
        revenueStats: {
          total: 0,
          pending: 0,
          overdue: 0
        },
        monthlyRevenue: [],
        recentInvoices: []
      }
    });
  } catch (error) {
    console.error('Get billing dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch billing dashboard data'
    });
  }
};

/**
 * Get invoices with filtering
 */
export const getInvoices = async (req, res) => {
  try {
    // For now, return empty invoices
    res.json({
      success: true,
      data: {
        invoices: [],
        totalCount: 0
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch invoices'
    });
  }
};

/**
 * Get billing stats and records for all service types
 */
export const getBillingStats = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    console.log('📖 FIRESTORE READ: Fetching billing data from all collections...');

    // Fetch all billing data from different collections
    let privateOfficeSnapshot, newPrivateOfficeSnapshot, virtualOfficeSnapshot, deskAssignmentsSnapshot;
    
    try {
      privateOfficeSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('requests').get();
      console.log(`📖 FIRESTORE READ: privateOfficeRooms/data/requests - ${privateOfficeSnapshot.docs.length} documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch privateOfficeRooms/data/requests:', err.message);
      privateOfficeSnapshot = { docs: [] };
    }

    // Fetch from new private office path using collection group
    try {
      newPrivateOfficeSnapshot = await firestore.collectionGroup('bookings').get();
      console.log(`📖 FIRESTORE READ: collectionGroup("bookings") - ${newPrivateOfficeSnapshot.docs.length} total documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch new private office bookings path:', err.message);
      newPrivateOfficeSnapshot = { docs: [] };
    }

    try {
      virtualOfficeSnapshot = await firestore.collection('virtual-office-clients').get();
      console.log(`📖 FIRESTORE READ: virtual-office-clients - ${virtualOfficeSnapshot.docs.length} documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch virtual-office-clients:', err.message);
      virtualOfficeSnapshot = { docs: [] };
    }

    try {
      deskAssignmentsSnapshot = await firestore.collection('desk-assignments').get();
      console.log(`📖 FIRESTORE READ: desk-assignments - ${deskAssignmentsSnapshot.docs.length} documents`);
    } catch (err) {
      console.warn('⚠️ Could not fetch desk-assignments:', err.message);
      deskAssignmentsSnapshot = { docs: [] };
    }

    // Process Private Office billing from OLD path - ONLY approved/active tenants
    const privateOfficeBilling = privateOfficeSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return convertTimestamps({
          id: doc.id,
          ...data,
          type: 'private-office',
          clientName: data.clientName || data.name || data.fullName || 'Unknown',
          email: data.email || data.emailAddress || '',
          contactNumber: data.contactNumber || data.phone || data.phoneNumber || data.contact || '',
          companyName: data.companyName || data.company || data.businessName || '',
          room: data.room || data.roomName || data.office || '',
          status: data.status || 'pending',
          amount: data.amount || data.totalAmount || data.price || 0,
          paymentStatus: data.paymentStatus || 'unpaid',
          startDate: data.startDate || data.createdAt || data.registeredAt || null
        });
      })
      .filter(record => record.status === 'approved' || record.status === 'active' || record.status === 'ongoing');

    console.log(`✅ Processed ${privateOfficeBilling.length} Private Office billing records from old path (tenants only)`);

    // Process Private Office billing from NEW path - ONLY approved/active tenants
    const newPrivateOfficeBilling = newPrivateOfficeSnapshot.docs
      .map(doc => {
        // Extract userId from path: /accounts/client/users/{userId}/request/office/bookings/{bookingId}
        const pathParts = doc.ref.path.split('/');
        const userId = pathParts[3];
        
        const data = doc.data();
        return convertTimestamps({
          id: doc.id,
          userId,
          ...data,
          type: 'private-office',
          clientName: data.clientName || data.name || data.fullName || 'Unknown',
          email: data.email || data.emailAddress || '',
          contactNumber: data.contactNumber || data.phone || data.phoneNumber || data.contact || '',
          companyName: data.companyName || data.company || data.businessName || '',
          room: data.room || data.roomName || data.office || '',
          status: data.status || 'pending',
          amount: data.amount || data.totalAmount || data.price || 0,
          paymentStatus: data.paymentStatus || 'unpaid',
          startDate: data.startDate || data.createdAt || data.registeredAt || null
        });
      })
      .filter(record => record.status === 'approved' || record.status === 'active' || record.status === 'ongoing');

    console.log(`✅ Processed ${newPrivateOfficeBilling.length} Private Office billing records from new path (tenants only)`);

    // Combine private office billing from both paths
    const allPrivateOfficeBilling = [...privateOfficeBilling, ...newPrivateOfficeBilling];

    // Process Virtual Office billing - ONLY active tenants
    const virtualOfficeBilling = virtualOfficeSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return convertTimestamps({
          id: doc.id,
          ...data,
          type: 'virtual-office',
          clientName: data.fullName || data.clientName || data.name || 'Unknown',
          email: data.email || data.emailAddress || '',
          contactNumber: data.phoneNumber || data.contactNumber || data.phone || data.contact || '',
          companyName: data.company || data.companyName || data.businessName || '',
          position: data.position || data.jobTitle || '',
          status: data.status || 'active',
          amount: data.amount || data.monthlyFee || data.price || 0,
          paymentStatus: data.paymentStatus || 'unpaid',
          startDate: data.dateStart || data.preferredStartDate || data.startDate || data.createdAt || null
        });
      })
      .filter(record => record.status === 'active' || record.status === 'approved');

    console.log(`✅ Processed ${virtualOfficeBilling.length} Virtual Office billing records (tenants only)`);

    // Process Dedicated Desk billing - ONLY tenants (not employees)
    const dedicatedDeskBilling = deskAssignmentsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return convertTimestamps({
          id: doc.id,
          ...data,
          type: 'dedicated-desk',
          clientName: data.name || data.fullName || data.clientName || 'Unknown',
          email: data.email || data.emailAddress || '',
          contactNumber: data.contactNumber || data.phone || data.phoneNumber || data.contact || '',
          companyName: data.company || data.companyName || data.businessName || '',
          desk: data.desk || data.deskTag || doc.id,
          status: 'active',
          amount: data.amount || data.monthlyFee || data.price || 0,
          paymentStatus: data.paymentStatus || 'unpaid',
          occupantType: data.type || 'Tenant', // Track if it's Employee or Tenant
          startDate: data.assignedAt || data.startDate || data.createdAt || null // Use assignedAt for desk assignments
        });
      })
      .filter(record => record.occupantType === 'Tenant' || !record.occupantType); // Only show Tenants, exclude Employees

    console.log(`✅ Processed ${dedicatedDeskBilling.length} Dedicated Desk billing records (tenants only, employees excluded)`);

    // Calculate stats
    const stats = {
      privateOffice: allPrivateOfficeBilling.length,
      virtualOffice: virtualOfficeBilling.length,
      dedicatedDesk: dedicatedDeskBilling.length,
      total: allPrivateOfficeBilling.length + virtualOfficeBilling.length + dedicatedDeskBilling.length
    };

    console.log(`📊 Billing Stats:`, stats);

    res.json({
      success: true,
      data: {
        stats,
        billing: {
          privateOffice: allPrivateOfficeBilling,
          virtualOffice: virtualOfficeBilling,
          dedicatedDesk: dedicatedDeskBilling
        }
      }
    });
  } catch (error) {
    console.error('❌ Get billing stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch billing stats'
    });
  }
};
