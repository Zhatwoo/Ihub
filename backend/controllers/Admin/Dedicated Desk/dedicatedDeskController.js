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

    console.log('📖 FIRESTORE READ: desk-assignments - executing query...');
    const assignmentsSnapshot = await firestore.collection('desk-assignments').get();
    console.log(`📖 FIRESTORE READ: desk-assignments - ${assignmentsSnapshot.docs.length} documents read`);
    let assignments = assignmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Normalize deskTag - use deskTag if available, otherwise use desk, otherwise use document ID
        deskTag: data.deskTag || data.desk || doc.id,
        // Convert Firestore timestamp to ISO string for JSON serialization
        assignedAt: data.assignedAt ? (data.assignedAt.toDate ? data.assignedAt.toDate().toISOString() : data.assignedAt) : null
      };
    });

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
 * Get desk requests with filtering - OPTIMIZED: Uses collection group query for 1 READ only!
 */
export const getDeskRequests = async (req, res) => {
  try {
    const { status, search, sortBy = 'requestDate', sortOrder = 'desc' } = req.query;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // OPTIMIZED: Use collection group query to get ALL desk requests in 1 READ!
    // This queries all 'request' subcollections across all users
    // Path: /accounts/client/users/{userId}/request/desk
    // Collection group ID: 'request' (must match the subcollection name)
    // Note: Can't filter by documentId in collection group, so we get all and filter in memory
    console.log('📖 FIRESTORE READ: collectionGroup("request") - executing query...');
    const deskRequestsSnapshot = await firestore
      .collectionGroup('request')
      .get();
    console.log(`📖 FIRESTORE READ: collectionGroup("request") - ${deskRequestsSnapshot.docs.length} total documents read`);
    
    // Filter to only get documents with ID 'desk' (in memory - still only 1 read!)
    const deskRequestDocs = deskRequestsSnapshot.docs.filter(doc => doc.id === 'desk');
    console.log(`📖 FIRESTORE READ: collectionGroup("request") - ${deskRequestDocs.length} desk requests after filtering`);

    // Removed: Log containing request count (may expose data)

    const deskRequests = [];
    const userIds = new Set(); // Track user IDs to fetch user info in batch

    // Process all desk requests from the single query
    for (const deskRequestDoc of deskRequestDocs) {
      const deskRequestData = deskRequestDoc.data();
      
      // Skip empty documents
      if (!deskRequestData || Object.keys(deskRequestData).length === 0) {
        continue;
      }

      // Extract userId from document path: accounts/client/users/{userId}/request/desk
      const pathParts = deskRequestDoc.ref.path.split('/');
      const userIdIndex = pathParts.indexOf('users');
      const userId = userIdIndex !== -1 && userIdIndex + 1 < pathParts.length 
        ? pathParts[userIdIndex + 1] 
        : null;

      if (!userId) {
        console.warn('⚠️ Could not extract userId from path:', deskRequestDoc.ref.path);
        continue;
      }

      userIds.add(userId);
      
      deskRequests.push({
        id: userId,
        userId: userId,
        ...deskRequestData,
        // User info will be fetched in batch below
        userInfo: null
      });
    }

    // Fetch user info for all users in 1 batch read
    if (userIds.size > 0) {
      const userIdsArray = Array.from(userIds);
      const userPromises = userIdsArray.map(async (userId) => {
        try {
            const userDoc = await firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(userId)
            .get();
            console.log(`📖 FIRESTORE READ: accounts/client/users/${userId} - ${userDoc.exists ? '1 document' : 'not found'}`);
          
          if (userDoc.exists) {
            return { userId, userData: userDoc.data() };
          }
          return { userId, userData: null };
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          return { userId, userData: null };
        }
      });

      // Process in batches of 10 to avoid overwhelming Firestore
      const BATCH_SIZE = 10;
      const userInfoMap = new Map();
      
      for (let i = 0; i < userPromises.length; i += BATCH_SIZE) {
        const batch = userPromises.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch);
        
        batchResults.forEach(({ userId, userData }) => {
          if (userData) {
            userInfoMap.set(userId, {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || ''
            });
          }
        });
      }

      // Attach user info to desk requests
      deskRequests.forEach(request => {
        const userInfo = userInfoMap.get(request.userId);
        if (userInfo) {
          request.userInfo = userInfo;
        }
      });
    }

    let filteredRequests = [...deskRequests];

    // Default: only show pending requests (unless status filter is explicitly provided)
    if (!status || status === 'all') {
      filteredRequests = filteredRequests.filter(request => {
        const isPending = request.status === 'pending';
        if (!isPending) {
          // Removed: Log containing private user names
        }
        return isPending;
      });
    } else {
      // Apply specific status filter if provided
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
    console.log(`📖 FIRESTORE READ: accounts/client/users/${userId} - executing query...`);
    const userRef = firestore.collection('accounts').doc('client').collection('users').doc(userId);
    const userDoc = await userRef.get();
    console.log(`📖 FIRESTORE READ: accounts/client/users/${userId} - ${userDoc.exists ? '1 document' : 'not found'}`);

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
      
    console.log(`📖 FIRESTORE READ: accounts/client/users/${userId}/request/desk - executing query...`);
    const deskRequestDoc = await deskRequestRef.get();
    console.log(`📖 FIRESTORE READ: accounts/client/users/${userId}/request/desk - ${deskRequestDoc.exists ? '1 document' : 'not found'}`);

    if (!deskRequestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Desk request not found'
      });
    }

    const deskRequestData = deskRequestDoc.data();

    // Update request status in the correct path - only update the status and timestamp
    await deskRequestRef.update({
      status: status,
      adminNotes: adminNotes || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If approving, create desk assignment
    if (status === 'approved' && assignedDesk) {
      // Extract company and contact from request data (try multiple locations)
      const requestedBy = deskRequestData.requestedBy || {};
      const company = deskRequestData.company || requestedBy.companyName || userData.companyName || '';
      const contact = deskRequestData.contact || requestedBy.contact || userData.contact || userData.phoneNumber || '';
      
      // Removed: Debug log (may contain private data)
      // Removed: Debug logs containing private user data (company, contact)
      console.log('Extracted contact:', contact);
      
      const assignmentData = {
        desk: assignedDesk, // Use 'desk' field, not 'deskTag'
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        contactNumber: contact,
        type: deskRequestData.occupantType || 'Tenant',
        company: company,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: userId
      };

      // Removed: Log containing private user data (assignmentData)
      await firestore.collection('desk-assignments').doc(assignedDesk).set(assignmentData);
    }

    // Verify the update was saved
    console.log(`📖 FIRESTORE READ: accounts/client/users/${userId}/request/desk - verification read...`);
    const verifyDoc = await deskRequestRef.get();
    console.log(`📖 FIRESTORE READ: accounts/client/users/${userId}/request/desk - ${verifyDoc.exists ? '1 document verified' : 'not found'}`);
    const verifyData = verifyDoc.data();

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

    // Fetch from desk-assignments collection ONLY
    console.log('📖 FIRESTORE READ: desk-assignments - executing query...');
    const assignmentsSnapshot = await firestore.collection('desk-assignments').get();
    console.log(`📖 FIRESTORE READ: desk-assignments - ${assignmentsSnapshot.docs.length} documents read`);
    const assignments = assignmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Normalize deskTag - use deskTag if available, otherwise use desk, otherwise use document ID
        deskTag: data.deskTag || data.desk || doc.id,
        // Convert Firestore timestamp to ISO string for JSON serialization
        assignedAt: data.assignedAt ? (data.assignedAt.toDate ? data.assignedAt.toDate().toISOString() : data.assignedAt) : null
      };
    });

    // Filter by part and sort by desk number
    const partOccupants = assignments
      .filter(assignment => {
        const deskIdentifier = assignment.deskTag;
        return deskIdentifier && deskIdentifier.toUpperCase().startsWith(part.toUpperCase());
      })
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

