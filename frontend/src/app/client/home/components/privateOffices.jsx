'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

// Custom hook to fetch private offices from backend API
export function usePrivateOffices() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/api/rooms');
        if (response.success && response.data) {
          const roomsData = response.data.map(room => ({
            id: room.id,
            name: room.name || 'Private Office',
            title: room.name || 'Private Office',
            description: room.inclusions || 'Modern, well-equipped private office designed for productivity and comfort.',
            image: room.image || '/rooms/default.png',
            rating: 4.95, // Default rating
            badge: 'Guest favorite',
            rentFee: room.rentFee || 0,
            currency: room.currency || 'PHP',
            rentFeePeriod: room.rentFeePeriod || 'per hour',
            inclusions: room.inclusions || ''
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

    fetchRooms();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchRooms, 30000);
    return () => clearInterval(interval);
  }, []);

  return { rooms, loading };
}

// Export for backward compatibility (if needed)
export const whyChooseFeatures = [];

