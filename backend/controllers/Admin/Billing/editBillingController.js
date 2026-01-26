// Edit Billing Controller
// Handles fetching and updating billing details for edit modal

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
 * Get billing details for edit modal
 * Returns tenant information, current billing details, and billing preview
 */
export const getBillingDetails = async (req, res) => {
  try {
    const { billingId, serviceType } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    console.log(`📖 FIRESTORE READ: Fetching billing details for ${serviceType}/${billingId}`);

    let billingData = null;
    let tenantInfo = null;
    let billingDetails = null;

    // Fetch based on service type
    if (serviceType === 'private-office') {
      const doc = await firestore
        .collection('privateOfficeRooms')
        .doc('data')
        .collection('requests')
        .doc(billingId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        billingData = convertTimestamps({
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

        tenantInfo = {
          clientName: billingData.clientName || 'Unknown',
          email: billingData.email || '',
          contactNumber: billingData.contactNumber || '',
          companyName: billingData.companyName || '',
          room: billingData.room || '',
          status: billingData.status || 'pending'
        };

        billingDetails = {
          amount: billingData.amount || billingData.totalAmount || 0,
          notes: billingData.notes || '',
          rentFee: roomRentFee || billingData.rentFee || billingData.amount || 0,
          rentFeePeriod: billingData.rentFeePeriod || 'Monthly',
          cusaFee: billingData.cusaFee || 0,
          parkingFee: billingData.parkingFee || 0
        };
      }
    } else if (serviceType === 'virtual-office') {
      const doc = await firestore
        .collection('virtual-office-clients')
        .doc(billingId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        billingData = convertTimestamps({
          id: doc.id,
          ...data,
          type: 'virtual-office'
        });

        tenantInfo = {
          clientName: billingData.clientName || billingData.name || 'Unknown',
          email: billingData.email || '',
          contactNumber: billingData.contactNumber || billingData.phone || '',
          companyName: billingData.companyName || billingData.company || '',
          position: billingData.position || '',
          status: billingData.status || 'active'
        };

        billingDetails = {
          amount: billingData.amount || billingData.monthlyFee || 0,
          notes: billingData.notes || '',
          rentFee: billingData.rentFee || billingData.amount || billingData.monthlyFee || 0,
          rentFeePeriod: billingData.rentFeePeriod || 'Monthly',
          cusaFee: billingData.cusaFee || 0,
          parkingFee: billingData.parkingFee || 0
        };
      }
    } else if (serviceType === 'dedicated-desk') {
      const doc = await firestore
        .collection('desk-assignments')
        .doc(billingId)
        .get();

      if (doc.exists) {
        const data = doc.data();
        billingData = convertTimestamps({
          id: doc.id,
          ...data,
          type: 'dedicated-desk'
        });

        tenantInfo = {
          clientName: billingData.name || billingData.clientName || 'Unknown',
          email: billingData.email || '',
          contactNumber: billingData.contactNumber || billingData.phone || '',
          companyName: billingData.company || billingData.companyName || '',
          desk: billingData.desk || billingData.deskTag || '',
          status: 'active'
        };

        billingDetails = {
          amount: billingData.amount || billingData.monthlyFee || 0,
          notes: billingData.notes || '',
          rentFee: billingData.rentFee || billingData.amount || billingData.monthlyFee || 0,
          rentFeePeriod: billingData.rentFeePeriod || 'Monthly',
          cusaFee: billingData.cusaFee || 0,
          parkingFee: billingData.parkingFee || 0
        };
      }
    }

    if (!billingData) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Billing record not found'
      });
    }

    console.log(`✅ Fetched billing details for ${serviceType}/${billingId}`);

    res.json({
      success: true,
      data: {
        billingId,
        serviceType,
        tenantInfo,
        billingDetails,
        billingData
      }
    });
  } catch (error) {
    console.error('❌ Get billing details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch billing details'
    });
  }
};

/**
 * Update billing details
 */
export const updateBillingDetails = async (req, res) => {
  try {
    const { billingId, serviceType } = req.params;
    const { amount, paymentStatus, dueDate, notes } = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    console.log(`📝 API WRITE: Updating billing details for ${serviceType}/${billingId}`);

    let updateRef;

    // Get reference based on service type
    if (serviceType === 'private-office') {
      updateRef = firestore
        .collection('privateOfficeRooms')
        .doc('data')
        .collection('requests')
        .doc(billingId);
    } else if (serviceType === 'virtual-office') {
      updateRef = firestore
        .collection('virtual-office-clients')
        .doc(billingId);
    } else if (serviceType === 'dedicated-desk') {
      updateRef = firestore
        .collection('desk-assignments')
        .doc(billingId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid service type'
      });
    }

    // Update the document
    await updateRef.update({
      amount: amount || 0,
      notes: notes || '',
      rentFee: req.body.rentFee || 0,
      rentFeePeriod: req.body.rentFeePeriod || 'Monthly',
      cusaFee: req.body.cusaFee || 0,
      parkingFee: req.body.parkingFee || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Updated billing details for ${serviceType}/${billingId}`);

    res.json({
      success: true,
      message: 'Billing details updated successfully',
      data: {
        billingId,
        serviceType,
        amount,
        notes,
        rentFee: req.body.rentFee || 0,
        rentFeePeriod: req.body.rentFeePeriod || 'Monthly',
        cusaFee: req.body.cusaFee || 0,
        parkingFee: req.body.parkingFee || 0
      }
    });
  } catch (error) {
    console.error('❌ Update billing details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update billing details'
    });
  }
};
