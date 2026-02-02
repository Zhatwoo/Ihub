// Admin Dedicated Desk controller
// Handles desk assignments, requests, and floor plan data

import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';
import { sendFirestoreError } from '../../../utils/firestoreHelper.js';

/**
 * Helper function to check if a document path is a desk request
 */
const isDeskRequestPath = (path) => {
  // Path must contain: /request/ AND /desk/ AND /requests/
  // Example: /accounts/client/users/{userId}/request/desk/requests/{requestId}
  return path.includes('/request/') && path.includes('/desk/') && path.includes('/requests/');
};

/**
 * Helper function to convert Firestore timestamp to ISO string
 */
const convertTimestamp = (ts) => {
  if (!ts) return null;
  if (typeof ts === 'object' && ts.toDate) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  try {
    return new Date(ts).toISOString();
  } catch {
    return null;
  }
};

/**
 * Get desk assignments with filtering and processing
 * Fetches from approved desk requests instead of desk-assignments collection
 */
export const getDeskAssignments = async (req, res) => {
  try {
    const { part, search, sortBy = 'deskTag', sortOrder = 'asc' } = req.query;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    let requestsSnapshot;
    try {
      // Try with where clause first (requires index)
      requestsSnapshot = await firestore
        .collectionGroup('requests')
        .where('status', '==', 'approved')
        .get();
    } catch (indexError) {
      // If index error, fall back to fetching without filter
      if (indexError.code === 9 || indexError.message?.includes('index')) {
        console.warn('⚠️ Firestore index not found, using fallback method...');
        requestsSnapshot = await firestore
          .collectionGroup('requests')
          .get();
      } else {
        throw indexError;
      }
    }
    
    // Filter to only desk requests (path contains /request/desk/requests/) and approved status
    let assignments = requestsSnapshot.docs
      .filter(doc => {
        const path = doc.ref.path;
        const data = doc.data();
        // Path must contain: /request/desk/requests/
        // This ensures we only get desk requests, not office requests
        const isDeskRequest = path.includes('/request/') && path.includes('/desk/') && path.includes('/requests/');
        return isDeskRequest && data.status === 'approved';
      })
      .map(doc => {
        const data = doc.data();
        
        // Convert Firestore timestamps to ISO strings
        const convertTimestamp = (ts) => {
          if (!ts) return null;
          if (typeof ts === 'object' && ts.toDate) return ts.toDate().toISOString();
          if (typeof ts === 'string') return ts;
          return new Date(ts).toISOString();
        };
        
        return {
          id: doc.id,
          ...data,
          // Normalize deskTag - use assignedDesk if available, otherwise use desk
          deskTag: data.assignedDesk || data.desk || doc.id,
          // Convert Firestore timestamp to ISO string for JSON serialization
          assignedAt: convertTimestamp(data.approvedAt || data.assignedAt),
          assignedAtISO: convertTimestamp(data.approvedAt || data.assignedAt)
        };
      });

    // Also fetch employee assignments from /accounts/desk-emp/assignments
    try {
      const employeeSnapshot = await firestore
        .collection('accounts')
        .doc('desk-emp')
        .collection('assignments')
        .get();
      
      const employeeAssignments = employeeSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          deskTag: data.deskTag || data.assignedDesk || data.desk || doc.id,
          assignedAt: convertTimestamp(data.assignedAt),
          assignedAtISO: convertTimestamp(data.assignedAt)
        };
      });
      
      // Combine tenant and employee assignments
      assignments = [...assignments, ...employeeAssignments];
    } catch (empError) {
      console.warn('⚠️ Could not fetch employee assignments:', empError.message);
    }

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
        const dateA = a.assignedAtISO ? new Date(a.assignedAtISO) : new Date(0);
        const dateB = b.assignedAtISO ? new Date(b.assignedAtISO) : new Date(0);
        comparison = dateA - dateB;
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
    // This queries all 'requests' subcollections across all users
    // Path: /accounts/client/users/{userId}/request/desk/requests/{requestId}
    // Collection group ID: 'requests' (must match the subcollection name)
    const deskRequestsSnapshot = await firestore
      .collectionGroup('requests')
      .get();
    
    // Filter to only get desk requests (from /request/desk/requests path)
    const deskRequestDocs = deskRequestsSnapshot.docs.filter(doc => {
      const path = doc.ref.path;
      return isDeskRequestPath(path);
    });

    const deskRequests = [];
    const userIds = new Set(); // Track user IDs to fetch user info in batch

    // Process all desk requests from the single query
    for (const deskRequestDoc of deskRequestDocs) {
      const deskRequestData = deskRequestDoc.data();
      
      // Skip empty documents
      if (!deskRequestData || Object.keys(deskRequestData).length === 0) {
        continue;
      }

      // Extract userId from document path: accounts/client/users/{userId}/request/desk/requests/{requestId}
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
        id: deskRequestDoc.id, // Use the actual document ID (requestId)
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
      filteredRequests = filteredRequests.filter(request => request.status === 'pending');
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
    const { userId, requestId } = req.params;
    const { status, adminNotes, assignedDesk } = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    if (!userId || !requestId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'userId and requestId are required'
      });
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

    // NEW PATH: /accounts/client/users/{userId}/request/desk/{requestId}
    const deskRequestRef = firestore
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .collection('request').doc('desk').collection('requests')
      .doc(requestId);
      
    const deskRequestDoc = await deskRequestRef.get();

    if (!deskRequestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Desk request not found'
      });
    }

    const deskRequestData = deskRequestDoc.data();

    // Extract company and contact from request data
    const requestedBy = deskRequestData.requestedBy || {};
    const company = deskRequestData.company || requestedBy.companyName || userData.companyName || '';
    const contact = deskRequestData.contact || requestedBy.contact || userData.contact || userData.phoneNumber || '';

    // Update request with status, assignedDesk, and additional info
    const updateData = {
      status: status,
      adminNotes: adminNotes || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // If approving, store assignment data directly in the request
    if (status === 'approved' && assignedDesk) {
      updateData.assignedDesk = assignedDesk;
      updateData.approvedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.name = `${userData.firstName} ${userData.lastName}`;
      updateData.email = userData.email;
      updateData.contactNumber = contact;
      updateData.company = company;
      updateData.type = deskRequestData.occupantType || 'Tenant';
    }

    await deskRequestRef.update(updateData);

    // Create initial bill if approving and occupant is a Tenant
    if (status === 'approved' && assignedDesk && (deskRequestData.occupantType || 'Tenant') === 'Tenant') {
      try {
        const billRef = firestore
          .collection('accounts')
          .doc('client')
          .collection('users')
          .doc(userId)
          .collection('bills')
          .doc();

        const startDate = new Date();

        await billRef.set({
          clientName: `${userData.firstName} ${userData.lastName}`,
          companyName: company,
          email: userData.email,
          contactNumber: contact,
          serviceType: 'dedicated-desk',
          assignedResource: assignedDesk,
          amount: 0, // Admin must set via Edit Bill
          cusaFee: 0,
          parkingFee: 0,
          lateFee: 0,
          damageFee: 0,
          feePeriod: null, // Admin must set via Edit Bill
          startDate: admin.firestore.Timestamp.fromDate(startDate),
          dueDate: null, // Admin must set via Edit Bill
          status: 'inactive', // Newly created bills start as inactive
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (billError) {
        console.error('Error creating bill:', billError);
      }
    }

    // Verify the update
    const verifyDoc = await deskRequestRef.get();
    const verifyData = verifyDoc.data();

    res.json({
      success: true,
      message: `Desk request ${status} successfully`,
      data: verifyData
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
 * Fetches from approved desk requests
 */
export const getOccupantsByPart = async (req, res) => {
  try {
    const { part } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }

    // Fetch from approved desk requests using collection group
    let requestsSnapshot;
    try {
      // Try with where clause first (requires index)
      requestsSnapshot = await firestore
        .collectionGroup('requests')
        .where('status', '==', 'approved')
        .get();
    } catch (indexError) {
      // If index error, fall back to fetching without filter
      if (indexError.code === 9 || indexError.message?.includes('index')) {
        console.warn('⚠️ Firestore index not found, using fallback method...');
        requestsSnapshot = await firestore
          .collectionGroup('requests')
          .get();
      } else {
        throw indexError;
      }
    }
    
    // Filter to only desk requests and approved status
    const assignments = requestsSnapshot.docs
      .filter(doc => {
        const path = doc.ref.path;
        const data = doc.data();
        return isDeskRequestPath(path) && data.status === 'approved';
      })
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Normalize deskTag - use assignedDesk if available
          deskTag: data.assignedDesk || data.desk || doc.id,
          // Convert Firestore timestamp to ISO string for JSON serialization
          assignedAt: convertTimestamp(data.approvedAt || data.assignedAt),
          assignedAtISO: convertTimestamp(data.approvedAt || data.assignedAt)
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
 * Fetches from approved desk requests
 */
export const getAllDeskAssignments = async (req, res) => {
  try {
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    try {
      // Try with where clause first (requires index)
      const requestsSnapshot = await firestore
        .collectionGroup('requests')
        .where('status', '==', 'approved')
        .get();
      
      // Filter to only desk requests
      const assignments = requestsSnapshot.docs
        .filter(doc => isDeskRequestPath(doc.ref.path))
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Normalize deskTag - use assignedDesk if available
            deskTag: data.assignedDesk || data.desk || doc.id,
            assignedAt: convertTimestamp(data.approvedAt || data.assignedAt)
          };
        });

      res.json({
        success: true,
        data: assignments
      });
    } catch (indexError) {
      // If index error, fall back to fetching without filter and filter in memory
      if (indexError.code === 9 || indexError.message?.includes('index')) {
        console.warn('⚠️ Firestore index not found, using fallback method...');
        console.warn('⚠️ Create index at: https://console.firebase.google.com/project/_/firestore/indexes');
        
        const requestsSnapshot = await firestore
          .collectionGroup('requests')
          .get();
        
        // Filter in memory
        const assignments = requestsSnapshot.docs
          .filter(doc => {
            const path = doc.ref.path;
            const data = doc.data();
            return isDeskRequestPath(path) && data.status === 'approved';
          })
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              deskTag: data.assignedDesk || data.desk || doc.id,
              assignedAt: convertTimestamp(data.approvedAt || data.assignedAt)
            };
          });

        res.json({
          success: true,
          data: assignments,
          warning: 'Using fallback query method. Please create Firestore index for better performance.'
        });
      } else {
        throw indexError;
      }
    }
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
 * Fetches from approved desk request by userId and requestId
 * Expected params: userId, requestId (assignmentId is kept for backward compatibility)
 */
export const getDeskAssignmentById = async (req, res) => {
  try {
    const { assignmentId, userId, requestId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // Support both old (assignmentId) and new (userId + requestId) patterns
    if (userId && requestId) {
      // New pattern: fetch from request path
      const requestRef = firestore
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId)
        .collection('request')
        .doc('desk')
        .collection('requests')
        .doc(requestId);
        
      const requestDoc = await requestRef.get();

      if (!requestDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Desk assignment not found'
        });
      }

      const data = requestDoc.data();
      if (data.status !== 'approved') {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Desk assignment not found (request not approved)'
        });
      }

      res.json({
        success: true,
        data: {
          id: requestDoc.id,
          ...data
        }
      });
    } else if (assignmentId) {
      // Old pattern: search for assignment by ID using collection group
      const requestsSnapshot = await firestore
        .collectionGroup('requests')
        .where('status', '==', 'approved')
        .get();
      
      const matchingDoc = requestsSnapshot.docs.find(doc => 
        doc.id === assignmentId && doc.ref.isDeskRequestPath(path)
      );

      if (!matchingDoc) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Desk assignment not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: matchingDoc.id,
          ...matchingDoc.data()
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Either assignmentId or (userId + requestId) is required'
      });
    }
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
 * For admin-assigned employees (no user account), store in /accounts/desk-emp/assignments/{deskId}
 * For tenants with user accounts, create an approved request
 */
