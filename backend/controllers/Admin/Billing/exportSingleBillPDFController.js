import { getFirestore } from '../../../config/firebase.js';
import PDFDocument from 'pdfkit';

export const exportSingleBillPDF = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { userId, billId } = req.params;
    const { isVirtualOffice } = req.query;

    console.log('[exportSingleBillPDF] Export request:', { userId, billId, isVirtualOffice });

    // Fetch the specific bill
    let billRef;
    let userRef;
    
    if (isVirtualOffice === 'true') {
      billRef = db
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .doc(userId)
        .collection('bills')
        .doc(billId);
      
      userRef = db
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .doc(userId);
    } else {
      billRef = db
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId)
        .collection('bills')
        .doc(billId);
      
      userRef = db
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId);
    }

    const billDoc = await billRef.get();
    const userDoc = await userRef.get();

    if (!billDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const bill = billDoc.data();
    const userData = userDoc.data();

    // Get client information - prioritize bill data, then user data
    const clientName = bill.clientName || 
      (isVirtualOffice === 'true' 
        ? (userData.fullName || 'N/A')
        : (userData.name || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : 'N/A')));

    const email = bill.email || userData.email || 'N/A';
    const companyName = bill.companyName || 
      (isVirtualOffice === 'true' ? (userData.company || 'N/A') : (userData.companyName || 'N/A'));
    const phone = bill.contactNumber || 
      (isVirtualOffice === 'true' ? (userData.phoneNumber || 'N/A') : (userData.contactNumber || 'N/A'));

    // Convert dates
    const dueDate = bill.dueDate?.toDate ? bill.dueDate.toDate() : new Date(bill.dueDate);
    const startDate = bill.startDate?.toDate ? bill.startDate.toDate() : new Date(bill.startDate);
    const paidAt = bill.paidAt?.toDate ? bill.paidAt.toDate() : (bill.paidAt ? new Date(bill.paidAt) : null);

    // Calculate amounts
    const amount = bill.amount || 0;
    const cusaFee = bill.cusaFee || 0;
    const parkingFee = bill.parkingFee || 0;
    const lateFee = bill.lateFee || 0;
    const damageFee = bill.damageFee || 0;
    const totalAmount = amount + cusaFee + parkingFee + lateFee + damageFee;

    // Format dates for filename
    const formatDateForFilename = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const startDateFormatted = formatDateForFilename(startDate);
    const dueDateFormatted = formatDateForFilename(dueDate);
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const filename = `${sanitizedClientName}, ${startDateFormatted} - ${dueDateFormatted}.pdf`;

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header with logo placeholder
    doc.fontSize(24).font('Helvetica-Bold').text('BILLING STATEMENT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text('Inspire Hub', { align: 'center' });
    doc.moveDown(2);

    // Add bill information box
    doc.fontSize(12).font('Helvetica-Bold').text('Bill Information', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`Bill ID: ${billId}`);
    doc.text(`Status: ${bill.status ? bill.status.charAt(0).toUpperCase() + bill.status.slice(1) : 'N/A'}`);
    doc.text(`Issue Date: ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
    doc.text(`Due Date: ${dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
    if (paidAt) {
      doc.text(`Paid Date: ${paidAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
    }
    doc.moveDown(1.5);

    // Add client information
    doc.fontSize(12).font('Helvetica-Bold').text('Client Information', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${clientName}`);
    doc.text(`Company: ${companyName}`);
    doc.text(`Email: ${email}`);
    doc.text(`Phone: ${phone}`);
    doc.moveDown(1.5);

    // Add service information
    doc.fontSize(12).font('Helvetica-Bold').text('Service Information', { underline: true });
    doc.moveDown(0.5);
    
    const serviceLabel = bill.serviceType === 'dedicated-desk' ? 'Dedicated Desk' : 
                        bill.serviceType === 'private-office' ? 'Private Office' : 
                        bill.serviceType === 'virtual-office' ? 'Virtual Office' : 'N/A';
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`Service Type: ${serviceLabel}`);
    doc.text(`Assigned Resource: ${bill.assignedResource || bill.desk || bill.room || bill.office || 'N/A'}`);
    doc.text(`Billing Period: ${bill.feePeriod || 'N/A'}`);
    doc.moveDown(1.5);

    // Add charges breakdown
    doc.fontSize(12).font('Helvetica-Bold').text('Charges Breakdown', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const descriptionX = 50;
    const amountX = 450;

    // Table headers
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', descriptionX, tableTop);
    doc.text('Amount', amountX, tableTop, { width: 95, align: 'right' });
    
    // Draw header line
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let currentY = tableTop + 25;
    doc.font('Helvetica').fontSize(10);

    // Add line items - show all charges
    doc.text('Base Fee', descriptionX, currentY);
    doc.text(`₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
    currentY += 20;

    doc.text('CUSA Fee', descriptionX, currentY);
    doc.text(`₱${cusaFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
    currentY += 20;

    doc.text('Parking Fee', descriptionX, currentY);
    doc.text(`₱${parkingFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
    currentY += 20;

    doc.text('Late Fee', descriptionX, currentY);
    doc.text(`₱${lateFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
    currentY += 20;

    doc.text('Damage Fee', descriptionX, currentY);
    doc.text(`₱${damageFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
    currentY += 20;

    // Draw line before total
    doc.moveTo(50, currentY + 5).lineTo(545, currentY + 5).stroke();
    currentY += 15;

    // Add total
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL AMOUNT', descriptionX, currentY);
    doc.text(`₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });

    // Add footer
    doc.fontSize(8).font('Helvetica').text(
      'Thank you for your business!',
      50,
      doc.page.height - 100,
      { align: 'center', width: doc.page.width - 100 }
    );

    doc.text(
      'For any questions regarding this bill, please contact our billing department.',
      50,
      doc.page.height - 80,
      { align: 'center', width: doc.page.width - 100 }
    );

    // Finalize PDF
    doc.end();

    console.log('[exportSingleBillPDF] PDF generated successfully');
  } catch (error) {
    console.error('[exportSingleBillPDF] Error generating PDF:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  }
};

// Export multiple bills as a single PDF with page breaks
export const exportMultipleBillsPDF = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { userId, billIds, isVirtualOffice } = req.body;

    console.log('[exportMultipleBillsPDF] Export request:', { userId, billIds, isVirtualOffice });

    if (!billIds || billIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No bills selected for export'
      });
    }

    // Fetch user data once
    let userRef;
    
    if (isVirtualOffice) {
      userRef = db
        .collection('accounts')
        .doc('virtual-tenants')
        .collection('tenants')
        .doc(userId);
    } else {
      userRef = db
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId);
    }

    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    const clientName = isVirtualOffice 
      ? (userData.fullName || 'N/A')
      : (userData.name || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : 'N/A'));

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bills-${userId}-${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Fetch and add each bill to the PDF
    for (let i = 0; i < billIds.length; i++) {
      const billId = billIds[i];
      
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
        continue; // Skip if bill not found
      }

      const bill = billDoc.data();

      // Add page break between bills (except for the first one)
      if (i > 0) {
        doc.addPage();
      }

      // Get client information - prioritize bill data, then user data
      const email = bill.email || userData.email || 'N/A';
      const companyName = bill.companyName || 
        (isVirtualOffice ? (userData.company || 'N/A') : (userData.companyName || 'N/A'));
      const phone = bill.contactNumber || 
        (isVirtualOffice ? (userData.phoneNumber || 'N/A') : (userData.contactNumber || 'N/A'));

      // Convert dates
      const dueDate = bill.dueDate?.toDate ? bill.dueDate.toDate() : new Date(bill.dueDate);
      const startDate = bill.startDate?.toDate ? bill.startDate.toDate() : new Date(bill.startDate);
      const paidAt = bill.paidAt?.toDate ? bill.paidAt.toDate() : (bill.paidAt ? new Date(bill.paidAt) : null);

      // Calculate amounts
      const amount = bill.amount || 0;
      const cusaFee = bill.cusaFee || 0;
      const parkingFee = bill.parkingFee || 0;
      const lateFee = bill.lateFee || 0;
      const damageFee = bill.damageFee || 0;
      const totalAmount = amount + cusaFee + parkingFee + lateFee + damageFee;

      // Add header
      doc.fontSize(24).font('Helvetica-Bold').text('BILLING STATEMENT', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text('Inspire Hub', { align: 'center' });
      doc.moveDown(2);

      // Add bill information
      doc.fontSize(12).font('Helvetica-Bold').text('Bill Information', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Bill ID: ${billId}`);
      doc.text(`Status: ${bill.status ? bill.status.charAt(0).toUpperCase() + bill.status.slice(1) : 'N/A'}`);
      doc.text(`Issue Date: ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
      doc.text(`Due Date: ${dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
      if (paidAt) {
        doc.text(`Paid Date: ${paidAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
      }
      doc.moveDown(1.5);

      // Add client information
      doc.fontSize(12).font('Helvetica-Bold').text('Client Information', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${clientName}`);
      doc.text(`Company: ${companyName}`);
      doc.text(`Email: ${email}`);
      doc.text(`Phone: ${phone}`);
      doc.moveDown(1.5);

      // Add service information
      doc.fontSize(12).font('Helvetica-Bold').text('Service Information', { underline: true });
      doc.moveDown(0.5);
      
      const serviceLabel = bill.serviceType === 'dedicated-desk' ? 'Dedicated Desk' : 
                          bill.serviceType === 'private-office' ? 'Private Office' : 
                          bill.serviceType === 'virtual-office' ? 'Virtual Office' : 'N/A';
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Service Type: ${serviceLabel}`);
      doc.text(`Assigned Resource: ${bill.assignedResource || bill.desk || bill.room || bill.office || 'N/A'}`);
      doc.text(`Billing Period: ${bill.feePeriod || 'N/A'}`);
      doc.moveDown(1.5);

      // Add charges breakdown
      doc.fontSize(12).font('Helvetica-Bold').text('Charges Breakdown', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const descriptionX = 50;
      const amountX = 450;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', descriptionX, tableTop);
      doc.text('Amount', amountX, tableTop, { width: 95, align: 'right' });
      
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

      let currentY = tableTop + 25;
      doc.font('Helvetica').fontSize(10);

      doc.text('Base Fee', descriptionX, currentY);
      doc.text(`₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
      currentY += 20;

      doc.text('CUSA Fee', descriptionX, currentY);
      doc.text(`₱${cusaFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
      currentY += 20;

      doc.text('Parking Fee', descriptionX, currentY);
      doc.text(`₱${parkingFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
      currentY += 20;

      doc.text('Late Fee', descriptionX, currentY);
      doc.text(`₱${lateFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
      currentY += 20;

      doc.text('Damage Fee', descriptionX, currentY);
      doc.text(`₱${damageFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
      currentY += 20;

      doc.moveTo(50, currentY + 5).lineTo(545, currentY + 5).stroke();
      currentY += 15;

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL AMOUNT', descriptionX, currentY);
      doc.text(`₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });

      // Add footer
      doc.fontSize(8).font('Helvetica').text(
        'Thank you for your business!',
        50,
        doc.page.height - 100,
        { align: 'center', width: doc.page.width - 100 }
      );

      doc.text(
        'For any questions regarding this bill, please contact our billing department.',
        50,
        doc.page.height - 80,
        { align: 'center', width: doc.page.width - 100 }
      );
    }

    // Finalize PDF
    doc.end();

    console.log('[exportMultipleBillsPDF] PDF generated successfully');
  } catch (error) {
    console.error('[exportMultipleBillsPDF] Error generating PDF:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  }
};


// Export selected bills (from potentially different users) as a single PDF
export const exportSelectedBillsPDF = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { bills } = req.body;

    console.log('[exportSelectedBillsPDF] Export request for', bills?.length, 'bills');

    if (!bills || bills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No bills selected for export'
      });
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=selected-bills-${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Process each bill
    for (let i = 0; i < bills.length; i++) {
      const billData = bills[i];
      
      // Add page break between bills (except for the first one)
      if (i > 0) {
        doc.addPage();
      }

      // Convert dates
      const dueDate = billData.dueDate ? new Date(billData.dueDate) : new Date();
      const startDate = billData.startDate ? new Date(billData.startDate) : new Date();
      const paidAt = billData.paidAt ? new Date(billData.paidAt) : null;

      // Calculate amounts
      const amount = billData.amount || 0;
      const cusaFee = billData.cusaFee || 0;
      const parkingFee = billData.parkingFee || 0;
      const lateFee = billData.lateFee || 0;
      const damageFee = billData.damageFee || 0;
      const totalAmount = amount + cusaFee + parkingFee + lateFee + damageFee;

      // Add header
      doc.fontSize(24).font('Helvetica-Bold').text('BILLING STATEMENT', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text('Inspire Hub', { align: 'center' });
      doc.moveDown(2);

      // Add bill information
      doc.fontSize(12).font('Helvetica-Bold').text('Bill Information', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Bill ID: ${billData.billId}`);
      doc.text(`Status: ${billData.status ? billData.status.charAt(0).toUpperCase() + billData.status.slice(1) : 'N/A'}`);
      doc.text(`Issue Date: ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
      doc.text(`Due Date: ${dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
      if (paidAt) {
        doc.text(`Paid Date: ${paidAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
      }
      doc.moveDown(1.5);

      // Add client information
      doc.fontSize(12).font('Helvetica-Bold').text('Client Information', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${billData.clientName || 'N/A'}`);
      doc.text(`Company: ${billData.companyName || 'N/A'}`);
      doc.text(`Email: ${billData.email || 'N/A'}`);
      doc.text(`Phone: ${billData.contactNumber || 'N/A'}`);
      doc.moveDown(1.5);

      // Add service information
      doc.fontSize(12).font('Helvetica-Bold').text('Service Information', { underline: true });
      doc.moveDown(0.5);
      
      const serviceLabel = billData.serviceType === 'dedicated-desk' ? 'Dedicated Desk' : 
                          billData.serviceType === 'private-office' ? 'Private Office' : 
                          billData.serviceType === 'virtual-office' ? 'Virtual Office' : 'N/A';
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Service Type: ${serviceLabel}`);
      doc.text(`Assigned Resource: ${billData.assignedResource || 'N/A'}`);
      doc.text(`Billing Period: ${billData.feePeriod || 'N/A'}`);
      doc.moveDown(1.5);

      // Add charges breakdown
      doc.fontSize(12).font('Helvetica-Bold').text('Charges Breakdown', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const descriptionX = 50;
      const amountX = 450;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', descriptionX, tableTop);
      doc.text('Amount', amountX, tableTop, { width: 95, align: 'right' });
      
      doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

      let currentY = tableTop + 25;
      doc.font('Helvetica').fontSize(10);

      doc.text('Base Fee', descriptionX, currentY);
      doc.text(`₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
      currentY += 20;

      doc.text('CUSA Fee', descriptionX, currentY);
      doc.text(`₱${cusaFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
      currentY += 20;

      doc.text('Parking Fee', descriptionX, currentY);
      doc.text(`₱${parkingFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
      currentY += 20;

      doc.text('Late Fee', descriptionX, currentY);
      doc.text(`₱${lateFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
      currentY += 20;

      doc.text('Damage Fee', descriptionX, currentY);
      doc.text(`₱${damageFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });
      currentY += 20;

      doc.moveTo(50, currentY + 5).lineTo(545, currentY + 5).stroke();
      currentY += 15;

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL AMOUNT', descriptionX, currentY);
      doc.text(`₱${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, amountX, currentY, { width: 95, align: 'right' });

      // Add footer
      doc.fontSize(8).font('Helvetica').text(
        'Thank you for your business!',
        50,
        doc.page.height - 100,
        { align: 'center', width: doc.page.width - 100 }
      );

      doc.text(
        'For any questions regarding this bill, please contact our billing department.',
        50,
        doc.page.height - 80,
        { align: 'center', width: doc.page.width - 100 }
      );
    }

    // Finalize PDF
    doc.end();

    console.log('[exportSelectedBillsPDF] PDF generated successfully');
  } catch (error) {
    console.error('[exportSelectedBillsPDF] Error generating PDF:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  }
};
