// Admin Reports controller
// Handles report generation and analytics

import { getFirestore } from '../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../utils/firestoreHelper.js';

/**
 * Get reservation trends data
 */
export const getReservationTrends = async (req, res) => {
  try {
    const { period = '12months' } = req.query;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Fetch all schedules
    const schedulesSnapshot = await firestore.collection('privateOfficeRooms').doc('data').collection('requests').get();
    const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate monthly data for the last 12 months
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthReservations = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.startDate || schedule.createdAt);
        return scheduleDate >= monthStart && scheduleDate <= monthEnd;
      });

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        reservations: monthReservations.length,
        revenue: monthReservations.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      });
    }

    res.json({
      success: true,
      data: {
        monthlyData,
        totalReservations: schedules.length,
        totalRevenue: schedules.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      }
    });
  } catch (error) {
    console.error('Get reservation trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch reservation trends'
    });
  }
};

/**
 * Get report history with filtering
 */
export const getReportHistory = async (req, res) => {
  try {
    const { type = 'all', status, search } = req.query;
    
    // For now, return dummy data since we don't have a reports collection
    // In a real implementation, you would fetch from a reports collection
    const dummyReports = [
      { id: 1, title: 'Monthly Revenue Report', type: 'Revenue', status: 'Generated', date: '2024-01-15', size: '2.3 MB' },
      { id: 2, title: 'Occupancy Analytics', type: 'Occupancy', status: 'Generated', date: '2024-01-10', size: '1.8 MB' },
      { id: 3, title: 'Client Activity Report', type: 'Activity', status: 'Pending', date: '2024-01-08', size: '0 MB' },
      { id: 4, title: 'Booking Trends Analysis', type: 'Booking', status: 'Generated', date: '2024-01-05', size: '3.1 MB' },
      { id: 5, title: 'Financial Summary Q4', type: 'Revenue', status: 'Generated', date: '2024-01-01', size: '4.2 MB' }
    ];

    let filteredReports = [...dummyReports];

    // Apply type filter
    if (type !== 'all') {
      filteredReports = filteredReports.filter(report => report.type === type);
    }

    // Apply status filter
    if (status) {
      filteredReports = filteredReports.filter(report => report.status === status);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReports = filteredReports.filter(report =>
        report.title.toLowerCase().includes(searchLower) ||
        report.type.toLowerCase().includes(searchLower)
      );
    }

    // Calculate stats
    const stats = {
      total: dummyReports.length,
      generated: dummyReports.filter(r => r.status === 'Generated').length,
      pending: dummyReports.filter(r => r.status === 'Pending').length,
      byType: {
        Revenue: dummyReports.filter(r => r.type === 'Revenue').length,
        Occupancy: dummyReports.filter(r => r.type === 'Occupancy').length,
        Activity: dummyReports.filter(r => r.type === 'Activity').length,
        Booking: dummyReports.filter(r => r.type === 'Booking').length
      }
    };

    res.json({
      success: true,
      data: {
        reports: filteredReports,
        stats,
        totalCount: filteredReports.length
      }
    });
  } catch (error) {
    console.error('Get report history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch report history'
    });
  }
};

/**
 * Generate new report
 */
export const generateReport = async (req, res) => {
  try {
    const { type, title, dateRange } = req.body;
    
    // In a real implementation, you would:
    // 1. Validate the request
    // 2. Generate the actual report based on type
    // 3. Save it to storage
    // 4. Create a record in reports collection
    
    // For now, simulate report generation
    const reportId = Date.now().toString();
    
    res.json({
      success: true,
      message: 'Report generation started',
      data: {
        id: reportId,
        title,
        type,
        status: 'Generating',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to generate report'
    });
  }
};