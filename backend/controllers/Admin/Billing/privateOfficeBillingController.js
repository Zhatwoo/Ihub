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
 */
export const getPrivateOfficeBillingDetails = async (req, res) => {
  try {
    const { billingId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    console.log(`📖 FIRESTORE READ: Fetching private office billing details for ${billingId}`);

    const doc = await firestore
      .collection('privateOfficeRooms')
      .doc('data')
      .collection('requests')
      .doc(billingId)
      .get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Billing record not found'
      });
    }

    const data = doc.data();
    const billingData = convertTimestamps({
      id: doc.id,
      ...data,
      type: 'private-office'
    });

    // Fetch room details to get rentFee
    let roomRentFee = 0;
    if (billingData.roomId) {
      try {
        const roomDoc = await firestore
          .collection('privateOfficeRooms')
          .doc('data')
          .collection('office')
          .doc(billingData.roomId)
          .get();
        if (roomDoc.exists) {
          roomRentFee = roomDoc.data().rentFee || 0;
        }
      } catch (error) {
        console.error('Error fetching room details:', error);
      }
    }

    const tenantInfo = {
      clientName: billingData.clientName || 'Unknown',
      email: billingData.email || '',
      contactNumber: billingData.contactNumber || '',
      companyName: billingData.companyName || '',
      room: billingData.room || '',
      status: billingData.status || 'pending'
    };

    const billingDetails = {
      notes: billingData.notes || '',
      rentFee: roomRentFee || billingData.rentFee || billingData.amount || 0,
      rentFeePeriod: billingData.rentFeePeriod || 'Monthly',
      cusaFee: billingData.cusaFee || 0,
      parkingFee: billingData.parkingFee || 0
    };

    console.log(`✅ Fetched private office billing details for ${billingId}`);

    res.json({
      success: true,
      data: {
        billingId,
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
 */
export const updatePrivateOfficeBillingDetails = async (req, res) => {
  try {
    const { billingId } = req.params;
    const { notes, cusaFee, parkingFee } = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    console.log(`📝 API WRITE: Updating private office billing details for ${billingId}`);

    const updateRef = firestore
      .collection('privateOfficeRooms')
      .doc('data')
      .collection('requests')
      .doc(billingId);

    // Update the document
    await updateRef.update({
      notes: notes || '',
      cusaFee: cusaFee || 0,
      parkingFee: parkingFee || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Updated private office billing details for ${billingId}`);

    res.json({
      success: true,
      message: 'Billing details updated successfully',
      data: {
        billingId,
        serviceType: 'private-office',
        notes,
        cusaFee: cusaFee || 0,
        parkingFee: parkingFee || 0
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
