import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';

// Get all billing records with latest bill status
export const getAllBilling = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const billingRecords = [];

    // Fetch all users
    const usersSnapshot = await db.collection('accounts').doc('client').collection('users').get();
    console.log(`[getAllBilling] Found ${usersSnapshot.docs.length} total users`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Get all bills for this user, ordered by creation date
      const billsSnapshot = await db
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId)
        .collection('bills')
        .orderBy('createdAt', 'desc')
        .get();

      console.log(`[getAllBilling] User ${userId} has ${billsSnapshot.docs.length} bills`);

      if (!billsSnapshot.empty) {
        const bills = billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Group bills by assignedResource (desk/office)
        const billsByResource = {};
        
        for (const bill of bills) {
          const resource = bill.assignedResource || bill.desk || bill.room || bill.office || 'Unknown';
          
          if (!billsByResource[resource]) {
            billsByResource[resource] = [];
          }
          
          billsByResource[resource].push(bill);
        }
        
        console.log(`[getAllBilling] User ${userId} has bills for ${Object.keys(billsByResource).length} resources`);
        
        // Create a billing record for each resource
        for (const [resource, resourceBills] of Object.entries(billsByResource)) {
          // Sort bills by createdAt to get the latest bill first
          const sortedBills = resourceBills.sort((a, b) => {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return bDate - aDate; // Descending order (latest first)
          });
          
          // Always use the latest bill (most recent by createdAt)
          const displayBill = sortedBills[0];
          
          // Check if there are any overdue, unpaid, or inactive bills for this resource
          const hasOverdueBills = resourceBills.some(bill => bill.status === 'overdue');
          const hasUnpaidBills = resourceBills.some(bill => bill.status === 'unpaid');
          const hasInactiveBills = resourceBills.some(bill => bill.status === 'inactive');
          
          // Determine the overall status based on priority: overdue > unpaid > inactive > paid
          let overallStatus = 'paid'; // Default to paid
          if (hasOverdueBills) {
            overallStatus = 'overdue';
          } else if (hasUnpaidBills) {
            overallStatus = 'unpaid';
          } else if (hasInactiveBills) {
            overallStatus = 'inactive';
          }
          
          console.log(`[getAllBilling] User ${userId}, Resource ${resource} - Latest bill status: ${displayBill.status}, Overall status: ${overallStatus}`);
          
          if (displayBill) {
            // Convert Firestore Timestamp to Date
            const dueDate = displayBill.dueDate?.toDate ? displayBill.dueDate.toDate() : (displayBill.dueDate ? new Date(displayBill.dueDate) : new Date());
            const startDate = displayBill.startDate?.toDate ? displayBill.startDate.toDate() : (displayBill.startDate ? new Date(displayBill.startDate) : new Date());
            const paidAt = displayBill.paidAt?.toDate ? displayBill.paidAt.toDate() : (displayBill.paidAt ? new Date(displayBill.paidAt) : null);

            // Handle feePeriod - check if it exists (not null/undefined), otherwise use fallback
            let feePeriod = 'N/A';
            if (displayBill.feePeriod !== null && displayBill.feePeriod !== undefined) {
              feePeriod = displayBill.feePeriod;
            } else if (displayBill.rentFeePeriod !== null && displayBill.rentFeePeriod !== undefined) {
              feePeriod = displayBill.rentFeePeriod;
            }

            // Check if all bills for this resource are paid
            const allBillsPaid = resourceBills.every(bill => bill.status === 'paid');

            billingRecords.push({
              userId,
              billId: displayBill.id,
              name: userData.name || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : displayBill.clientName || 'N/A'),
              email: userData.email || displayBill.email || 'N/A',
              phone: userData.contactNumber || displayBill.contactNumber || 'N/A',
              companyName: userData.companyName || displayBill.companyName || 'N/A',
              serviceType: displayBill.serviceType || 'N/A',
              assignedResource: resource,
              amount: displayBill.amount || displayBill.rentFee || 0,
              cusaFee: displayBill.cusaFee || 0,
              parkingFee: displayBill.parkingFee || 0,
              lateFee: displayBill.lateFee || 0,
              damageFee: displayBill.damageFee || 0,
              feePeriod: feePeriod,
              status: overallStatus, // Use overall status for this resource
              dueDate: dueDate.toISOString(),
              startDate: startDate.toISOString(),
              paidAt: paidAt ? paidAt.toISOString() : null,
              allBillsPaid: allBillsPaid, // Flag to indicate if all bills for this resource are paid
            });
            
            console.log(`[getAllBilling] Added billing record for user ${userId}, resource ${resource}`);
          }
        }
      } else {
        console.log(`[getAllBilling] User ${userId} has no bills, skipping`);
      }
    }

    // Fetch bills from virtual office tenants
    const virtualOfficeTenantsSnapshot = await db
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .get();
    console.log(`[getAllBilling] Found ${virtualOfficeTenantsSnapshot.docs.length} virtual office tenants`);

    for (const tenantDoc of virtualOfficeTenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();

      // Get all bills for this virtual office tenant
      const billsSnapshot = await db
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .doc(tenantId)
        .collection('bills')
        .orderBy('createdAt', 'desc')
        .get();

      console.log(`[getAllBilling] Virtual office tenant ${tenantId} has ${billsSnapshot.docs.length} bills`);

      if (!billsSnapshot.empty) {
        const bills = billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Group bills by assignedResource
        const billsByResource = {};
        
        for (const bill of bills) {
          const resource = bill.assignedResource || 'Virtual Office';
          
          if (!billsByResource[resource]) {
            billsByResource[resource] = [];
          }
          
          billsByResource[resource].push(bill);
        }
        
        console.log(`[getAllBilling] Virtual office tenant ${tenantId} has bills for ${Object.keys(billsByResource).length} resources`);
        
        // Create a billing record for each resource
        for (const [resource, resourceBills] of Object.entries(billsByResource)) {
          // Sort bills by createdAt to get the latest bill first
          const sortedBills = resourceBills.sort((a, b) => {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return bDate - aDate; // Descending order (latest first)
          });
          
          // Always use the latest bill (most recent by createdAt)
          const displayBill = sortedBills[0];
          
          const hasOverdueBills = resourceBills.some(bill => bill.status === 'overdue');
          const hasUnpaidBills = resourceBills.some(bill => bill.status === 'unpaid');
          const hasInactiveBills = resourceBills.some(bill => bill.status === 'inactive');
          
          let overallStatus = 'paid';
          if (hasOverdueBills) {
            overallStatus = 'overdue';
          } else if (hasUnpaidBills) {
            overallStatus = 'unpaid';
          } else if (hasInactiveBills) {
            overallStatus = 'inactive';
          }
          
          console.log(`[getAllBilling] Virtual office tenant ${tenantId}, Resource ${resource} - Latest bill status: ${displayBill.status}, Overall status: ${overallStatus}`);
          
          if (displayBill) {
            const dueDate = displayBill.dueDate?.toDate ? displayBill.dueDate.toDate() : (displayBill.dueDate ? new Date(displayBill.dueDate) : new Date());
            const startDate = displayBill.startDate?.toDate ? displayBill.startDate.toDate() : (displayBill.startDate ? new Date(displayBill.startDate) : new Date());
            const paidAt = displayBill.paidAt?.toDate ? displayBill.paidAt.toDate() : (displayBill.paidAt ? new Date(displayBill.paidAt) : null);

            let feePeriod = 'N/A';
            if (displayBill.feePeriod !== null && displayBill.feePeriod !== undefined) {
              feePeriod = displayBill.feePeriod;
            }

            const allBillsPaid = resourceBills.every(bill => bill.status === 'paid');

            billingRecords.push({
              userId: tenantId, // Use tenantId as userId for virtual office
              tenantId: tenantId, // Add tenantId to identify virtual office tenants
              isVirtualOffice: true, // Flag to identify virtual office billing
              billId: displayBill.id,
              name: tenantData.fullName || displayBill.clientName || 'N/A',
              email: tenantData.email || displayBill.email || 'N/A',
              phone: tenantData.phoneNumber || displayBill.contactNumber || 'N/A',
              companyName: tenantData.company || displayBill.companyName || 'N/A',
              serviceType: 'virtual-office',
              assignedResource: resource,
              amount: displayBill.amount || 0,
              cusaFee: displayBill.cusaFee || 0,
              parkingFee: displayBill.parkingFee || 0,
              lateFee: displayBill.lateFee || 0,
              damageFee: displayBill.damageFee || 0,
              feePeriod: feePeriod,
              status: overallStatus,
              dueDate: dueDate.toISOString(),
              startDate: startDate.toISOString(),
              paidAt: paidAt ? paidAt.toISOString() : null,
              allBillsPaid: allBillsPaid,
            });
            
            console.log(`[getAllBilling] Added billing record for virtual office tenant ${tenantId}, resource ${resource}`);
          }
        }
      }
    }

    console.log(`[getAllBilling] Returning ${billingRecords.length} billing records`);

    res.status(200).json({
      success: true,
      data: billingRecords
    });
  } catch (error) {
    console.error('Error fetching billing records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing records',
      error: error.message
    });
  }
};

