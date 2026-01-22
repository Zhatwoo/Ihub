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
  const assignmentsRef = firestore.collection('desk-assignments');

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

  if (unsubDeskAssignments) unsubDeskAssignments();
  unsubDeskAssignments = assignmentsRef.onSnapshot(
    (snapshot) => {
      const data = normalizeDeskAssignments(snapshot);
      io.emit('firestore:desk-assignments', { success: true, data });
      console.log('📡 onSnapshot: firestore:desk-assignments emitted,', data.length, 'assignments');
    },
    (err) => {
      console.error('❌ onSnapshot desk-assignments error:', err);
    }
  );

  console.log('✅ Realtime Firestore (onSnapshot) initialized: rooms, desk-assignments');
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
