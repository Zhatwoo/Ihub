import { getFirestore } from '../config/firebase.js';
import admin from 'firebase-admin';

// Fee period to days mapping
const FEE_PERIOD_DAYS = {
  'Monthly': 30,
  'Quarterly': 90,
  'Semiannually': 180,
  'Annually': 365,
  '5 minutes': 5 / (24 * 60) // For testing: 5 minutes in days
};

// Check and create new bills for overdue payments
const checkAndCreateNewBills = async () => {
  try {
    const db = getFirestore();
    if (!db) {
      console.log('[Billing Service] Firestore not initialized, skipping check');
      return;
    }

    console.log('[Billing Service] Checking for overdue bills...');
    
    const now = new Date();
    const usersSnapshot = await db.collection('accounts').doc('client').collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Get all bills for this user, ordered by creation date
      const billsSnapshot = await db
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId)
        .collection('bills')
        .orderBy('createdAt', 'desc')
        .get();

      if (billsSnapshot.empty) continue;

      const bills = billsSnapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
      
      // Group bills by assignedResource to handle each resource separately
      const billsByResource = {};
      for (const bill of bills) {
        const resource = bill.assignedResource || bill.desk || bill.room || bill.office || 'Unknown';
        if (!billsByResource[resource]) {
          billsByResource[resource] = [];
        }
        billsByResource[resource].push(bill);
      }
      
      console.log(`[Billing Service] User ${userId} has bills for ${Object.keys(billsByResource).length} resources`);
      
      // Process each resource separately
      for (const [resource, resourceBills] of Object.entries(billsByResource)) {
        // Find the latest bill for this resource
        const latestBill = resourceBills[0];
        
        // Skip if bill doesn't have feePeriod or dueDate set (admin hasn't configured it yet)
        if (!latestBill.feePeriod || !latestBill.dueDate) {
          console.log(`[Billing Service] Skipping user ${userId}, resource ${resource} - bill not configured (missing feePeriod or dueDate)`);
          continue;
        }
        
        const dueDate = latestBill.dueDate?.toDate ? latestBill.dueDate.toDate() : new Date(latestBill.dueDate);
        
        // Skip if dueDate is invalid (epoch time or before year 2000)
        if (isNaN(dueDate.getTime()) || dueDate.getFullYear() < 2000) {
          console.log(`[Billing Service] Skipping user ${userId}, resource ${resource} - invalid dueDate: ${dueDate}`);
          continue;
        }

        // Check if due date has passed
        if (now > dueDate) {
          // Update status of unpaid bills to overdue for this resource
          for (const bill of resourceBills) {
            if (bill.status === 'unpaid') {
              const billDueDate = bill.dueDate?.toDate ? bill.dueDate.toDate() : new Date(bill.dueDate);
              if (now > billDueDate) {
                await bill.ref.update({ status: 'overdue' });
                console.log(`[Billing Service] Updated bill ${bill.id} to overdue for user ${userId}, resource ${resource}`);
              }
            }
          }

          // Create new bill regardless of payment status (even if previous bills are overdue)
          // Calculate days to add based on fee period
          const feePeriod = latestBill.feePeriod || 'Monthly';
          const daysToAdd = FEE_PERIOD_DAYS[feePeriod] || 30;

          // Calculate new dates based on the latest bill's due date
          const newStartDate = new Date(dueDate);
          // For time-based periods, start immediately after due date
          // For day-based periods, start the next day
          if (feePeriod === '5 minutes') {
            newStartDate.setMinutes(newStartDate.getMinutes() + 1); // Start 1 minute after due date
          } else {
            newStartDate.setDate(newStartDate.getDate() + 1); // Start day after previous due date
          }

          const newDueDate = new Date(newStartDate);
          if (feePeriod === '5 minutes') {
            newDueDate.setMinutes(newDueDate.getMinutes() + 5);
          } else {
            newDueDate.setDate(newDueDate.getDate() + daysToAdd);
          }

          // Check if a bill already exists for this period (within tolerance for time-based periods)
          const tolerance = feePeriod === '5 minutes' ? 60000 : 86400000; // 1 minute or 1 day in milliseconds
          const existingBillForPeriod = resourceBills.find(bill => {
            const billStartDate = bill.startDate?.toDate ? bill.startDate.toDate() : new Date(bill.startDate);
            return Math.abs(billStartDate.getTime() - newStartDate.getTime()) < tolerance;
          });

          if (!existingBillForPeriod) {
            // Get user data for client information
            const userData = userDoc.data();
            
            // Create new bill with same details as previous bill
            const newBill = {
              clientName: latestBill.clientName || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : 'N/A'),
              companyName: latestBill.companyName || userData.companyName || 'N/A',
              email: latestBill.email || userData.email || 'N/A',
              contactNumber: latestBill.contactNumber || userData.contactNumber || 'N/A',
              serviceType: latestBill.serviceType,
              assignedResource: resource,
              amount: latestBill.amount || 0,
              cusaFee: latestBill.cusaFee || 0,
              parkingFee: latestBill.parkingFee || 0,
              lateFee: 0, // Reset late fee
              damageFee: 0, // Reset damage fee
              feePeriod: latestBill.feePeriod,
              status: 'unpaid',
              startDate: admin.firestore.Timestamp.fromDate(newStartDate),
              dueDate: admin.firestore.Timestamp.fromDate(newDueDate),
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // Copy additional fields if they exist (bookingId, roomId, etc.)
            if (latestBill.bookingId) newBill.bookingId = latestBill.bookingId;
            if (latestBill.roomId) newBill.roomId = latestBill.roomId;

            await db
              .collection('accounts')
              .doc('client')
              .collection('users')
              .doc(userId)
              .collection('bills')
              .add(newBill);

            console.log(`[Billing Service] Created new bill for user ${userId}, resource ${resource}, start: ${newStartDate.toISOString()}, due: ${newDueDate.toISOString()}`);
          } else {
            console.log(`[Billing Service] Bill already exists for user ${userId}, resource ${resource} for period starting ${newStartDate.toISOString()}`);
          }
        }
      }
    }

    console.log('[Billing Service] Billing check completed');
  } catch (error) {
    console.error('[Billing Service] Error checking bills:', error);
  }
};

// Start the recurring billing service
const startBillingService = () => {
  console.log('[Billing Service] Starting recurring billing service...');
  
  // Run immediately on startup
  checkAndCreateNewBills();
  
  // Run every 1 minute
  setInterval(checkAndCreateNewBills, 60 * 1000);
  
  console.log('[Billing Service] Recurring billing service started (checks every 1 minute)');
};

export { startBillingService, checkAndCreateNewBills };