// Get billing statistics for dashboard
export const getBillingStats = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    let totalBills = 0;
    let totalRevenue = 0;
    let paidCount = 0;
    let unpaidCount = 0; // Count of unpaid bills
    let unpaidAmount = 0;
    let overdueCount = 0;
    let inactiveCount = 0; // Count of inactive bills

    // Fetch all users and their bills
    const usersSnapshot = await db.collection('accounts').doc('client').collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Get all bills for this user
      const billsSnapshot = await db
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId)
        .collection('bills')
        .get();

      billsSnapshot.forEach(billDoc => {
        const bill = billDoc.data();
        totalBills++;

        if (bill.status === 'paid') {
          paidCount++;
          totalRevenue += (bill.amount || 0) + (bill.cusaFee || 0) + (bill.parkingFee || 0) + (bill.lateFee || 0) + (bill.damageFee || 0);
        } else if (bill.status === 'unpaid') {
          unpaidCount++;
          unpaidAmount += (bill.amount || 0) + (bill.cusaFee || 0) + (bill.parkingFee || 0);
        } else if (bill.status === 'overdue') {
          overdueCount++;
          unpaidAmount += (bill.amount || 0) + (bill.cusaFee || 0) + (bill.parkingFee || 0);
        } else if (bill.status === 'inactive') {
          inactiveCount++;
        }
      });
    }

    // Fetch all virtual office tenants and their bills
    const virtualOfficeTenantsSnapshot = await db
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .get();

    for (const tenantDoc of virtualOfficeTenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;

      // Get all bills for this virtual office tenant
      const billsSnapshot = await db
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .doc(tenantId)
        .collection('bills')
        .get();

      billsSnapshot.forEach(billDoc => {
        const bill = billDoc.data();
        totalBills++;

        if (bill.status === 'paid') {
          paidCount++;
          totalRevenue += (bill.amount || 0) + (bill.cusaFee || 0) + (bill.parkingFee || 0) + (bill.lateFee || 0) + (bill.damageFee || 0);
        } else if (bill.status === 'unpaid') {
          unpaidCount++;
          unpaidAmount += (bill.amount || 0) + (bill.cusaFee || 0) + (bill.parkingFee || 0);
        } else if (bill.status === 'overdue') {
          overdueCount++;
          unpaidAmount += (bill.amount || 0) + (bill.cusaFee || 0) + (bill.parkingFee || 0);
        } else if (bill.status === 'inactive') {
          inactiveCount++;
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalBills,
        totalRevenue,
        paidCount,
        unpaidCount, // Add unpaid count to response
        unpaidAmount,
        overdueCount,
        inactiveCount // Add inactive count to response
      }
    });
    
    console.log('[getBillingStats] Returning stats:', {
      totalBills,
      totalRevenue,
      paidCount,
      unpaidCount,
      overdueCount,
      inactiveCount
    });
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing statistics',
      error: error.message
    });
  }
};

