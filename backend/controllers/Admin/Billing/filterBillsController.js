import { getFirestore } from '../../../config/firebase.js';

// Filter bills based on user, status, and date range
export const filterBills = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { userId, status, serviceType, dateFrom, dateTo } = req.query;

    console.log('[filterBills] Filter params:', { userId, status, serviceType, dateFrom, dateTo });

    const allBills = [];

    // Determine which users to fetch bills from
    const userIds = userId ? [userId] : [];

    // If no specific user, fetch from all users
    if (!userId) {
      // Fetch from client users
      const usersSnapshot = await db.collection('accounts').doc('client').collection('users').get();
      usersSnapshot.forEach(doc => userIds.push(doc.id));

      // Fetch from virtual office tenants
      const tenantsSnapshot = await db.collection('accounts').doc('virtual-tenants').collection('tenants').get();
      tenantsSnapshot.forEach(doc => userIds.push(doc.id));
    }

    // Fetch bills for each user
    for (const uid of userIds) {
      // Try client users first
      const userDoc = await db.collection('accounts').doc('client').collection('users').doc(uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const billsSnapshot = await db
          .collection('accounts')
          .doc('client')
          .collection('users')
          .doc(uid)
          .collection('bills')
          .get();

        billsSnapshot.forEach(billDoc => {
          const bill = billDoc.data();
          allBills.push({
            ...bill,
            billId: billDoc.id,
            userId: uid,
            clientName: userData.name || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : bill.clientName || 'N/A'),
            isVirtualOffice: false
          });
        });
      } else {
        // Try virtual office tenants
        const tenantDoc = await db.collection('accounts').doc('virtual-tenants').collection('tenants').doc(uid).get();
        
        if (tenantDoc.exists) {
          const tenantData = tenantDoc.data();
          const billsSnapshot = await db
            .collection('accounts')
            .doc('virtual-tenants')
            .collection('tenants')
            .doc(uid)
            .collection('bills')
            .get();

          billsSnapshot.forEach(billDoc => {
            const bill = billDoc.data();
            allBills.push({
              ...bill,
              billId: billDoc.id,
              userId: uid,
              clientName: tenantData.fullName || bill.clientName || 'N/A',
              isVirtualOffice: true
            });
          });
        }
      }
    }

    console.log(`[filterBills] Fetched ${allBills.length} bills before filtering`);

    // Apply filters
    let filteredBills = allBills.filter(bill => {
      // Status filter
      if (status && bill.status !== status) {
        return false;
      }

      // Service Type filter
      if (serviceType && bill.serviceType !== serviceType) {
        return false;
      }

      // Date range filter - check if bill's startDate or dueDate falls within range
      if (dateFrom || dateTo) {
        const billStartDate = bill.startDate?.toDate ? bill.startDate.toDate() : new Date(bill.startDate);
        const billDueDate = bill.dueDate?.toDate ? bill.dueDate.toDate() : new Date(bill.dueDate);
        
        let isInRange = false;

        if (dateFrom && dateTo) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);

          // Check if either startDate or dueDate falls within the range
          const startInRange = billStartDate >= fromDate && billStartDate <= toDate;
          const dueInRange = billDueDate >= fromDate && billDueDate <= toDate;
          
          isInRange = startInRange || dueInRange;
        } else if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          
          isInRange = billStartDate >= fromDate || billDueDate >= fromDate;
        } else if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          
          isInRange = billStartDate <= toDate || billDueDate <= toDate;
        }

        if (!isInRange) {
          return false;
        }
      }

      return true;
    });

    // Convert Firestore timestamps to ISO strings for JSON response
    filteredBills = filteredBills.map(bill => ({
      ...bill,
      startDate: bill.startDate?.toDate ? bill.startDate.toDate().toISOString() : bill.startDate,
      dueDate: bill.dueDate?.toDate ? bill.dueDate.toDate().toISOString() : bill.dueDate,
      createdAt: bill.createdAt?.toDate ? bill.createdAt.toDate().toISOString() : bill.createdAt,
      paidAt: bill.paidAt?.toDate ? bill.paidAt.toDate().toISOString() : bill.paidAt
    }));

    console.log(`[filterBills] Returning ${filteredBills.length} filtered bills`);

    res.status(200).json({
      success: true,
      data: filteredBills
    });
  } catch (error) {
    console.error('[filterBills] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter bills',
      error: error.message
    });
  }
};
