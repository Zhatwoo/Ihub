// Virtual Office Billing Controller
// Handles fetching and updating billing details for virtual office tenants

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
 * Get billing details for virtual office
 * Fetches from bills collection: /accounts/client/users/{userId}/bills/{billId}
 */
export const getVirtualOfficeBillingDetails = async (req, res) => {
  try {
    const { billingId } = req.params;
    const { userId } = req.query;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    let doc = null;
    let data = null;
    let foundUserId = userId;

    // If userId is provided, try bills collection first
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
        console.warn('Could not fetch from bills collection:', err.message);
      }
    }

    // If not found, search through all users
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
      type: 'virtual-office'
    });

    const tenantInfo = {
      clientName: billingData.clientName || 'Unknown',
      email: billingData.email || '',
      contactNumber: billingData.contactNumber || '',
      companyName: billingData.companyName || '',
      position: billingData.position || '',
      status: billingData.status || 'unpaid'
    };

    const billingDetails = {
      amount: billingData.rentFee || 0,
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
        serviceType: 'virtual-office',
        tenantInfo,
        billingDetails,
        billingData
      }
    });
  } catch (error) {
    console.error('❌ Get virtual office billing details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch billing details'
    });
  }
};

/**
 * Update virtual office billing details
 * Updates bills collection: /accounts/client/users/{userId}/bills/{billId}
 */
export const updateVirtualOfficeBillingDetails = async (req, res) => {
  try {
    const { billingId } = req.params;
    const { userId, amount, rentFeePeriod, notes, cusaFee, parkingFee } = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    let updateRef = null;
    let foundUserId = userId;

    // If userId is provided, try bills collection first
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
        console.warn('Could not check bills collection:', err.message);
      }
    }

    // If not found, search through all users
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

    if (amount !== undefined) updateData.rentFee = amount || 0;
    if (rentFeePeriod !== undefined) updateData.rentFeePeriod = rentFeePeriod || 'Monthly';
    if (notes !== undefined) updateData.notes = notes || '';
    if (cusaFee !== undefined) updateData.cusaFee = cusaFee || 0;
    if (parkingFee !== undefined) updateData.parkingFee = parkingFee || 0;

    await updateRef.update(updateData);

    res.json({
      success: true,
      message: 'Billing details updated successfully',
      data: {
        billingId,
        userId: foundUserId,
        serviceType: 'virtual-office',
        ...updateData
      }
    });
  } catch (error) {
    console.error('❌ Update virtual office billing details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update billing details'
    });
  }
};