// Get all bills for a specific user or virtual office client
export const getUserBills = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { userId } = req.params;
    const { isVirtualOffice } = req.query; // Check if this is a virtual office client

    let billsSnapshot;
    
    if (isVirtualOffice === 'true') {
      // Fetch bills from virtual office tenant
      billsSnapshot = await db
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .doc(userId)
        .collection('bills')
        .orderBy('createdAt', 'desc')
        .get();
    } else {
      // Fetch bills from user account
      billsSnapshot = await db
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId)
        .collection('bills')
        .orderBy('createdAt', 'desc')
        .get();
    }

    const bills = billsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Handle feePeriod properly
      let feePeriod = 'N/A';
      if (data.feePeriod !== null && data.feePeriod !== undefined) {
        feePeriod = data.feePeriod;
      } else if (data.rentFeePeriod !== null && data.rentFeePeriod !== undefined) {
        feePeriod = data.rentFeePeriod;
      }
      
      return {
        id: doc.id,
        ...data,
        feePeriod: feePeriod,
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate().toISOString() : data.dueDate,
        startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString() : data.startDate,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        paidAt: data.paidAt?.toDate ? data.paidAt.toDate().toISOString() : data.paidAt,
      };
    });

    res.status(200).json({
      success: true,
      data: bills
    });
  } catch (error) {
    console.error('Error fetching user bills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bills',
      error: error.message
    });
  }
};

