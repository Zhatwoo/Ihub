// Private Office Billing Controller
// Handles fetching and updating billing details for private office tenants

import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

/**
 * Convert Firestore timestamps to ISO strings
 */
const convertTimestamps = (obj) => {
  if (!obj) return obj;
  
  const converted = { ...obj };
  
  // Convert all date fields
  ['startDate', 'createdAt', 'assignedAt', 'updatedAt', 'registeredAt'].forEach(field => {
    if (converted[field]) {
      if (typeof converted[field] === 'object' && converted[field].toDate) {
        converted[field] = converted[field].toDate().toISOString();
      } else if (!(typeof converted[field] === 'string')) {
        converted[field] = new Date(converted[field]).toISOString();
      }
    }
  });
  
  return converted;
};

/**
 * Get billing details for private office
 * Fetches from bills collection: /accounts/client/users/{userId}/bills/{billId}
 */
export const getPrivateOfficeBillingDetails = async (req, res) => {
  try {
    const { billingId } = req.params;
    const { userId } = req.query; // Get userId from query params
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    let doc = null;
    let data = null;
    let foundUserId = userId;

    // If userId is provided, try bills collection first (most efficient)
    if (userId) {
      try {
        doc = await firestore
          .collection('accounts')
          .doc('client')
          .collection('users')
          .doc(userId)
          .collection('bills')
          .doc(billingId)
          .get();
        
        if (doc.exists) {
          data = doc.data();
        }
      } catch (err) {
        console.warn('Could not fetch from bills collection with userId:', err.message);
      }
    }

    // If not found with userId, search through all users (last resort)
    if (!doc || !doc.exists) {
      try {
        const usersSnapshot = await firestore.collection('accounts').doc('client').collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
          const uid = userDoc.id;
          const billDoc = await firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(uid)
            .collection('bills')
            .doc(billingId)
            .get();
          
          if (billDoc.exists) {
            doc = billDoc;
            data = billDoc.data();
            foundUserId = uid;
            break;
          }
        }
      } catch (err) {
        console.warn('Could not search through users:', err.message);
      }
    }

    if (!doc || !doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Billing record not found'
      });
    }

    const billingData = convertTimestamps({
      id: doc.id,
      userId: foundUserId,
      ...data,
      type: 'private-office'
    });

    const tenantInfo = {
      clientName: billingData.clientName || 'Unknown',
      email: billingData.email || '',
      contactNumber: billingData.contactNumber || '',
      companyName: billingData.companyName || '',
      room: billingData.suite || billingData.room || '',
      status: billingData.status || 'unpaid'
    };

    const billingDetails = {
      notes: billingData.notes || '',
      rentFee: billingData.rentFee || 0,
      rentFeePeriod: billingData.rentFeePeriod || 'Monthly',
      cusaFee: billingData.cusaFee || 0,
      parkingFee: billingData.parkingFee || 0
    };

    res.json({
      success: true,
      data: {
        billingId,
        userId: foundUserId,
        serviceType: 'private-office',
        tenantInfo,
        billingDetails,
        billingData
      }
    });
  } catch (error) {
    console.error('❌ Get private office billing details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch billing details'
    });
  }
};

/**
 * Update private office billing details
 * Updates bills collection: /accounts/client/users/{userId}/bills/{billId}
 */
export const updatePrivateOfficeBillingDetails = async (req, res) => {
  try {
    const { billingId } = req.params;
    const { userId, notes, cusaFee, parkingFee, rentFee, rentFeePeriod } = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    let updateRef = null;
    let foundUserId = userId;

    // If userId is provided, try bills collection first (most efficient)
    if (userId) {
      try {
        const billDoc = await firestore
          .collection('accounts')
          .doc('client')
          .collection('users')
          .doc(userId)
          .collection('bills')
          .doc(billingId)
          .get();
        
        if (billDoc.exists) {
          updateRef = firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(userId)
            .collection('bills')
            .doc(billingId);
        }
      } catch (err) {
        console.warn('Could not check bills collection with userId:', err.message);
      }
    }

    // If not found with userId, search through all users (last resort)
    if (!updateRef) {
      try {
        const usersSnapshot = await firestore.collection('accounts').doc('client').collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
          const uid = userDoc.id;
          const billDoc = await firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(uid)
            .collection('bills')
            .doc(billingId)
            .get();
          
          if (billDoc.exists) {
            updateRef = firestore
              .collection('accounts')
              .doc('client')
              .collection('users')
              .doc(uid)
              .collection('bills')
              .doc(billingId);
            foundUserId = uid;
            break;
          }
        }
      } catch (err) {
        console.warn('Could not search through users:', err.message);
      }
    }

    if (!updateRef) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Billing record not found'
      });
    }

    // Update the document
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (notes !== undefined) updateData.notes = notes || '';
    if (cusaFee !== undefined) updateData.cusaFee = cusaFee || 0;
    if (parkingFee !== undefined) updateData.parkingFee = parkingFee || 0;
    if (rentFee !== undefined) updateData.rentFee = rentFee || 0;
    if (rentFeePeriod !== undefined) updateData.rentFeePeriod = rentFeePeriod || 'Monthly';

    await updateRef.update(updateData);

    res.json({
      success: true,
      message: 'Billing details updated successfully',
      data: {
        billingId,
        userId: foundUserId,
        serviceType: 'private-office',
        ...updateData
      }
    });
  } catch (error) {
    console.error('❌ Update private office billing details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update billing details'
    });
  }
};
