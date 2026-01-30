/**
 * Real-time Firestore service
 * Uses onSnapshot listeners and emits updates via Socket.IO
 */

import { getFirestore } from '../config/firebase.js';

const isTimestamp = (v) =>
  v &&
  typeof v === 'object' &&
  typeof v.toDate === 'function' &&
  typeof v.seconds === 'number';

function sanitizeForEmit(obj) {
  if (obj == null) return obj;
  if (isTimestamp(obj)) return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(sanitizeForEmit);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = sanitizeForEmit(v);
    return out;
  }
  return obj;
}

function normalizeRooms(snapshot) {
  const rooms = snapshot.docs
    .map((doc) => {
      const roomData = doc.data();
      return { id: doc.id, ...roomData };
    })
    .filter((room) => {
      const status = room.status?.toLowerCase();
      const visible = room.visible !== false;
      const isDeleted = status === 'deleted' || status === 'hidden';
      return visible && !isDeleted;
    });
  return sanitizeForEmit(rooms);
}

function normalizeDeskAssignments(snapshot) {
  const assignments = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      deskTag: data.deskTag || data.desk || doc.id,
    };
  });
  return sanitizeForEmit(assignments);
}

let unsubRooms = null;
let unsubDeskAssignments = null;

/**
 * Initialize Firestore onSnapshot listeners and emit via Socket.IO
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
export function initRealtimeFirestore(io) {
  const firestore = getFirestore();
  if (!firestore || !io) {
    console.warn('⚠️  Realtime Firestore: Firestore or Socket.IO not available, skipping onSnapshot');
    return;
  }

  const roomsRef = firestore
    .collection('privateOfficeRooms')
    .doc('data')
    .collection('office');

  if (unsubRooms) unsubRooms();
  unsubRooms = roomsRef.onSnapshot(
    (snapshot) => {
      const data = normalizeRooms(snapshot);
      io.emit('firestore:rooms', { success: true, data });
      console.log('📡 onSnapshot: firestore:rooms emitted,', data.length, 'rooms');
    },
    (err) => {
      console.error('❌ onSnapshot rooms error:', err);
    }
  );

  // Note: Collection group queries don't support onSnapshot in the same way
  // For desk assignments, we'll use a polling approach or the frontend can fetch on demand
  // Alternatively, we could listen to specific user paths if needed
  if (unsubDeskAssignments) unsubDeskAssignments();
  
  // Fetch desk assignments periodically (every 30 seconds) instead of real-time
  const fetchAndEmitDeskAssignments = async () => {
    try {
      let requestsSnapshot;
      try {
        // Try with where clause first (requires index)
        requestsSnapshot = await firestore
          .collectionGroup('requests')
          .where('status', '==', 'approved')
          .get();
      } catch (indexError) {
        // If index error, fall back to fetching without filter
        if (indexError.code === 9 || indexError.message?.includes('FAILED_PRECONDITION') || indexError.message?.includes('index')) {
          requestsSnapshot = await firestore
            .collectionGroup('requests')
            .get();
        } else {
          throw indexError;
        }
      }
      
      const assignments = requestsSnapshot.docs
        .filter(doc => {
          const path = doc.ref.path;
          const data = doc.data();
          // Filter for desk requests with approved status
          return path.includes('/request/') && path.includes('/desk/') && path.includes('/requests/') && data.status === 'approved';
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            deskTag: data.assignedDesk || data.desk || doc.id,
          };
        });
      
      // Also fetch employee assignments
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
          };
        });
        
        // Combine tenant and employee assignments
        assignments.push(...employeeAssignments);
      } catch (empError) {
        // Silently fail if employee collection doesn't exist yet
      }
      
      const sanitized = sanitizeForEmit(assignments);
      io.emit('firestore:desk-assignments', { success: true, data: sanitized });
    } catch (err) {
      console.error('❌ Polling desk-assignments error:', err.message);
    }
  };
  
  // Initial fetch
  fetchAndEmitDeskAssignments();
  
  // Poll every 30 seconds
  const pollInterval = setInterval(fetchAndEmitDeskAssignments, 30000);
  
  // Store cleanup function
  unsubDeskAssignments = () => {
    clearInterval(pollInterval);
  };

  console.log('✅ Realtime Firestore initialized: rooms (onSnapshot), desk-assignments (polling)');
}

export function stopRealtimeFirestore() {
  if (unsubRooms) {
    unsubRooms();
    unsubRooms = null;
  }
  if (unsubDeskAssignments) {
    unsubDeskAssignments();
    unsubDeskAssignments = null;
  }
  console.log('🛑 Realtime Firestore listeners stopped');
}