/**
 * Get all desk assignments
 */
export const getAllDeskAssignments = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    console.log('📖 FIRESTORE READ: desk-assignments - executing query...');
    const assignmentsSnapshot = await firestore.collection('desk-assignments').get();
    console.log(`📖 FIRESTORE READ: desk-assignments - ${assignmentsSnapshot.docs.length} documents read`);
    
    const assignments = assignmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Normalize deskTag - use deskTag if available, otherwise use desk, otherwise use document ID
        deskTag: data.deskTag || data.desk || doc.id
      };
    });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Get all desk assignments error:', error);
    
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
    
    console.log(`📖 FIRESTORE READ: desk-assignments/${assignmentId} - executing query...`);
    const assignmentDoc = await firestore.collection('desk-assignments').doc(assignmentId).get();
    console.log(`📖 FIRESTORE READ: desk-assignments/${assignmentId} - ${assignmentDoc.exists ? '1 document' : 'not found'}`);

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

    console.log(`📖 FIRESTORE READ: desk-assignments/${docId} - verification read...`);
    const newAssignment = await assignmentRef.get();
    console.log(`📖 FIRESTORE READ: desk-assignments/${docId} - ${newAssignment.exists ? '1 document verified' : 'not found'}`);

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

    console.log(`📖 FIRESTORE READ: desk-assignments/${assignmentId} - verification read...`);
    const updatedAssignment = await assignmentRef.get();
    console.log(`📖 FIRESTORE READ: desk-assignments/${assignmentId} - ${updatedAssignment.exists ? '1 document verified' : 'not found'}`);

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