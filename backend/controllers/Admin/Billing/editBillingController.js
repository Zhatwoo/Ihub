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
      // Fetch from approved desk requests using collection group query
      console.log('📖 FIRESTORE READ: Searching for approved desk request...');
      const requestsSnapshot = await firestore
        .collectionGroup('requests')
        .where('status', '==', 'approved')
        .get();
      
      // Find the matching desk assignment by ID or assignedDesk
      const matchingDoc = requestsSnapshot.docs.find(doc => {
        const path = doc.ref.path;
        const data = doc.data();
        return path.includes('/request/desk/') && 
               (doc.id === billingId || data.assignedDesk === billingId || data.desk === billingId);
      });

      if (matchingDoc) {
        const data = matchingDoc.data();
        billingData = convertTimestamps({
          id: matchingDoc.id,
          ...data,
          type: 'dedicated-desk'
        });

        tenantInfo = {
          clientName: billingData.name || billingData.clientName || 'Unknown',
          email: billingData.email || '',
          contactNumber: billingData.contactNumber || billingData.phone || '',
          companyName: billingData.company || billingData.companyName || '',
          desk: billingData.assignedDesk || billingData.desk || billingData.deskTag || '',
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
      // Update approved desk request
      console.log('📖 FIRESTORE READ: Searching for approved desk request to update...');
      const requestsSnapshot = await firestore
        .collectionGroup('requests')
        .where('status', '==', 'approved')
        .get();
      
      // Find the matching desk assignment by ID or assignedDesk
      const matchingDoc = requestsSnapshot.docs.find(doc => {
        const path = doc.ref.path;
        const data = doc.data();
        return path.includes('/request/desk/') && 
               (doc.id === billingId || data.assignedDesk === billingId || data.desk === billingId);
      });

      if (!matchingDoc) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Desk assignment not found'
        });
      }

      updateRef = matchingDoc.ref;
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

    // For dedicated-desk and virtual-office, activate any inactive bills by changing status to unpaid
    if (serviceType === 'dedicated-desk' || serviceType === 'virtual-office') {
      try {
        let billsRef;
        let userId;

        if (serviceType === 'dedicated-desk') {
          // Extract userId from the desk request path
          const pathParts = updateRef.path.split('/');
          console.log(`📍 Desk request path: ${updateRef.path}`);
          console.log(`📍 Path parts:`, pathParts);
          const userIdIndex = pathParts.indexOf('users') + 1;
          userId = pathParts[userIdIndex];
          console.log(`📍 Extracted userId: ${userId}`);
          
          if (!userId) {
            console.error('⚠️ Could not extract userId from path');
            throw new Error('Could not extract userId from desk request path');
          }
          
          billsRef = firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(userId)
            .collection('bills');
        } else if (serviceType === 'virtual-office') {
          console.log(`📍 Virtual office billingId: ${billingId}`);
          billsRef = firestore
            .collection('accounts')
            .doc('virtual-tenants')
            .collection('tenants')
            .doc(billingId)
            .collection('bills');
        }

        console.log(`📖 FIRESTORE READ: Searching for inactive bills...`);
        // Find and activate inactive bills
        const inactiveBillsSnapshot = await billsRef
          .where('status', '==', 'inactive')
          .get();

        console.log(`📊 Found ${inactiveBillsSnapshot.size} inactive bill(s)`);

        if (!inactiveBillsSnapshot.empty) {
          const batch = firestore.batch();
          inactiveBillsSnapshot.docs.forEach(billDoc => {
            console.log(`🔄 Activating bill ${billDoc.id}`);
            batch.update(billDoc.ref, {
              status: 'unpaid',
              activatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          });

          await batch.commit();
          console.log(`✅ Activated ${inactiveBillsSnapshot.size} inactive bill(s) for ${serviceType}/${billingId}`);
        } else {
          console.log(`ℹ️ No inactive bills found for ${serviceType}/${billingId}`);
        }
      } catch (billError) {
        console.error('⚠️ Error activating bills:', billError);
        console.error('⚠️ Error stack:', billError.stack);
        // Don't fail the main update if bill activation fails
      }
    }

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


