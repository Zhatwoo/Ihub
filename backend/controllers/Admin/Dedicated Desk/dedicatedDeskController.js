// Admin Dedicated Desk controller
// Handles desk assignments, requests, and floor plan data

import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

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

    console.log('📋 [getDeskAssignments] Fetching desk assignments from /desk-assignments collection');
    const assignmentsSnapshot = await firestore.collection('desk-assignments').get();
    let assignments = assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`✅ [getDeskAssignments] Total assignments in /desk-assignments: ${assignments.length}`);
    console.log('📊 [getDeskAssignments] Raw assignments:', JSON.stringify(assignments.map(a => ({
      id: a.id,
      deskTag: a.deskTag || a.desk,
      name: a.name,
      type: a.type
    })), null, 2));

    // Apply part filter
    if (part && part !== 'all') {
      assignments = assignments.filter(assignment => 
        assignment.deskTag && assignment.deskTag.startsWith(part.toUpperCase())
      );
      console.log(`  Filtered by part ${part}: ${assignments.length} assignments`);
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
      console.log(`  Filtered by search "${search}": ${assignments.length} assignments`);
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

    console.log('📈 [getDeskAssignments] Stats by part:', statsByPart);

    res.json({
      success: true,
      data: {
        assignments,
        statsByPart,
        totalCount: assignments.length
      }
    });
  } catch (error) {
    console.error('❌ [getDeskAssignments] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch desk assignments'
    });
  }
};

/**
 * Get desk requests with filtering - OPTIMIZED to reduce Firestore quota usage
 */
