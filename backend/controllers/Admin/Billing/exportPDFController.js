import { getFirestore } from '../../../config/firebase.js';
import PDFDocument from 'pdfkit';

export const exportBillingPDF = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { users, status, service, dateFrom, dateTo } = req.body;

    console.log('[exportBillingPDF] Export request:', { users, status, service, dateFrom, dateTo });

    // Collect all bills based on filters
    const allBills = [];

    // Determine which users to fetch bills for
    const userIds = users === 'all' || !users || users.length === 0 ? [] : users;

    // If "all" users or no specific users selected, fetch all
    if (users === 'all' || !users || users.length === 0) {
      // Fetch from dedicated desk and private office users
      if (!service || service === 'all' || service === 'dedicated-desk' || service === 'private-office') {
        const usersSnapshot = await db.collection('accounts').doc('client').collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const userData = userDoc.data();
          
          const billsSnapshot = await db
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(userId)
            .collection('bills')
            .get();

          billsSnapshot.forEach(billDoc => {
            const bill = billDoc.data();
            allBills.push({
              ...bill,
              billId: billDoc.id,
              userId,
              clientName: userData.name || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : 'N/A'),
              email: userData.email || 'N/A',
              companyName: userData.companyName || 'N/A',
              serviceType: bill.serviceType || 'N/A'
            });
          });
        }
      }

      // Fetch from virtual office tenants
      if (!service || service === 'all' || service === 'virtual-office') {
        const tenantsSnapshot = await db
          .collection('accounts')
          .doc('virtual-tenants')
          .collection('tenants')
          .get();

        for (const tenantDoc of tenantsSnapshot.docs) {
          const tenantId = tenantDoc.id;
          const tenantData = tenantDoc.data();
          
          const billsSnapshot = await db
            .collection('accounts')
            .doc('virtual-tenants')
            .collection('tenants')
            .doc(tenantId)
            .collection('bills')
            .get();

          billsSnapshot.forEach(billDoc => {
            const bill = billDoc.data();
            allBills.push({
              ...bill,
              billId: billDoc.id,
              userId: tenantId,
              tenantId,
              isVirtualOffice: true,
              clientName: tenantData.fullName || 'N/A',
              email: tenantData.email || 'N/A',
              companyName: tenantData.company || 'N/A',
              serviceType: 'virtual-office'
            });
          });
        }
      }
    } else {
      // Fetch bills for specific users
      for (const userId of userIds) {
        // Try fetching from client users first
        const userDoc = await db.collection('accounts').doc('client').collection('users').doc(userId).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          const billsSnapshot = await db
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(userId)
            .collection('bills')
            .get();

          billsSnapshot.forEach(billDoc => {
            const bill = billDoc.data();
            allBills.push({
              ...bill,
              billId: billDoc.id,
              userId,
              clientName: userData.name || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : 'N/A'),
              email: userData.email || 'N/A',
              companyName: userData.companyName || 'N/A',
              serviceType: bill.serviceType || 'N/A'
            });
          });
        } else {
          // Try fetching from virtual office tenants
          const tenantDoc = await db.collection('accounts').doc('virtual-tenants').collection('tenants').doc(userId).get();
          
          if (tenantDoc.exists) {
            const tenantData = tenantDoc.data();
            const billsSnapshot = await db
              .collection('accounts')
              .doc('virtual-tenants')
              .collection('tenants')
              .doc(userId)
              .collection('bills')
              .get();

            billsSnapshot.forEach(billDoc => {
              const bill = billDoc.data();
              allBills.push({
                ...bill,
                billId: billDoc.id,
                userId,
                tenantId: userId,
                isVirtualOffice: true,
                clientName: tenantData.fullName || 'N/A',
                email: tenantData.email || 'N/A',
                companyName: tenantData.company || 'N/A',
                serviceType: 'virtual-office'
              });
            });
          }
        }
      }
    }

    console.log(`[exportBillingPDF] Fetched ${allBills.length} bills before filtering`);

    // Apply filters
    let filteredBills = allBills.filter(bill => {
      // Status filter
      if (status && status !== 'all' && bill.status !== status) {
        return false;
      }

      // Service type filter
      if (service && service !== 'all' && bill.serviceType !== service) {
        return false;
      }

      // Date range filter (based on startDate)
      if (dateFrom || dateTo) {
        const billStartDate = bill.startDate?.toDate ? bill.startDate.toDate() : new Date(bill.startDate);
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (billStartDate < fromDate) {
            return false;
          }
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (billStartDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });

    console.log(`[exportBillingPDF] ${filteredBills.length} bills after filtering`);

    // Sort bills by client name
    filteredBills.sort((a, b) => (a.clientName || '').localeCompare(b.clientName || ''));

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=billing-report-${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(20).font('Helvetica-Bold').text('Billing Report', { align: 'center' });
    doc.moveDown(0.5);
    
    // Add generation date
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    // Add filter summary
    doc.fontSize(12).font('Helvetica-Bold').text('Filters Applied:', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Status: ${status && status !== 'all' ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}`);
    doc.text(`Service Type: ${service && service !== 'all' ? service.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'All'}`);
    doc.text(`Date Range: ${dateFrom || 'Any'} to ${dateTo || 'Any'}`);
    doc.text(`Total Bills: ${filteredBills.length}`);
    doc.moveDown(1.5);

    if (filteredBills.length === 0) {
      doc.fontSize(12).text('No bills found matching the selected filters.', { align: 'center' });
    } else {
      // Calculate totals
      const totalAmount = filteredBills.reduce((sum, bill) => {
        return sum + (bill.amount || 0) + (bill.cusaFee || 0) + (bill.parkingFee || 0) + (bill.lateFee || 0) + (bill.damageFee || 0);
      }, 0);

      const paidBills = filteredBills.filter(b => b.status === 'paid');
      const unpaidBills = filteredBills.filter(b => b.status === 'unpaid');
      const overdueBills = filteredBills.filter(b => b.status === 'overdue');

      // Add summary statistics
      doc.fontSize(12).font('Helvetica-Bold').text('Summary:', { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Amount: ₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      doc.text(`Paid Bills: ${paidBills.length}`);
      doc.text(`Unpaid Bills: ${unpaidBills.length}`);
      doc.text(`Overdue Bills: ${overdueBills.length}`);
      doc.moveDown(1.5);

      // Add bills table
      const tableTop = doc.y;
      const itemHeight = 20;
      const pageHeight = doc.page.height - doc.page.margins.bottom;

      // Table headers
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Client', 50, tableTop, { width: 100 });
      doc.text('Service', 155, tableTop, { width: 80 });
      doc.text('Resource', 240, tableTop, { width: 80 });
      doc.text('Amount', 325, tableTop, { width: 70, align: 'right' });
      doc.text('Due Date', 400, tableTop, { width: 70 });
      doc.text('Status', 475, tableTop, { width: 70 });

      // Draw header line
      doc.moveTo(50, tableTop + 12).lineTo(545, tableTop + 12).stroke();

      let currentY = tableTop + 20;

      // Add bills
      doc.font('Helvetica').fontSize(8);
      filteredBills.forEach((bill, index) => {
        // Check if we need a new page
        if (currentY + itemHeight > pageHeight) {
          doc.addPage();
          currentY = 50;
          
          // Redraw headers on new page
          doc.fontSize(9).font('Helvetica-Bold');
          doc.text('Client', 50, currentY, { width: 100 });
          doc.text('Service', 155, currentY, { width: 80 });
          doc.text('Resource', 240, currentY, { width: 80 });
          doc.text('Amount', 325, currentY, { width: 70, align: 'right' });
          doc.text('Due Date', 400, currentY, { width: 70 });
          doc.text('Status', 475, currentY, { width: 70 });
          doc.moveTo(50, currentY + 12).lineTo(545, currentY + 12).stroke();
          currentY += 20;
          doc.font('Helvetica').fontSize(8);
        }

        const totalBillAmount = (bill.amount || 0) + (bill.cusaFee || 0) + (bill.parkingFee || 0) + (bill.lateFee || 0) + (bill.damageFee || 0);
        const dueDate = bill.dueDate?.toDate ? bill.dueDate.toDate() : new Date(bill.dueDate);
        const serviceLabel = bill.serviceType === 'dedicated-desk' ? 'Dedicated Desk' : 
                            bill.serviceType === 'private-office' ? 'Private Office' : 
                            bill.serviceType === 'virtual-office' ? 'Virtual Office' : 'N/A';

        doc.text(bill.clientName || 'N/A', 50, currentY, { width: 100, ellipsis: true });
        doc.text(serviceLabel, 155, currentY, { width: 80, ellipsis: true });
        doc.text(bill.assignedResource || 'N/A', 240, currentY, { width: 80, ellipsis: true });
        doc.text(`₱${totalBillAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 325, currentY, { width: 70, align: 'right' });
        doc.text(dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 400, currentY, { width: 70 });
        doc.text(bill.status ? bill.status.charAt(0).toUpperCase() + bill.status.slice(1) : 'N/A', 475, currentY, { width: 70 });

        currentY += itemHeight;
      });
    }

    // Finalize PDF
    doc.end();

    console.log('[exportBillingPDF] PDF generated successfully');
  } catch (error) {
    console.error('[exportBillingPDF] Error generating PDF:', error);
    
    // If headers haven't been sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  }
};