export const createDeskAssignment = async (req, res) => {
  try {
    const assignmentData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // Validate required fields
    if (!assignmentData.desk) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'desk is required'
      });
    }

    // Check if this is an employee (no userId) or tenant (has userId)
    const isEmployee = !assignmentData.userId || assignmentData.type === 'Employee';

    if (isEmployee) {
      // For employees: Store in /accounts/desk-emp/assignments/{deskId}
      const employeeRef = firestore
        .collection('accounts')
        .doc('desk-emp')
        .collection('assignments')
        .doc(assignmentData.desk);

      const employeeData = {
        desk: assignmentData.desk,
        deskTag: assignmentData.desk,
        assignedDesk: assignmentData.desk,
        name: assignmentData.name || '',
        email: assignmentData.email || '',
        contactNumber: assignmentData.contactNumber || assignmentData.contact || '',
        company: assignmentData.company || '',
        type: 'Employee',
        status: 'active',
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await employeeRef.set(employeeData);

      const newAssignment = await employeeRef.get();

      res.status(201).json({
        success: true,
        message: 'Employee desk assignment created successfully',
        data: {
          id: newAssignment.id,
          ...newAssignment.data()
        }
      });
    } else {
      // For tenants: Create an approved request in user's request collection
      const requestRef = firestore
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(assignmentData.userId)
        .collection('request').doc('desk').collection('requests')
        .doc();

      const requestData = {
        status: 'approved',
        assignedDesk: assignmentData.desk,
        desk: assignmentData.desk,
        deskTag: assignmentData.desk,
        name: assignmentData.name || '',
        email: assignmentData.email || '',
        contactNumber: assignmentData.contactNumber || assignmentData.contact || '',
        company: assignmentData.company || '',
        type: 'Tenant',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        requestDate: assignmentData.requestDate || admin.firestore.FieldValue.serverTimestamp(),
        adminNotes: 'Created via admin assignment'
      };

      await requestRef.set(requestData);

      const newRequest = await requestRef.get();

      res.status(201).json({
        success: true,
        message: 'Tenant desk assignment created successfully',
        data: {
          id: newRequest.id,
          ...newRequest.data()
        }
      });
    }
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
 * Delete desk assignment
 * Handles both employee assignments and tenant requests
 * For employees: Deletes from /accounts/desk-emp/assignments/{deskId}
 * For tenants: Updates request status to 'cancelled' and deletes associated bills
 * Expected params: userId, requestId (assignmentId is kept for backward compatibility)
 */
export const deleteDeskAssignment = async (req, res) => {
  try {
    const { assignmentId, userId, requestId } = req.params;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // Support both old (assignmentId) and new (userId + requestId) patterns
    if (userId && requestId) {
      // New pattern: update request status to cancelled
      const requestRef = firestore
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId)
        .collection('request').doc('desk').collection('requests')
        .doc(requestId);
        
      const requestDoc = await requestRef.get();

      if (!requestDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Desk assignment not found'
        });
      }

      const requestData = requestDoc.data();
      const deskTag = requestData.assignedDesk || requestData.desk;

      // Update status to cancelled (keeps history)
      await requestRef.update({
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Delete associated bills for tenants
      if (requestData.type === 'Tenant' || !requestData.type) {
        try {
          const billsSnapshot = await firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(userId)
            .collection('bills')
            .where('serviceType', '==', 'dedicated-desk')
            .where('assignedResource', '==', deskTag)
            .get();

          if (billsSnapshot.docs.length > 0) {
            const batch = firestore.batch();
            billsSnapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`✅ Deleted ${billsSnapshot.docs.length} bill(s) for desk ${deskTag}`);
          }
        } catch (billError) {
          console.error('Error deleting bills:', billError);
          // Continue even if bill deletion fails
        }
      }

      res.json({
        success: true,
        message: 'Desk assignment deleted successfully'
      });
    } else if (assignmentId) {
      // Old pattern: search for assignment by ID and delete
      // First check if it's an employee assignment
      const employeeRef = firestore
        .collection('accounts')
        .doc('desk-emp')
        .collection('assignments')
        .doc(assignmentId);
      
      const employeeDoc = await employeeRef.get();

      if (employeeDoc.exists) {
        // It's an employee assignment - delete it (no bills to delete)
        await employeeRef.delete();
        
        return res.json({
          success: true,
          message: 'Employee desk assignment deleted successfully'
        });
      }

      // Not an employee, search in tenant requests using collection group
      let requestsSnapshot;
      try {
        // Try with where clause first (requires index)
        requestsSnapshot = await firestore
          .collectionGroup('requests')
          .where('status', '==', 'approved')
          .get();
      } catch (indexError) {
        // If index error, fall back to fetching without filter
        if (indexError.code === 9 || indexError.message?.includes('index')) {
          console.warn('⚠️ Firestore index not found, using fallback method...');
          requestsSnapshot = await firestore
            .collectionGroup('requests')
            .get();
        } else {
          throw indexError;
        }
      }
      
      // Fixed: Use isDeskRequestPath helper function correctly
      const matchingDoc = requestsSnapshot.docs.find(doc => {
        const path = doc.ref.path;
        const data = doc.data();
        return doc.id === assignmentId && isDeskRequestPath(path) && data.status === 'approved';
      });

      if (!matchingDoc) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Desk assignment not found'
        });
      }

      const matchingData = matchingDoc.data();
      const deskTag = matchingData.assignedDesk || matchingData.desk;
      
      // Extract userId from path
      const pathParts = matchingDoc.ref.path.split('/');
      const userIdIndex = pathParts.indexOf('users');
      const extractedUserId = userIdIndex !== -1 && userIdIndex + 1 < pathParts.length 
        ? pathParts[userIdIndex + 1] 
        : null;

      // Update status to cancelled (keeps history)
      await matchingDoc.ref.update({
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Delete associated bills for tenants
      if (extractedUserId && (matchingData.type === 'Tenant' || !matchingData.type)) {
        try {
          const billsSnapshot = await firestore
            .collection('accounts')
            .doc('client')
            .collection('users')
            .doc(extractedUserId)
            .collection('bills')
            .where('serviceType', '==', 'dedicated-desk')
            .where('assignedResource', '==', deskTag)
            .get();

          if (billsSnapshot.docs.length > 0) {
            const batch = firestore.batch();
            billsSnapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`✅ Deleted ${billsSnapshot.docs.length} bill(s) for desk ${deskTag}`);
          }
        } catch (billError) {
          console.error('Error deleting bills:', billError);
          // Continue even if bill deletion fails
        }
      }

      res.json({
        success: true,
        message: 'Desk assignment deleted successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Either assignmentId or (userId + requestId) is required'
      });
    }
  } catch (error) {
    console.error('Delete desk assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete desk assignment'
    });
  }
};

