'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

// Custom hook to fetch private offices from backend API
export function usePrivateOffices() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        /**
         * IMPORTANT:
         * We intentionally do NOT call `/api/schedules/occupancy` here anymore.
         * That endpoint can be expensive (Firestore reads) and caused `RESOURCE_EXHAUSTED`.
         * Client home now relies on the room's `status` field (Vacant/Occupied) from `/api/rooms`.
         */
        const roomsResponse = await api.get('/api/rooms');

        if (roomsResponse.success && roomsResponse.data) {
          const roomsData = roomsResponse.data
            .filter((room) => room.status !== 'Occupied') // hide occupied rooms
            .map((room) => ({
              id: room.id,
              name: room.name || 'Private Office',
              title: room.name || 'Private Office',
              description:
                room.inclusions ||
                'Modern, well-equipped private office designed for productivity and comfort.',
              image: room.image || '/images/inspirelogo.png',
              rating: 4.95, // Default rating
              badge: 'Guest favorite',
              rentFee: room.rentFee || 0,
              currency: room.currency || 'PHP',
              rentFeePeriod: room.rentFeePeriod || 'per hour',
              inclusions: room.inclusions || '',
            }));

          setRooms(roomsData);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchRooms();
    
    // Poll for updates every 60 seconds (reduced frequency to save quota)
    // Only poll when tab is visible to reduce unnecessary requests
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Only create interval if one doesn't already exist
        if (!intervalRef.current) {
          fetchRooms(); // Fetch immediately when tab becomes visible
          intervalRef.current = setInterval(fetchRooms, 60000);
        }
      }
    };
    
    // Start polling if tab is visible (only if no interval exists)
    if (!document.hidden && !intervalRef.current) {
      intervalRef.current = setInterval(fetchRooms, 60000);
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { rooms, loading };
}

// Export for backward compatibility (if needed)
export const whyChooseFeatures = [];

