// Admin Dedicated Desk controller
// Handles desk assignments, requests, and floor plan data

import { getFirestore } from '../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../utils/firestoreHelper.js';

/**
 * Get desk assignments with filtering and processing
 */
export const getDeskAssignments = async (req, res) => {
  try {
    const { part, search, sortBy = 'deskTag', sortOrder = 'asc' } = req.query;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    const assignmentsSnapshot = await firestore.collection('desk-assignments').get();
    let assignments = assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Apply part filter
    if (part && part !== 'all') {
      assignments = assignments.filter(assignment => 
        assignment.deskTag && assignment.deskTag.startsWith(part.toUpperCase())
      );
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      assignments = assignments.filter(assignment =>
        (assignment.name && assignment.name.toLowerCase().includes(searchLower)) ||
        (assignment.email && assignment.email.toLowerCase().includes(searchLower)) ||
        (assignment.deskTag && assignment.deskTag.toLowerCase().includes(searchLower)) ||
        (assignment.company && assignment.company.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    assignments.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'deskTag') {
        const partA = a.deskTag?.charAt(0) || '';
        const partB = b.deskTag?.charAt(0) || '';
        if (partA !== partB) {
          comparison = partA.localeCompare(partB);
        } else {
          const numA = parseInt(a.deskTag?.slice(1)) || 0;
          const numB = parseInt(b.deskTag?.slice(1)) || 0;
          comparison = numA - numB;
        }
      } else if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'type') {
        comparison = (a.type || '').localeCompare(b.type || '');
      } else if (sortBy === 'assignedAt') {
        comparison = new Date(a.assignedAt || 0) - new Date(b.assignedAt || 0);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Calculate stats by part
    const statsByPart = {};
    const parts = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    parts.forEach(partLetter => {
      const partAssignments = assignments.filter(a => a.deskTag?.startsWith(partLetter));
      statsByPart[partLetter] = {
        total: partAssignments.length,
        tenants: partAssignments.filter(a => a.type === 'Tenant').length,
        employees: partAssignments.filter(a => a.type === 'Employee').length
      };
    });

    res.json({
      success: true,
      data: {
        assignments,
        statsByPart,
        totalCount: assignments.length
      }
    });
  } catch (error) {
    console.error('Get desk assignments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch desk assignments'
    });
  }
};

/**
 * Get desk requests with filtering
 */
export const getDeskRequests = async (req, res) => {
  try {
    const { status, search, sortBy = 'requestDate', sortOrder = 'desc' } = req.query;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Get desk requests from user documents
    const usersSnapshot = await firestore.collection('accounts').doc('client').collection('users').get();
    const deskRequests = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.deskRequest) {
        deskRequests.push({
          id: userDoc.id,
          userId: userDoc.id,
          ...userData.deskRequest,
          userInfo: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email
          }
        });
      }
    }

    let filteredRequests = [...deskRequests];

    // Apply status filter
    if (status && status !== 'all') {
      filteredRequests = filteredRequests.filter(request => request.status === status);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRequests = filteredRequests.filter(request =>
        (request.userInfo?.firstName && request.userInfo.firstName.toLowerCase().includes(searchLower)) ||
        (request.userInfo?.lastName && request.userInfo.lastName.toLowerCase().includes(searchLower)) ||
        (request.userInfo?.email && request.userInfo.email.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filteredRequests.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'requestDate') {
        comparison = new Date(a.requestDate || a.createdAt || 0) - new Date(b.requestDate || b.createdAt || 0);
      } else if (sortBy === 'name') {
        const nameA = `${a.userInfo?.firstName || ''} ${a.userInfo?.lastName || ''}`.trim();
        const nameB = `${b.userInfo?.firstName || ''} ${b.userInfo?.lastName || ''}`.trim();
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Calculate stats
    const stats = {
      total: deskRequests.length,
      pending: deskRequests.filter(r => r.status === 'pending').length,
      approved: deskRequests.filter(r => r.status === 'approved').length,
      rejected: deskRequests.filter(r => r.status === 'rejected').length
    };

    res.json({
      success: true,
      data: {
        requests: filteredRequests,
        stats,
        totalCount: filteredRequests.length
      }
    });
  } catch (error) {
    console.error('Get desk requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch desk requests'
    });
  }
};

/**
 * Update desk request status
 */
export const updateDeskRequestStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, adminNotes, assignedDesk } = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    const userRef = firestore.collection('accounts').doc('client').collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    if (!userData.deskRequest) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Desk request not found'
      });
    }

    // Update request status
    const updateData = {
      deskRequest: {
        ...userData.deskRequest,
        status,
        adminNotes: adminNotes || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    };

    // If approving, create desk assignment
    if (status === 'approved' && assignedDesk) {
      const assignmentData = {
        deskTag: assignedDesk,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        contactNumber: userData.phoneNumber || '',
        type: userData.deskRequest.occupantType || 'Tenant',
        company: userData.deskRequest.company || '',
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: userId
      };

      await firestore.collection('desk-assignments').doc(assignedDesk).set(assignmentData);
      updateData.deskRequest.assignedDesk = assignedDesk;
    }

    await userRef.update(updateData);

    res.json({
      success: true,
      message: `Desk request ${status} successfully`,
      data: updateData.deskRequest
    });
  } catch (error) {
    console.error('Update desk request status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update desk request status'
    });
  }
};

/**
 * Get occupants by part for floor plan
 */
export const getOccupantsByPart = async (req, res) => {
  try {
    const { part } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    const assignmentsSnapshot = await firestore.collection('desk-assignments').get();
    const assignments = assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter by part and sort by desk number
    const partOccupants = assignments
      .filter(assignment => assignment.deskTag && assignment.deskTag.startsWith(part.toUpperCase()))
      .sort((a, b) => {
        const numA = parseInt(a.deskTag.slice(1)) || 0;
        const numB = parseInt(b.deskTag.slice(1)) || 0;
        return numA - numB;
      });

    res.json({
      success: true,
      data: {
        occupants: partOccupants,
        totalCount: partOccupants.length
      }
    });
  } catch (error) {
    console.error('Get occupants by part error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch occupants by part'
    });
  }
};