/**
 * Update desk assignment
 * Handles both employee assignments and tenant requests
 * For employees: Updates in /accounts/desk-emp/assignments/{deskId}
 * For tenants: Updates the approved desk request document
 * Expected params: userId, requestId (assignmentId is kept for backward compatibility)
 */
export const updateDeskAssignment = async (req, res) => {
  try {
    const { assignmentId, userId, requestId } = req.params;
    const updateData = req.body;
    const firestore = getFirestore();
    
    if (!firestore) {
      return sendFirestoreError(res);
    }
    
    // Support both old (assignmentId) and new (userId + requestId) patterns
    if (userId && requestId) {
      // New pattern: update request document
      const requestRef = firestore
        .collection('accounts')
        .doc('client')
        .collection('users')
        .doc(userId)
        .collection('request').doc('desk').collection('requests')
        .doc(requestId);
        
      const requestDoc = await requestRef.get();

      if (!requestDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Desk assignment not found'
        });
      }

      await requestRef.update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const updatedRequest = await requestRef.get();

      res.json({
        success: true,
        message: 'Desk assignment updated successfully',
        data: {
          id: updatedRequest.id,
          ...updatedRequest.data()
        }
      });
    } else if (assignmentId) {
      // Old pattern: search for assignment by ID and update
      // First check if it's an employee assignment
      const employeeRef = firestore
        .collection('accounts')
        .doc('desk-emp')
        .collection('assignments')
        .doc(assignmentId);
      
      const employeeDoc = await employeeRef.get();

      if (employeeDoc.exists) {
        // It's an employee assignment - update it
        await employeeRef.update({
          ...updateData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        const updatedEmployee = await employeeRef.get();
        
        return res.json({
          success: true,
          message: 'Employee desk assignment updated successfully',
          data: {
            id: updatedEmployee.id,
            ...updatedEmployee.data()
          }
        });
      }

      // Not an employee, search in tenant requests using collection group
      
      let requestsSnapshot;
      try {
        // Try with where clause first (requires index)
        requestsSnapshot = await firestore
          .collectionGroup('requests')
          .where('status', '==', 'approved')
          .get();
      } catch (indexError) {
        // If index error, fall back to fetching without filter
        if (indexError.code === 9 || indexError.message?.includes('index')) {
          console.warn('⚠️ Firestore index not found, using fallback method...');
          requestsSnapshot = await firestore
            .collectionGroup('requests')
            .get();
        } else {
          throw indexError;
        }
      }
      
      
      // Fixed: Use isDeskRequestPath helper function correctly
      const matchingDoc = requestsSnapshot.docs.find(doc => {
        const path = doc.ref.path;
        const data = doc.data();
        return doc.id === assignmentId && isDeskRequestPath(path) && data.status === 'approved';
      });

      if (!matchingDoc) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Desk assignment not found'
        });
      }

      await matchingDoc.ref.update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const updatedDoc = await matchingDoc.ref.get();

      res.json({
        success: true,
        message: 'Desk assignment updated successfully',
        data: {
          id: updatedDoc.id,
          ...updatedDoc.data()
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Either assignmentId or (userId + requestId) is required'
      });
    }
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







