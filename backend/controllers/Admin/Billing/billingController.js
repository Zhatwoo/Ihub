// Admin Billing controller
// Handles billing, invoices, and revenue calculations

import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

/**
 * Get billing dashboard data
 */
export const getBillingDashboard = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Fetch all revenue-generating data
    const [schedulesSnapshot, virtualOfficeSnapshot, deskAssignmentsSnapshot] = await Promise.all([
      firestore.collection('privateOfficeRooms').doc('data').collection('requests').get(),
      firestore.collection('virtual-office-clients').get(),
      firestore.collection('desk-assignments').get()
    ]);

    const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const virtualOfficeClients = virtualOfficeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const deskAssignments = deskAssignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate revenue from private office bookings
    const privateOfficeRevenue = schedules
      .filter(s => s.status === 'completed' || s.status === 'active')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    // Calculate revenue from virtual office (dummy calculation)
    const virtualOfficeRevenue = virtualOfficeClients
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + (c.monthlyFee || 2500), 0);

    // Calculate revenue from dedicated desks (dummy calculation)
    const dedicatedDeskRevenue = deskAssignments
      .reduce((sum, d) => sum + (d.monthlyFee || 3000), 0);

    const totalRevenue = privateOfficeRevenue + virtualOfficeRevenue + dedicatedDeskRevenue;

    // Calculate monthly revenue for the last 6 months
    const monthlyRevenue = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      // Calculate revenue for this month (simplified)
      const monthRevenue = schedules
        .filter(s => {
          const scheduleDate = new Date(s.startDate || s.createdAt);
          return scheduleDate >= monthStart && scheduleDate <= monthEnd && 
                 (s.status === 'completed' || s.status === 'active');
        })
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      monthlyRevenue.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue,
        privateOffice: monthRevenue * 0.6, // Assume 60% from private office
        virtualOffice: monthRevenue * 0.25, // 25% from virtual office
        dedicatedDesk: monthRevenue * 0.15  // 15% from dedicated desk
      });
    }

    // Generate dummy invoice data
    const dummyInvoices = [
      { id: 'INV-2024-001', client: 'Tech Corp Ltd.', amount: 15000, status: 'Paid', dueDate: '2024-01-15', service: 'Private Office' },
      { id: 'INV-2024-002', client: 'StartUp Inc.', amount: 8500, status: 'Pending', dueDate: '2024-01-20', service: 'Virtual Office' },
      { id: 'INV-2024-003', client: 'Design Studio', amount: 12000, status: 'Paid', dueDate: '2024-01-10', service: 'Dedicated Desk' },
      { id: 'INV-2024-004', client: 'Marketing Agency', amount: 20000, status: 'Overdue', dueDate: '2024-01-05', service: 'Private Office' },
      { id: 'INV-2024-005', client: 'Consulting Firm', amount: 6500, status: 'Paid', dueDate: '2024-01-25', service: 'Virtual Office' }
    ];

    const revenueStats = {
      total: totalRevenue,
      privateOffice: privateOfficeRevenue,
      virtualOffice: virtualOfficeRevenue,
      dedicatedDesk: dedicatedDeskRevenue,
      monthlyGrowth: monthlyRevenue.length > 1 ? 
        ((monthlyRevenue[5].revenue - monthlyRevenue[4].revenue) / monthlyRevenue[4].revenue * 100) : 0
    };

    const invoiceStats = {
      total: dummyInvoices.length,
      paid: dummyInvoices.filter(i => i.status === 'Paid').length,
      pending: dummyInvoices.filter(i => i.status === 'Pending').length,
      overdue: dummyInvoices.filter(i => i.status === 'Overdue').length,
      totalAmount: dummyInvoices.reduce((sum, i) => sum + i.amount, 0),
      paidAmount: dummyInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0)
    };

    res.json({
      success: true,
      data: {
        revenueStats,
        invoiceStats,
        monthlyRevenue,
        recentInvoices: dummyInvoices.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Get billing dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch billing dashboard data'
    });
  }
};

/**
 * Get invoices with filtering
 */
export const getInvoices = async (req, res) => {
  try {
    const { status, search, sortBy = 'dueDate', sortOrder = 'desc' } = req.query;
    
    // Generate dummy invoice data (in real app, fetch from invoices collection)
    const dummyInvoices = [
      { id: 'INV-2024-001', client: 'Tech Corp Ltd.', amount: 15000, status: 'Paid', dueDate: '2024-01-15', service: 'Private Office', createdAt: '2024-01-01' },
      { id: 'INV-2024-002', client: 'StartUp Inc.', amount: 8500, status: 'Pending', dueDate: '2024-01-20', service: 'Virtual Office', createdAt: '2024-01-02' },
      { id: 'INV-2024-003', client: 'Design Studio', amount: 12000, status: 'Paid', dueDate: '2024-01-10', service: 'Dedicated Desk', createdAt: '2024-01-03' },
      { id: 'INV-2024-004', client: 'Marketing Agency', amount: 20000, status: 'Overdue', dueDate: '2024-01-05', service: 'Private Office', createdAt: '2024-01-04' },
      { id: 'INV-2024-005', client: 'Consulting Firm', amount: 6500, status: 'Paid', dueDate: '2024-01-25', service: 'Virtual Office', createdAt: '2024-01-05' },
      { id: 'INV-2024-006', client: 'Law Firm LLC', amount: 18000, status: 'Pending', dueDate: '2024-01-30', service: 'Private Office', createdAt: '2024-01-06' },
      { id: 'INV-2024-007', client: 'Creative Agency', amount: 9500, status: 'Paid', dueDate: '2024-01-12', service: 'Dedicated Desk', createdAt: '2024-01-07' },
      { id: 'INV-2024-008', client: 'Finance Corp', amount: 25000, status: 'Overdue', dueDate: '2024-01-08', service: 'Private Office', createdAt: '2024-01-08' }
    ];

    let filteredInvoices = [...dummyInvoices];

    // Apply status filter
    if (status && status !== 'all') {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.id.toLowerCase().includes(searchLower) ||
        invoice.client.toLowerCase().includes(searchLower) ||
        invoice.service.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filteredInvoices.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'dueDate') {
        comparison = new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'client') {
        comparison = a.client.localeCompare(b.client);
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    res.json({
      success: true,
      data: {
        invoices: filteredInvoices,
        totalCount: filteredInvoices.length
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch invoices'
    });
  }
};