export const getDeskRequests = async (req, res) => {
  try {
    const { status, search, sortBy = 'requestDate', sortOrder = 'desc' } = req.query;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // OPTIMIZED: Get all users first
    const usersSnapshot = await firestore.collection('accounts').doc('client').collection('users').get();
    const deskRequests = [];
    const userDocs = usersSnapshot.docs;

    console.log('📊 Total users found:', userDocs.length);

    // OPTIMIZED: Process in batches of 10 to avoid overwhelming Firestore and reduce quota usage
    const BATCH_SIZE = 10;
    for (let i = 0; i < userDocs.length; i += BATCH_SIZE) {
      const batch = userDocs.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel (but limited to BATCH_SIZE)
      const batchPromises = batch.map(async (userDoc) => {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        try {
          // Check the correct path: /accounts/client/users/{userId}/request/desk
          const deskRequestDoc = await firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(userId)
            .collection('request')
            .doc('desk')
            .get();

          if (deskRequestDoc.exists) {
            const deskRequestData = deskRequestDoc.data();
            
            // Skip empty documents
            if (Object.keys(deskRequestData).length === 0) {
              return null;
            }
            
            return {
              id: userId,
              userId: userId,
              ...deskRequestData,
              userInfo: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email
              }
            };
          }
          return null;
        } catch (error) {
          console.error(`Error checking desk request for user ${userId}:`, error);
          return null;
        }
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      deskRequests.push(...batchResults.filter(r => r !== null));
      
      // Small delay between batches to avoid quota exhaustion
      if (i + BATCH_SIZE < userDocs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
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
        comparison = new Date(a.requestDate || 0) - new Date(b.requestDate || 0);
      } else if (sortBy === 'name') {
        const nameA = `${a.userInfo?.firstName || ''} ${a.userInfo?.lastName || ''}`.trim();
        const nameB = `${b.userInfo?.firstName || ''} ${b.userInfo?.lastName || ''}`.trim();
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === 'email') {
        comparison = (a.userInfo?.email || '').localeCompare(b.userInfo?.email || '');
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

    // Get user data first
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

    // Get desk request from correct path: /accounts/client/users/{userId}/request/desk
    const deskRequestRef = firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .collection('request')
      .doc('desk');
      
    const deskRequestDoc = await deskRequestRef.get();

    if (!deskRequestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Desk request not found'
      });
    }

    const deskRequestData = deskRequestDoc.data();

    // Update request status in the correct path
    const updateData = {
      ...deskRequestData,
      status,
      adminNotes: adminNotes || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // If approving, create desk assignment
    if (status === 'approved' && assignedDesk) {
      const assignmentData = {
        deskTag: assignedDesk,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        contactNumber: userData.phoneNumber || '',
        type: deskRequestData.occupantType || 'Tenant',
        company: deskRequestData.company || '',
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: userId
      };

      await firestore.collection('desk-assignments').doc(assignedDesk).set(assignmentData);
      updateData.assignedDesk = assignedDesk;
    }

    await deskRequestRef.update(updateData);

    res.json({
      success: true,
      message: `Desk request ${status} successfully`,
      data: updateData
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
 * IMPORTANT: Fetches ONLY from /desk-assignments collection
 */
export const getOccupantsByPart = async (req, res) => {
  try {
    const { part } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    console.log('🔍 [getOccupantsByPart] Fetching occupants for part:', part);
    console.log('🔍 [getOccupantsByPart] Collection path: /desk-assignments');

    // Fetch from desk-assignments collection ONLY
    const assignmentsSnapshot = await firestore.collection('desk-assignments').get();
    const assignments = assignmentsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    console.log('📊 [getOccupantsByPart] Total documents in /desk-assignments:', assignments.length);
    console.log('📋 [getOccupantsByPart] All desk assignments:', JSON.stringify(assignments.map(a => ({ 
      id: a.id, 
      desk: a.desk, 
      deskTag: a.deskTag, 
      name: a.name,
      type: a.type
    })), null, 2));

    // Filter by part and sort by desk number
    const partOccupants = assignments
      .filter(assignment => {
        const deskIdentifier = assignment.deskTag || assignment.desk;
        const matches = deskIdentifier && deskIdentifier.toUpperCase().startsWith(part.toUpperCase());
        if (!matches) {
          console.log(`  ❌ Skipping ${assignment.id}: deskIdentifier="${deskIdentifier}" does not start with "${part}"`);
        }
        return matches;
      })
      .map(assignment => ({
        ...assignment,
        deskTag: assignment.deskTag || assignment.desk // Normalize to deskTag
      }))
      .sort((a, b) => {
        const numA = parseInt(a.deskTag.slice(1)) || 0;
        const numB = parseInt(b.deskTag.slice(1)) || 0;
        return numA - numB;
      });

    console.log(`✅ [getOccupantsByPart] Occupants for part ${part}:`, partOccupants.length);
    console.log('📍 [getOccupantsByPart] Filtered occupants:', JSON.stringify(partOccupants.map(o => ({ 
      deskTag: o.deskTag, 
      name: o.name,
      type: o.type 
    })), null, 2));

    res.json({
      success: true,
      data: {
        occupants: partOccupants,
        totalCount: partOccupants.length
      }
    });
  } catch (error) {
    console.error('❌ [getOccupantsByPart] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch occupants by part'
    });
  }
};

/**
 * Get all desk assignments
 */
export const getAllDeskAssignments = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    console.log('📋 [getAllDeskAssignments] Fetching all desk assignments from /desk-assignments collection');
    const assignmentsSnapshot = await firestore.collection('desk-assignments').get();
    
    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ [getAllDeskAssignments] Total desk assignments found: ${assignments.length}`);
    console.log('📊 [getAllDeskAssignments] Desk assignments:', JSON.stringify(assignments.map(a => ({
      id: a.id,
      deskTag: a.deskTag || a.desk,
      name: a.name,
      email: a.email,
      type: a.type,
      company: a.company
    })), null, 2));

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('❌ [getAllDeskAssignments] Error:', error);
    
    if (error.message && error.message.includes('not initialized')) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database is not connected. Please configure Firebase Admin SDK credentials in backend/.env'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch desk assignments'
    });
  }
};

/**
 * Get desk assignment by ID
 */
export const getDeskAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const assignmentDoc = await firestore.collection('desk-assignments').doc(assignmentId).get();

    if (!assignmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Desk assignment not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: assignmentDoc.id,
        ...assignmentDoc.data()
      }
    });
  } catch (error) {
    console.error('Get desk assignment by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch desk assignment'
    });
  }
};

/**
 * Create new desk assignment
 * If deskId is provided in assignmentData, use it as document ID
 */
export const createDeskAssignment = async (req, res) => {
  try {
    const assignmentData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // If desk field exists, use it as document ID (for direct assignment by desk tag)
    const docId = assignmentData.desk || null;
    
    let assignmentRef;
    if (docId) {
      // Use specific document ID (desk tag)
      assignmentRef = firestore.collection('desk-assignments').doc(docId);
      await assignmentRef.set({
        ...assignmentData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Let Firestore generate ID
      assignmentRef = await firestore.collection('desk-assignments').add({
        ...assignmentData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    const newAssignment = await assignmentRef.get();

    res.status(201).json({
      success: true,
      message: 'Desk assignment created successfully',
      data: {
        id: newAssignment.id,
        ...newAssignment.data()
      }
    });
  } catch (error) {
    console.error('Create desk assignment error:', error);
    
    if (error.message && error.message.includes('not initialized')) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database is not connected. Please configure Firebase Admin SDK credentials in backend/.env'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create desk assignment'
    });
  }
};

/**
 * Update desk assignment
 * Also supports create-if-not-exists behavior
 */
export const updateDeskAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const updateData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const assignmentRef = firestore.collection('desk-assignments').doc(assignmentId);
    const assignmentDoc = await assignmentRef.get();

    if (!assignmentDoc.exists) {
      // Create if doesn't exist
      await assignmentRef.set({
        ...updateData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Update existing
      await assignmentRef.update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    const updatedAssignment = await assignmentRef.get();

    res.json({
      success: true,
      message: 'Desk assignment saved successfully',
      data: {
        id: updatedAssignment.id,
        ...updatedAssignment.data()
      }
    });
  } catch (error) {
    console.error('Update desk assignment error:', error);
    
    if (error.message && error.message.includes('not initialized')) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Firestore database is not connected. Please configure Firebase Admin SDK credentials in backend/.env'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update desk assignment'
    });
  }
};

/**
 * Delete desk assignment
 */
export const deleteDeskAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    const assignmentRef = firestore.collection('desk-assignments').doc(assignmentId);
    const assignmentDoc = await assignmentRef.get();

    if (!assignmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Desk assignment not found'
      });
    }

    await assignmentRef.delete();

    res.json({
      success: true,
      message: 'Desk assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete desk assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete desk assignment'
    });
  }
};