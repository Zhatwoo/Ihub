'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// Custom hook to fetch private offices from Firebase
export function usePrivateOffices() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Private Office',
        title: doc.data().name || 'Private Office',
        description: doc.data().inclusions || 'Modern, well-equipped private office designed for productivity and comfort.',
        image: doc.data().image || '/rooms/default.png',
        rating: 4.95, // Default rating
        badge: 'Guest favorite',
        rentFee: doc.data().rentFee || 0,
        currency: doc.data().currency || 'PHP',
        rentFeePeriod: doc.data().rentFeePeriod || 'per hour',
        inclusions: doc.data().inclusions || ''
      }));
      setRooms(roomsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { rooms, loading };
}

// Export for backward compatibility (if needed)
export const whyChooseFeatures = [];

