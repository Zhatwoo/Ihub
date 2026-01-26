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
 * Fetches from bills collection: /accounts/client/users/{userId}/bills/{billId}
 */
export const getBillingStats = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Fetch all users
    const usersSnapshot = await firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .get();

    // Fetch bills for each user
    const allBills = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      try {
        const billsSnapshot = await firestore
          .collection('accounts')
          .doc('client')
          .collection('users')
          .doc(userId)
          .collection('bills')
          .get();
        
        if (billsSnapshot.docs.length > 0) {
          billsSnapshot.docs.forEach(billDoc => {
            const billData = billDoc.data();
            allBills.push(convertTimestamps({
              id: billDoc.id,
              userId,
              ...billData,
              // Map serviceType to type field for frontend compatibility
              type: billData.serviceType === 'Private Office' ? 'private-office' 
                  : billData.serviceType === 'Virtual Office' ? 'virtual-office'
                  : billData.serviceType === 'Dedicated Desk' ? 'dedicated-desk'
                  : 'unknown',
              // Ensure all required fields are present
              clientName: billData.clientName || userData.fullName || userData.name || 'Unknown',
              email: billData.email || userData.email || '',
              contactNumber: billData.contactNumber || userData.phoneNumber || userData.phone || '',
              companyName: billData.companyName || userData.company || '',
              room: billData.suite || billData.room || '',
              desk: billData.desk || '',
              amount: billData.rentFee || 0,
              paymentStatus: billData.status || 'unpaid'
            }));
          });
        }
      } catch (err) {
        console.warn(`⚠️ Could not fetch bills for user ${userId}:`, err.message);
      }
    }

    // Separate bills by service type
    const privateOfficeBilling = allBills.filter(bill => bill.type === 'private-office');
    const virtualOfficeBilling = allBills.filter(bill => bill.type === 'virtual-office');
    const dedicatedDeskBilling = allBills.filter(bill => bill.type === 'dedicated-desk');

    // Calculate stats
    const stats = {
      privateOffice: privateOfficeBilling.length,
      virtualOffice: virtualOfficeBilling.length,
      dedicatedDesk: dedicatedDeskBilling.length,
      total: allBills.length
    };

    res.json({
      success: true,
      data: {
        stats,
        billing: {
          privateOffice: privateOfficeBilling,
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

/**
 * Record payment for a bill
 * Updates bill status to "paid" and adds late fee and damage fee
 */
export const recordPayment = async (req, res) => {
  try {
    const { billId } = req.params;
    const { userId, lateFee, damageFee } = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'userId is required'
      });
    }

    // Get the bill reference
    const billRef = firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .collection('bills')
      .doc(billId);

    const billDoc = await billRef.get();

    if (!billDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Bill not found'
      });
    }

    // Update the bill with payment information
    await billRef.update({
      status: 'paid',
      lateFee: lateFee || 0,
      damageFee: damageFee || 0,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        billId,
        userId,
        status: 'paid',
        lateFee: lateFee || 0,
        damageFee: damageFee || 0
      }
    });
  } catch (error) {
    console.error('❌ Record payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to record payment'
    });
  }
};
