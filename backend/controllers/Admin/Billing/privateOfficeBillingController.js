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
    const { userId } = req.query; // Get userId from query params
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    console.log(`📖 FIRESTORE READ: Fetching private office billing details for ${billingId}${userId ? ` (userId: ${userId})` : ''}`);

    let doc = null;
    let data = null;

    // If userId is provided, try new path first (most efficient)
    if (userId) {
      try {
        doc = await firestore
          .collection('accounts')
          .doc('client')
          .collection('users')
          .doc(userId)
          .collection('request')
          .doc('office')
          .collection('bookings')
          .doc(bookingsId)
          .get();
        
        if (doc.exists) {
          data = doc.data();
          console.log(`📖 FIRESTORE READ: Found in new path - accounts/client/users/${userId}/request/office/bookings/${billingId}`);
        }
      } catch (err) {
        console.warn('Could not fetch from new path with userId:', err.message);
      }
    }

    // If not found with userId, try old path
    if (!doc || !doc.exists) {
      try {
        doc = await firestore
          .collection('privateOfficeRooms')
          .doc('data')
          .collection('requests')
          .doc(billingId)
          .get();
        
        if (doc.exists) {
          data = doc.data();
          console.log(`📖 FIRESTORE READ: Found in old path - privateOfficeRooms/data/requests/${billingId}`);
        }
      } catch (err) {
        console.warn('Could not fetch from old path:', err.message);
      }
    }

    // If still not found, search through all users (last resort)
    if (!doc || !doc.exists) {
      try {
        console.log('📖 FIRESTORE READ: Searching through all users for booking...');
        const usersSnapshot = await firestore.collection('accounts').doc('client').collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
          const uid = userDoc.id;
          const bookingDoc = await firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(uid)
            .collection('request')
            .doc('office')
            .collection('bookings')
            .doc(billingId)
            .get();
          
          if (bookingDoc.exists) {
            doc = bookingDoc;
            data = bookingDoc.data();
            console.log(`📖 FIRESTORE READ: Found in new path - accounts/client/users/${uid}/request/office/bookings/${billingId}`);
            break;
          }
        }
      } catch (err) {
        console.warn('Could not search through users:', err.message);
      }
    }

    if (!doc || !doc.exists) {
      console.error(`❌ Billing record not found for billingId: ${billingId}`);
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Billing record not found'
      });
    }

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

    let updateRef = null;

    // Try old path first
    try {
      const oldDoc = await firestore
        .collection('privateOfficeRooms')
        .doc('data')
        .collection('requests')
        .doc(billingId)
        .get();
      
      if (oldDoc.exists) {
        updateRef = firestore
          .collection('privateOfficeRooms')
          .doc('data')
          .collection('requests')
          .doc(billingId);
        console.log(`Found in old path - updating...`);
      }
    } catch (err) {
      console.warn('Could not check old path:', err.message);
    }

    // If not found in old path, try new path
    if (!updateRef) {
      try {
        console.log('Trying new path for private office bookings...');
        const usersSnapshot = await firestore.collection('accounts').doc('client').collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const bookingDoc = await firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(userId)
            .collection('request')
            .doc('office')
            .collection('bookings')
            .doc(billingId)
            .get();
          
          if (bookingDoc.exists) {
            updateRef = firestore
              .collection('accounts')
              .doc('client')
              .collection('users')
              .doc(userId)
              .collection('request')
              .doc('office')
              .collection('bookings')
              .doc(billingId);
            console.log(`Found in new path - updating...`);
            break;
          }
        }
      } catch (err) {
        console.warn('Could not check new path:', err.message);
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
