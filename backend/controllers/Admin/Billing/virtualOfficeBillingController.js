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
 */
export const getVirtualOfficeBillingDetails = async (req, res) => {
  try {
    const { billingId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    console.log(`📖 FIRESTORE READ: Fetching virtual office billing details for ${billingId}`);

    const doc = await firestore
      .collection('virtual-office-clients')
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
      type: 'virtual-office'
    });

    const tenantInfo = {
      clientName: billingData.clientName || billingData.name || 'Unknown',
      email: billingData.email || '',
      contactNumber: billingData.contactNumber || billingData.phone || '',
      companyName: billingData.companyName || billingData.company || '',
      position: billingData.position || '',
      status: billingData.status || 'active'
    };

    const billingDetails = {
      amount: billingData.amount || billingData.monthlyFee || 0,
      notes: billingData.notes || '',
      rentFee: billingData.rentFee || billingData.amount || billingData.monthlyFee || 0,
      rentFeePeriod: billingData.rentFeePeriod || 'Monthly',
      cusaFee: billingData.cusaFee || 0,
      parkingFee: billingData.parkingFee || 0
    };

    console.log(`✅ Fetched virtual office billing details for ${billingId}`);

    res.json({
      success: true,
      data: {
        billingId,
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
 */
export const updateVirtualOfficeBillingDetails = async (req, res) => {
  try {
    const { billingId } = req.params;
    const { amount, rentFeePeriod, notes, cusaFee, parkingFee } = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    console.log(`📝 API WRITE: Updating virtual office billing details for ${billingId}`);

    const updateRef = firestore
      .collection('virtual-office-clients')
      .doc(billingId);

    // Update the document
    await updateRef.update({
      amount: amount || 0,
      rentFeePeriod: rentFeePeriod || 'Monthly',
      notes: notes || '',
      cusaFee: cusaFee || 0,
      parkingFee: parkingFee || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Updated virtual office billing details for ${billingId}`);

    res.json({
      success: true,
      message: 'Billing details updated successfully',
      data: {
        billingId,
        serviceType: 'virtual-office',
        amount,
        rentFeePeriod,
        notes,
        cusaFee: cusaFee || 0,
        parkingFee: parkingFee || 0
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