// Record payment for a bill
export const recordPayment = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { userId, billId } = req.params;
    const { lateFee = 0, damageFee = 0, paymentMethod = 'Cash', isVirtualOffice } = req.body;

    console.log('[recordPayment] Recording payment for:', { userId, billId, isVirtualOffice, lateFee, damageFee, paymentMethod });

    let billRef;
    
    if (isVirtualOffice) {
      // Update bill in virtual office tenant
      billRef = db
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .doc(userId)
        .collection('bills')
        .doc(billId);
      console.log('[recordPayment] Using virtual office path');
    } else {
      // Update bill in user account
      billRef = db
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId)
        .collection('bills')
        .doc(billId);
      console.log('[recordPayment] Using user account path');
    }

    const updateData = {
      status: 'paid',
      lateFee: parseFloat(lateFee) || 0,
      damageFee: parseFloat(damageFee) || 0,
      paymentMethod: paymentMethod,
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    };

    console.log('[recordPayment] Update data:', updateData);

    await billRef.update(updateData);

    console.log('[recordPayment] ✅ Payment recorded successfully');

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('[recordPayment] ❌ Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
};

// Update bill details
export const updateBill = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { userId, billId } = req.params;
    const { amount, cusaFee, parkingFee, feePeriod, dueDate, isVirtualOffice } = req.body;

    console.log('[updateBill] ===== UPDATE BILL REQUEST =====');
    console.log('[updateBill] userId:', userId);
    console.log('[updateBill] billId:', billId);
    console.log('[updateBill] isVirtualOffice:', isVirtualOffice);
    console.log('[updateBill] Received request body:', JSON.stringify(req.body, null, 2));
    console.log('[updateBill] feePeriod value:', feePeriod, 'type:', typeof feePeriod);
    console.log('[updateBill] dueDate value:', dueDate, 'type:', typeof dueDate);

    // Get the current bill to access startDate
    let billRef;
    
    if (isVirtualOffice) {
      billRef = db
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .doc(userId)
        .collection('bills')
        .doc(billId);
    } else {
      billRef = db
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId)
        .collection('bills')
        .doc(billId);
    }
    
    const billDoc = await billRef.get();
    if (!billDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const currentBill = billDoc.data();

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount) || 0;
    if (cusaFee !== undefined) updateData.cusaFee = parseFloat(cusaFee) || 0;
    if (parkingFee !== undefined) updateData.parkingFee = parseFloat(parkingFee) || 0;
    
    // Save feePeriod if provided
    if (feePeriod !== undefined && feePeriod !== null && feePeriod !== 'N/A') {
      updateData.feePeriod = feePeriod;
      console.log('[updateBill] Setting feePeriod to:', feePeriod);
    }
    
    // Save dueDate if provided and valid
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      console.log('[updateBill] Parsed dueDate:', dueDateObj);
      
      if (!isNaN(dueDateObj.getTime())) {
        updateData.dueDate = admin.firestore.Timestamp.fromDate(dueDateObj);
        console.log('[updateBill] Setting dueDate to:', dueDateObj.toISOString());
      } else {
        console.error('[updateBill] Invalid dueDate provided:', dueDate);
      }
    }

    console.log('[updateBill] Final update data:', JSON.stringify(updateData, null, 2));

    // If bill status is currently inactive, activate it (change to unpaid)
    if (currentBill.status === 'inactive') {
      updateData.status = 'unpaid';
      updateData.activatedAt = admin.firestore.FieldValue.serverTimestamp();
      // Update startDate to current date when activating
      updateData.startDate = admin.firestore.FieldValue.serverTimestamp();
      console.log('[updateBill] 🔄 Activating bill: changing status from inactive to unpaid and updating startDate to current date');
    }

    await billRef.update(updateData);

    console.log('[updateBill] ✅ Bill updated successfully in Firestore');

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully'
    });
  } catch (error) {
    console.error('[updateBill] ❌ Error updating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bill',
      error: error.message
    });
  }
};

// Create initial bill for a tenant (called manually by admin)
export const createBill = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { userId } = req.params;
    const { 
      serviceType, 
      assignedResource, 
      amount, 
      cusaFee, 
      parkingFee, 
      feePeriod, 
      startDate, 
      dueDate 
    } = req.body;

    // Get user data
    const userDoc = await db.collection('accounts').doc('client').collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    const billData = {
      clientName: userData.name || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : 'N/A'),
      companyName: userData.companyName || 'N/A',
      email: userData.email || 'N/A',
      contactNumber: userData.contactNumber || 'N/A',
      serviceType: serviceType || 'N/A',
      assignedResource: assignedResource || 'N/A',
      amount: parseFloat(amount) || 0,
      cusaFee: parseFloat(cusaFee) || 0,
      parkingFee: parseFloat(parkingFee) || 0,
      lateFee: 0,
      damageFee: 0,
      feePeriod: feePeriod || 'Monthly',
      startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
      dueDate: admin.firestore.Timestamp.fromDate(new Date(dueDate)),
      status: 'inactive', // Newly created bills start as inactive
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const billRef = await db
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .collection('bills')
      .add(billData);

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      billId: billRef.id
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bill',
      error: error.message
    });
  }
};
